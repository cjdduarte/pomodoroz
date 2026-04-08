import { PayloadAction } from "@reduxjs/toolkit";

export type SettingTypes = {
  ignoreUpdate: string;
  alwaysOnTop: boolean;
  compactMode: boolean;
  showGridRandomButton: boolean;
  enableGridColorLoop: boolean;
  enableFullscreenBreak: boolean;
  enableDarkTheme: boolean;
  followSystemTheme: boolean;
  enableStrictMode: boolean;
  enableProgressAnimation: boolean;
  enableVoiceAssistance: boolean;
  useNativeTitlebar: boolean;
  notificationSoundOn: boolean;
  notificationSound: NotificationSoundTypes;
  closeToTray: boolean;
  minimizeToTray: boolean;
  autoStartWorkTime: boolean;
  resetFocusToIdleEnabled: boolean;
  notificationType: NotificationTypes;
  openAtLogin: boolean;
  enableInAppAutoUpdate: boolean;
  language: LanguageOption;
};

export type LanguageCode = "en" | "es" | "zh" | "ja" | "pt";

export type LanguageOption = "auto" | LanguageCode;

export enum NotificationSoundTypes {
  DEFAULT = "default",
  CUSTOM = "custom",
}

export const enum NotificationTypes {
  NONE = "none",
  NORMAL = "normal",
  EXTRA = "extra",
}

export type SettingsPayload<T extends keyof SettingTypes> =
  PayloadAction<SettingTypes[T]>;
