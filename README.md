# Smart Stock Advisor

Smart Stock Advisor is a browser-based portfolio workspace for tracking stock holdings and getting simple rule-based buy, hold, or sell recommendations.

The project now includes a working app experience plus the original Python CLI for learning and testing the advisor logic.

## Run the App

Start the local demo server:

```bash
python3 server.py
```

Then open:

```text
http://127.0.0.1:8000/index.html
```

No install step is required. The app saves holdings in the browser with `localStorage`.

## Public Link Deployment

Deploy with Vercel to make the app accessible to anyone with a link.

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the GitHub repo.
3. Keep the default project settings.
4. Deploy.

Vercel will serve the frontend and the Python market endpoint at the same public URL. The app will keep using `/api/market?ticker=AAPL` for live quote signals.

GitHub Pages can host the visual app, but it cannot run the Python market AI endpoint. Use Vercel if you want the full experience.

## App Features

- Add buys with ticker, dollar amount, buy price, and current price
- Automatically calculate fractional shares from dollars invested
- Add multiple buys for the same ticker at different prices
- Track average cost across all buys
- View total cost, current value, total return, and portfolio change
- Scan holdings in a responsive table
- Add to or delete any holding
- View allocation bars by current market value
- View a profit/loss graph showing the trade difference by holding
- Choose risk level and investing goal for recommendations
- Compare selling today against a hold estimate
- Adjust expected ROI and projection horizon
- Use a rule-based AI score to judge the projected setup
- Pull public market quote and trend data through the local server
- Generate a simple up/down/neutral market signal from moving averages and momentum
- Load a demo portfolio for quick testing
- Clear browser-saved holdings

## Recommendation Rules

The advisor uses rule-based educational logic:

- Short-term goals favor locking in gains and cutting losses sooner.
- Long-term goals can tolerate larger price swings.
- Low-risk investors are guided toward more cautious choices.
- Medium- and high-risk investors may be shown buy-more opportunities after larger drops.

This is not financial advice.

## ROI Projection

The advisor panel includes a what-if projection:

- `Sell Today` shows the current profit or loss if the position is closed now.
- `Hold Estimate` shows the projected profit or loss using the expected ROI input.
- `Difference` shows the extra estimated result from holding instead of selling.
- `AI Score` is a simple rule-based confidence score using ROI, risk, goal, and current performance.

If the expected ROI field is blank, the app fills in a model estimate based on the selected risk level, goal, current stock performance, and time horizon.

## Market AI

The `Analyze Market` button asks the local Python server for public market data. The server checks recent quote and historical price data, then creates a simple signal:

- `Up` when price and momentum are above the recent trend
- `Down` when price and momentum are below the recent trend
- `Neutral` when the setup is mixed

The signal is rule-based and educational. It is not a guarantee that a stock will go up or down.

## Project Structure

```text
smart-stock-advisor/
|-- index.html
|-- styles.css
|-- app.js
|-- server.py
|-- market_data.py
|-- api/
|   |-- market.py
|-- vercel.json
|-- advisor.py
|-- main.py
|-- portfolio.json
|-- test_advisor.py
|-- README.md
```

## Python CLI

The command-line version is still available:

```bash
python3 main.py
```

## Run Tests

```bash
python3 -m unittest
```

## Future Improvements

- Add CSV import and export
- Add live prices from a stock API
- Add watchlists and alerts
- Add portfolio sector tags
- Deploy the app with GitHub Pages

## Authors

- Nirvana Khatiwada
- Aksha Khadgi
