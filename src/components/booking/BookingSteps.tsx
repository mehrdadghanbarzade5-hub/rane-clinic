export type StepId =
  | "topic"
  | "therapist"
  | "slot"
  | "visited"
  | "intake"
  | "confirm";

export const STEPS: { id: StepId; label: string }[] = [
  { id: "topic", label: "موضوع" },
  { id: "therapist", label: "درمانگر" },
  { id: "slot", label: "نوبت" },
  { id: "visited", label: "سابقه" },
  { id: "intake", label: "اولین مراجعه" },
  { id: "confirm", label: "تأیید" },
];
