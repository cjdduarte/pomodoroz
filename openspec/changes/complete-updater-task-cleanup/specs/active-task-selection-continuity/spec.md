## ADDED Requirements

### Requirement: Active task selection follows a cross-list card move

The system SHALL update the active task selection to the destination list when its selected card is moved between task lists.

#### Scenario: Active card moves to another list

- **WHEN** the selected task card is dragged from its selected list to a different task list
- **THEN** the selection keeps the same card ID and changes to the destination list ID

#### Scenario: Unrelated or same-list drag occurs

- **WHEN** a different card moves, a list moves, or the selected card is reordered within its current list
- **THEN** the active task selection remains unchanged

### Requirement: Moved active task remains resolvable

The system SHALL preserve the active timer context after its selected task card moves to another list.

#### Scenario: Timer resolves a moved active task

- **WHEN** a selected card has moved to another list
- **THEN** active-task resolution locates that card in its destination list without clearing selection or pausing the timer
