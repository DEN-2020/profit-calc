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
function loadSaved() {
  ["symbol","capital","entry","tp","sl","fee"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = localStorage.getItem("spot_" + id);
    if (val !== null) el.value = val;
  });
}
function saveValue(id) {
  const el = document.getElementById(id);
  if (!el) return;
  localStorage.setItem("spot_" + id, el.value);
}

["symbol","capital","entry","tp","sl","fee"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => saveValue(id));
});
loadSaved();

// --------------------------
// Main Spot Calculator
// --------------------------
const btn = document.getElementById("spot-calc-btn");
if (btn) {
  btn.addEventListener("click", () => {
    const sym     = (document.getElementById("symbol").value || "").trim();
    const capital = parseFloat(document.getElementById("capital").value);
    const entry   = parseFloat(document.getElementById("entry").value);
    const tp      = parseFloat(document.getElementById("tp").value);
    const slVal   = document.getElementById("sl").value;
    const sl      = slVal === "" ? null : parseFloat(slVal);
    const feePct  = parseFloat(document.getElementById("fee").value);

    const out = document.getElementById("spot-result");

    if (!capital || !entry || !tp) {
      out.innerHTML = `<div class="error">Fill capital, entry and TP</div>`;
      return;
    }

    const size   = capital / entry;
    const profit = (tp - entry) * size;

    const feeRate  = feePct / 100;
    const feeEntry = size * entry * feeRate;
    const feeExit  = size * tp    * feeRate;
    const totalFees = feeEntry + feeExit;

    const net = profit - totalFees;
    const roe = (net / capital) * 100;

    let riskHTML = "";
    if (sl) {
      const slLoss    = (entry - sl) * size;
      const feeSlExit = size * sl * feeRate;
      const netLoss   = slLoss + feeEntry + feeSlExit;
      const riskPct   = (netLoss / capital) * 100;
      const rr        = netLoss > 0 ? net / netLoss : null;

      riskHTML = `
        <div class="result-section-title">SL Risk</div>

        <div class="result-row">
          <span class="result-row-label">Loss</span>
          <span class="result-row-value">-${netLoss.toFixed(2)} $</span>
        </div>

        <div class="result-row">
          <span class="result-row-label">Risk %</span>
          <span class="result-row-value">-${riskPct.toFixed(2)} %</span>
        </div>

        <div class="result-row">
          <span class="result-row-label">R:R</span>
          <span class="result-row-value">${rr ? rr.toFixed(2) : "—"}</span>
        </div>
      `;
    }

    out.innerHTML = `
      <div class="result-row">
        <span class="result-row-label">Symbol</span>
        <span class="result-row-value">${sym || "—"}</span>
      </div>

      <div class="result-row">
        <span class="result-row-label">Position size</span>
        <span class="result-row-value">
          ${size.toFixed(6)} ${sym || ""}
        </span>
      </div>

      <div class="result-row">
        <span class="result-row-label">Gross profit</span>
        <span class="result-row-value">${profit.toFixed(2)} $</span>
      </div>

      <div class="result-row">
        <span class="result-row-label">Total fees</span>
        <span class="result-row-value">${totalFees.toFixed(2)} $</span>
      </div>

      <div class="result-row">
        <span class="result-row-label">Net profit</span>
        <span class="result-row-value">${net.toFixed(2)} $</span>
      </div>

      <div class="result-row">
        <span class="result-row-label">ROE</span>
        <span class="result-row-value">${roe.toFixed(2)} %</span>
      </div>

      ${riskHTML}
    `;

    drawChart(entry, tp, sl);
  });
}

// --------------------------
// Simple Visual Chart (still минимализм)
// --------------------------
function drawChart(entry, tp, sl) {
  const box = document.getElementById("spot-chart");
  if (!box) return;
  box.innerHTML = "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "220");
  svg.style.borderRadius = "12px";
  svg.style.background = "linear-gradient(180deg, #1a1a1a, #0f0f0f)";

  const values = sl ? [entry, tp, sl] : [entry, tp];
  const minP = Math.min(...values);
  const maxP = Math.max(...values);
  const pad = (maxP - minP) * 0.25 || 1;

  const minY = minP - pad;
  const maxY = maxP + pad;

  function y(val) {
    return 200 - ((val - minY) / (maxY - minY)) * 180;
  }

  function drawLine(price, color, label) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "14");
    line.setAttribute("x2", "96%");
    line.setAttribute("y1", y(price));
    line.setAttribute("y2", y(price));
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "18");
    text.setAttribute("y", y(price) - 4);
    text.setAttribute("fill", color);
    text.setAttribute("font-size", "11");
    text.textContent = `${label}: ${price}`;
    svg.appendChild(text);
  }

  drawLine(entry, "#4bb8ff", "Entry");
  drawLine(tp, "#51ff84", "TP");
  if (sl) drawLine(sl, "#ff5e5e", "SL");

  box.appendChild(svg);
}
