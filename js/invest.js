// ===== Short helpers =====
const G  = id => document.getElementById(id);
const num = id => parseFloat(G(id).value) || 0;

G("inv-calc-btn").addEventListener("click", calcInvest);


// ===== Main =====
function calcInvest() {
  const amount = num("inv_amount");
  const pctMonth = num("inv_pct") / 100;
  const months = num("inv_months");

  const capFreq   = parseInt(G("inv_freq").value); // капитализация (0/1/90/180/365)
  const reinvPeriod = parseInt(G("inv_reinvest_period").value); // 0/1/3/6/12
  const reinvType   = G("inv_reinvest_type").value;
  const reinvVal    = num("inv_reinvest_value"); // % или $ в зависимости от типа

  let balance = amount;           // APY model
  let balanceSimple = amount;     // APR model

  const logs = [];

  const daily = pctMonth / 30;

  for (let m = 1; m <= months; m++) {

    // --- APR (simple interest) ---
    const profitSimple = balanceSimple * pctMonth;
    balanceSimple += profitSimple;

    // --- APY (compounding) ---
    if (capFreq === 30) {
      // monthly compounding
      const profit = balance * pctMonth;
      balance += profit;

    } else if (capFreq === 1) {
      // daily compounding
      for (let d = 0; d < 30; d++) {
        balance *= (1 + daily);
      }

    } else if (capFreq === 0) {
      // no compounding
      balance += balance * pctMonth;

    } else {
      // period compounding (90/180/365)
      const profit = balance * pctMonth;
      if ((m * 30) % capFreq === 0) {
        balance += profit;
      }
    }

    // --- REINVEST logic ---
    if (reinvPeriod > 0 && m % reinvPeriod === 0) {
      if (reinvType === "profit_full") {
        // add the profit of the period
        const profit = balance * pctMonth * reinvPeriod;
        balance += profit;

      } else if (reinvType === "profit_percent") {
        const profit = balance * pctMonth * reinvPeriod;
        balance += profit * (reinvVal / 100);

      } else if (reinvType === "fixed_amount") {
        balance += reinvVal;

      }
    }

    logs.push({
      m,
      simple: balanceSimple,
      compound: balance
    });
  }

  const roiS = ((balanceSimple - amount) / amount) * 100;
  const roiC = ((balance - amount) / amount) * 100;

  renderResult(amount, balanceSimple, balance, roiS, roiC, logs);
  drawChart(logs);
}


// ====== Result UI ======
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
        <div class="res-icon">%</</div>
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
  `;
}


// ====== Chart (compact, fixed) ======
function drawChart(logs) {
  const box = G("inv-chart");
  box.innerHTML = "";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("viewBox", "0 0 360 150");
  svg.style.width = "100%";

  const values = logs.map(l => l.compound);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const span = maxVal - minVal || 1;

  const x = i => 20 + (i / (logs.length - 1)) * 320;
  const y = v => 130 - ((v - minVal) / span) * 100;

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
