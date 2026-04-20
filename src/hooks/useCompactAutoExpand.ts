import { useCallback, useEffect, useRef } from "react";
import { getInvokeConnector } from "contexts";
import { COMPACT_COLLAPSE, COMPACT_EXPAND } from "ipc";

type UseCompactAutoExpandOptions = {
  compactModeEnabled: boolean;
  threshold?: number;
};

const DEFAULT_THRESHOLD = 260;

const useCompactAutoExpand = ({
  compactModeEnabled,
  threshold = DEFAULT_THRESHOLD,
}: UseCompactAutoExpandOptions) => {
  const didExpandRef = useRef(false);
  const compactModeEnabledRef = useRef(compactModeEnabled);

  useEffect(() => {
    compactModeEnabledRef.current = compactModeEnabled;
  }, [compactModeEnabled]);

  const maybeExpandCompact = useCallback(() => {
    if (!compactModeEnabled) {
      return false;
    }

    if (
      typeof window === "undefined" ||
      window.innerHeight >= threshold
    ) {
      return false;
    }

    if (didExpandRef.current) {
      return false;
    }

    didExpandRef.current = true;
    getInvokeConnector().send(COMPACT_EXPAND);
    return true;
  }, [compactModeEnabled, threshold]);

  const collapseCompact = useCallback(() => {
    if (!didExpandRef.current) {
      return false;
    }

    didExpandRef.current = false;

    if (!compactModeEnabledRef.current) {
      return false;
    }

    getInvokeConnector().send(COMPACT_COLLAPSE);
    return true;
  }, []);

  useEffect(() => {
    return () => {
      collapseCompact();
    };
  }, [collapseCompact]);

  return {
    maybeExpandCompact,
    collapseCompact,
  };
};

export default useCompactAutoExpand;
