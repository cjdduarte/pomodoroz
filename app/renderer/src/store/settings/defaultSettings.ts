import {
  NotificationSoundTypes,
  NotificationTypes,
  SettingTypes,
} from "./types";
import { detectOS, isPreferredDark } from "utils";

export const defaultSettings: Readonly<SettingTypes> = Object.freeze({
  alwaysOnTop: false,
  compactMode: false,
  showGridRandomButton: false,
  enableGridColorLoop: false,
  ignoreUpdate: "",
  enableFullscreenBreak: false,
  enableStrictMode: false,
  enableDarkTheme: isPreferredDark(),
  followSystemTheme: true,
  enableProgressAnimation: true,
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
  language: "auto",
});
