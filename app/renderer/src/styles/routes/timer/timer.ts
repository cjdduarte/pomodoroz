import styled from "styled-components/macro";

export const StyledTimer = styled.main`
  width: 100%;
  height: 100%;

  flex: 1 1;

  padding-top: 1.2rem;

  display: flex;
  flex-direction: column;
  align-items: end;

  &.compact {
    padding-top: 0;
    height: auto;
    flex: 0 0 auto;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    align-content: start;
    align-items: center;

    & > :last-child {
      grid-column: 1 / -1;
    }
  }

  animation: enterFromBottom 160ms ease;

  @keyframes enterFromBottom {
    0% {
      opacity: 0;
      transform: translateY(1.2rem);
    }

    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
