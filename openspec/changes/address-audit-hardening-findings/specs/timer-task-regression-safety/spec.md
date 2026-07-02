## ADDED Requirements

### Requirement: Special breaks trigger within their configured window

Special breaks SHALL trigger once per configured break per day when the timer is playing and the current local time is inside the configured `fromTime` inclusive and `toTime` exclusive window.

#### Scenario: App resumes inside special-break window

- **WHEN** the timer is playing, not already in a special break, and current local time is between a configured special break's `fromTime` and `toTime`
- **THEN** the app enters special break mode and sends the existing special-break notification once for that configured break on that date

#### Scenario: Same special break window is checked repeatedly

- **WHEN** the timer remains inside an already-triggered special-break window on the same date
- **THEN** the app does not re-enter the same special break repeatedly

### Requirement: Automatic day-color reset does not alter undo history

Automatic daily day-color cleanup SHALL update current task state without adding an undo-history entry or clearing redo history.

#### Scenario: Stale day colors are reset automatically

- **WHEN** the Tasks grid detects stale day-color dates after a date change
- **THEN** the stale colors are cleared without changing the user's undo/redo stacks

#### Scenario: User manually resets day colors

- **WHEN** the user invokes the explicit reset-color action from the UI
- **THEN** the reset remains a normal task action in undo/redo history

### Requirement: Timer session restart policy is explicit

The project SHALL document whether active timer session state is persisted across app restart.

#### Scenario: Operator reviews timer persistence behavior

- **WHEN** documentation for pending improvements or operational state is reviewed
- **THEN** it explicitly states that active timer round/type/playing state is not persisted in this batch
