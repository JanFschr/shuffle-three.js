#!/usr/bin/env bash
set -euo pipefail

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Sync abgebrochen: Das Arbeitsverzeichnis enthält bereits Änderungen." >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Sync abgebrochen: Der Git-Remote 'origin' ist nicht konfiguriert." >&2
  exit 1
fi

branch="$(git branch --show-current)"
if [[ -z "$branch" ]]; then
  echo "Sync abgebrochen: HEAD befindet sich auf keinem Branch." >&2
  exit 1
fi

echo "Aktualisiere origin/main …"
git fetch --prune origin main

if [[ "$branch" == "main" ]]; then
  git merge --ff-only origin/main
else
  if ! git rebase origin/main; then
    git rebase --abort >/dev/null 2>&1 || true
    echo "Sync abgebrochen: Rebase-Konflikt. Keine Dateien wurden zur Bearbeitung freigegeben." >&2
    exit 1
  fi
fi

echo "Sync erfolgreich: '$branch' basiert auf dem aktuellen origin/main."
