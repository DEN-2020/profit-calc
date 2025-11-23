// =====================
// Helpers
// =====================
const G = id => document.getElementById(id);
const num = id => parseFloat(G(id).value) || 0;

G("inv-calc-btn").addEventListener("click", calcInvest);

// =====================
// Correct Investment Engine
// =====================
function calcInvest() {
  const start = num("inv_amount");
  const pctMonth = num("inv_pct") / 100;    // monthly %
  const months = num("inv_months");

  const capFreq = parseInt(G("inv_freq").value);  // 0/1/30/90/180/365
  const reinvPeriod = parseInt(G("inv_reinvest_period").value); 
  const reinvType = G("inv_reinvest_type").value;
  const reinvVal = num("inv_reinvest_value");

 let apr = start;
let apy = start;

let aprBase = start; // APR всегда считает от начального депозита

for (let m = 1; m <= months; m++) {

    // --- APR (simple) ---
    apr = aprBase + aprBase * pctMonth * m;


    // --- APY (compound) ---
    if (capFreq === 0) {
        // no compounding — тело НЕ растёт
        // apy не меняем тут
    }

    else if (capFreq === 1) {
        // daily compounding (30 days)
        for (let d = 0; d < 30; d++) {
            apy *= (1 + dailyRate);
        }
    }

    else if (capFreq === 30) {
        // monthly compounding
        apy *= (1 + pctMonth);
    }

    else {
        // period compounding 90/180/365
        if ((m * 30) % capFreq === 0) {
            apy *= (1 + pctMonth);
        }
    }

    // --- REINVEST — только увеличивает тело ---
    if (reinvPeriod > 0 && m % reinvPeriod === 0) {
        let monthlyProfit = apy * pctMonth * reinvPeriod;

        if (reinvType === "profit_full") {
            apy += monthlyProfit;

        } else if (reinvType === "profit_percent") {
            apy += monthlyProfit * (reinvVal / 100);

        } else if (reinvType === "fixed_amount") {
            apy += reinvVal;
        }
    }

    logs.push({ m, apr, apy });
}

  const roiApr = ((apr - start) / start) * 100;
  const roiApy = ((apy - start) / start) * 100;

  renderResult(start, apr, apy, roiApr, roiApy);
  drawChart(logs);
}

// =======================
// Result UI
// =======================
function renderResult(start, fs, fc, rs, rc) {
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
          <span class="res-value">${fs.toFixed(2)}$</span>
        </div>
      </div>

      <div class="res-item">
        <div class="res-icon">Y</div>
        <div class="res-content">
          <span class="res-label">Final APY</span>
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
  `;
}

// =======================
// Chart
// =======================
function drawChart(logs) {
  const box = G("inv-chart");
  box.innerHTML = "";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("viewBox", "0 0 360 150");
  svg.style.width = "100%";

  const values = logs.map(l => l.apy);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = maxV - minV || 1;

  const x = i => 20 + (i / (logs.length - 1)) * 320;
  const y = v => 130 - ((v - minV) / span) * 100;

  let p = "";
  logs.forEach((r, i) => {
    p += (i === 0 ? "M" : "L") + x(i) + " " + y(r.apy) + " ";
  });

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", p);
  path.setAttribute("stroke", "#4bb8ff");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-width", "2");

  svg.appendChild(path);
  box.appendChild(svg);
}
