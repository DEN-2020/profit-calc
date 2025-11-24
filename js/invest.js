// DOM READY v=11 (fixed logic + improved chart + correct reinvest)
document.addEventListener("DOMContentLoaded", () => {

  // ONLINE BADGE
  function updateOnlineStatus() {
    const el = document.getElementById("offline-indicator");
    if (!el) return;
    el.textContent = navigator.onLine ? "Online" : "Offline";
    el.classList.toggle("online", navigator.onLine);
    el.classList.toggle("offline", !navigator.onLine);
  }
  updateOnlineStatus();
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  // HELPERS
  const G = (id) => document.getElementById(id);
  const num = (id) => parseFloat(G(id)?.value || 0);

  G("inv-calc-btn").addEventListener("click", () => {
    try {
      calcInvest();
    } catch (e) {
      console.error(e);
      G("inv-result").innerHTML = `<div class="error">${e.message}</div>`;
    }
  });

  // ============================
  // MAIN CALCULATION
  // ============================
  function calcInvest() {
    const start = num("inv_amount");
    const pct = num("inv_pct") / 100;
    const months = num("inv_months");

    const reinvEvery = parseInt(G("inv_reinvest_period").value) || 0;
    const reinvValue = num("inv_reinvest_value");

    if (!start || !pct || !months) {
      G("inv-result").innerHTML = "<div class='error'>Fill the fields</div>";
      return;
    }

    let balance = start;
    let totalInvested = start;

    const logs = [];

    for (let m = 1; m <= months; m++) {

      // 1) прибыль месяца
      const profit = balance * pct;
      balance += profit;

      // 2) ре-инвест (внешние деньги)
      if (reinvEvery > 0 && reinvValue > 0 && m % reinvEvery === 0) {
        balance += reinvValue;
        totalInvested += reinvValue;
      }

      logs.push({ m, balance, profit });
    }

    const finalBalance = balance;
    const totalProfit = finalBalance - totalInvested;

    renderResult({
      start,
      months,
      reinvEvery,
      reinvValue,
      totalInvested,
      finalBalance,
      totalProfit,
      lastMonthProfit: logs.at(-1).profit,
      logs
    });

    drawChart(logs);
  }

  // ============================
  // RESULT PANEL
  // ============================
  function renderResult(d) {

    const reinfText =
      d.reinvEvery > 0 && d.reinvValue > 0
        ? `+${d.reinvValue}$ every ${d.reinvEvery} months`
        : "No reinvest";

    const monthlyAPR = d.start * (num("inv_pct") / 100); // фиксированный
    const profitPeriod = d.finalBalance - d.start;

    G("inv-result").innerHTML = `
      <div class="result-grid">

        <div class="res-item"><div class="res-icon">S</div>
          <div class="res-content"><span>Initial</span>
          <span class="res-value">${d.start.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">Σ</div>
          <div class="res-content"><span>Total Invested</span>
          <span class="res-value">${d.totalInvested.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">F</div>
          <div class="res-content"><span>Final Balance</span>
          <span class="res-value">${d.finalBalance.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">P</div>
          <div class="res-content"><span>Total Profit</span>
          <span class="res-value green">${d.totalProfit.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">M</div>
          <div class="res-content"><span>Profit per month</span>
          <span class="res-value">${monthlyAPR.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">R</div>
          <div class="res-content"><span>Reinvest</span>
          <span class="res-value">${reinfText}</span></div>
        </div>

        <div class="res-item"><div class="res-icon">📈</div>
          <div class="res-content"><span>Profit for period</span>
          <span class="res-value">${profitPeriod.toFixed(2)}$</span></div>
        </div>

      </div>
    `;
  }

  // ============================
  // SVG CHART (improved)
  // ============================
  function drawChart(logs) {
    const box = G("inv-chart");
    box.innerHTML = "";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 420 200");
    svg.style.width = "100%";

    const vals = logs.map(x => x.balance);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;

    // линия
    let pathD = "";
    logs.forEach((r, i) => {
      const x = 40 + (i / (logs.length - 1)) * 340;
      const y = 160 - ((r.balance - min) / span) * 120;
      pathD += `${i === 0 ? "M" : "L"}${x},${y} `;
    });

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathD);
    path.setAttribute("stroke", "#4bb8ff");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");

    svg.appendChild(path);

    // подписи min/max
    const labelMin = document.createElementNS(svgNS, "text");
    labelMin.setAttribute("x", 5);
    labelMin.setAttribute("y", 165);
    labelMin.setAttribute("fill", "#888");
    labelMin.textContent = min.toFixed(0);

    const labelMax = document.createElementNS(svgNS, "text");
    labelMax.setAttribute("x", 5);
    labelMax.setAttribute("y", 40);
    labelMax.setAttribute("fill", "#888");
    labelMax.textContent = max.toFixed(0);

    svg.appendChild(labelMin);
    svg.appendChild(labelMax);

    // подписи месяцев
    logs.forEach((r, i) => {
      if (i % 3 === 0) {
        const tx = document.createElementNS(svgNS, "text");
        tx.setAttribute("x", 40 + (i / (logs.length - 1)) * 340);
        tx.setAttribute("y", 180);
        tx.setAttribute("font-size", "10");
        tx.setAttribute("fill", "#aaa");
        tx.textContent = r.m;
        svg.appendChild(tx);
      }
    });

    box.appendChild(svg);
  }

});
