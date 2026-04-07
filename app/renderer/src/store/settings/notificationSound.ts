import notificationBellWav from "assets/audios/notification-bell.wav";
import notificationCustomWav from "assets/audios/notification-custom.wav";
import { NotificationSoundTypes } from "./types";

type NotificationSoundOption = {
  value: NotificationSoundTypes;
  labelKey: string;
};

const notificationSoundSources: Record<NotificationSoundTypes, string> =
  {
    [NotificationSoundTypes.DEFAULT]: notificationBellWav,
    [NotificationSoundTypes.CUSTOM]: notificationCustomWav,
  };

export const notificationSoundOptions: NotificationSoundOption[] = [
  {
    value: NotificationSoundTypes.DEFAULT,
    labelKey: "settings.notificationSoundDefault",
  },
  {
    value: NotificationSoundTypes.CUSTOM,
    labelKey: "settings.notificationSoundCustom",
  },
];

export const getNotificationSoundSource = (
  notificationSound: NotificationSoundTypes
): string =>
  notificationSoundSources[notificationSound] ??
  notificationSoundSources[NotificationSoundTypes.DEFAULT];
