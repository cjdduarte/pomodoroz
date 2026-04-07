import { useState, useCallback } from "react";

type InputState = string | Record<string, string>;

export const useInput = <T extends InputState>(initialState: T) => {
  const [value, setValue] = useState<T>(initialState);
  const isObjectState =
    typeof initialState === "object" && initialState !== null;

  const getValueCallback = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value: inputValue } = e.target;
      if (isObjectState) {
        setValue(
          (prevState) =>
            ({
              ...(prevState as Record<string, string>),
              [name]: inputValue,
            }) as T
        );
        return;
      }
      setValue(inputValue as T);
    },
    [isObjectState]
  );

  return { value, setValue, getValueCallback };
};
