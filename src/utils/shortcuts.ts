type ShortcutEvent = {
  altKey: boolean;
  ctrlKey: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
  preventDefault(): void;
};

type ShortcutMatchEvent = Omit<ShortcutEvent, "preventDefault">;

const SHORTCUT_MODIFIERS = ["CmdOrCtrl", "Alt", "Shift"] as const;

type ShortcutModifier = (typeof SHORTCUT_MODIFIERS)[number];

export const DEFAULT_SHORTCUTS = Object.freeze({
  toggleTheme: "Alt+Shift+t",
});

export type ShortcutAction = keyof typeof DEFAULT_SHORTCUTS;
export type ShortcutSettings = Record<ShortcutAction, string>;

const MODIFIER_LABELS: Record<ShortcutModifier, string> = {
  CmdOrCtrl: "Cmd/Ctrl",
  Alt: "Alt",
  Shift: "Shift",
};

const MODIFIER_ALIASES: Record<string, ShortcutModifier> = {
  alt: "Alt",
  cmd: "CmdOrCtrl",
  command: "CmdOrCtrl",
  control: "CmdOrCtrl",
  ctrl: "CmdOrCtrl",
  cmdorctrl: "CmdOrCtrl",
  "cmd/ctrl": "CmdOrCtrl",
  meta: "CmdOrCtrl",
  shift: "Shift",
};

const normalizeModifier = (
  modifier: string
): ShortcutModifier | null => {
  const normalized = modifier.trim().toLowerCase().replace(/\s/g, "");
  return MODIFIER_ALIASES[normalized] ?? null;
};

const isShortcutKey = (key: string): boolean => /^[0-9a-z]$/.test(key);

export const normalizeShortcut = (shortcut: string): string | null => {
  const parts = shortcut
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const key = parts[parts.length - 1].toLowerCase();
  if (!isShortcutKey(key)) {
    return null;
  }

  const modifiers = new Set<ShortcutModifier>();
  for (const part of parts.slice(0, -1)) {
    const modifier = normalizeModifier(part);
    if (!modifier || modifiers.has(modifier)) {
      return null;
    }
    modifiers.add(modifier);
  }

  if (modifiers.size === 0) {
    return null;
  }

  const orderedModifiers = SHORTCUT_MODIFIERS.filter((modifier) =>
    modifiers.has(modifier)
  );

  return [...orderedModifiers, key].join("+");
};

export const formatShortcut = (shortcut: string): string => {
  const normalized = normalizeShortcut(shortcut);
  if (!normalized) {
    return shortcut;
  }

  return normalized
    .split("+")
    .map((part, index, parts) => {
      if (index === parts.length - 1) {
        return part.toUpperCase();
      }
      return MODIFIER_LABELS[part as ShortcutModifier] ?? part;
    })
    .join(" + ");
};

const createShortcutList = (shortcuts: string[]): readonly string[] =>
  shortcuts
    .map((shortcut) => normalizeShortcut(shortcut))
    .filter((shortcut): shortcut is string => Boolean(shortcut));

export const RESERVED_SHORTCUTS = createShortcutList([
  "Alt+Shift+h",
  "Alt+Shift+s",
  "CmdOrCtrl+a",
  "CmdOrCtrl+c",
  "CmdOrCtrl+v",
  "CmdOrCtrl+x",
  "CmdOrCtrl+z",
  "CmdOrCtrl+Shift+z",
]);

export const isReservedShortcut = (
  shortcut: string,
  reservedShortcuts: readonly string[] = RESERVED_SHORTCUTS
): boolean => {
  const normalized = normalizeShortcut(shortcut);
  if (!normalized) {
    return true;
  }

  return reservedShortcuts.some(
    (reservedShortcut) =>
      normalizeShortcut(reservedShortcut) === normalized
  );
};

export const getShortcutFromEvent = (
  event: ShortcutEvent
): string | null => {
  const key = event.key.toLowerCase();
  if (!isShortcutKey(key)) {
    return null;
  }

  const modifiers: ShortcutModifier[] = [];
  if (event.ctrlKey || event.metaKey) {
    modifiers.push("CmdOrCtrl");
  }
  if (event.altKey) {
    modifiers.push("Alt");
  }
  if (event.shiftKey) {
    modifiers.push("Shift");
  }

  if (modifiers.length === 0) {
    return null;
  }

  const shortcut = normalizeShortcut([...modifiers, key].join("+"));
  if (!shortcut) {
    return null;
  }

  event.preventDefault();
  return shortcut;
};

export const shortcutMatchesEvent = (
  shortcut: string,
  event: ShortcutMatchEvent
): boolean => {
  const normalized = normalizeShortcut(shortcut);
  if (!normalized) {
    return false;
  }

  const parts = normalized.split("+");
  const key = parts[parts.length - 1];
  if (event.key.toLowerCase() !== key) {
    return false;
  }

  const modifiers = new Set(parts.slice(0, -1));
  const commandOrControlPressed = event.ctrlKey || event.metaKey;

  return (
    modifiers.has("CmdOrCtrl") === commandOrControlPressed &&
    modifiers.has("Alt") === event.altKey &&
    modifiers.has("Shift") === event.shiftKey
  );
};
