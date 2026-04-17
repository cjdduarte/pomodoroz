import { CounterContext } from "contexts";
import { useEffect, useContext } from "react";
import { useAppSelector } from "./storeHooks";
import { TraySVG } from "components";
import { encodeSvg } from "utils";

export const useTrayIconUpdates = (
  onNewIcon: (dataUrl: string) => void
) => {
  const timer = useAppSelector((state) => state.timer);

  const { count, duration, timerType } = useContext(CounterContext);
  // Throttle tray icon updates to 1s resolution to avoid excessive native
  // icon updates on Linux appindicator.
  const safeDuration = duration > 0 ? duration : 1;
  const displayCount = Math.ceil(count);
  const clampedDisplayCount = Math.max(
    0,
    Math.min(safeDuration, displayCount)
  );
  const dashOffset =
    ((safeDuration - clampedDisplayCount) * 24) / safeDuration;

  useEffect(() => {
    if (timer.playing) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = 16;
      canvas.height = 16;

      let svgXML = encodeSvg(
        <TraySVG timerType={timerType} dashOffset={dashOffset} />
      );

      const img = new Image();
      img.src = svgXML;

      img.onload = function () {
        ctx?.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");

        onNewIcon(dataUrl);
      };
    }
  }, [onNewIcon, timer.playing, timerType, dashOffset]);
};
