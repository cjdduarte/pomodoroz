import { NotificationSoundTypes } from "store/settings/types";
import { getNotificationSoundSource } from "store/settings/notificationSound";
import { playNotificationAudio, showDesktopNotification } from "utils";

type OptionProps = {
  mute?: boolean;
  notificationSound?: NotificationSoundTypes;
} & NotificationOptions;

export const useNotification = (
  constantOptions?: OptionProps,
  notify?: boolean
) => {
  return function (
    title: string,
    options: NotificationOptions,
    audioSrc?: string
  ) {
    const {
      mute,
      notificationSound = NotificationSoundTypes.DEFAULT,
      ...constantNotificationOptions
    } = constantOptions ?? {};

    const defaultOptions: NotificationOptions = {
      ...constantNotificationOptions,
      ...options,
      silent: true,
    };

    // Making sure that notification sound the same
    // in all Operating System

    if (!mute) {
      const defaultSound =
        getNotificationSoundSource(notificationSound);
      void playNotificationAudio(defaultSound);

      if (audioSrc) {
        void playNotificationAudio(audioSrc, { delayMs: 1500 });
      }
    }

    if (!notify) return;
    void showDesktopNotification(title, defaultOptions);
  };
};
