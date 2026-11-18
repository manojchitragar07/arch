#!/usr/bin/env bash
# Quickstart script for AURA Architecture Full-Stack Application

set -e

PORT=${1:-8080}
echo "Starting AURA Architecture Server on port $PORT..."
python3 backend/app.py "$PORT"
