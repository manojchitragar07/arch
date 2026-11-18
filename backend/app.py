#!/usr/bin/env python3
"""
AURA Architectural Full-Stack Server.
Combines REST API endpoints with high-performance HTTP 206 video range streaming.
"""

import http.server
import socketserver
import json
import sys
from pathlib import Path

# Add project root to sys.path so backend imports work reliably
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import HOST, PORT
from backend.handlers.api import (
    get_health,
    get_video_info,
    save_inquiry,
    get_inquiries,
    get_artworks,
    get_exhibitions,
)
from backend.handlers.static import resolve_frontend_path, serve_static_file

class ApplicationHandler(http.server.BaseHTTPRequestHandler):
    server_version = "AURA-Server/2.0"

    def log_message(self, format, *args):
        # Format clean, readable access logs
        sys.stdout.write(f"[{self.log_date_time_string()}] {self.command} {self.path} -> {args[1] if len(args) > 1 else args[0]}\n")
        sys.stdout.flush()

    def send_json(self, status_code, data):
        """Send JSON response with CORS headers."""
        try:
            body = json.dumps(data, indent=2).encode("utf-8")
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        clean_path = self.path.split("?")[0].rstrip("/")

        # API Routing
        if clean_path == "/api/health":
            self.send_json(200, get_health())
            return
        elif clean_path == "/api/artworks":
            # Extract category query param if present
            category = None
            if "?" in self.path:
                for param in self.path.split("?")[1].split("&"):
                    if param.startswith("category="):
                        category = param.split("=")[1]
            self.send_json(200, get_artworks(category))
            return
        elif clean_path == "/api/exhibitions":
            self.send_json(200, get_exhibitions())
            return
        elif clean_path == "/api/video-info":
            self.send_json(200, get_video_info())
            return
        elif clean_path == "/api/inquiries":
            self.send_json(200, get_inquiries())
            return

        # Static Frontend File Routing
        file_path = resolve_frontend_path(self.path)
        if file_path:
            serve_static_file(self, file_path)
        else:
            self.send_error(404, f"File Not Found: {self.path}")

    def do_POST(self):
        clean_path = self.path.split("?")[0].rstrip("/")

        if clean_path == "/api/inquiry":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                payload = json.loads(body) if body else {}
                result = save_inquiry(payload)
                self.send_json(201, result)
            except ValueError as ve:
                self.send_json(400, {"success": False, "error": str(ve)})
            except Exception as e:
                self.send_json(500, {"success": False, "error": f"Server error: {str(e)}"})
        else:
            self.send_error(404, "API endpoint not found")

class ReusableServer(socketserver.TCPServer):
    allow_reuse_address = True

def start_server(port=PORT):
    current_port = port
    while True:
        try:
            with ReusableServer((HOST, current_port), ApplicationHandler) as httpd:
                url = f"http://{HOST}:{current_port}/"
                print("=" * 64)
                print(f"✦ AURA Architecture System Online")
                print(f"✦ Frontend Application: {url}")
                print(f"✦ Health Check API:     {url}api/health")
                print(f"✦ Video Metadata API:   {url}api/video-info")
                print("=" * 64)
                print("Press Ctrl+C to terminate server.")
                httpd.serve_forever()
        except OSError as e:
            if "Address already in use" in str(e):
                current_port += 1
                continue
            raise

if __name__ == "__main__":
    port_arg = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    start_server(port_arg)
