// ===============================
//  ONLINE / OFFLINE INDICATOR
// ===============================
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


// ===============================
//  HELPERS
// ===============================
function getNum(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const v = parseFloat(el.value);
  return isNaN(v) ? null : v;
}
function getTxt(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim().toUpperCase() : "";
}


// ===============================
//  LOAD SYMBOLS (same as spot)
// ===============================
let PERP_SYMBOLS = [];

async function loadAllSymbols() {
  try {
    const r = await fetch("https://api.binance.com/api/v3/exchangeInfo");
    if (!r.ok) return [];
    const j = await r.json();
    return j.symbols.map(s => s.symbol);
  } catch (e) {
    return [];
  }
}

(async () => {
  PERP_SYMBOLS = await loadAllSymbols();
})();


// ===============================
//  SYMBOL ICON
// ===============================
const ICON_CDN = "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/icons/128/color/";

function updateSymbolIcon(sym) {
  const el = document.getElementById("perp_symbol_icon");
  if (!el) return;

  if (!sym) { el.src = "img/blank.png"; return; }

  const base = sym.replace(/USDT|USD|BUSD/i, "").toLowerCase();
  const url = `${ICON_CDN}${base}.png`;

  fetch(url, { method: "HEAD" })
    .then(r => { el.src = r.ok ? url : "img/blank.png"; })
    .catch(() => { el.src = "img/blank.png"; });
}


// ===============================
//  AUTOCOMPLETE
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("perp_symbol");
  const list = document.getElementById("perp_autocomplete");

  input.addEventListener("input", () => {
    const val = input.value.trim().toUpperCase();
    updateSymbolIcon(val);

    list.innerHTML = "";
    if (!val || PERP_SYMBOLS.length === 0) return;

    PERP_SYMBOLS.filter(s => s.startsWith(val)).slice(0, 15).forEach(sym => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.textContent = sym;
      item.onclick = () => {
        input.value = sym;
        updateSymbolIcon(sym);
        list.innerHTML = "";
        loadPrice();
      };
      list.appendChild(item);
    });
  });
});


// ===============================
//  FETCH PRICE
// ===============================
async function fetchPrice(symbol) {
  if (!symbol) return null;
  try {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    if (!r.ok) return null;
    const j = await r.json();
    return parseFloat(j.price);
  } catch (e) {
    return null;
  }
}

async function loadPrice() {
  const sym = getTxt("perp_symbol");
  const elPrice = document.getElementById("perp_entry");
  const live = document.getElementById("perp_live_price");
  if (!sym) return;

  live.textContent = "…";
  const px = await fetchPrice(sym);
  if (!px) {
    live.textContent = "error";
    return;
  }

  live.textContent = px.toFixed(2);
  elPrice.value = px;
  updateSymbolIcon(sym);
}


// ===============================
//  MAIN CALCULATION
// ===============================
function calcPerp() {
  const symbol   = getTxt("perp_symbol");
  const margin   = getNum("perp_margin");
  const entry    = getNum("perp_entry");
  const tp       = getNum("perp_tp");
  const sl       = getNum("perp_sl");
  const lev      = getNum("perp_leverage");
  const feePct   = getNum("perp_fee");
  const side     = document.getElementById("perp_side").value;

  const out = document.getElementById("perp-result");

  if (!margin || !entry || !tp || !lev) {
    out.innerHTML = `<div class="error">Fill margin, entry, TP, leverage.</div>`;
    return;
  }

  // Size
  const size = (margin * lev) / entry;

  // Profit per unit
  const profitPer = side === "long" ? (tp - entry) : (entry - tp);
  const grossProfit = profitPer * size;

  // Fees
  const feeRate = (feePct || 0) / 100;
  const totalFees = (size * entry + size * tp) * feeRate;
  const net = grossProfit - totalFees;
  const roe = (net / margin) * 100;

  // SL
  let riskBlock = "";
  if (sl) {
    const lossPer = side === "long" ? (entry - sl) : (sl - entry);

    if (lossPer > 0) {
      const grossLoss = lossPer * size;
      const totalFeesSL = (size * entry + size * sl) * feeRate;
      const netLoss = grossLoss + totalFeesSL;
      const riskPct = (netLoss / margin) * 100;
      const rr = netLoss > 0 ? net / netLoss : null;

      riskBlock = `
        <div class="rr-block">
          <b>SL Risk:</b><br>
          Loss: -${netLoss.toFixed(2)} $<br>
          Risk on margin: -${riskPct.toFixed(2)} %<br>
          R:R = ${rr ? rr.toFixed(2) : "—"}
        </div>`;
    }
  }

  out.innerHTML = `
    <div class="result-line"><b>Symbol:</b> ${symbol}</div>
    <div class="result-line"><b>Position size:</b> ${size.toFixed(6)} units</div>
    <div class="result-line"><b>Gross profit:</b> ${grossProfit.toFixed(2)} $</div>
    <div class="result-line"><b>Fees:</b> ${totalFees.toFixed(2)} $</div>
    <div class="result-line"><b>Net profit:</b> ${net.toFixed(2)} $</div>
    <div class="result-line"><b>ROE:</b> ${roe.toFixed(2)} %</div>
    ${riskBlock}
  `;
}


// ===============================
//  EVENTS
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-calc-perp").onclick = calcPerp;
  document.getElementById("btn-fetch-price").onclick = loadPrice;
});
