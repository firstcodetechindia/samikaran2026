#!/bin/bash
set -e
pnpm install
pnpm --filter @workspace/db run push-force 2>/dev/null || pnpm --filter db push-force 2>/dev/null || true
