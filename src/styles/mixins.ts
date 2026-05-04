import { css } from "styled-components";

export const StyledScrollbar = css`
  scrollbar-width: thin;
  scrollbar-color: var(--color-disabled-text) var(--color-bg-tertiary);

  &::-webkit-scrollbar {
    width: 0.6rem;
    height: 0.6rem;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--color-disabled-text);
  }

  &::-webkit-scrollbar-track {
    background-color: var(--color-bg-tertiary);
  }
`;
