// =======================
// SHORT HELPERS
// =======================
const G = id => document.getElementById(id);
const num = id => parseFloat(G(id).value) || 0;

G("inv-calc-btn").addEventListener("click", calcInvest);


// =======================
// MAIN CALC
// =======================
function calcInvest() {
  const start = num("inv_amount");
  const pctMonth = num("inv_pct") / 100;      // monthly %
  const months = num("inv_months");

  const reinvEvery = parseInt(G("inv_reinvest_period").value); // 0/1/3/6/12
  const reinvValue = num("inv_reinvest_value");

  const addMonthly = num("inv_add");
  const withdrawMonthly = num("inv_withdraw");

  let aprBal = start;
  let apyBal = start;

  const logs = [];

  for (let m = 1; m <= months; m++) {

    // ===== APR (simple % each month) =====
    aprBal += aprBal * pctMonth;
    aprBal += addMonthly;
    aprBal -= withdrawMonthly;

    if (reinvEvery > 0 && m % reinvEvery === 0) {
      aprBal += reinvValue;  // external top-up
    }

    // ===== APY (monthly compounding) =====
    apyBal *= (1 + pctMonth);
    apyBal += addMonthly;
    apyBal -= withdrawMonthly;

    if (reinvEvery > 0 && m % reinvEvery === 0) {
      apyBal += reinvValue; // external top-up
    }

    logs.push({
      m,
      apr: aprBal,
      apy: apyBal
    });
  }

  const roiAPR = ((aprBal - start) / start) * 100;
  const roiAPY = ((apyBal - start) / start) * 100;

  renderResult(start, aprBal, apyBal, roiAPR, roiAPY, logs);
  drawChart(logs);
}


// =======================
// RESULT OUTPUT
// =======================
function renderResult(start, aprFinal, apyFinal, roiAPR, roiAPY, logs) {
  G("inv-result").innerHTML = `
    <div class="result-grid">

      <div class="res-item">
        <div class="res-icon">S</div>
        <div class="res-content">
          <span class="res-label">Start</span>
          <span class="res-value">${start.toFixed(2)}$</span>
        </div>
      </div>

      <div class="res-item">
        <div class="res-icon">A</div>
        <div class="res-content">
          <span class="res-label">Final APR</span>
          <span class="res-value">${aprFinal.toFixed(2)}$</span>
        </div>
      </div>

      <div class="res-item">
        <div class="res-icon">Y</div>
        <div class="res-content">
          <span class="res-label">Final APY</span>
          <span class="res-value green">${apyFinal.toFixed(2)}$</span>
        </div>
      </div>

      <div class="res-item">
        <div class="res-icon">%</div>
        <div class="res-content">
          <span class="res-label">ROI APR</span>
          <span class="res-value">${roiAPR.toFixed(2)}%</span>
        </div>
      </div>

      <div class="res-item">
        <div class="res-icon">%</div>
        <div class="res-content">
          <span class="res-label">ROI APY</span>
          <span class="res-value green">${roiAPY.toFixed(2)}%</span>
        </div>
      </div>

    </div>
  `;
}


// =======================
// COMPACT SVG CHART
// =======================
function drawChart(logs) {
  const box = G("inv-chart");
  box.innerHTML = "";

  if (!logs.length) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("viewBox", "0 0 360 140");
  svg.style.width = "100%";

  const values = logs.map(l => l.apy);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = i => 20 + (i / (logs.length - 1)) * 320;
  const y = v => 120 - ((v - min) / span) * 100;

  let d = "";
  logs.forEach((row, i) => {
    const px = x(i);
    const py = y(row.apy);
    d += (i === 0 ? "M" : "L") + px + " " + py + " ";
  });

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", d);
  path.setAttribute("stroke", "#4bb8ff");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("fill", "none");

  svg.appendChild(path);
  box.appendChild(svg);
}
