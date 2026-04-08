import {
  autoUpdater,
  UpdateInfo,
  AppUpdater,
  ProgressInfo,
} from "electron-updater";
import ElectronLogger from "electron-log";
import { app } from "electron";
import fs from "fs";
import path from "path";

type AutoUpdateProps = {
  onErrorUpdating?: (error: unknown) => void;
  onCheckingUpdates?: () => void;
  onUpdateAvailable?: (info: UpdateInfo) => void;
  onUpdateNotAvailable?: (info: UpdateInfo) => void;
  onDownloadProgress?: (progress: ProgressInfo) => void;
  onUpdateDownloaded?: (info: UpdateInfo) => void;
};

export function activateAutoUpdate({
  onErrorUpdating,
  onCheckingUpdates,
  onUpdateAvailable,
  onUpdateNotAvailable,
  onDownloadProgress,
  onUpdateDownloaded,
}: AutoUpdateProps): AppUpdater {
  const logger = ElectronLogger;
  logger.transports.file.level = "debug";
  autoUpdater.logger = logger;

  if (onErrorUpdating) autoUpdater.on("error", onErrorUpdating);

  const devUpdaterConfigPath = path.join(
    app.getAppPath(),
    "dev-app-update.yml"
  );
  const packagedUpdaterConfigPath = path.join(
    process.resourcesPath,
    "app-update.yml"
  );
  const isPackagedLinuxWithoutAppImage =
    app.isPackaged &&
    process.platform === "linux" &&
    !process.env.APPIMAGE;
  const shouldCheckForUpdates = app.isPackaged
    ? fs.existsSync(packagedUpdaterConfigPath) &&
      !isPackagedLinuxWithoutAppImage
    : fs.existsSync(devUpdaterConfigPath);

  if (onCheckingUpdates)
    autoUpdater.on("checking-for-update", onCheckingUpdates);

  if (onUpdateAvailable)
    autoUpdater.on("update-available", onUpdateAvailable);

  if (onUpdateNotAvailable)
    autoUpdater.on("update-not-available", onUpdateNotAvailable);

  if (onDownloadProgress)
    autoUpdater.on("download-progress", onDownloadProgress);

  if (onUpdateDownloaded)
    autoUpdater.on("update-downloaded", onUpdateDownloaded);

  if (shouldCheckForUpdates) {
    autoUpdater.checkForUpdates().catch((error) => {
      logger.error("[Updater] checkForUpdates failed:", error);
      onErrorUpdating?.(error);
    });
  } else {
    if (isPackagedLinuxWithoutAppImage) {
      logger.info(
        "[Updater] Skipping update check on Linux packaged app without APPIMAGE env"
      );
    } else if (app.isPackaged) {
      logger.info(
        `[Updater] Skipping update check in packaged app (missing ${packagedUpdaterConfigPath})`
      );
    } else {
      logger.info(
        `[Updater] Skipping update check in dev (missing ${devUpdaterConfigPath})`
      );
    }
  }

  return autoUpdater;
}
