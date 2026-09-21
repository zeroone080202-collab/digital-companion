#!/bin/sh
set -eu
cd "$(dirname "$0")"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
[ -f .env ] || cp .env.example .env
[ -f data/knowledge.sqlite ] || .venv/bin/python tools/bootstrap.py
echo 'Open http://127.0.0.1:8000 in your browser.'
exec .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1 --no-access-log
