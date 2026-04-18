import type { KeyboardEvent } from "react";

const SHORTCUT_MODIFIERS = Object.freeze({
  Control: "CmdOrCtrl",
  Alt: "Alt",
  Meta: "Meta",
  Shift: "Shift",
});

export function getShortcutFromEvent(e: KeyboardEvent) {
  // Ignore the event if there is no modifier
  if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) return null;

  const key = e.key.toLowerCase();

  // Ignore modifiers for the key part in the shortcut
  if (
    key === "control" ||
    key === "alt" ||
    key === "meta" ||
    key === "shift"
  )
    return null;

  e.preventDefault();

  let shortcut = "";

  // Add modifiers to the shortcut
  if (e.ctrlKey) shortcut += `${SHORTCUT_MODIFIERS.Control}+`;
  if (e.altKey) shortcut += `${SHORTCUT_MODIFIERS.Alt}+`;
  if (e.metaKey) shortcut += `${SHORTCUT_MODIFIERS.Meta}+`;
  if (e.shiftKey) shortcut += `${SHORTCUT_MODIFIERS.Shift}+`;

  // Accept only alphanumeric characters (for now)
  if (!key.match(/^[0-9a-z]$/)) return null;

  shortcut += key;
  return shortcut;
}
