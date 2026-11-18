"""
Vercel Serverless Function API Entrypoint.
Exports 'app', 'application', and 'handler' for Vercel Python runtime.
"""

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app import app, application, handler, ApplicationHandler
