// ===========================
// SIMPLE INVESTMENT CALCULATOR
// ===========================

// helpers
const G = id => document.getElementById(id);
const num = id => parseFloat(G(id).value) || 0;

G("inv-calc-btn").addEventListener("click", calcInvest);

function calcInvest() {
    const amount = num("inv_amount");          // стартовый депозит
    const pct = num("inv_pct") / 100;          // % в месяц
    const months = num("inv_months");          // срок
    const reinvPeriod = parseInt(G("inv_reinvest_period").value); // 0/1/3/6/12
    const reinvAmount = num("inv_reinvest_value"); // сколько добавлять

    let balance = amount;
    const logs = [];

    for (let m = 1; m <= months; m++) {

        // прибыль за месяц
        const profit = balance * pct;
        balance += profit;

        // ручной реинвест / долив — если указан период
        if (reinvPeriod > 0 && m % reinvPeriod === 0) {
            balance += reinvAmount;
        }

        logs.push({
            m,
            balance: balance,
            profit: profit
        });
    }

    const final = balance;
    const roi = ((final - amount) / amount) * 100;

    renderResult(amount, final, roi, logs);
    drawChart(logs);
}


// ===========================
// RESULT BLOCK
// ===========================

function renderResult(start, final, roi, logs) {
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
          <div class="res-icon">F</div>
          <div class="res-content">
            <span class="res-label">Final balance</span>
            <span class="res-value green">${final.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">%</div>
          <div class="res-content">
            <span class="res-label">ROI</span>
            <span class="res-value">${roi.toFixed(2)}%</span>
          </div>
        </div>

      </div>

      <div class="inv-table">
        ${logs.slice(-6).map(r => `
          <div class="inv-row">
            <span>Month ${r.m}</span>
            <span>${r.balance.toFixed(2)}$</span>
          </div>
        `).join("")}
      </div>
    `;
}


// ===========================
// SIMPLE LINE CHART
// ===========================

function drawChart(logs) {
    const box = G("inv-chart");
    box.innerHTML = "";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");

    svg.setAttribute("viewBox", "0 0 360 150");
    svg.style.width = "100%";

    const values = logs.map(l => l.balance);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const span = maxVal - minVal || 1;

    const x = i => 20 + (i / (logs.length - 1)) * 320;
    const y = v => 130 - ((v - minVal) / span) * 100;

    let path = "";

    logs.forEach((v, i) => {
        path += (i === 0 ? "M" : "L") + x(i) + " " + y(v.balance) + " ";
    });

    const line = document.createElementNS(svgNS, "path");
    line.setAttribute("d", path);
    line.setAttribute("stroke", "#4bb8ff");
    line.setAttribute("fill", "none");
    line.setAttribute("stroke-width", "2");

    svg.appendChild(line);
    box.appendChild(svg);
}
