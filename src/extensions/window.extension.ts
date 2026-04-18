declare global {
  interface Window {
    isUserHaveSession?: () => boolean;
  }
}

export {};
