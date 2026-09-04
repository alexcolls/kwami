import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  addCustomInstructions,
  connectNodes,
  deleteCustomInstructions,
  deleteMemoryEdge,
  deleteMemoryNode,
  detectCommunities,
  detectDuplicates,
  getFactRating,
  getMemoryGraph,
  getUserFacts,
  ingestData,
  mergeNodes,
  reorganizeGraph,
  setFactRating,
  updateMemoryEdge,
  updateMemoryNode,
} from '../../src/utils/api-client';
import { FakeBackend } from './helpers/backend';

const USER = 'user-123';

let backend: FakeBackend;

beforeAll(async () => {
  backend = await FakeBackend.start();
});

afterEach(() => {
  backend.reset();
});

afterAll(async () => {
  await backend.stop();
});

describe('memory graph', () => {
  it('requests the graph with the 1000-node limit and parses the payload', async () => {
    backend.on(`GET /memory/${USER}/graph`, {
      body: {
        nodes: [{ id: 'n1', label: 'Ada', type: 'person' }],
        edges: [{ source: 'n1', target: 'n2', relation: 'knows' }],
      },
    });

    const graph = await getMemoryGraph(backend.baseUrl, USER);

    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges[0].relation).toBe('knows');
    expect(backend.lastRequest()?.query.get('limit')).toBe('1000');
  });

  it('treats a 404 as an empty graph, not an error', async () => {
    backend.on(`GET /memory/${USER}/graph`, { status: 404, body: { detail: 'no user' } });

    await expect(getMemoryGraph(backend.baseUrl, USER)).resolves.toEqual({ nodes: [], edges: [] });
  });

  it('throws on any other failure status', async () => {
    backend.on(`GET /memory/${USER}/graph`, { status: 500, body: {} });

    await expect(getMemoryGraph(backend.baseUrl, USER)).rejects.toThrow(
      /Failed to fetch memory graph/,
    );
  });

  it('sends the bearer token when one is configured, and none when it is not', async () => {
    backend.on(`GET /memory/${USER}/graph`, { body: { nodes: [], edges: [] } });

    await getMemoryGraph(backend.baseUrl, USER, { authToken: 'secret-token' });
    expect(backend.lastRequest()?.headers.authorization).toBe('Bearer secret-token');

    await getMemoryGraph(backend.baseUrl, USER);
    expect(backend.lastRequest()?.headers.authorization).toBeUndefined();
  });
});

describe('user facts', () => {
  it('omits the query string entirely when neither limit nor offset is given', async () => {
    backend.on(`GET /memory/${USER}/facts`, {
      body: { facts: ['likes coffee'], count: 1, total: 1, offset: 0, limit: 50, has_more: false },
    });

    const page = await getUserFacts(backend.baseUrl, USER);

    expect(page.facts).toEqual(['likes coffee']);
    expect([...backend.lastRequest()!.query.keys()]).toEqual([]);
  });

  it('forwards pagination, including an offset of 0', async () => {
    backend.on(`GET /memory/${USER}/facts`, {
      body: { facts: [], count: 0, total: 0, offset: 0, limit: 10, has_more: false },
    });

    await getUserFacts(backend.baseUrl, USER, { limit: 10, offset: 0 });

    const query = backend.lastRequest()!.query;
    expect(query.get('limit')).toBe('10');
    // `offset: 0` is falsy — a truthiness check here would silently drop the first page.
    expect(query.get('offset')).toBe('0');
  });

  it('returns an empty page for a 404', async () => {
    backend.on(`GET /memory/${USER}/facts`, { status: 404, body: {} });

    await expect(getUserFacts(backend.baseUrl, USER)).resolves.toEqual({
      facts: [],
      count: 0,
      total: 0,
      offset: 0,
      limit: 50,
      has_more: false,
    });
  });
});

describe('graph editing', () => {
  it('PATCHes a node with a JSON body', async () => {
    backend.on(`PATCH /memory/${USER}/node/node-1`, {
      body: {
        success: true,
        old_node_uuid: 'node-1',
        new_node_uuid: 'node-2',
        name: 'Ada',
        summary: null,
        recreated_edges: 3,
      },
    });

    const result = await updateMemoryNode(backend.baseUrl, USER, 'node-1', { name: 'Ada' });

    expect(result.recreated_edges).toBe(3);
    const request = backend.lastRequest()!;
    expect(request.method).toBe('PATCH');
    expect(request.headers['content-type']).toBe('application/json');
    expect(request.body).toEqual({ name: 'Ada' });
  });

  it('PATCHes an edge and surfaces the server `detail` on failure', async () => {
    backend.on(`PATCH /memory/${USER}/edge/edge-1`, {
      status: 422,
      body: { detail: 'valid_at must precede invalid_at' },
    });

    await expect(updateMemoryEdge(backend.baseUrl, USER, 'edge-1', { fact: 'x' })).rejects.toThrow(
      'valid_at must precede invalid_at',
    );
  });

  it('falls back to the status text when the error body carries no detail', async () => {
    backend.on(`DELETE /memory/${USER}/node/node-1`, { status: 503, body: {} });

    await expect(deleteMemoryNode(backend.baseUrl, USER, 'node-1')).rejects.toThrow(
      /Failed to delete node/,
    );
  });

  it('DELETEs a node and an edge', async () => {
    backend
      .on(`DELETE /memory/${USER}/node/node-1`, { body: { success: true, deleted_node: 'node-1' } })
      .on(`DELETE /memory/${USER}/edge/edge-1`, {
        body: { success: true, deleted_edge: 'edge-1' },
      });

    await expect(deleteMemoryNode(backend.baseUrl, USER, 'node-1')).resolves.toEqual({
      success: true,
      deleted_node: 'node-1',
    });
    await expect(deleteMemoryEdge(backend.baseUrl, USER, 'edge-1')).resolves.toEqual({
      success: true,
      deleted_edge: 'edge-1',
    });
  });

  it('connects two nodes with a POST body', async () => {
    backend.on(`POST /memory/${USER}/connect`, {
      body: {
        success: true,
        edge_uuid: 'edge-9',
        source_node_uuid: 'a',
        target_node_uuid: 'b',
        relation: 'knows',
        fact: 'a knows b',
      },
    });

    const result = await connectNodes(backend.baseUrl, USER, {
      source_node_uuid: 'a',
      target_node_uuid: 'b',
      relation: 'knows',
    });

    expect(result.edge_uuid).toBe('edge-9');
    expect(backend.lastRequest()?.body).toEqual({
      source_node_uuid: 'a',
      target_node_uuid: 'b',
      relation: 'knows',
    });
  });
});

describe('fact rating and custom instructions', () => {
  it('reads the current rating config', async () => {
    backend.on(`GET /memory/${USER}/fact-rating`, {
      body: { configured: false, instruction: null, examples: null },
    });

    await expect(getFactRating(backend.baseUrl, USER)).resolves.toEqual({
      configured: false,
      instruction: null,
      examples: null,
    });
  });

  it('PUTs a new rating config', async () => {
    backend.on(`PUT /memory/${USER}/fact-rating`, { body: { success: true } });

    await setFactRating(backend.baseUrl, USER, {
      instruction: 'Rate by relevance',
      examples: { high: 'h', medium: 'm', low: 'l' },
    });

    expect(backend.lastRequest()?.method).toBe('PUT');
    expect(backend.lastRequest()?.body).toMatchObject({ instruction: 'Rate by relevance' });
  });

  it('adds instructions and deletes a named subset', async () => {
    backend
      .on(`POST /memory/${USER}/instructions`, { body: { success: true, added: 2 } })
      .on(`DELETE /memory/${USER}/instructions`, { body: { success: true } });

    await addCustomInstructions(backend.baseUrl, USER, [
      { name: 'tone', text: 'be brief' },
      { name: 'lang', text: 'reply in English' },
    ]);
    expect(backend.lastRequest()?.body).toEqual({
      instructions: [
        { name: 'tone', text: 'be brief' },
        { name: 'lang', text: 'reply in English' },
      ],
    });

    await deleteCustomInstructions(backend.baseUrl, USER, ['tone', 'a name/with slash']);
    // The names travel as one comma-joined, URI-encoded value.
    expect(backend.lastRequest()?.query.get('names')).toBe('tone,a name/with slash');
  });

  it('deletes every instruction when no names are given', async () => {
    backend.on(`DELETE /memory/${USER}/instructions`, { body: { success: true } });

    await deleteCustomInstructions(backend.baseUrl, USER);

    expect(backend.lastRequest()?.query.has('names')).toBe(false);
  });
});

describe('graph analysis', () => {
  it('ingests raw data', async () => {
    backend.on(`POST /memory/${USER}/ingest`, { body: { success: true, episode_uuid: 'ep-1' } });

    await ingestData(backend.baseUrl, USER, { data: 'hello', type: 'text' });

    expect(backend.lastRequest()?.body).toEqual({ data: 'hello', type: 'text' });
  });

  it('passes the resolution and threshold only when supplied', async () => {
    backend
      .on(`GET /memory/${USER}/communities`, { body: { communities: [], count: 0 } })
      .on(`GET /memory/${USER}/duplicates`, { body: { duplicates: [], count: 0 } });

    await detectCommunities(backend.baseUrl, USER);
    expect(backend.lastRequest()?.query.has('resolution')).toBe(false);

    await detectCommunities(backend.baseUrl, USER, 1.4);
    expect(backend.lastRequest()?.query.get('resolution')).toBe('1.4');

    await detectDuplicates(backend.baseUrl, USER, 0.9);
    expect(backend.lastRequest()?.query.get('threshold')).toBe('0.9');
  });

  it('merges two nodes by uuid', async () => {
    backend.on(`POST /memory/${USER}/merge`, {
      body: {
        success: true,
        keep_uuid: 'a',
        keep_name: 'Ada',
        removed_uuid: 'b',
        recreated_edges: 2,
      },
    });

    await mergeNodes(backend.baseUrl, USER, 'a', 'b');

    expect(backend.lastRequest()?.body).toEqual({ keep_uuid: 'a', remove_uuid: 'b' });
  });

  it('reorganizes the graph and reports what it did', async () => {
    backend.on(`POST /memory/${USER}/reorganize`, {
      body: {
        success: true,
        report: { orphans_removed: 4, merges_performed: 1, communities_found: 3, errors: [] },
      },
    });

    const result = await reorganizeGraph(backend.baseUrl, USER, 0.95);

    expect(result.report.orphans_removed).toBe(4);
    expect(backend.lastRequest()?.query.get('auto_merge_threshold')).toBe('0.95');
  });
});
