import styled, { css } from "styled-components";
import { themes } from "styles";

const TitlebarButton = css`
  width: 4rem;
  height: 100%;

  border: none;
  background-color: transparent;

  position: relative;

  /*
   * Workaround Linux/Tauri:
   * após restaurar da bandeja, o toggle de resizable (usado para
   * recuperar input grab no webkit2gtk) pode gerar hover preso.
   * O TauriConnectorProvider aplica data-suppress-hover="true" no
   * html por um curto período até o próximo mousemove real.
   */
  html[data-suppress-hover="true"] &:hover {
    background-color: transparent;
  }

  &:hover {
    background-color: var(--color-titlebar-hover);
  }
`;

export const StyledTitlebar = styled.div`
  width: 100%;
  height: 4rem;

  display: flex;
  align-items: center;
`;

export const StyledTitlebarDragRegion = styled.div`
  flex: 1;
  min-width: 0;
  height: 100%;

  display: flex;
  align-items: center;
  cursor: grab;
`;

export const StyledMarkWrapper = styled.div`
  width: max-content;
  height: 100%;
  display: grid;
  align-items: center;
  grid-auto-flow: column;
  column-gap: 0.8rem;

  padding-left: 1rem;
  pointer-events: none;
`;

export const StyledMarkLogo = styled.img`
  width: 1.6rem;
  height: 1.6rem;

  border-radius: 5px;
  background-color: var(--color-bg-tertiary);
`;

export const StyledMarkName = styled.h1<{ type?: string }>`
  font-size: 1.4rem;
  color: var(--color-heading-text);

  display: flex;
  align-items: flex-start;

  span {
    font-size: 1rem;
    font-weight: 500;
    text-transform: lowercase;
    margin-left: 0.8rem;
  }
`;

export const StyledThemeToggler = styled.button`
  ${TitlebarButton};
`;

export const StyledWindowActions = styled.div`
  width: max-content;
  height: 100%;
`;

export const StyledMinimizeButton = styled.button`
  ${TitlebarButton};

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;

    width: 12px;
    height: 2px;

    border-radius: 10px;
    background-color: var(--color-body-text);
    transform: translate(-50%, -50%);
  }
`;

export const StyledCloseButton = styled.button`
  ${TitlebarButton};

  html[data-suppress-hover="true"] &:hover {
    &::before,
    &::after {
      background-color: var(--color-body-text);
    }
  }

  &:hover {
    &::before,
    &::after {
      background-color: ${themes.color.close};
    }
  }

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;

    margin-left: -7px;
    margin-top: -1px;

    width: 14px;
    height: 2px;

    border-radius: 10px;
    background-color: var(--color-body-text);
  }

  &::before {
    transform: rotate(45deg);
  }

  &::after {
    transform: rotate(-45deg);
  }
`;
