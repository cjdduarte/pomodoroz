import { padNum } from "utils";

export const useTime = (n: number) => {
  const safeTotalSeconds = Math.max(0, Math.floor(n));
  const hours = Math.floor(safeTotalSeconds / 3600);
  const minutes = Math.floor((safeTotalSeconds % 3600) / 60);
  const seconds = safeTotalSeconds % 60;

  return {
    hours: padNum(hours),
    minutes: padNum(minutes),
    seconds: padNum(seconds),
  };
};
