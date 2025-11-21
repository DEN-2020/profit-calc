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
// Main Spot Calculator
// --------------------------
const btnCalc = document.getElementById("spot-calc-btn");
const resultBox = document.getElementById("spot-result");

if (btnCalc) {
  btnCalc.addEventListener("click", () => {
    const sym = (document.getElementById("symbol").value || "").trim();
    const capital = parseFloat(document.getElementById("capital").value);
    const entry   = parseFloat(document.getElementById("entry").value);
    const tp      = parseFloat(document.getElementById("tp").value);
    const slRaw   = document.getElementById("sl").value;
    const sl      = slRaw === "" ? null : parseFloat(slRaw);
    const feePct  = parseFloat(document.getElementById("fee").value);

    if (!resultBox) return;

    // простая валидация
    if (!capital || !entry || !tp || capital <= 0 || entry <= 0 || tp <= 0) {
      resultBox.innerHTML =
        "<div class='error'>Fill capital, entry, TP (must be &gt; 0)</div>";
      return;
    }

    const size = capital / entry;
    const profit = (tp - entry) * size;

    const feeRate = (feePct || 0) / 100;
    const feeEntry = size * entry * feeRate;
    const feeExit  = size * tp    * feeRate;
    const totalFees = feeEntry + feeExit;

    const net = profit - totalFees;
    const roe = (net / capital) * 100;

    let riskBlock = "";
    if (sl && sl > 0) {
      const slLoss = (entry - sl) * size;          // убыток по цене
      const feeSlExit = size * sl * feeRate;       // комиссия при выходе по SL
      const netLoss = slLoss + feeEntry + feeSlExit;
      const riskPct = (netLoss / capital) * 100;
      const rr = netLoss > 0 ? net / netLoss : null;

      riskBlock = `
        <br><b>SL Risk:</b><br>
        Loss: -${netLoss.toFixed(2)}$<br>
        Risk %: -${riskPct.toFixed(2)}%<br>
        R:R = ${rr ? rr.toFixed(2) : "—"}
      `;
    }

    resultBox.innerHTML = `
      <div class="result-grid">
        <div><span>Symbol:</span><strong>${sym || "—"}</strong></div>
        <div><span>Position size:</span><strong>${size.toFixed(6)} ${sym || ""}</strong></div>
        <div><span>Gross profit:</span><strong>${profit.toFixed(2)}$</strong></div>
        <div><span>Total fees:</span><strong>${totalFees.toFixed(2)}$</strong></div>
        <div><span>Net profit:</span><strong>${net.toFixed(2)}$</strong></div>
        <div><span>ROE:</span><strong>${roe.toFixed(2)}%</strong></div>
      </div>
      ${riskBlock}
    `;

    drawSpotChart(entry, tp, sl);
  });
}


// --------------------------
// Simple Visual Chart (SVG)
// --------------------------
function drawSpotChart(entry, tp, sl) {
  const box = document.getElementById("spot-chart");
  if (!box || !entry || !tp) return;

  box.innerHTML = "";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 320 130");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "130");

  // фон
  const bg = document.createElementNS(svgNS, "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", "320");
  bg.setAttribute("height", "130");
  bg.setAttribute("rx", "12");
  bg.setAttribute("fill", "#101015");
  svg.appendChild(bg);

  const values = sl ? [sl, entry, tp] : [entry, tp];
  const minP = Math.min(...values);
  const maxP = Math.max(...values);
  const span = maxP - minP || 1;

  function x(price) {
    return 30 + ((price - minP) / span) * 260; // 30..290
  }

  // базовая ось
  const axis = document.createElementNS(svgNS, "line");
  axis.setAttribute("x1", "20");
  axis.setAttribute("x2", "300");
  axis.setAttribute("y1", "100");
  axis.setAttribute("y2", "100");
  axis.setAttribute("stroke", "#333");
  axis.setAttribute("stroke-width", "2");
  svg.appendChild(axis);

  function drawMarker(price, color, label) {
    const px = x(price);

    const vline = document.createElementNS(svgNS, "line");
    vline.setAttribute("x1", px);
    vline.setAttribute("x2", px);
    vline.setAttribute("y1", "100");
    vline.setAttribute("y2", "40");
    vline.setAttribute("stroke", color);
    vline.setAttribute("stroke-width", "3");
    svg.appendChild(vline);

    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("cx", px);
    dot.setAttribute("cy", "100");
    dot.setAttribute("r", "4");
    dot.setAttribute("fill", color);
    svg.appendChild(dot);

    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", px);
    text.setAttribute("y", "30");
    text.setAttribute("fill", color);
    text.setAttribute("font-size", "11");
    text.setAttribute("text-anchor", "middle");
    text.textContent = `${label} ${price}`;
    svg.appendChild(text);
  }

  drawMarker(entry, "#4bb8ff", "Entry");
  drawMarker(tp, "#51ff84", "TP");
  if (sl) drawMarker(sl, "#ff5e5e", "SL");

  box.appendChild(svg);
}
