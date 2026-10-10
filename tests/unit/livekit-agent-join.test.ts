import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomEvent } from 'livekit-client';
import type * as LiveKitClient from 'livekit-client';
import { FakeRemoteParticipant, FakeRoom } from '../helpers/fake-livekit';

vi.mock('livekit-client', async (importOriginal) => {
  const actual = await importOriginal<typeof LiveKitClient>();
  const { FakeRoom: Fake } = await import('../helpers/fake-livekit');
  return { ...actual, Room: Fake, createLocalTracks: vi.fn(async () => []) };
});

const { LiveKitAdapter } = await import('../../src/agent/adapters/LiveKitAdapter');

const AGENT = 'agent-AJ_1';

/**
 * The agent is dispatched after the client joins and arrives a second or two later. Data
 * published before it is in the room reaches nobody, so the full config and every update sent
 * straight after connect were silently lost and the session ran on the agent's placeholder: it
 * answered as "Kwami" with the default voice whatever the panels said.
 */
async function connect(agentAlreadyThere = false) {
  const adapter = new LiveKitAdapter({
    url: 'wss://example.invalid',
    token: 'test-token',
    audioInputEnabled: false,
    agentIdentity: AGENT,
  });
  // sendConfigUpdate lives on the LiveKit pipeline, not on the AgentPipeline interface.
  const pipeline = adapter.createPipeline() as ReturnType<typeof adapter.createPipeline> & {
    sendConfigUpdate(type: string, config: unknown): void;
  };
  const original = FakeRoom.prototype.connect;
  if (agentAlreadyThere) {
    vi.spyOn(FakeRoom.prototype, 'connect').mockImplementation(async function (
      this: FakeRoom,
      url: string,
      token: string,
    ) {
      this.remoteParticipants.set(AGENT, new FakeRemoteParticipant(AGENT));
      return original.call(this, url, token);
    });
  }
  await pipeline.connect({ kwamiId: 'k1', kwamiName: 'Jarvis', soul: { name: 'Jarvis' } });
  return { pipeline, room: FakeRoom.last };
}

function agentJoins(room: FakeRoom) {
  const agent = new FakeRemoteParticipant(AGENT);
  room.remoteParticipants.set(AGENT, agent);
  room.emit(RoomEvent.ParticipantConnected, agent);
}

const types = (room: FakeRoom) =>
  room.decodePublished().map((m) => {
    const msg = m as { type: string; updateType?: string };
    return msg.updateType ? `${msg.type}:${msg.updateType}` : msg.type;
  });

beforeEach(() => {
  FakeRoom.reset();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('messages for an agent that has not joined yet', () => {
  it('are held, then delivered in order when it joins', async () => {
    const { pipeline, room } = await connect();
    pipeline.sendConfigUpdate('soul', { charter: { enabled: true } });
    pipeline.sendConfigUpdate('brain', { enabled: true });
    expect(room.publishedData).toHaveLength(0);

    agentJoins(room);

    expect(types(room)).toEqual(['config', 'config_update:soul', 'config_update:brain']);
    expect((room.decodePublished()[0] as { kwamiName: string }).kwamiName).toBe('Jarvis');
  });

  it('go straight out when the agent is already in the room', async () => {
    const { pipeline, room } = await connect(true);
    pipeline.sendConfigUpdate('brain', { enabled: true });
    expect(types(room)).toEqual(['config', 'config_update:brain']);
  });

  it('a replaced agent gets the config again, and the app is told to sync', async () => {
    const { room } = await connect();
    agentJoins(room);
    const seen: Array<{ rejoin: boolean }> = [];
    const listener = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener('kwami:agent_joined', listener);

    room.remoteParticipants.delete(AGENT);
    agentJoins(room);

    window.removeEventListener('kwami:agent_joined', listener);
    expect(types(room)).toEqual(['config', 'config']);
    expect(seen).toEqual([{ rejoin: true }]);
  });
});

describe('an agent that asks for the config', () => {
  it('gets it again, and the app is told to resend its updates', async () => {
    const { room } = await connect();
    agentJoins(room);
    const seen: Array<{ rejoin: boolean }> = [];
    const listener = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener('kwami:agent_joined', listener);

    const request = new TextEncoder().encode(JSON.stringify({ type: 'config_request' }));
    room.emit(RoomEvent.DataReceived, request, room.remoteParticipants.get(AGENT));

    window.removeEventListener('kwami:agent_joined', listener);
    expect(types(room)).toEqual(['config', 'config']);
    expect(seen).toEqual([{ rejoin: true }]);
  });
});
