// Short helpers
const G = id => document.getElementById(id);
const num = id => parseFloat(G(id).value) || 0;

G("inv-calc-btn").addEventListener("click", calcInvest);

function calcInvest() {
  const amount = num("inv_amount");
  const pct = num("inv_pct") / 100;
  const months = num("inv_months");
  const freq = parseInt(G("inv_freq").value);
  const type = G("inv_type").value;
  const add = num("inv_add");
  const wd  = num("inv_withdraw");

  let balance = amount;
  let balanceSimple = amount;

  let logs = [];

  // daily rate for APY-compound internal math
  const dailyPct = pct / 30;

  for (let m = 1; m <= months; m++) {
    // SIMPLE APR (no compounding)
    const profitSimple = balanceSimple * pct;
    balanceSimple += profitSimple + add - wd;

    // COMPOUND (APY / flexible reinvest)
    let profit;

    if (type === "simple") {
      profit = balance * pct;
      balance += profit + add - wd;

    } else {
      // daily compounding OR period compounding
      if (freq === 0) {
        // no reinvest
        profit = balance * pct;
        balance += profit + add - wd;

      } else if (freq === 1) {
        // daily APY
        for (let d = 0; d < 30; d++) {
          balance *= (1 + dailyPct);
        }
        balance += add - wd;

      } else {
        // period compounding (30/90/180/365)
        profit = balance * pct;

        if (m * 30 % freq === 0) {
          balance += profit;
        }

        balance += add - wd;
      }
    }

    logs.push({ m, simple: balanceSimple, compound: balance });
  }

  const finalSimple = balanceSimple;
  const finalComp = balance;

  const roiSimple = ((finalSimple - amount) / amount) * 100;
  const roiComp = ((finalComp - amount) / amount) * 100;

  renderResult(amount, finalSimple, finalComp, roiSimple, roiComp, logs);
  drawChart(logs);
}

function renderResult(start, fs, fc, rs, rc, logs) {
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
        <span class="res-label">Final (APR)</span>
        <span class="res-value">${fs.toFixed(2)}$</span>
      </div>
    </div>

    <div class="res-item">
      <div class="res-icon">Y</div>
      <div class="res-content">
        <span class="res-label">Final (APY)</span>
        <span class="res-value green">${fc.toFixed(2)}$</span>
      </div>
    </div>

    <div class="res-item">
      <div class="res-icon">%</div>
      <div class="res-content">
        <span class="res-label">ROI APR</span>
        <span class="res-value">${rs.toFixed(2)}%</span>
      </div>
    </div>

    <div class="res-item">
      <div class="res-icon">%</div>
      <div class="res-content">
        <span class="res-label">ROI APY</span>
        <span class="res-value green">${rc.toFixed(2)}%</span>
      </div>
    </div>

  </div>

  <div class="inv-table">
    ${logs.slice(-6).map(r => `
      <div class="inv-row">
        <span>Month ${r.m}</span>
        <span>${r.compound.toFixed(2)}$</span>
      </div>
    `).join("")}
  </div>
  `;
}

function drawChart(logs) {
  const box = G("inv-chart");
  box.innerHTML = "";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("viewBox", "0 0 360 180");
  svg.style.width = "100%";

  const values = logs.map(l => l.compound);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const span = maxVal - minVal || 1;

  const x = i => 20 + (i / (logs.length - 1)) * 320;
  const y = v => 150 - ((v - minVal) / span) * 120;

  let path = "";

  logs.forEach((v, i) => {
    path += (i === 0 ? "M" : "L") + x(i) + " " + y(v.compound) + " ";
  });

  const line = document.createElementNS(svgNS, "path");
  line.setAttribute("d", path);
  line.setAttribute("stroke", "#4bb8ff");
  line.setAttribute("fill", "none");
  line.setAttribute("stroke-width", "2");

  svg.appendChild(line);
  box.appendChild(svg);
}
