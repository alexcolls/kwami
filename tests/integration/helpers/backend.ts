import { once } from 'node:events';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface RecordedRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

export interface StubbedRoute {
  status?: number;
  body?: unknown;
}

/**
 * A stand-in for the Kwami backend, on a real socket.
 *
 * The api-client tests drive `src/utils/api-client.ts` against this over HTTP rather than
 * stubbing `fetch`, so URL construction, query-string encoding, headers, request bodies and
 * status handling are all exercised the way they run in production. Anything the client and
 * this server disagree about is a contract bug the unit layer cannot see.
 */
export class FakeBackend {
  private readonly server: Server;
  private readonly routes = new Map<string, StubbedRoute>();
  readonly requests: RecordedRequest[] = [];

  private constructor(server: Server) {
    this.server = server;
  }

  static async start(): Promise<FakeBackend> {
    // Construct first, attach the listener second: the handler closes over the instance,
    // so passing it to createServer would mean referring to a binding that does not exist yet.
    const server = createServer();
    const backend = new FakeBackend(server);

    server.on('request', (req, res) => {
      backend.handle(req, res).catch((error: unknown) => {
        res.statusCode = 500;
        res.end(JSON.stringify({ detail: String(error) }));
      });
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    return backend;
  }

  get baseUrl(): string {
    const address = this.server.address() as AddressInfo;
    return `http://127.0.0.1:${address.port}`;
  }

  /** Register the response for one `METHOD /pathname` pair (no query string). */
  on(route: string, response: StubbedRoute): this {
    this.routes.set(route, response);
    return this;
  }

  lastRequest(): RecordedRequest | undefined {
    return this.requests.at(-1);
  }

  reset(): void {
    this.routes.clear();
    this.requests.length = 0;
  }

  async stop(): Promise<void> {
    this.server.closeAllConnections();
    this.server.close();
    await once(this.server, 'close');
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', this.baseUrl);
    const raw = await readBody(req);

    this.requests.push({
      method: req.method ?? 'GET',
      path: url.pathname,
      query: url.searchParams,
      headers: req.headers,
      body: raw ? safeJson(raw) : undefined,
    });

    const route = this.routes.get(`${req.method} ${url.pathname}`);
    res.setHeader('content-type', 'application/json');

    if (!route) {
      res.statusCode = 404;
      res.end(JSON.stringify({ detail: `No stub for ${req.method} ${url.pathname}` }));
      return;
    }

    res.statusCode = route.status ?? 200;
    res.end(JSON.stringify(route.body ?? {}));
  }
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}
