#!/usr/bin/env bash
set -euo pipefail

docker exec redpanda rpk topic create promotion_events || true
