// =========================
//  ONLINE / OFFLINE STATUS
// =========================
function updateOnlineStatus() {
    const el = document.getElementById("offline-indicator");
    if (!el) return;

    if (navigator.onLine) {
        el.classList.remove("offline");
        el.classList.add("online");
        el.textContent = "Online";
    } else {
        el.classList.remove("online");
        el.classList.add("offline");
        el.textContent = "Offline";
    }
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
document.addEventListener("DOMContentLoaded", updateOnlineStatus);


// =========================
// IMPORTS
// =========================
import { loadSymbols } from "./symbols.js";
import { getPrice } from "./binance.js";

let ALL_SYMBOLS = [];

(async () => {
    ALL_SYMBOLS = await loadSymbols();
})();


// =========================
// ICON LOADER
// =========================
const ICON_CDN =
  "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/";

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
    .then((r) => (el.src = r.ok ? url : "img/blank.png"))
    .catch(() => (el.src = "img/blank.png"));
}


// =========================
// AUTOCOMPLETE
// =========================
const symbolEl = document.getElementById("symbol");
const autoEl = document.getElementById("symbol-autocomplete");

symbolEl.addEventListener("input", () => {
    const val = symbolEl.value.trim().toUpperCase();

    updateSymbolIcon(val);
    autoEl.innerHTML = "";
    if (!val) return;

    const matches = ALL_SYMBOLS.filter(s => s.startsWith(val)).slice(0, 15);

    matches.forEach(m => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.textContent = m;

        item.onclick = () => {
            symbolEl.value = m;
            updateSymbolIcon(m);
            autoEl.innerHTML = "";
            loadLivePrice();
        };

        autoEl.appendChild(item);
    });
});


// =========================
//  LIVE PRICE LOADER
// =========================
const livePriceEl = document.getElementById("perp_live_price");
const entryEl = document.getElementById("perp_entry");

async function loadLivePrice() {
    const sym = symbolEl.value.trim().toUpperCase();
    if (!sym) return;

    updateSymbolIcon(sym);

    livePriceEl.textContent = "…";

    const px = await getPrice(sym);
    if (!px) {
        livePriceEl.textContent = "error";
        return;
    }

    livePriceEl.textContent = px.toFixed(2);
    entryEl.value = px;
}

document.getElementById("btn-fetch-price")
  .addEventListener("click", loadLivePrice);


// =========================
// FUTURES CALC
// =========================
function getNum(id) {
  const v = parseFloat(document.getElementById(id).value);
  return isNaN(v) ? null : v;
}

function calcPerp() {
    const sym = symbolEl.value.trim().toUpperCase();
    const margin = getNum("perp_margin");
    const entry = getNum("perp_entry");
    const tp = getNum("perp_tp");
    const sl = getNum("perp_sl");
    const lev = getNum("perp_leverage");
    const feePct = getNum("perp_fee") || 0;
    const side = document.getElementById("perp_side").value;

    const out = document.getElementById("perp-result");

    if (!margin || !entry || !tp || !lev) {
        out.innerHTML = `<div class="error">Fill margin, entry, TP, leverage.</div>`;
        return;
    }

    // logic check
    if (side === "long" && tp <= entry) {
        out.innerHTML = `<div class="error">For LONG: TP must be > Entry</div>`;
        return;
    }
    if (side === "short" && tp >= entry) {
        out.innerHTML = `<div class="error">For SHORT: TP must be < Entry</div>`;
        return;
    }

    // sl check
    if (sl) {
        if (side === "long" && sl >= entry) {
            out.innerHTML = `<div class="error">For LONG: SL must be < Entry</div>`;
            return;
        }
        if (side === "short" && sl <= entry) {
            out.innerHTML = `<div class="error">For SHORT: SL must be > Entry</div>`;
            return;
        }
    }

    // size
    const size = (margin * lev) / entry;

    // profit
    let profitPer = side === "long" ? (tp - entry) : (entry - tp);
    const grossProfit = profitPer * size;

    const feeRate = feePct / 100;
    const notionalEntry = size * entry;
    const notionalExit = size * tp;
    const totalFees = (notionalEntry + notionalExit) * feeRate;

    const net = grossProfit - totalFees;
    const roe = (net / margin) * 100;

    // liquidation
    const mmr = 0.005;
    const liq =
      side === "long"
        ? entry * (1 - mmr * lev)
        : entry * (1 + mmr * lev);

    // SL block
    let slBlock = "";

    if (sl) {
        let lossPer = side === "long" ? (entry - sl) : (sl - entry);

        if (lossPer > 0) {
            const grossLoss = lossPer * size;
            const notionalSL = size * sl;
            const totalFeesSL = (notionalEntry + notionalSL) * feeRate;
            const netLoss = grossLoss + totalFeesSL;
            const riskPct = (netLoss / margin) * 100;

            slBlock = `
                <div class="res-item">
                  <div class="res-icon">⚠</div>
                  <div class="res-content">
                    <span class="res-label">SL Risk</span>
                    <span class="res-value red">-${netLoss.toFixed(2)}$ (${riskPct.toFixed(2)}%)</span>
                  </div>
                </div>`;
        }
    }

    // render
    out.innerHTML = `
      <div class="result-grid">

        <div class="res-item">
          <div class="res-icon">◎</div>
          <div class="res-content">
            <span class="res-label">Symbol</span>
            <span class="res-value">${sym}</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">∑</div>
          <div class="res-content">
            <span class="res-label">Position size</span>
            <span class="res-value">${size.toFixed(6)}</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">G</div>
          <div class="res-content">
            <span class="res-label">Gross profit</span>
            <span class="res-value green">${grossProfit.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">F</div>
          <div class="res-content">
            <span class="res-label">Fees</span>
            <span class="res-value orange">${totalFees.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">P</div>
          <div class="res-content">
            <span class="res-label">Net profit</span>
            <span class="res-value ${net >= 0 ? "green" : "red"}">${net.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">%</div>
          <div class="res-content">
            <span class="res-label">ROE</span>
            <span class="res-value ${roe >= 0 ? "green" : "red"}">${roe.toFixed(2)}%</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">L</div>
          <div class="res-content">
            <span class="res-label">Liquidation</span>
            <span class="res-value red">${liq.toFixed(2)}</span>
          </div>
        </div>

        ${slBlock}

      </div>
    `;

    drawPerpChart(entry, tp, sl);
}

document.getElementById("btn-calc-perp")
  .addEventListener("click", calcPerp);


// =========================
//  SVG CHART
// =========================
function drawPerpChart(entry, tp, sl) {
    const box = document.getElementById("perp-chart");
    if (!box) return;

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

    const x = (p) => 30 + ((p - minP) / span) * 300;

    // bg
    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("width", "360");
    bg.setAttribute("height", "110");
    bg.setAttribute("fill", "#050712");
    bg.setAttribute("rx", "12");
    svg.appendChild(bg);

    // baseline
    const base = document.createElementNS(svgNS, "line");
    base.setAttribute("x1", "25");
    base.setAttribute("x2", "335");
    base.setAttribute("y1", "75");
    base.setAttribute("y2", "75");
    base.setAttribute("stroke", "#262638");
    base.setAttribute("stroke-width", "2");
    svg.appendChild(base);

    // zones
    const green = document.createElementNS(svgNS, "rect");
    green.setAttribute("x", Math.min(x(entry), x(tp)));
    green.setAttribute("y", "55");
    green.setAttribute("width", Math.abs(x(tp) - x(entry)));
    green.setAttribute("height", "20");
    green.setAttribute("fill", "rgba(34,197,94,0.20)");
    svg.appendChild(green);

    if (sl) {
        const red = document.createElementNS(svgNS, "rect");
        red.setAttribute("x", Math.min(x(sl), x(entry)));
        red.setAttribute("y", "55");
        red.setAttribute("width", Math.abs(x(entry) - x(sl)));
        red.setAttribute("height", "20");
        red.setAttribute("fill", "rgba(239,68,68,0.20)");
        svg.appendChild(red);
    }

    function mark(p, color, textLabel) {
        const px = x(p);

        const ln = document.createElementNS(svgNS, "line");
        ln.setAttribute("x1", px);
        ln.setAttribute("x2", px);
        ln.setAttribute("y1", 40);
        ln.setAttribute("y2", 75);
        ln.setAttribute("stroke", color);
        ln.setAttribute("stroke-width", "2.4");
        svg.appendChild(ln);

        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", px);
        dot.setAttribute("cy", "75");
        dot.setAttribute("r", "4");
        dot.setAttribute("fill", color);
        svg.appendChild(dot);

        const t = document.createElementNS(svgNS, "text");
        t.setAttribute("x", px);
        t.setAttribute("y", textLabel === "Entry" ? 18 : 24);
        t.setAttribute("fill", color);
        t.setAttribute("font-size", "11");
        t.setAttribute("text-anchor", "middle");
        t.textContent = `${textLabel} ${p}`;
        svg.appendChild(t);
    }

    mark(entry, "#4bb8ff", "Entry");
    mark(tp, "#51ff84", "TP");
    if (sl) mark(sl, "#ff5e5e", "SL");

    box.appendChild(svg);
}


// =========================
// LOCAL STORAGE
// =========================
const PERP_FIELDS = [
  "symbol",
  "perp_margin",
  "perp_entry",
  "perp_tp",
  "perp_sl",
  "perp_leverage",
  "perp_fee"
];

function saveField(id) {
  const el = document.getElementById(id);
  if (el) localStorage.setItem("perp_" + id, el.value);
}

PERP_FIELDS.forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => saveField(id));
});

(function loadSaved() {
  PERP_FIELDS.forEach((id) => {
    const v = localStorage.getItem("perp_" + id);
    const el = document.getElementById(id);
    if (el && v !== null) el.value = v;
  });
})();


// =========================
// DEFAULT SYMBOL + AUTO PRICE
// =========================
document.addEventListener("DOMContentLoaded", () => {
    const DEFAULT_SYMBOL = "BTCUSDT";

    // ensure default symbol AFTER DOM exists
    if (symbolEl && !symbolEl.value.trim()) {
        symbolEl.value = DEFAULT_SYMBOL;
        localStorage.setItem("perp_symbol", DEFAULT_SYMBOL);
    }

    // load icon safely (image now exists)
    updateSymbolIcon(symbolEl.value.trim().toUpperCase());

    // now load price
    loadLivePrice();
});
