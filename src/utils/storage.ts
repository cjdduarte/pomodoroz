type CorruptStorageRead = {
  error: unknown;
  rawValue: string;
};

export type StorageReadResult<T> =
  | { status: "ok"; value: T }
  | { status: "missing" }
  | ({ status: "corrupt" } & CorruptStorageRead);

const corruptStorageReads = new Map<string, CorruptStorageRead>();

const buildCorruptBackupKey = (name: string): string => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9A-Za-z]/g, "-");

  return `${name}.corrupt.${timestamp}`;
};

export const saveToStorage = <T>(name: string, state: T): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(name, serializedState);
  } catch (error) {
    console.error(error);
  }
};

export const readFromStorage = <T = unknown>(
  name: string
): StorageReadResult<T> => {
  try {
    const serializedState = localStorage.getItem(name);
    if (serializedState === null) {
      return { status: "missing" };
    }

    return {
      status: "ok",
      value: JSON.parse(serializedState) as T,
    };
  } catch (error) {
    const rawValue = localStorage.getItem(name) ?? "";
    corruptStorageReads.set(name, { error, rawValue });
    console.error(error);
    return { status: "corrupt", error, rawValue };
  }
};

export const getFromStorage = <T = unknown>(
  name: string
): T | undefined => {
  const result = readFromStorage<T>(name);

  return result.status === "ok" ? result.value : undefined;
};

export const backupCorruptStorageValue = (
  name: string
): string | null => {
  const corruptRead = corruptStorageReads.get(name);
  if (!corruptRead) {
    return null;
  }

  const backupKey = buildCorruptBackupKey(name);
  try {
    localStorage.setItem(backupKey, corruptRead.rawValue);
    corruptStorageReads.delete(name);
    console.warn(
      `[Storage] Valor corrompido de ${name} preservado em ${backupKey}.`,
      corruptRead.error
    );
    return backupKey;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const removeFromStorage = (name: string): void => {
  try {
    localStorage.removeItem(name);
  } catch (error) {
    console.error(error);
  }
};
