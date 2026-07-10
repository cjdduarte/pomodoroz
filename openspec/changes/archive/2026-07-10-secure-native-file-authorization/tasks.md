## 1. Native Task Transfer Boundary

- [x] 1.1 Add native task-import and task-export commands that own the JSON dialog selection and transfer result events.
- [x] 1.2 Reuse final-path and payload guardrails in the native callback before every read or write.
- [x] 1.3 Remove generic `read_text_file` and `write_text_file` commands from the command module and invoke handler.

## 2. Renderer Integration

- [x] 2.1 Replace renderer dialog/path orchestration with the native task-import and task-export command invocations.
- [x] 2.2 Remove unused JavaScript dialog imports and preserve existing Settings result handling.

## 3. Verification And Documentation

- [x] 3.1 Add focused Rust tests for task-transfer input guards and command-surface regression coverage.
- [x] 3.2 Update the active corrections roadmap and both unreleased changelogs with the completed security hardening.
- [x] 3.3 Run OpenSpec strict validation, renderer lint/typecheck/tests, and Rust fmt/clippy/check/test.
