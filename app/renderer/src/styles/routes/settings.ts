import styled from "styled-components/macro";
import { themes } from "styles/themes";
import { StyledScrollbar } from "styles/mixins";
import { StyledButtonSecondary } from "styles";

export const StyledSettings = styled.main`
  width: 100%;
  height: 100%;

  padding-left: 2rem;
  padding-right: 1.4rem;

  flex: 1 1;

  animation: 320ms ${themes.enterFromRight} ease;

  overflow: hidden scroll;

  ${StyledScrollbar};
`;

export const StyledSettingSection = styled.section`
  width: 100%;
  height: max-content;

  display: grid;
  align-items: center;

  margin-top: 0.8rem;

  &:not(:first-of-type) {
    margin-top: 2rem;
    margin-bottom: 1.6rem;
  }

  &:last-of-type {
    margin-bottom: 0.2rem;
  }
`;

export const StyledSectionHeading = styled.h4`
  font-size: 1rem;
  font-weight: 500;

  color: var(--color-disabled-text);

  text-transform: uppercase;
`;

export const StyledStarButton = styled(StyledButtonSecondary)`
  width: 100%;
  min-width: 0;
  height: auto;
  min-height: 4.2rem;
  flex: 1 1 0;
  padding: 0.9rem 1.2rem;
  text-align: center;
  line-height: 1.25;
  white-space: normal;
  overflow-wrap: anywhere;

  & > svg {
    margin-left: -1rem;
  }
`;

export const StyledSupportButtonLabel = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
`;

export const StyledCoffeeEmoji = styled.span`
  display: inline-block;
  font-size: 1.9rem;
  line-height: 1;
  transform: translateY(0.05rem);
`;

export const StyledSectionSticky = styled.div`
  width: 100%;
  min-height: 7.5rem;

  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;

  gap: 0.8rem;

  background-color: var(--color-bg-primary);

  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;

  padding-top: 2rem;
  padding-bottom: 2rem;
`;
