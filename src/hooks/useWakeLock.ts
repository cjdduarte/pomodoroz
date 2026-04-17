import { useCallback, useEffect, useRef } from "react";

const useWakeLock = () => {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const preventSleeping = useCallback(async () => {
    const wakeLockApi = (
      navigator as Navigator & { wakeLock?: WakeLock }
    ).wakeLock;

    if (!wakeLockApi) {
      return;
    }

    if (sentinelRef.current && !sentinelRef.current.released) {
      return;
    }

    try {
      sentinelRef.current = await wakeLockApi.request("screen");
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
