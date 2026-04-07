import { useCallback, useEffect, useRef } from "react";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
};

type WakeLockLike = {
  request: (type: "screen") => Promise<WakeLockSentinelLike>;
};

declare global {
  interface Navigator {
    wakeLock?: WakeLockLike;
  }
}

const useWakeLock = () => {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  const preventSleeping = useCallback(async () => {
    if (!navigator.wakeLock) {
      return;
    }

    if (sentinelRef.current && !sentinelRef.current.released) {
      return;
    }

    try {
      sentinelRef.current = await navigator.wakeLock.request("screen");
    } catch (_) {
      sentinelRef.current = null;
    }
  }, []);

  const allowSleeping = useCallback(async () => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    sentinelRef.current = null;

    try {
      await sentinel.release();
    } catch (_) {
      // no-op
    }
  }, []);

  useEffect(() => {
    return () => {
      void allowSleeping();
    };
  }, [allowSleeping]);

  return { preventSleeping, allowSleeping };
};

export default useWakeLock;
