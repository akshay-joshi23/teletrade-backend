export type Trade = "HVAC" | "PLUMBING" | "ELECTRICAL" | "GENERAL";

export interface MockHostSession {
  id: string; // roomId or host session id
  proId: string;
  trade: Trade;
  createdAt: number; // ms epoch
  status: "OPEN" | "LIVE" | "ENDED";
}

export interface MockJoinRequest {
  id: string; // waitingRoomId / request id
  homeownerId: string;
  trade: Trade;
  note?: string;
  status: "OPEN" | "ADMITTED" | "MATCHED" | "CANCELED" | "COMPLETED";
  roomId?: string; // set when matched/admitted
  proId?: string; // set when admitted
  createdAt: number;
  updatedAt: number;
}

type Store = {
  hostSessions: Map<string, MockHostSession>;
  joinRequests: Map<string, MockJoinRequest>;
  sweep(): void;
};

const g = globalThis as any;
if (!g.__teletradeMockStore) {
  const store: Store = {
    hostSessions: new Map(),
    joinRequests: new Map(),
    sweep() {
      const now = Date.now();
      const HOST_TTL = 1000 * 60 * 60; // 1h
      const REQ_TTL = 1000 * 60 * 60; // 1h
      for (const [k, v] of this.hostSessions) {
        if (now - v.createdAt > HOST_TTL || v.status === "ENDED") this.hostSessions.delete(k);
      }
      for (const [k, v] of this.joinRequests) {
        if (now - v.createdAt > REQ_TTL || ["COMPLETED", "CANCELED"].includes(v.status)) this.joinRequests.delete(k);
      }
    },
  };
  g.__teletradeMockStore = store;

  if (typeof setInterval === "function") {
    // best-effort periodic sweep when the lambda stays warm
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setInterval(() => g.__teletradeMockStore.sweep(), 60_000).unref?.();
  }
}

export const mockStore = g.__teletradeMockStore as Store;


