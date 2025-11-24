// ===== Helpers =====
const G = id => document.getElementById(id);
const num = id => parseFloat(G(id).value) || 0;

G("inv-calc-btn").addEventListener("click", calcInvest);


// ===== Main calculator =====
function calcInvest() {
  const start = num("inv_amount");
  const pct = num("inv_pct") / 100;
  const months = num("inv_months");

  const reinvEvery = parseInt(G("inv_reinvest_period").value);
  const reinvAdd = num("inv_reinvest_value");

  const addMonthly = num("inv_add");
  const withdrawMonthly = num("inv_withdraw");

  let capital = start;

  let logs = [];
  let profit6 = 0;
  let profit12 = 0;

  for (let m = 1; m <= months; m++) {

    const profit = capital * pct;
    capital += profit;

    profit12 += profit;

    // monthly additions / withdrawals
    capital += addMonthly;
    capital -= withdrawMonthly;

    // REINVEST logic
    if (reinvEvery > 0 && m % reinvEvery === 0) {
      capital += reinvAdd;
    }

    // snapshot after 6 months
    if (m === 6) profit6 = capital - start;

    logs.push({
      m,
      capital: capital
    });
  }

  renderResult(start, logs[5].capital, capital, profit6, profit12, reinvEvery, reinvAdd);
  drawChart(logs);
}


// ===== Result output =====
function renderResult(start, val6, val12, p6, p12, reinvEvery, reinvAdd) {

  G("inv-result").innerHTML = `
  <div class="result-grid">

    <div class="res-item">
      <div class="res-icon">💰</div>
      <div class="res-content">
        <div class="res-label">Invested</div>
        <div class="res-value">${start.toFixed(2)}$</div>
      </div>
    </div>

    <div class="res-item">
      <div class="res-icon">📆</div>
      <div class="res-content">
        <div class="res-label">After 6 months</div>
        <div class="res-value">${val6.toFixed(2)}$</div>
      </div>
    </div>

    <div class="res-item">
      <div class="res-icon">⏳</div>
      <div class="res-content">
        <div class="res-label">Profit 6m</div>
        <div class="res-value green">${p6.toFixed(2)}$</div>
      </div>
    </div>

    <div class="res-item">
      <div class="res-icon">📈</div>
      <div class="res-content">
        <div class="res-label">After 12 months</div>
        <div class="res-value green">${val12.toFixed(2)}$</div>
      </div>
    </div>

    <div class="res-item">
      <div class="res-icon">🟩</div>
      <div class="res-content">
        <div class="res-label">Profit 12m</div>
        <div class="res-value green">${p12.toFixed(2)}$</div>
      </div>
    </div>

    ${
      reinvEvery > 0
        ? `<div class="res-item">
             <div class="res-icon">🔁</div>
             <div class="res-content">
               <div class="res-label">Reinvest</div>
               <div class="res-value">${reinvEvery}m → +${reinvAdd}$</div>
             </div>
           </div>`
        : ""
    }

  </div>`;
}


// ===== Chart =====
function drawChart(logs) {
  const box = G("inv-chart");
  box.innerHTML = "";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("viewBox", "0 0 360 160");
  svg.style.width = "100%";

  const values = logs.map(l => l.capital);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = i => 25 + (i / (logs.length - 1)) * 300;
  const y = v => 140 - ((v - min) / span) * 110;

  // Line
  let d = "";
  logs.forEach((row, i) => {
    d += (i === 0 ? "M" : "L") + x(i) + " " + y(row.capital) + " ";
  });

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", d);
  path.setAttribute("stroke", "#4bb8ff");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("fill", "none");
  svg.appendChild(path);

  // Markers + labels
  logs.forEach((row, i) => {
    const px = x(i);
    const py = y(row.capital);

    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("cx", px);
    dot.setAttribute("cy", py);
    dot.setAttribute("r", "3");
    dot.setAttribute("fill", "#4bb8ff");
    svg.appendChild(dot);

    if (i % 3 === 0) {
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", px);
      text.setAttribute("y", 155);
      text.setAttribute("font-size", "10");
      text.setAttribute("fill", "#888");
      text.setAttribute("text-anchor", "middle");
      text.textContent = "M" + row.m;
      svg.appendChild(text);
    }
  });

  box.appendChild(svg);
}
