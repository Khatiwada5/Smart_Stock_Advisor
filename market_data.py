import csv
import math
from io import StringIO
from urllib.request import urlopen


def stooq_symbol(ticker):
    ticker = "".join(character for character in ticker.upper() if character.isalnum() or character == ".")
    if "." not in ticker:
        ticker = f"{ticker}.US"
    return ticker.lower()


def fetch_csv(url):
    with urlopen(url, timeout=8) as response:
        return response.read().decode("utf-8")


def safe_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def average(values):
    return sum(values) / len(values) if values else 0


def fetch_quote(ticker):
    symbol = stooq_symbol(ticker)
    url = f"https://stooq.com/q/l/?s={symbol}&f=sd2t2ohlcv&h&e=csv"
    rows = list(csv.DictReader(StringIO(fetch_csv(url))))

    if not rows or rows[0].get("Close") in {"N/D", None, ""}:
        raise ValueError("No quote found.")

    row = rows[0]
    return {
        "ticker": ticker.upper(),
        "price": float(row["Close"]),
        "open": safe_float(row.get("Open")),
        "high": safe_float(row.get("High")),
        "low": safe_float(row.get("Low")),
        "volume": safe_float(row.get("Volume")),
    }


def fetch_history(ticker):
    symbol = stooq_symbol(ticker)
    url = f"https://stooq.com/q/d/l/?s={symbol}&i=d"
    rows = list(csv.DictReader(StringIO(fetch_csv(url))))
    closes = [safe_float(row.get("Close")) for row in rows[-40:]]
    return [close for close in closes if close and close > 0]


def build_signal(closes, quote=None):
    if len(closes) < 8:
        open_price = quote.get("open") if quote else None
        latest = quote.get("price") if quote else None

        if open_price and latest:
            intraday = ((latest - open_price) / open_price) * 100
            if intraday >= 0.35:
                return {
                    "direction": "Up",
                    "confidence": min(72, round(50 + intraday * 18)),
                    "reason": f"Live quote is {intraday:.2f}% above today's open.",
                }
            if intraday <= -0.35:
                return {
                    "direction": "Down",
                    "confidence": min(72, round(50 + abs(intraday) * 18)),
                    "reason": f"Live quote is {intraday:.2f}% below today's open.",
                }

        return {
            "direction": "Neutral",
            "confidence": 45,
            "reason": "Trend history is limited and today's move is not decisive.",
        }

    latest = closes[-1]
    previous = closes[-2]
    sma5 = average(closes[-5:])
    sma20 = average(closes[-20:]) if len(closes) >= 20 else average(closes)
    momentum = ((latest - closes[-6]) / closes[-6]) * 100 if len(closes) >= 6 else 0
    day_change = ((latest - previous) / previous) * 100 if previous else 0
    returns = [
        ((closes[index] - closes[index - 1]) / closes[index - 1]) * 100
        for index in range(1, len(closes))
        if closes[index - 1]
    ]
    return_average = average(returns)
    volatility = math.sqrt(average([(value - return_average) ** 2 for value in returns])) if returns else 0

    score = 50
    score += 18 if latest > sma20 else -18
    score += 12 if sma5 > sma20 else -12
    score += max(min(momentum * 1.6, 18), -18)
    score += max(min(day_change * 1.4, 8), -8)
    score -= min(volatility * 1.8, 12)
    confidence = max(8, min(92, round(abs(score - 50) + 42)))

    if score >= 58:
        direction = "Up"
        reason = f"Price is above trend with {momentum:.2f}% recent momentum."
    elif score <= 42:
        direction = "Down"
        reason = f"Price is below trend with {momentum:.2f}% recent momentum."
    else:
        direction = "Neutral"
        reason = f"Trend is mixed; recent momentum is {momentum:.2f}%."

    return {
        "direction": direction,
        "confidence": confidence,
        "reason": reason,
        "metrics": {
            "sma5": round(sma5, 2),
            "sma20": round(sma20, 2),
            "momentum": round(momentum, 2),
            "dayChange": round(day_change, 2),
            "volatility": round(volatility, 2),
        },
    }


def get_market_payload(ticker):
    quote = fetch_quote(ticker)
    history = fetch_history(ticker)
    quote["signal"] = build_signal(history, quote)
    return quote
