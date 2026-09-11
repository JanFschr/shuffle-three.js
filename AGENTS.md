# Repository workflow rules

These rules apply to every change in this repository.

1. Keep exactly one Codex pull request in flight. Continue the existing Codex
   branch instead of opening overlapping pull requests for follow-up work.
2. Before editing, run `.github/scripts/sync-before-edit.sh`. Do not change files
   unless that command succeeds. It fetches `origin/main` and rebases the working
   branch (or fast-forwards `main`) so a PR is never built from a stale base.
3. Do not edit `README.md` for routine implementation details, status reports,
   test counts, or PR automation. Change it only when the user-facing setup,
   controls, or runtime requirements genuinely change.
4. Put contributor and automation documentation in `.github/`, not in the
   user-facing README.
5. If the base branch cannot be fetched, state that limitation rather than
   guessing at conflict resolution. Never overwrite a newer base-branch version
   merely to make a merge automatic.
