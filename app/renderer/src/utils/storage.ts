export const saveToStorage = <T>(name: string, state: T): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(name, serializedState);
  } catch (error) {
    console.error(error);
  }
};

export const getFromStorage = <T = unknown>(
  name: string
): T | undefined => {
  try {
    const serializedState = localStorage.getItem(name);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState) as T;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
