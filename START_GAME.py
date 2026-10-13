#!/usr/bin/env python3
"""A local-only HTTP file server. It never connects to the Internet."""
import http.server, socketserver, webbrowser, threading, os, time
from pathlib import Path
os.chdir(Path(__file__).resolve().parent)
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map, '.webp':'image/webp', '.js':'application/javascript; charset=utf-8', '.woff2':'font/woff2'}
class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address=True
with Server(('127.0.0.1',8765),Handler) as server:
    host,port=server.server_address
    url=f'http://127.0.0.1:{port}/index.html'
    print('VO LAM IDLE - OFFLINE: '+url)
    print('Bam Ctrl+C de tat server. Toan bo du lieu luu o trinh duyet cua may nay.')
    threading.Thread(target=lambda: (time.sleep(0.8),webbrowser.open(url)),daemon=True).start()
    try: server.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt: print('Da dung game.')
