#!/usr/bin/env python3
"""
AURA Architectural Full-Stack Server & Serverless Entrypoint.
Exports standard 'app', 'application', and 'handler' variables for Vercel, WSGI,
and standalone local server deployment.
"""

import http.server
import socketserver
import json
import sys
import urllib.parse
from pathlib import Path

# Add project root to sys.path so backend imports work reliably
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import HOST, PORT
from backend.handlers.api import (
    get_health,
    get_artworks,
    get_exhibitions,
    get_video_info,
    save_inquiry,
    get_inquiries,
)
from backend.handlers.static import resolve_frontend_path, serve_static_file


# ==============================================================================
# 1. BaseHTTPRequestHandler Class (Compatible with Vercel serverless & standalone)
# ==============================================================================

class ApplicationHandler(http.server.BaseHTTPRequestHandler):
    server_version = "AURA-Server/3.2"

    def log_message(self, format, *args):
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
            category = None
            if "?" in self.path:
                for param in self.path.split("?")[1].split("&"):
                    if param.startswith("category="):
                        category = urllib.parse.unquote(param.split("=")[1])
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


# ==============================================================================
# 2. WSGI Application Callable (Compatible with Vercel, Gunicorn, uWSGI, Render)
# ==============================================================================

def wsgi_application(environ, start_response):
    path = environ.get("PATH_INFO", "/").rstrip("/")
    method = environ.get("REQUEST_METHOD", "GET").upper()
    query = environ.get("QUERY_STRING", "")

    headers = [
        ("Content-Type", "application/json; charset=utf-8"),
        ("Access-Control-Allow-Origin", "*"),
        ("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
        ("Access-Control-Allow-Headers", "Content-Type"),
    ]

    if method == "OPTIONS":
        start_response("204 No Content", headers)
        return [b""]

    # API Endpoints
    if path == "/api/health":
        start_response("200 OK", headers)
        return [json.dumps(get_health(), indent=2).encode("utf-8")]

    elif path == "/api/artworks":
        params = urllib.parse.parse_qs(query)
        category = params.get("category", [None])[0]
        start_response("200 OK", headers)
        return [json.dumps(get_artworks(category), indent=2).encode("utf-8")]

    elif path == "/api/exhibitions":
        start_response("200 OK", headers)
        return [json.dumps(get_exhibitions(), indent=2).encode("utf-8")]

    elif path == "/api/video-info":
        start_response("200 OK", headers)
        return [json.dumps(get_video_info(), indent=2).encode("utf-8")]

    elif path == "/api/inquiries":
        start_response("200 OK", headers)
        return [json.dumps(get_inquiries(), indent=2).encode("utf-8")]

    elif path == "/api/inquiry" and method == "POST":
        try:
            try:
                request_body_size = int(environ.get("CONTENT_LENGTH", 0))
            except ValueError:
                request_body_size = 0
            body = environ["wsgi.input"].read(request_body_size).decode("utf-8")
            payload = json.loads(body) if body else {}
            result = save_inquiry(payload)
            start_response("201 Created", headers)
            return [json.dumps(result, indent=2).encode("utf-8")]
        except ValueError as ve:
            start_response("400 Bad Request", headers)
            return [json.dumps({"success": False, "error": str(ve)}).encode("utf-8")]
        except Exception as e:
            start_response("500 Internal Server Error", headers)
            return [json.dumps({"success": False, "error": str(e)}).encode("utf-8")]

    # If static file requested via WSGI
    file_path = resolve_frontend_path(path)
    if file_path and file_path.is_file():
        import mimetypes
        content_type, _ = mimetypes.guess_type(str(file_path))
        if not content_type:
            content_type = "application/octet-stream"
        file_size = file_path.stat().st_size
        static_headers = [
            ("Content-Type", content_type),
            ("Content-Length", str(file_size)),
            ("Accept-Ranges", "bytes"),
            ("Access-Control-Allow-Origin", "*"),
        ]
        start_response("200 OK", static_headers)
        with open(file_path, "rb") as f:
            return [f.read()]

    start_response("404 Not Found", headers)
    return [json.dumps({"error": f"Path not found: {path}"}).encode("utf-8")]


# ==============================================================================
# 3. Exported Variables for Vercel / WSGI / Serverless
# ==============================================================================

# Vercel serverless checks for 'app', 'application', or 'handler'
app = wsgi_application
application = wsgi_application
handler = ApplicationHandler


# ==============================================================================
# 4. Standalone Server Runner
# ==============================================================================

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
                print(f"✦ Artworks Catalog API: {url}api/artworks")
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
