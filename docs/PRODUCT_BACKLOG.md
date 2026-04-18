# Product Backlog — Pomodoroz

> Extracted from previous `TECHNICAL_DECISIONS_2026.md` (sections 6.1, 6.4, and 6.7).
>
> This document tracks product features that are **not yet implemented**.
> For implemented changes, see `CHANGELOG.md` / `CHANGELOG.en.md`.
> For migration planning, see `MIGRATION_TO_TAURI.md`.
> For release operations, see `RELEASE_OPERATIONS.md`.

---

## 1. Non-Blocking Improvements (Open)

| Item                                                | Status   | Notes                                         |
| --------------------------------------------------- | -------- | --------------------------------------------- |
| Always On Top on Linux/Wayland                      | Open     | Behavior depends on window manager/compositor |
| Full packaged matrix validation (Win/macOS/Linux)   | Open     | Dedicated release cycle                       |
| Gamification (streaks, XP, achievements)            | Ideation | See section 2                                 |
| Adaptive focus (presets, extend, break suggestions) | Ideation | See section 3                                 |

---

## 2. Gamification

Goal: increase user engagement through game mechanics in the Pomodoro workflow.

### Ideas Under Evaluation

| Mechanic      | Description                                                     | Required data                                            |
| ------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Streaks       | Consecutive days with at least one completed cycle              | Daily cycle history (already in `statistics`)            |
| XP / Levels   | Points per completed focus cycle with progressive levels        | Persistent counter (new slice or `statistics` extension) |
| Achievements  | Unlockable badges by milestones (10 cycles, 7-day streak, 100h) | Rule logic over existing data                            |
| Daily summary | End-of-day popup/card with metrics and progress                 | `statistics` data filtered by day                        |

### Principles

- 100% local data (no server/cloud).
- Persistence via `localStorage` or store plugin (same app pattern).
- No new external dependencies; use existing state management patterns.
- Incremental rollout: streaks -> XP -> achievements.
- Discreet UI that does not disrupt the primary timer flow.

### Technical Dependencies

- `store/statistics` already tracks completed cycles, durations, and timestamps.
- Needs new slice (`store/gamification`) or `statistics` extension for persistent XP/levels/achievements.
- New components expected: badge/card in Timer or Statistics route.

### Status

- In ideation. No code implemented.
- Waiting for minimum scope definition and approval.

---

## 3. Adaptive Focus

Source: real feedback from ADHD communities (Reddit r/ADHD, clinical articles, user reports).
None of these are fixed commitments — all are hypotheses to validate.

Context: classic 25/5 Pomodoro tends to have limited adoption among ADHD users.
Most people who say it works are using a modified version. Common complaints:

1. Interrupting hyperfocus is disruptive.
2. Task-initiation paralysis — "I need to work 25 min" does not help starting.
3. Break becomes doomscroll instead of rest.
4. Rigid timer can create anxiety rather than focus.

Pomodoroz already covers part of this space (1-120 min durations, 0-min breaks,
strict mode, progressive notifications, rotation grid with draw).
Items below target the remaining gaps.

### Next Cycle (High Priority)

| #   | Feature                 | Effort | Description                                                                                             | Success metric                                 |
| --- | ----------------------- | ------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Cadence presets         | Low    | Settings buttons: Just Start (5/1), Sprint (10/3), Classic (25/5), Flow (50/10). Fills existing fields. | % sessions started via preset vs manual config |
| 2   | Extend session (+5/+10) | Medium | End-of-focus option "Continue +5/+10 min" before break starts. Addresses hyperfocus interruption.       | Reduction in skip/reset during focus sessions  |
| 3   | Break suggestion        | Low    | Rotating break text: "Drink water", "Stretch", "Breathe". Keeps user away from phone doomscroll.        | Lower cancel/skip rate during break            |

### Backlog (Evaluate After Next Cycle)

| #   | Feature                  | Effort | Description                                                                                                 | Success metric                      |
| --- | ------------------------ | ------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 4   | Global play/pause hotkey | Low    | Example: `Alt+Shift+P` to start/pause without opening window. Existing hotkey infrastructure can be reused. | Hotkey adoption (local measurement) |
| 5   | Cadence report           | Medium | Statistics hint: "Your most productive sessions were around ~15 min" using existing store data.             | Statistics screen engagement        |
| 6   | Motivational message     | Low    | "You completed 3 cycles today" after each focus block. Positive reinforcement.                              | Consecutive sessions/day            |
| 7   | Reverse Pomodoro         | Medium | Inverted mode: long break -> short 2-3 min check-in -> break. For low-energy days.                          | Usage on days with 0 normal cycles  |
| 8   | Ambient sounds           | High   | White noise / lo-fi during focus. Frequently requested, requires audio assets and new UI.                   | % sessions with sound enabled       |
| 9   | "No-judgment" mode       | Low    | Option to hide cycle counters/statistics on hard days.                                                      | Retention on low-usage days         |

### Principles

- Do not add rigid behavior — adaptability is the differentiator.
- Keep data 100% local.
- Implement incrementally; each item should be valuable on its own.
- Validate with real usage before expanding scope.

### Status

- In ideation. No code implemented.
- Next cycle priority defined (items 1-3).
