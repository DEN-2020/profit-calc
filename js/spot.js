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

  <div class="res-item">
    <span class="res-label">Symbol</span>
    <span class="res-value">${sym || "—"}</span>
  </div>

  <div class="res-item">
    <span class="res-label">Position size</span>
    <span class="res-value">${size.toFixed(6)} ${sym || ""}</span>
  </div>

  <div class="res-item">
    <span class="res-label">Gross profit</span>
    <span class="res-value green">+${profit.toFixed(2)}$</span>
  </div>

  <div class="res-item">
    <span class="res-label">Total fees</span>
    <span class="res-value orange">-${totalFees.toFixed(2)}$</span>
  </div>

  <div class="res-item">
    <span class="res-label">Net profit</span>
    <span class="res-value ${net >= 0 ? "green" : "red"}">
      ${net >= 0 ? "+" : ""}${net.toFixed(2)}$
    </span>
  </div>

  <div class="res-item">
    <span class="res-label">ROE</span>
    <span class="res-value ${roe >= 0 ? "green" : "red"}">
      ${roe.toFixed(2)}%
    </span>
  </div>

</div>

${sl ? `
<div class="result-risk">
  <div class="res-item">
    <span class="res-label">SL Net Loss</span>
    <span class="res-value red">-${netLoss.toFixed(2)}$</span>
  </div>
  <div class="res-item">
    <span class="res-label">Risk %</span>
    <span class="res-value red">-${riskPct.toFixed(2)}%</span>
  </div>
  <div class="res-item">
    <span class="res-label">R:R</span>
    <span class="res-value">${rr ? rr.toFixed(2) : "—"}</span>
  </div>
</div>
` : ""}
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
  svg.setAttribute("viewBox", "0 0 340 90");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "90");

  const values = sl ? [sl, entry, tp] : [entry, tp];
  const minP = Math.min(...values);
  const maxP = Math.max(...values);
  const span = maxP - minP || 1;

  const x = price => 20 + ((price - minP) / span) * 300;

  const bg = document.createElementNS(svgNS, "rect");
  bg.setAttribute("width", "340");
  bg.setAttribute("height", "90");
  bg.setAttribute("fill", "#101015");
  bg.setAttribute("rx", "10");
  svg.appendChild(bg);

  // зелёная зона Entry -> TP
  const greenZone = document.createElementNS(svgNS, "rect");
  greenZone.setAttribute("x", x(entry));
  greenZone.setAttribute("y", "40");
  greenZone.setAttribute("width", x(tp) - x(entry));
  greenZone.setAttribute("height", "20");
  greenZone.setAttribute("fill", "#153a23");
  svg.appendChild(greenZone);

  if (sl) {
    const redZone = document.createElementNS(svgNS, "rect");
    redZone.setAttribute("x", x(sl));
    redZone.setAttribute("y", "40");
    redZone.setAttribute("width", x(entry) - x(sl));
    redZone.setAttribute("height", "20");
    redZone.setAttribute("fill", "#3a1515");
    svg.appendChild(redZone);
  }

  function mark(price, color, label) {
    const px = x(price);

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", px);
    line.setAttribute("x2", px);
    line.setAttribute("y1", 30);
    line.setAttribute("y2", 70);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);

    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", px);
    text.setAttribute("y", 25);
    text.setAttribute("fill", color);
    text.setAttribute("font-size", "12");
    text.setAttribute("text-anchor", "middle");
    text.textContent = `${label} ${price}`;
    svg.appendChild(text);
  }

  mark(entry, "#4bb8ff", "Entry");
  mark(tp, "#51ff84", "TP");
  if (sl) mark(sl, "#ff5e5e", "SL");

  box.appendChild(svg);
}
