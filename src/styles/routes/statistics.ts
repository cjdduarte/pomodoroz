import styled, { css } from "styled-components";
import { StyledScrollbar } from "styles/mixins";
import { themes } from "styles/themes";

export const StyledStatistics = styled.main`
  width: 100%;
  height: 100%;

  padding-left: 2rem;
  padding-right: 1.4rem;
  padding-bottom: 2rem;

  flex: 1 1;
  overflow: hidden scroll;

  animation: 320ms ${themes.enterFromRight} ease;

  ${StyledScrollbar};
`;

export const StyledStatisticsToolbar = styled.div`
  display: grid;
  grid-template-columns: 1fr max-content;
  align-items: end;
  gap: 1rem;

  margin-top: 1.6rem;
  margin-bottom: 1.2rem;
`;

export const StyledStatisticsToolbarLabel = styled.label`
  font-size: 1rem;
  color: var(--color-disabled-text);
  text-transform: uppercase;
`;

export const StyledStatisticsSummary = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;

  margin-bottom: 1.4rem;
`;

export const StyledStatisticsCard = styled.article`
  min-height: 7.8rem;
  padding: 1rem;

  border-radius: 3px;
  border: 1px solid var(--color-border-primary);
  background-color: var(--color-bg-secondary);
`;

export const StyledStatisticsCardLabel = styled.p`
  font-size: 1rem;
  color: var(--color-disabled-text);
  text-transform: uppercase;
`;

export const StyledStatisticsCardValue = styled.h4`
  margin-top: 0.6rem;

  font-size: 2rem;
  font-weight: 500;
  color: var(--color-heading-text);
`;

export const StyledStatisticsSection = styled.section`
  margin-top: 1.6rem;
`;

export const StyledStatisticsSectionHeading = styled.h4`
  margin-bottom: 1rem;

  font-size: 1rem;
  font-weight: 500;
  color: var(--color-disabled-text);
  text-transform: uppercase;
`;

export const StyledStatisticsRows = styled.div`
  display: grid;
  gap: 0.8rem;
`;

export const StyledStatisticsRow = styled.div`
  display: grid;
  align-items: center;
  gap: 0.6rem;
`;

export const StyledStatisticsRowMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  color: var(--color-heading-text);
`;

export const StyledStatisticsRowLabel = styled.p`
  max-width: 65%;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledStatisticsRowValue = styled.span`
  font-weight: 500;
  color: var(--color-heading-text);
`;

export const StyledStatisticsBar = styled.div`
  width: 100%;
  height: 0.8rem;

  border-radius: 99px;
  background-color: var(--color-border-primary);
  overflow: hidden;
`;

type StatisticsBarFillProps = {
  $variant: "focus" | "break" | "idle";
};

export const StyledStatisticsBarFill = styled.div<StatisticsBarFillProps>`
  height: 100%;
  border-radius: 99px;

  background-color: ${(p) =>
    p.$variant === "focus"
      ? "var(--color-primary)"
      : p.$variant === "break"
        ? "var(--color-yellow)"
        : "var(--color-disabled-text)"};
`;

export const StyledStatisticsStackedBar = styled.div`
  width: 100%;
  height: 0.9rem;

  display: flex;
  border-radius: 99px;
  overflow: hidden;
  background-color: var(--color-border-primary);
`;

export const StyledStatisticsCycleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 2rem;
  height: 2rem;
  padding: 0 0.6rem;

  border-radius: 99px;
  color: var(--color-primary);
  border: 1px solid rgba(var(--color-primary-rgb), 0.4);
  background-color: rgba(var(--color-primary-rgb), 0.08);
  font-size: 1.1rem;
  font-weight: 500;
`;

export const StyledStatisticsActions = styled.div`
  margin-top: 1.2rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.8rem;
`;

export const StyledStatisticsEmpty = styled.p`
  color: var(--color-disabled-text);
`;

export const StyledStatisticsLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem 1.4rem;

  margin-bottom: 1rem;
`;

const StatisticsLegendDot = css`
  content: "";
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
`;

export const StyledStatisticsLegendItem = styled.span<{
  $variant: "focus" | "break" | "idle";
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-body-text);

  &::before {
    ${StatisticsLegendDot};
    background-color: ${(p) =>
      p.$variant === "focus"
        ? "var(--color-primary)"
        : p.$variant === "break"
          ? "var(--color-yellow)"
          : "var(--color-disabled-text)"};
  }
`;
