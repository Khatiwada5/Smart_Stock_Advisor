import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from market_data import get_market_payload


PORT = 8000


class SmartStockHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/market":
            params = parse_qs(parsed.query)
            ticker = params.get("ticker", [""])[0].strip().upper()

            if not ticker:
                self.send_json({"error": "Ticker is required."}, status=400)
                return

            try:
                self.send_json(get_market_payload(ticker))
            except Exception as error:
                self.send_json({"error": str(error)}, status=502)
            return

        super().do_GET()

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), SmartStockHandler)
    print(f"Smart Stock Advisor running at http://127.0.0.1:{PORT}/index.html")
    server.serve_forever()
