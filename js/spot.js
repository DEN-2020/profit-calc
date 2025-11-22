// --------------------------
// Offline Indicator
// --------------------------
function updateOfflineStatus() {
  const ind = document.getElementById("offline-indicator");
  if (!ind) return;

  if (navigator.onLine) {
    ind.textContent = "Online";
    ind.classList.remove("offline");
    ind.classList.add("online");
  } else {
    ind.textContent = "Offline";
    ind.classList.remove("online");
    ind.classList.add("offline");
  }
}

window.addEventListener("online", updateOfflineStatus);
window.addEventListener("offline", updateOfflineStatus);
updateOfflineStatus();


// --------------------------
// Local Storage
// --------------------------
const SPOT_FIELDS = ["symbol", "capital", "entry", "tp", "sl", "fee"];

function loadSaved() {
  SPOT_FIELDS.forEach((id) => {
    const val = localStorage.getItem("spot_" + id);
    const el = document.getElementById(id);
    if (el && val !== null) el.value = val;
  });
}

function saveValue(id) {
  const el = document.getElementById(id);
  if (!el) return;
  localStorage.setItem("spot_" + id, el.value);
}

SPOT_FIELDS.forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => saveValue(id));
});

loadSaved();


// --------------------------
// Helpers (formatting)
// --------------------------
function formatMoney(v) {
  if (!Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  const abs = Math.abs(v);
  const digits = abs >= 1000 ? 0 : abs >= 100 ? 1 : 2;
  return `${sign}${abs.toFixed(digits)}$`;
}

function formatPercent(v) {
  if (!Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  const abs = Math.abs(v);
  const digits = abs >= 100 ? 1 : 2;
  return `${sign}${abs.toFixed(digits)}%`;
}

function formatSize(v) {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1) return v.toFixed(4);
  return v.toFixed(6);
}


// ==============================
// ICONS
// ==============================
const ICON_CDN = "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/";

function updateSymbolIcon(sym) {
  const el = document.getElementById("symbol-icon");
  if (!el) return;

  if (!sym) {
    el.src = "img/blank.png";
    return;
  }

  const base = sym.replace(/USDT|USD|BUSD/i, "").toLowerCase();
  const url = `${ICON_CDN}${base}.png`;

  fetch(url, { method: "HEAD" })
    .then(res => {
      el.src = res.ok ? url : "img/blank.png";
    })
    .catch(() => {
      el.src = "img/blank.png";
    });
}


// ==============================
// Autocomplete + Price Loader
// ==============================
let ALL_SYMBOLS = [];

import { loadSymbols } from "./symbols.js";
import { getPrice } from "./binance.js";

(async () => {
  ALL_SYMBOLS = await loadSymbols();
})();

const symbolEl = document.getElementById("symbol");
const auto = document.getElementById("symbol-autocomplete");
const entryEl = document.getElementById("entry");
const priceEl = document.getElementById("live-price");

symbolEl.addEventListener("input", () => {
  const val = symbolEl.value.trim().toUpperCase();
  updateSymbolIcon(val);

  auto.innerHTML = "";
  if (!val) return;

  const matches = ALL_SYMBOLS.filter(s => s.startsWith(val)).slice(0, 15);

  matches.forEach(m => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.textContent = m;

    item.onclick = () => {
      symbolEl.value = m;
      updateSymbolIcon(m);
      auto.innerHTML = "";
      loadPrice();
    };

    auto.appendChild(item);
  });
});

async function loadPrice() {
  const sym = symbolEl.value.trim().toUpperCase();
  if (!sym) return;

  updateSymbolIcon(sym);

  priceEl.textContent = "…";
  const price = await getPrice(sym);

  if (price) {
    priceEl.textContent = price.toFixed(2);
    entryEl.value = price;
  } else {
    priceEl.textContent = "error";
  }
}

document.getElementById("update-price-btn").addEventListener("click", loadPrice);


// --------------------------
// Main Spot Calculator
// --------------------------
const btnCalc = document.getElementById("spot-calc-btn");
const resultBox = document.getElementById("spot-result");

if (btnCalc) {
  btnCalc.addEventListener("click", () => {
    const sym = (document.getElementById("symbol").value || "").trim().toUpperCase();
    const capital = parseFloat(document.getElementById("capital").value);
    const entry   = parseFloat(document.getElementById("entry").value);
    const tp      = parseFloat(document.getElementById("tp").value);
    const slRaw   = document.getElementById("sl").value;
    const sl      = slRaw === "" ? null : parseFloat(slRaw);
    const feePct  = parseFloat(document.getElementById("fee").value);

    if (!resultBox) return;

    // валидация
    if (!capital || !entry || !tp || capital <= 0 || entry <= 0 || tp <= 0) {
      resultBox.innerHTML =
        "<div class='error'>Fill capital, entry, TP (must be &gt; 0)</div>";
      return;
    }

    const size = capital / entry;

    const feeRate = (feePct || 0) / 100;
    const feeEntry = size * entry * feeRate;
    const feeExit  = size * tp    * feeRate;
    const totalFees = feeEntry + feeExit;

    const grossProfit = (tp - entry) * size;
    const net = grossProfit - totalFees;
    const roe = (net / capital) * 100;

    // Доп. метрики
    const tpDistPct = ((tp - entry) / entry) * 100;
    const breakevenPrice = entry + (totalFees / size);

    // Risk (SL)
    let riskHtml = "";
    let netLossAbs = null;
    let riskPctAbs = null;
    let rr = null;
    let slDistPct = null;

    if (sl && sl > 0) {
      const slLossPrice = (entry - sl) * size;     // убыток по движению цены (без знака ещё не меняем)
      const feeSlExit = size * sl * feeRate;       // комиссия выхода по SL
      const netLoss = slLossPrice + feeEntry + feeSlExit;
      netLossAbs = Math.abs(netLoss);
      riskPctAbs = (netLossAbs / capital) * 100;
      slDistPct = ((entry - sl) / entry) * 100;
      rr = netLossAbs > 0 ? net / netLossAbs : null;

      riskHtml = `
<div class="result-risk">
  <div class="res-item">
    <div class="res-icon res-icon-risk">⚠</div>
    <div class="res-content">
      <span class="res-label">Max SL loss</span>
      <span class="res-value">
        <span class="badge badge-red">${formatMoney(-netLossAbs)}</span>
      </span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon res-icon-risk">%</div>
    <div class="res-content">
      <span class="res-label">Risk / Capital</span>
      <span class="res-value red">${formatPercent(riskPctAbs)}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon res-icon-risk">SL</div>
    <div class="res-content">
      <span class="res-label">Distance to SL</span>
      <span class="res-value red">${formatPercent(slDistPct)}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon res-icon-extra">R</div>
    <div class="res-content">
      <span class="res-label">Reward : Risk</span>
      <span class="res-value">${rr ? rr.toFixed(2) : "—"}</span>
    </div>
  </div>
</div>`;
    }

    // Основной блок результата
    resultBox.innerHTML = `
<div class="result-grid">

  <div class="res-item">
    <div class="res-icon res-icon-symbol">◎</div>
    <div class="res-content">
      <span class="res-label">Symbol</span>
      <span class="res-value">${sym || "—"}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon res-icon-size">∑</div>
    <div class="res-content">
      <span class="res-label">Position size</span>
      <span class="res-value">
        ${formatSize(size)} ${sym || ""}
      </span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon res-icon-profit">P</div>
    <div class="res-content">
      <span class="res-label">Net profit (after fees)</span>
      <span class="res-value">
        <span class="badge ${net >= 0 ? "badge-green" : "badge-red"}">
          ${formatMoney(net)}
        </span>
      </span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon res-icon-profit">G</div>
    <div class="res-content">
      <span class="res-label">Gross profit</span>
      <span class="res-value green">${formatMoney(grossProfit)}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon res-icon-fee">F</div>
    <div class="res-content">
      <span class="res-label">Total fees (entry + exit)</span>
      <span class="res-value orange">${formatMoney(totalFees)}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon res-icon-roe">%</div>
    <div class="res-content">
      <span class="res-label">ROE</span>
      <span class="res-value ${roe >= 0 ? "green" : "red"}">
        ${formatPercent(roe)}
      </span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon res-icon-extra">TP</div>
    <div class="res-content">
      <span class="res-label">Distance to TP</span>
      <span class="res-value green">${formatPercent(tpDistPct)}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon res-icon-extra">BE</div>
    <div class="res-content">
      <span class="res-label">Break-even price</span>
      <span class="res-value">${breakevenPrice.toFixed(2)}</span>
    </div>
  </div>

</div>

${riskHtml}
`;

    drawSpotChart(entry, tp, sl);
  });
}


// --------------------------
// Position View Chart (SVG)
// --------------------------
function drawSpotChart(entry, tp, sl) {
  const box = document.getElementById("spot-chart");
  if (!box || !entry || !tp) return;

  box.innerHTML = "";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 360 110");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "110");

  const values = sl ? [sl, entry, tp] : [entry, tp];
  const minP = Math.min(...values);
  const maxP = Math.max(...values);
  const span = maxP - minP || 1;

  const x = price => 30 + ((price - minP) / span) * 300;

  // фон
  const bg = document.createElementNS(svgNS, "rect");
  bg.setAttribute("width", "360");
  bg.setAttribute("height", "110");
  bg.setAttribute("fill", "#050712");
  bg.setAttribute("rx", "12");
  svg.appendChild(bg);

  // базовая линия
  const base = document.createElementNS(svgNS, "line");
  base.setAttribute("x1", "25");
  base.setAttribute("x2", "335");
  base.setAttribute("y1", "75");
  base.setAttribute("y2", "75");
  base.setAttribute("stroke", "#262638");
  base.setAttribute("stroke-width", "2");
  svg.appendChild(base);

  // зелёная зона (Entry -> TP)
  const greenZone = document.createElementNS(svgNS, "rect");
  greenZone.setAttribute("x", Math.min(x(entry), x(tp)));
  greenZone.setAttribute("y", "55");
  greenZone.setAttribute("width", Math.abs(x(tp) - x(entry)));
  greenZone.setAttribute("height", "20");
  greenZone.setAttribute("fill", "rgba(34,197,94,0.20)");
  svg.appendChild(greenZone);

  // красная зона (SL -> Entry)
  if (sl) {
    const redZone = document.createElementNS(svgNS, "rect");
    redZone.setAttribute("x", Math.min(x(sl), x(entry)));
    redZone.setAttribute("y", "55");
    redZone.setAttribute("width", Math.abs(x(entry) - x(sl)));
    redZone.setAttribute("height", "20");
    redZone.setAttribute("fill", "rgba(239,68,68,0.20)");
    svg.appendChild(redZone);
  }

  function mark(price, color, label) {
  const px = x(price);

  const line = document.createElementNS(svgNS, "line");
  line.setAttribute("x1", px);
  line.setAttribute("x2", px);
  line.setAttribute("y1", 40);
  line.setAttribute("y2", 75);
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", "2.4");
  svg.appendChild(line);

  const dot = document.createElementNS(svgNS, "circle");
  dot.setAttribute("cx", px);
  dot.setAttribute("cy", "75");
  dot.setAttribute("r", "4");
  dot.setAttribute("fill", color);
  svg.appendChild(dot);

  const text = document.createElementNS(svgNS, "text");
  text.setAttribute("x", px);

  
  const textY = label === "Entry" ? 18 : 24;
  text.setAttribute("y", textY);
  

  text.setAttribute("fill", color);
  text.setAttribute("font-size", "11");
  text.setAttribute("text-anchor", "middle");
  text.textContent = `${label} ${price}`;
  svg.appendChild(text);
  }

  mark(entry, "#4bb8ff", "Entry");
  mark(tp, "#51ff84", "TP");
  if (sl) mark(sl, "#ff5e5e", "SL");

  box.appendChild(svg);
}
