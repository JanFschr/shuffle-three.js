# Repository workflow rules

These rules apply to every change in this repository.

1. Keep exactly one Codex pull request in flight. Continue the existing Codex
   branch instead of opening overlapping pull requests for follow-up work.
2. Do not edit `README.md` for routine implementation details, status reports,
   test counts, or PR automation. Change it only when the user-facing setup,
   controls, or runtime requirements genuinely change.
3. Put contributor and automation documentation in `.github/`, not in the
   user-facing README.
4. If the base branch cannot be fetched, state that limitation rather than
   guessing at conflict resolution. Never overwrite a newer base-branch version
   merely to make a merge automatic.
