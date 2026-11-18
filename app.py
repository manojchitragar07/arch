"""
Root Entrypoint for Vercel, Render, and WSGI Platforms.
Exports top-level 'app', 'application', and 'handler' variables.
"""

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from backend.app import app, application, handler, ApplicationHandler, start_server

if __name__ == "__main__":
    start_server()
