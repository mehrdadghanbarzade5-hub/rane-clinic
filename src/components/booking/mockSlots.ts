export type BusyLevel = "quiet" | "normal" | "busy";

export type Slot = {
  time: string;          // "18:30"
  level: BusyLevel;      // quiet/normal/busy
  available: boolean;    // true/false
};

export const mockSlots: Record<string, Slot[]> = {
  "2026-02-14": [
    { time: "16:00", level: "quiet", available: true },
    { time: "17:30", level: "busy", available: false },
    { time: "19:00", level: "normal", available: true },
  ],
};
