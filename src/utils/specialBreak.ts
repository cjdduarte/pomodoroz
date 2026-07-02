import type {
  ConfigTypes,
  SpecialBreakTypes,
} from "store/config/types";

type SpecialBreakId = keyof ConfigTypes["specialBreaks"];

export type SpecialBreakTrigger = {
  breakConfig: SpecialBreakTypes;
  key: string;
};

const SPECIAL_BREAK_ORDER: SpecialBreakId[] = [
  "firstBreak",
  "secondBreak",
  "thirdBreak",
  "fourthBreak",
];

const parseClockTimeToMinutes = (value: string): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
};

const getDateKey = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
};

const getCurrentMinutes = (date: Date): number =>
  date.getHours() * 60 + date.getMinutes();

const isWithinSpecialBreakWindow = (
  breakConfig: SpecialBreakTypes,
  currentMinutes: number
): boolean => {
  const fromMinutes = parseClockTimeToMinutes(breakConfig.fromTime);
  const toMinutes = parseClockTimeToMinutes(breakConfig.toTime);

  if (fromMinutes === null || toMinutes === null) {
    return false;
  }

  return fromMinutes <= currentMinutes && currentMinutes < toMinutes;
};

export const getSpecialBreakTrigger = (
  specialBreaks: ConfigTypes["specialBreaks"],
  date: Date,
  triggeredKeys: ReadonlySet<string>
): SpecialBreakTrigger | null => {
  const dateKey = getDateKey(date);
  const currentMinutes = getCurrentMinutes(date);

  for (const id of SPECIAL_BREAK_ORDER) {
    const breakConfig = specialBreaks[id];
    if (!breakConfig) {
      continue;
    }

    const key = `${dateKey}:${id}:${breakConfig.fromTime}-${breakConfig.toTime}`;
    if (
      !triggeredKeys.has(key) &&
      isWithinSpecialBreakWindow(breakConfig, currentMinutes)
    ) {
      return { breakConfig, key };
    }
  }

  return null;
};
