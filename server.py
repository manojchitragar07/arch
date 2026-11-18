#!/usr/bin/env python3
"""
Root Entrypoint for AURA Full-Stack Server.
Delegates execution to backend.app.
"""

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from backend.app import start_server
from backend.config import PORT

if __name__ == "__main__":
    port_arg = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    start_server(port_arg)
