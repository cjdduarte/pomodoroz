import styled from "styled-components";

type LayoutProps = { noTransition?: boolean };

export const StyledLayout = styled.div<LayoutProps>`
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  justify-items: center;
  background-color: var(--color-bg-primary);

  & > main {
    height: 38rem;
    animation: ${(p) => p.noTransition && "none"};
    &.compact {
      height: unset;
    }
  }
`;
