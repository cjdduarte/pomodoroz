export type TaskGridPriorityDisplayMode = "normal" | "first" | "only";

export const resolveInitialTaskGridPriorityDisplayMode = (
  storedValue: unknown,
  legacyStoredValue: unknown
): TaskGridPriorityDisplayMode => {
  if (
    storedValue === "normal" ||
    storedValue === "first" ||
    storedValue === "only"
  ) {
    return storedValue;
  }

  return legacyStoredValue === "prioritized" ? "only" : "normal";
};

export const getNextTaskGridPriorityDisplayMode = (
  current: TaskGridPriorityDisplayMode
): TaskGridPriorityDisplayMode => {
  if (current === "normal") return "first";
  if (current === "first") return "only";
  return "normal";
};
