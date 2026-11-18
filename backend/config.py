"""
Backend Configuration for AURA Cinematic Architecture Application.
"""

import os
from pathlib import Path

# Base Paths
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
DATA_DIR = BACKEND_DIR / "data"

# Server Settings
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8080))

# Video Asset Paths
PRIMARY_VIDEO = FRONTEND_DIR / "assets" / "videos" / "optimized_video.mp4"
SOURCE_VIDEO = FRONTEND_DIR / "assets" / "videos" / "gemini_generated_video_beb49dc7.mp4"

# Inquiries Data Store
INQUIRIES_FILE = DATA_DIR / "inquiries.json"

# Buffer size for streaming byte ranges (64 KB)
STREAM_BUFFER_SIZE = 64 * 1024
