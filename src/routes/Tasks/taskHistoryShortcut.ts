type TaskHistoryShortcutEvent = Pick<
  KeyboardEvent,
  "code" | "ctrlKey" | "metaKey" | "shiftKey"
>;

// Ctrl+Shift+Z também casa com "Ctrl+Z": o Shift decide entre undo e redo.
export const getTaskHistoryShortcutAction = (
  event: TaskHistoryShortcutEvent
): "undo" | "redo" | null => {
  if (!(event.ctrlKey || event.metaKey) || event.code !== "KeyZ") {
    return null;
  }

  return event.shiftKey ? "redo" : "undo";
};
