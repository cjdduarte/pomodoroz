import {
  NotificationSoundTypes,
  NotificationTypes,
  SettingTypes,
} from "./types";
import { DEFAULT_SHORTCUTS, detectOS, isPreferredDark } from "utils";

export const defaultSettings: Readonly<SettingTypes> = Object.freeze({
  alwaysOnTop: false,
  compactMode: false,
  showGridRandomButton: true,
  enableGridColorLoop: true,
  ignoreUpdate: "",
  enableFullscreenBreak: false,
  enableStrictMode: false,
  enableDarkTheme: isPreferredDark(),
  followSystemTheme: true,
  enableProgressAnimation: true,
  enableFocusExtension: false,
  enableVoiceAssistance: false,
  notificationSoundOn: true,
  notificationSound: NotificationSoundTypes.DEFAULT,
  notificationType: NotificationTypes.NONE,
  closeToTray: true,
  minimizeToTray: false,
  autoStartWorkTime: false,
  resetFocusToIdleEnabled: false,
  useNativeTitlebar: detectOS() === "Windows" ? false : true,
  openAtLogin: false,
  enableInAppAutoUpdate: false,
  language: "auto",
  shortcuts: { ...DEFAULT_SHORTCUTS },
});
