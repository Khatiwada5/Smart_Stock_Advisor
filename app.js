const STORAGE_KEY = "smartStockAdvisorPortfolio";

const demoPortfolio = [
  {
    ticker: "AAPL",
    currentPrice: 191.12,
    lots: [
      { amount: 50, buyPrice: 174.35, shares: 50 / 174.35 },
      { amount: 25, buyPrice: 181.2, shares: 25 / 181.2 },
    ],
  },
  {
    ticker: "MSFT",
    currentPrice: 414.8,
    lots: [{ amount: 100, buyPrice: 391.25, shares: 100 / 391.25 }],
  },
  {
    ticker: "TSLA",
    currentPrice: 221.65,
    lots: [
      { amount: 50, buyPrice: 238.4, shares: 50 / 238.4 },
      { amount: 25, buyPrice: 230.15, shares: 25 / 230.15 },
    ],
  },
  {
    ticker: "NVDA",
    currentPrice: 1040.45,
    lots: [{ amount: 75, buyPrice: 915.15, shares: 75 / 915.15 }],
  },
];

const state = {
  holdings: loadHoldings(),
};

const elements = {
  form: document.querySelector("#stockForm"),
  editIndex: document.querySelector("#editIndex"),
  formMode: document.querySelector("#formMode"),
  ticker: document.querySelector("#ticker"),
  amountInvested: document.querySelector("#amountInvested"),
  buyPrice: document.querySelector("#buyPrice"),
  currentPrice: document.querySelector("#currentPrice"),
  sharePreview: document.querySelector("#sharePreview"),
  quoteButton: document.querySelector("#quoteButton"),
  quoteStatus: document.querySelector("#quoteStatus"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  seedDemoButton: document.querySelector("#seedDemoButton"),
  clearButton: document.querySelector("#clearButton"),
  totalCost: document.querySelector("#totalCost"),
  totalValue: document.querySelector("#totalValue"),
  totalReturn: document.querySelector("#totalReturn"),
  totalChange: document.querySelector("#totalChange"),
  holdingsBody: document.querySelector("#holdingsBody"),
  emptyState: document.querySelector("#emptyState"),
  holdingCount: document.querySelector("#holdingCount"),
  allocationList: document.querySelector("#allocationList"),
  performanceChart: document.querySelector("#performanceChart"),
  advisorStock: document.querySelector("#advisorStock"),
  selectedStockLabel: document.querySelector("#selectedStockLabel"),
  expectedRoi: document.querySelector("#expectedRoi"),
  projectionMonths: document.querySelector("#projectionMonths"),
  marketSignalButton: document.querySelector("#marketSignalButton"),
  marketSignal: document.querySelector("#marketSignal"),
  recommendation: document.querySelector("#recommendation"),
  scenarioGrid: document.querySelector("#scenarioGrid"),
};

function loadHoldings() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(normalizeHolding).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function normalizeHolding(holding) {
  if (!holding || !holding.ticker) {
    return null;
  }

  if (Array.isArray(holding.lots)) {
    return {
      ticker: cleanTicker(holding.ticker),
      currentPrice: Number(holding.currentPrice),
      lots: holding.lots
        .map((lot) => ({
          amount: Number(lot.amount),
          buyPrice: Number(lot.buyPrice),
          shares: Number(lot.shares) || Number(lot.amount) / Number(lot.buyPrice),
        }))
        .filter((lot) => lot.amount > 0 && lot.buyPrice > 0 && lot.shares > 0),
      market: holding.market || null,
    };
  }

  const shares = Number(holding.shares);
  const buyPrice = Number(holding.buyPrice);
  return {
    ticker: cleanTicker(holding.ticker || holding.name),
    currentPrice: Number(holding.currentPrice || holding.current),
    lots: [
      {
        amount: shares * buyPrice,
        buyPrice,
        shares,
      },
    ].filter((lot) => lot.amount > 0 && lot.buyPrice > 0 && lot.shares > 0),
    market: holding.market || null,
  };
}

function saveHoldings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.holdings));
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);
}

function calculateChange(buyPrice, currentPrice) {
  return ((currentPrice - buyPrice) / buyPrice) * 100;
}

function cleanTicker(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9.]/g, "").slice(0, 8);
}

function getHoldingStats(holding) {
  const shares = holding.lots.reduce((total, lot) => total + lot.shares, 0);
  const cost = holding.lots.reduce((total, lot) => total + lot.amount, 0);
  const averageCost = shares ? cost / shares : 0;
  const value = shares * holding.currentPrice;
  const returnAmount = value - cost;
  const change = averageCost ? calculateChange(averageCost, holding.currentPrice) : 0;

  return { shares, cost, averageCost, value, returnAmount, change };
}

function getTotals() {
  return state.holdings.reduce(
    (totals, holding) => {
      const stats = getHoldingStats(holding);
      totals.cost += stats.cost;
      totals.value += stats.value;
      return totals;
    },
    { cost: 0, value: 0 },
  );
}

function getDecision(change, risk, goal) {
  if (goal === "short") {
    if (change >= 10) {
      return {
        label: "SELL",
        detail: "Lock in profit while the short-term gain is strong.",
      };
    }
    if (change <= -5) {
      return {
        label: "SELL",
        detail: "Cut losses before the position moves further against you.",
      };
    }
    if (risk === "high" && change <= -2) {
      return {
        label: "HOLD",
        detail: "Watch closely. The position is down but still near your entry.",
      };
    }
    return {
      label: "HOLD",
      detail: "The move is not large enough to justify a short-term action.",
    };
  }

  if (change <= -15 && ["medium", "high"].includes(risk)) {
    return {
      label: "BUY MORE",
      detail: "The stock is discounted and your risk setting allows adding.",
    };
  }
  if (change <= -10 && risk === "low") {
    return {
      label: "HOLD",
      detail: "Avoid adding risk until the position stabilizes.",
    };
  }
  if (change >= 20 && risk === "low") {
    return {
      label: "PARTIAL SELL",
      detail: "Rebalance after a large gain to protect the portfolio.",
    };
  }
  if (change >= 30 && risk === "medium") {
    return {
      label: "PARTIAL SELL",
      detail: "Take some profit while keeping long-term exposure.",
    };
  }

  return {
    label: "HOLD",
    detail: "The current setup fits your selected goal and risk level.",
  };
}

function getSuggestedRoi(change, risk, goal, months, marketSignal = null) {
  const riskPremium = {
    low: 1.5,
    medium: 3,
    high: 5,
  };
  const goalBoost = goal === "long" ? 2 : 0.75;
  const reboundBoost = change < 0 ? Math.min(Math.abs(change) * 0.18, 4) : 0;
  const momentumBoost = change > 0 ? Math.min(change * 0.08, 3) : 0;
  const horizonBoost = Math.max(months - 1, 0) * 0.45;
  const marketBoost =
    marketSignal?.direction === "Up"
      ? marketSignal.confidence / 18
      : marketSignal?.direction === "Down"
        ? -(marketSignal.confidence / 18)
        : 0;

  return Number((riskPremium[risk] + goalBoost + reboundBoost + momentumBoost + horizonBoost + marketBoost).toFixed(1));
}

function getProjection(holding, expectedRoi) {
  const stats = getHoldingStats(holding);
  const projectedPrice = holding.currentPrice * (1 + expectedRoi / 100);
  const projectedValue = stats.shares * projectedPrice;
  const projectedReturn = projectedValue - stats.cost;
  const projectedRoi = stats.cost ? (projectedReturn / stats.cost) * 100 : 0;
  const lockedRoi = stats.cost ? (stats.returnAmount / stats.cost) * 100 : 0;

  return {
    ...stats,
    projectedPrice,
    projectedValue,
    projectedReturn,
    projectedRoi,
    lockedRoi,
    extraReturn: projectedReturn - stats.returnAmount,
  };
}

function getSelectedRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function updateSharePreview() {
  const amount = Number(elements.amountInvested.value);
  const buyPrice = Number(elements.buyPrice.value);
  const shares = amount > 0 && buyPrice > 0 ? amount / buyPrice : 0;
  elements.sharePreview.textContent = formatNumber(shares);
}

async function fetchMarketData(ticker) {
  const response = await fetch(`/api/market?ticker=${encodeURIComponent(ticker)}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Market data is unavailable for that ticker.");
  }
  return payload;
}

function renderMarketSignal(signal) {
  if (!signal) {
    elements.marketSignal.innerHTML = `
      <span>Market AI</span>
      <strong>No live signal yet</strong>
      <p>Pull a quote to compare trend, momentum, and volatility.</p>
    `;
    return;
  }

  const directionClass = signal.direction === "Down" ? "loss" : signal.direction === "Up" ? "gain" : "";
  elements.marketSignal.innerHTML = `
    <span>Market AI</span>
    <strong class="${directionClass}">${signal.direction} bias · ${signal.confidence}/100</strong>
    <p>${signal.reason}</p>
  `;
}

async function updateQuoteFromMarket() {
  const ticker = cleanTicker(elements.ticker.value || elements.advisorStock.selectedOptions[0]?.textContent || "");
  if (!ticker) {
    elements.quoteStatus.textContent = "Enter a ticker first.";
    return null;
  }

  elements.quoteStatus.textContent = `Checking ${ticker} market data...`;

  try {
    const market = await fetchMarketData(ticker);
    elements.ticker.value = market.ticker;
    elements.currentPrice.value = market.price.toFixed(2);
    if (!elements.buyPrice.value) {
      elements.buyPrice.value = market.price.toFixed(2);
    }
    elements.quoteStatus.textContent = `${market.ticker} quote loaded at ${formatMoney(market.price)}.`;
    updateSharePreview();
    return market;
  } catch (error) {
    elements.quoteStatus.textContent = error.message;
    return null;
  }
}

function renderSummary() {
  const totals = getTotals();
  const returnAmount = totals.value - totals.cost;
  const change = totals.cost ? (returnAmount / totals.cost) * 100 : 0;

  elements.totalCost.textContent = formatMoney(totals.cost);
  elements.totalValue.textContent = formatMoney(totals.value);
  elements.totalReturn.textContent = formatMoney(returnAmount);
  elements.totalReturn.className = returnAmount < 0 ? "loss" : "gain";
  elements.totalChange.textContent = `${change.toFixed(2)}%`;
  elements.totalChange.className = change < 0 ? "loss" : "gain";
}

function renderHoldings() {
  elements.holdingsBody.innerHTML = "";
  elements.emptyState.style.display = state.holdings.length ? "none" : "block";

  state.holdings.forEach((holding, index) => {
    const stats = getHoldingStats(holding);
    const row = document.createElement("tr");
    const changeClass = stats.change < 0 ? "loss" : "gain";

    row.innerHTML = `
      <td>
        <div class="ticker-cell">
          <span class="ticker-mark">${holding.ticker.slice(0, 2)}</span>
          <span>${holding.ticker}<small>${holding.lots.length} buy${holding.lots.length === 1 ? "" : "s"}</small></span>
        </div>
      </td>
      <td>${formatNumber(stats.shares)}</td>
      <td>${formatMoney(stats.cost)}</td>
      <td>${formatMoney(stats.averageCost)}</td>
      <td>${formatMoney(stats.value)}</td>
      <td class="${changeClass}">${stats.change.toFixed(2)}%</td>
      <td>
        <div class="action-cell">
          <button class="table-action" data-action="add" data-index="${index}" type="button">Add</button>
          <button class="table-action" data-action="delete" data-index="${index}" type="button">Delete</button>
        </div>
      </td>
    `;

    elements.holdingsBody.appendChild(row);
  });
}

function renderAllocation() {
  const totals = getTotals();
  elements.holdingCount.textContent = `${state.holdings.length} holdings`;
  elements.allocationList.innerHTML = "";

  if (!state.holdings.length) {
    elements.allocationList.innerHTML = '<p class="empty-state" style="display:block">No allocation data yet.</p>';
    return;
  }

  state.holdings
    .map((holding) => ({
      holding,
      value: getHoldingStats(holding).value,
    }))
    .sort((a, b) => b.value - a.value)
    .forEach(({ holding, value }) => {
      const percentage = totals.value ? (value / totals.value) * 100 : 0;
      const item = document.createElement("div");
      item.className = "allocation-item";
      item.innerHTML = `
        <div class="allocation-row">
          <span>${holding.ticker}</span>
          <span>${percentage.toFixed(1)}%</span>
        </div>
        <div class="allocation-bar">
          <div class="allocation-fill" style="width: ${Math.max(percentage, 1)}%"></div>
        </div>
      `;
      elements.allocationList.appendChild(item);
    });
}

function renderPerformanceChart() {
  const canvas = elements.performanceChart;
  const context = canvas.getContext("2d");
  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const padding = { top: 24, right: 18, bottom: 44, left: 72 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const stats = state.holdings.map((holding) => ({
    ticker: holding.ticker,
    returnAmount: getHoldingStats(holding).returnAmount,
  }));
  const maxAbs = Math.max(...stats.map((item) => Math.abs(item.returnAmount)), 1);
  const zeroY = padding.top + chartHeight / 2;

  context.strokeStyle = "#d9dee7";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding.left, zeroY);
  context.lineTo(width - padding.right, zeroY);
  context.stroke();

  context.fillStyle = "#647181";
  context.font = "12px Inter, system-ui, sans-serif";
  context.textAlign = "right";
  context.fillText(formatMoney(maxAbs), padding.left - 10, padding.top + 4);
  context.fillText("$0", padding.left - 10, zeroY + 4);
  context.fillText(formatMoney(-maxAbs), padding.left - 10, padding.top + chartHeight);

  if (!stats.length) {
    context.textAlign = "center";
    context.fillText("Add holdings or load demo data to see trade differences.", width / 2, height / 2);
    return;
  }

  const gap = 18;
  const barWidth = Math.max((chartWidth - gap * (stats.length - 1)) / stats.length, 28);

  stats.forEach((item, index) => {
    const x = padding.left + index * (barWidth + gap);
    const normalized = Math.abs(item.returnAmount) / maxAbs;
    const barHeight = normalized * (chartHeight / 2 - 12);
    const y = item.returnAmount >= 0 ? zeroY - barHeight : zeroY;

    context.fillStyle = item.returnAmount >= 0 ? "#0f8a55" : "#c34343";
    context.fillRect(x, y, barWidth, Math.max(barHeight, 2));

    context.fillStyle = "#18202a";
    context.textAlign = "center";
    context.fillText(item.ticker, x + barWidth / 2, height - 18);
    context.fillStyle = item.returnAmount >= 0 ? "#0f8a55" : "#c34343";
    context.fillText(
      formatMoney(item.returnAmount),
      x + barWidth / 2,
      item.returnAmount >= 0 ? y - 8 : y + barHeight + 16,
    );
  });
}

function renderAdvisorSelect() {
  const currentValue = elements.advisorStock.value;
  elements.advisorStock.innerHTML = "";

  if (!state.holdings.length) {
    elements.advisorStock.innerHTML = '<option value="">No holdings</option>';
    elements.advisorStock.disabled = true;
    return;
  }

  elements.advisorStock.disabled = false;
  state.holdings.forEach((holding, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = holding.ticker;
    elements.advisorStock.appendChild(option);
  });

  if (currentValue && state.holdings[Number(currentValue)]) {
    elements.advisorStock.value = currentValue;
  }
}

function renderRecommendation() {
  const index = Number(elements.advisorStock.value);
  const holding = state.holdings[index];

  if (!holding) {
    elements.selectedStockLabel.textContent = "Select a holding";
    elements.recommendation.innerHTML = `
      <span>Recommendation</span>
      <strong>HOLD</strong>
      <p>Add or select a holding to run the advisor.</p>
    `;
    elements.scenarioGrid.innerHTML = `
      <article>
        <span>Sell Today</span>
        <strong>$0.00</strong>
        <p>Locked-in result</p>
      </article>
      <article>
        <span>Hold Estimate</span>
        <strong>$0.00</strong>
        <p>Projected result</p>
      </article>
    `;
    renderMarketSignal(null);
    return;
  }

  const stats = getHoldingStats(holding);
  const risk = getSelectedRadio("risk");
  const goal = getSelectedRadio("goal");
  const months = Number(elements.projectionMonths.value);
  const suggestedRoi = getSuggestedRoi(stats.change, risk, goal, months, holding.market);
  const expectedRoi = elements.expectedRoi.value === "" ? suggestedRoi : Number(elements.expectedRoi.value);
  const projection = getProjection(holding, expectedRoi);
  const decision = getDecision(
    stats.change,
    risk,
    goal,
  );
  const holdClass = projection.projectedReturn < 0 ? "loss" : "gain";
  const sellClass = stats.returnAmount < 0 ? "loss" : "gain";
  const differenceClass = projection.extraReturn < 0 ? "loss" : "gain";

  elements.selectedStockLabel.textContent = `${holding.ticker} is ${stats.change.toFixed(2)}% from entry`;
  elements.expectedRoi.placeholder = `${suggestedRoi}% model estimate`;
  elements.recommendation.innerHTML = `
    <span>Recommendation</span>
    <strong>${decision.label}</strong>
    <p>${decision.detail} Model ROI estimate: ${suggestedRoi.toFixed(1)}% over ${months} month${months === 1 ? "" : "s"}.</p>
  `;
  elements.scenarioGrid.innerHTML = `
    <article>
      <span>Sell Today</span>
      <strong class="${sellClass}">${formatMoney(stats.returnAmount)}</strong>
      <p>${projection.lockedRoi.toFixed(2)}% ROI locked in</p>
    </article>
    <article>
      <span>Hold Estimate</span>
      <strong class="${holdClass}">${formatMoney(projection.projectedReturn)}</strong>
      <p>${projection.projectedRoi.toFixed(2)}% ROI at ${formatMoney(projection.projectedPrice)} per share</p>
    </article>
    <article>
      <span>Difference</span>
      <strong class="${differenceClass}">${formatMoney(projection.extraReturn)}</strong>
      <p>Estimated extra result versus selling today</p>
    </article>
    <article>
      <span>AI Score</span>
      <strong>${Math.max(0, Math.min(100, Math.round(50 + projection.projectedRoi - projection.lockedRoi / 2)))}/100</strong>
      <p>Rule-based confidence, not market prediction</p>
    </article>
  `;
  renderMarketSignal(holding.market);
}

function render() {
  renderSummary();
  renderHoldings();
  renderAllocation();
  renderPerformanceChart();
  renderAdvisorSelect();
  renderRecommendation();
}

function resetForm() {
  elements.form.reset();
  elements.editIndex.value = "";
  elements.formMode.textContent = "Dollar amount first";
  elements.cancelEditButton.style.display = "none";
  elements.quoteStatus.textContent = "Use Get Price to pull a public market quote when available.";
  updateSharePreview();
}

function handleSubmit(event) {
  event.preventDefault();

  const ticker = cleanTicker(elements.ticker.value);
  const amount = Number(elements.amountInvested.value);
  const buyPrice = Number(elements.buyPrice.value);
  const currentPrice = Number(elements.currentPrice.value);
  const holding = {
    ticker,
    currentPrice,
    lots: [
      {
        amount,
        buyPrice,
        shares: amount / buyPrice,
      },
    ],
  };

  if (!ticker || amount <= 0 || buyPrice <= 0 || currentPrice <= 0) {
    return;
  }

  const editIndex = elements.editIndex.value;
  if (editIndex !== "") {
    const existing = state.holdings[Number(editIndex)];
    existing.currentPrice = currentPrice;
    existing.lots.push(holding.lots[0]);
  } else {
    const existing = state.holdings.find((item) => item.ticker === ticker);
    if (existing) {
      existing.currentPrice = currentPrice;
      existing.lots.push(holding.lots[0]);
    } else {
    state.holdings.push(holding);
    }
  }

  saveHoldings();
  resetForm();
  render();
}

function addToHolding(index) {
  const holding = state.holdings[index];
  elements.editIndex.value = String(index);
  elements.formMode.textContent = `Adding to ${holding.ticker}`;
  elements.ticker.value = holding.ticker;
  elements.amountInvested.value = "";
  elements.buyPrice.value = "";
  elements.currentPrice.value = holding.currentPrice;
  elements.cancelEditButton.style.display = "inline-flex";
  elements.amountInvested.focus();
  updateSharePreview();
}

function deleteHolding(index) {
  state.holdings.splice(index, 1);
  saveHoldings();
  resetForm();
  render();
}

elements.form.addEventListener("submit", handleSubmit);
elements.amountInvested.addEventListener("input", updateSharePreview);
elements.buyPrice.addEventListener("input", updateSharePreview);
elements.quoteButton.addEventListener("click", updateQuoteFromMarket);
elements.cancelEditButton.addEventListener("click", resetForm);
elements.seedDemoButton.addEventListener("click", () => {
  state.holdings = demoPortfolio.map((holding) => ({ ...holding }));
  saveHoldings();
  resetForm();
  render();
});
elements.clearButton.addEventListener("click", () => {
  if (!state.holdings.length) {
    return;
  }
  state.holdings = [];
  saveHoldings();
  resetForm();
  render();
});
elements.holdingsBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);
  if (button.dataset.action === "edit") {
    addToHolding(index);
  }
  if (button.dataset.action === "add") {
    addToHolding(index);
  }
  if (button.dataset.action === "delete") {
    deleteHolding(index);
  }
});
elements.advisorStock.addEventListener("change", renderRecommendation);
elements.marketSignalButton.addEventListener("click", async () => {
  const index = Number(elements.advisorStock.value);
  const holding = state.holdings[index];
  if (!holding) {
    return;
  }

  elements.marketSignal.innerHTML = `
    <span>Market AI</span>
    <strong>Scanning ${holding.ticker}...</strong>
    <p>Checking quote, short trend, and recent volatility.</p>
  `;

  try {
    const market = await fetchMarketData(holding.ticker);
    holding.currentPrice = market.price;
    holding.market = market.signal;
    saveHoldings();
    render();
  } catch (error) {
    elements.marketSignal.innerHTML = `
      <span>Market AI</span>
      <strong>Signal unavailable</strong>
      <p>${error.message}</p>
    `;
  }
});
elements.expectedRoi.addEventListener("input", renderRecommendation);
elements.projectionMonths.addEventListener("change", () => {
  elements.expectedRoi.value = "";
  renderRecommendation();
});
document.querySelectorAll('input[name="risk"], input[name="goal"]').forEach((input) => {
  input.addEventListener("change", () => {
    elements.expectedRoi.value = "";
    renderRecommendation();
  });
});
window.addEventListener("resize", renderPerformanceChart);

resetForm();
render();
