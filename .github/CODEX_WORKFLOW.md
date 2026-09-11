# Codex pull-request workflow

To avoid conflicts, only one Codex pull request should be open at a time. New
follow-up work belongs on that existing branch until it is merged. A new Codex
branch must start from the latest `main`.

Before any edit, Codex must run `.github/scripts/sync-before-edit.sh`. The script
refuses to run with local changes or without an `origin` remote, fetches
`origin/main`, and rebases a feature branch onto it. On `main` it permits only a
fast-forward update. A failed or conflicting rebase is aborted instead of being
resolved by guessing.

Eligible internal Codex pull requests are syntax-checked and tested by
`auto-merge-codex.yml`, then squash-merged and deployed. A pull request is
eligible when it is not a draft and either:

- its branch is named `work`,
- its branch starts with `codex/`, or
- it carries the `codex` label.

Fork pull requests never receive this privileged treatment. Merge conflicts are
not resolved with an automatic “ours” or “theirs” strategy because that could
silently discard changes already on `main`. If a conflict occurs, update the PR
branch from `main`, resolve it deliberately, and rerun the checks.

The repository setting **Settings → Actions → General → Workflow permissions →
Read and write permissions** must be enabled for automatic merging and Pages
dispatch.
