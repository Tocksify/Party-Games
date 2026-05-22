#!/usr/bin/env bash
set -e
npx --yes pnpm@10 install --frozen-lockfile
npx --yes pnpm@10 run typecheck:libs
npx --yes pnpm@10 --filter @workspace/db run push
npx --yes pnpm@10 --filter @workspace/api-server run build
