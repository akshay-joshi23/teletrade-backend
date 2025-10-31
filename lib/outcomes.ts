export type OutcomeType = "resolved_remote" | "needs_in_person" | "parts_required";

export type OutcomeRecord = {
  roomId: string;
  trade: import("./types").Trade | "";
  proSessionId: string;
  homeownerSessionId: string;
  outcome: OutcomeType;
  notes?: string;
  createdAt: number;
};

const byRoom = new Map<string, OutcomeRecord>();

export function saveOutcome(rec: OutcomeRecord) {
  byRoom.set(rec.roomId, rec);
}

export function getOutcome(roomId: string) {
  return byRoom.get(roomId) || null;
}


