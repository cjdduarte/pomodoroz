declare module "*.woff";
declare module "*.woff2";
declare module "*.png";
declare module "*.jpg";
declare module "*.wav";
declare module "*.mp4";
declare module "*.ogv";
declare module "*.webm";

declare module "*.svg" {
  import * as React from "react";

  export const ReactComponent: React.FunctionComponent<
    React.ComponentProps<"svg"> & {
      title?: string;
      titleId?: string;
      desc?: string;
      descId?: string;
    }
  >;

  const src: string;
  export default src;
}
