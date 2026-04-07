import {
  useState,
  useLayoutEffect,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

interface TargetOutside<T extends HTMLElement = HTMLElement> {
  ref: RefObject<T>;
  eventType?: keyof DocumentEventMap;
}

/**
 * If you want to listen to clicks outside the element set eventType to 'click'
 * @param ref
 * @param eventType
 */
export const useTargetOutside = <T extends HTMLElement = HTMLElement>({
  ref,
  eventType,
}: TargetOutside<T>): [boolean, Dispatch<SetStateAction<boolean>>] => {
  const [state, setState] = useState(false);

  useLayoutEffect(() => {
    function outsideTarget(e: Event) {
      const { current } = ref;
      const target = e.target;

      if (current && target instanceof Node) {
        if (current.contains(target)) return;
        setState(false);
      }
    }

    function closeOnEscape(e: KeyboardEvent) {
      if (e.code === "Escape") {
        setState(false);
      }
    }

    if (state) {
      if (eventType)
        document.addEventListener(eventType, outsideTarget);
      document.addEventListener("keydown", closeOnEscape);
    }
    return () => {
      if (eventType)
        document.removeEventListener(eventType, outsideTarget);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [state, ref, eventType]);

  return [state, setState];
};
