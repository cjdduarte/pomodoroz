import styled, { css } from "styled-components/macro";
import { themes } from "styles/themes";
import { StyledScrollbar } from "styles/mixins";

export const StyledGridWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  width: 100%;
  overflow: hidden;
`;

export const StyledGridToolbar = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding: ${(p) => (p.$compact ? "0.55rem 1rem" : "0.8rem 2rem")};
  border-bottom: 1px solid var(--color-border-primary);
  background-color: var(--color-bg-secondary);
  flex-shrink: 0;
`;

export const StyledGridToolbarButton = styled.button<{
  $iconOnly?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: ${(p) => (p.$iconOnly ? "0.4rem" : "0.4rem 0.8rem")};
  min-width: ${(p) => (p.$iconOnly ? "2rem" : "auto")};
  border: 1px solid var(--color-border-primary);
  border-radius: 3px;
  background-color: var(--color-bg-primary);
  color: var(--color-body-text);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  transition: ${themes.transition};

  svg {
    width: 1rem;
    height: 1rem;
    display: block;
  }

  &:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    color: var(--color-disabled-text);
    border-color: var(--color-border-primary);
  }

  &:disabled:hover {
    color: var(--color-disabled-text);
    border-color: var(--color-border-primary);
  }
`;

export const StyledGridContent = styled.div<{ $compact?: boolean }>`
  flex: 1;
  min-height: 0;
  overflow-y: ${(p) => (p.$compact ? "scroll" : "auto")};
  overflow-x: hidden;
  scrollbar-gutter: stable;
  padding: ${(p) =>
    p.$compact ? "0.5rem 1rem 0.4rem" : "0.9rem 2rem 0.7rem"};
  background-color: var(--color-bg-primary);

  ${StyledScrollbar};

  ${(p) =>
    p.$compact &&
    css`
      /* Keep scrollbar visible in compact grid mode (no hover dependency). */
      scrollbar-width: thin;
      scrollbar-color: var(--color-disabled-text)
        var(--color-bg-tertiary);

      &::-webkit-scrollbar {
        width: 0.6rem;
      }

      &::-webkit-scrollbar-thumb {
        background-color: var(--color-disabled-text);
      }

      &::-webkit-scrollbar-track {
        background-color: var(--color-bg-tertiary);
      }
    `}
`;

export const StyledGridCards = styled.div<{
  $columns?: number;
  $compact?: boolean;
}>`
  display: grid;
  gap: 0.6rem;
  width: 100%;

  ${(p) =>
    p.$columns
      ? css`
          grid-template-columns: repeat(${p.$columns}, minmax(0, 1fr));
        `
      : css`
          grid-template-columns: repeat(
            auto-fit,
            minmax(${p.$compact ? "8.8rem" : "12rem"}, 1fr)
          );
        `};
`;

export const StyledGridSeparator = styled.div`
  grid-column: 1 / -1;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-heading-text);
  text-transform: uppercase;
  padding: 0.45rem 0 0.25rem;
  border-bottom: 1px solid var(--color-border-primary);
  margin-top: 0.2rem;

  &:first-child {
    margin-top: 0;
  }
`;

type CardColorVariant = "green" | "red" | "neutral";

export const StyledGridCard = styled.button<{
  $color: CardColorVariant;
  $compact?: boolean;
  $active?: boolean;
  $grouped?: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${(p) => (p.$grouped ? "0.2rem" : "0.3rem")};
  padding: ${(p) =>
    p.$grouped
      ? p.$compact
        ? "0.55rem 0.72rem"
        : "0.62rem 0.8rem"
      : "0.78rem 0.95rem"};
  border-radius: 4px;
  cursor: pointer;
  transition: ${themes.transition};
  text-align: left;
  width: 100%;
  min-height: ${(p) =>
    p.$grouped ? (p.$compact ? "4rem" : "4.25rem") : "5.4rem"};

  ${(p) => {
    switch (p.$color) {
      case "green":
        return css`
          background: rgba(var(--color-green-rgb), 0.15);
          border: 2px solid var(--color-green);
        `;
      case "red":
        return css`
          background: rgba(var(--color-pink-rgb), 0.15);
          border: 2px solid var(--color-pink);
        `;
      default:
        return css`
          background: var(--color-bg-task-card);
          border: 2px solid var(--color-border-primary);
        `;
    }
  }}

  ${(p) =>
    p.$active &&
    css`
      box-shadow:
        0 0 0 2px rgba(var(--color-primary-rgb), 0.28),
        0 2px 6px var(--color-shadow-primary);
    `}

  &:hover {
    box-shadow: ${(p) =>
      p.$active
        ? "0 0 0 2px rgba(var(--color-primary-rgb), 0.34), 0 3px 8px var(--color-shadow-primary)"
        : "0 2px 6px var(--color-shadow-primary)"};
  }
`;

export const StyledGridCardTitle = styled.span`
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--color-heading-text);
  text-transform: uppercase;
  text-shadow: none;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`;

export const StyledGridCardTask = styled.span<{
  $done?: boolean;
  $placeholder?: boolean;
}>`
  font-size: 1.05rem;
  color: var(--color-body-text);
  line-height: 1.35;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-decoration: ${(p) => (p.$done ? "line-through" : "none")};
  opacity: ${(p) => (p.$done ? 0.72 : 1)};
  font-style: ${(p) => (p.$placeholder ? "italic" : "normal")};
`;

export const StyledGridFooter = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${(p) => (p.$compact ? "0.5rem" : "0.8rem")};
  flex-wrap: wrap;
  padding: ${(p) => (p.$compact ? "0.35rem 1rem" : "0.5rem 2rem")};
  border-top: 1px solid var(--color-border-primary);
  background-color: var(--color-bg-secondary);
  flex-shrink: 0;

  @media (max-width: 38rem) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const StyledGridStats = styled.span<{ $compact?: boolean }>`
  font-size: ${(p) => (p.$compact ? "1rem" : "1.1rem")};
  color: var(--color-body-text);
  min-width: 0;
`;

export const StyledGridHint = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.95rem;
  line-height: 1.2;
  color: var(--color-disabled-text);
  font-style: italic;
  margin-left: auto;

  @media (max-width: 38rem) {
    margin-left: 0;
  }
`;

export const StyledGridFooterControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
  flex-wrap: wrap;

  @media (max-width: 38rem) {
    margin-left: 0;
  }
`;

export const StyledGridColumns = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

export const StyledGridColumnsLabel = styled.label`
  font-size: 0.95rem;
  color: var(--color-disabled-text);
`;

export const StyledGridColumnsSelect = styled.select`
  min-width: 4.4rem;
  padding: 0.2rem 0.45rem;
  border: 1px solid var(--color-border-primary);
  border-radius: 3px;
  background-color: var(--color-bg-primary);
  color: var(--color-body-text);
  font-size: 0.95rem;
  cursor: pointer;
  transition: ${themes.transition};

  &:hover {
    border-color: var(--color-primary);
  }
`;

export const StyledViewToggle = styled.div`
  display: flex;
  gap: 0.2rem;
  padding: 0.6rem 2rem 0;
  background-color: var(--color-bg-primary);
  flex-shrink: 0;
`;

export const StyledViewToggleButton = styled.button<{
  $active?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border-primary);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  font-size: 1.1rem;
  cursor: pointer;
  transition: ${themes.transition};

  ${(p) =>
    p.$active
      ? css`
          background-color: var(--color-bg-secondary);
          color: var(--color-heading-text);
          font-weight: 600;
        `
      : css`
          background-color: transparent;
          color: var(--color-body-text);

          &:hover {
            color: var(--color-heading-text);
            background-color: var(--color-bg-tertiary);
          }
        `}
`;
