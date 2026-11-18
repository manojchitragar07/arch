"""
Static file handler with HTTP 206 Partial Content (Range Request) support.
Optimized for instant video seeking and scrubbing across all modern browsers.
"""

import http.server
import os
import re
import mimetypes
from backend.config import FRONTEND_DIR, STREAM_BUFFER_SIZE

# Ensure common web MIME types are properly registered
mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("video/mp4", ".m4v")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")

def resolve_frontend_path(url_path):
    """Map URL path to a safe local file inside FRONTEND_DIR."""
    # Strip query parameters / anchors
    clean_path = url_path.split("?")[0].split("#")[0].lstrip("/")
    if not clean_path or clean_path == "/":
        clean_path = "index.html"

    target_file = (FRONTEND_DIR / clean_path).resolve()
    # Path traversal protection
    try:
        target_file.relative_to(FRONTEND_DIR)
    except ValueError:
        return None

    if target_file.is_file():
        return target_file
    return None

def serve_static_file(handler, file_path):
    """Serve a file with Byte Range support (HTTP 206) or standard HTTP 200."""
    try:
        file_size = os.path.getsize(file_path)
        content_type, _ = mimetypes.guess_type(str(file_path))
        if not content_type:
            content_type = "application/octet-stream"

        range_header = handler.headers.get("Range", None)

        if range_header:
            match = re.match(r"bytes=(\d+)-(\d*)", range_header)
            if not match:
                handler.send_error(416, "Requested Range Not Satisfiable")
                return

            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else file_size - 1

            if start >= file_size or end >= file_size or start > end:
                handler.send_error(416, "Requested Range Not Satisfiable")
                return

            content_length = end - start + 1

            handler.send_response(206)
            handler.send_header("Content-Type", content_type)
            handler.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            handler.send_header("Content-Length", str(content_length))
            handler.send_header("Accept-Ranges", "bytes")
            handler.send_header("Cache-Control", "public, max-age=3600")
            handler.end_headers()

            with open(file_path, "rb") as f:
                f.seek(start)
                bytes_sent = 0
                while bytes_sent < content_length:
                    to_read = min(STREAM_BUFFER_SIZE, content_length - bytes_sent)
                    chunk = f.read(to_read)
                    if not chunk:
                        break
                    handler.wfile.write(chunk)
                    bytes_sent += len(chunk)
        else:
            handler.send_response(200)
            handler.send_header("Content-Type", content_type)
            handler.send_header("Content-Length", str(file_size))
            handler.send_header("Accept-Ranges", "bytes")
            handler.send_header("Cache-Control", "no-cache")
            handler.end_headers()

            with open(file_path, "rb") as f:
                while True:
                    chunk = f.read(STREAM_BUFFER_SIZE)
                    if not chunk:
                        break
                    handler.wfile.write(chunk)

    except (BrokenPipeError, ConnectionResetError):
        # Client aborted seek request (normal during rapid scrubbing)
        pass
    except Exception as e:
        try:
            handler.send_error(500, f"Internal Server Error: {str(e)}")
        except Exception:
            pass
