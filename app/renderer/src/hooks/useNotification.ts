import { NotificationSoundTypes } from "store/settings/types";
import { getNotificationSoundSource } from "store/settings/notificationSound";

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

      new Audio(defaultSound).play().catch((e) => {
        console.warn("There was a problem playing sound", e);
      });

      if (audioSrc) {
        setTimeout(() => {
          new Audio(audioSrc).play().catch((e) => {
            console.warn("There was a problem playing sound", e);
          });
        }, 1500);
      }
    }

    if (!notify) return;
    return new window.Notification(title, defaultOptions);
  };
};
