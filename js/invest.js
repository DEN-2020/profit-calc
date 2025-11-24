// DOM READY v=8
document.addEventListener("DOMContentLoaded", () => {

  // -----------------------------
  // ONLINE BADGE
  // -----------------------------
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


  // -----------------------------
  // HELPERS
  // -----------------------------
  const G = (id) => document.getElementById(id);
  const num = (id) => parseFloat(G(id)?.value || 0);


  // -----------------------------
  // BUTTON
  // -----------------------------
  G("inv-calc-btn")?.addEventListener("click", () => {
    try {
      calcInvest();
    } catch (e) {
      console.error(e);
      G("inv-result").innerHTML = `<div class="error">JS Error: ${e.message}</div>`;
    }
  });


  // ============================================================
  // MAIN CALCULATION (КОМПОУНДИНГ + РЕИНВЕСТ)
  // ============================================================
  function calcInvest() {
    const start = num("inv_amount");
    const pct = num("inv_pct") / 100;
    const months = num("inv_months");

    const reinvEvery = parseInt(G("inv_reinvest_period").value) || 0;
    const reinvValue = num("inv_reinvest_value");

    if (!start || !pct || !months) {
      G("inv-result").innerHTML = "<div class='error'>Fill the fields</div>";
      G("inv-chart").innerHTML = "";
      return;
    }

    let balance = start;
    let totalInvested = start;

    const logs = [];

    for (let m = 1; m <= months; m++) {
      const profit = balance * pct;
      balance += profit;

      if (reinvEvery > 0 && reinvValue > 0 && m % reinvEvery === 0) {
        balance += reinvValue;
        totalInvested += reinvValue;
      }

      logs.push({ m, balance, profit });
    }

    const finalBalance = balance;
    const totalProfit = finalBalance - totalInvested;

    // проценты
    const percentTotal = (totalProfit / totalInvested) * 100;
    const percentMonthly = pct * 100;
    const percentYearly = (Math.pow(1 + pct, 12) - 1) * 100;

    renderResult({
      start,
      totalInvested,
      finalBalance,
      totalProfit,
      percentTotal,
      percentMonthly,
      percentYearly,
      month6: logs.find(x => x.m === 6)?.balance || start,
      lastMonthProfit: logs.at(-1).profit,
      logs
    });

    drawChart(logs);
  }


  // ============================================================
  // RENDER BLOCK
  // ============================================================
  function renderResult(d) {
    G("inv-result").innerHTML = `
      <div class="result-grid">

        <div class="res-item"><div class="res-icon">S</div>
          <div class="res-content"><span>Initial</span>
          <span class="res-value">${d.start.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">Σ</div>
          <div class="res-content"><span>Total invested</span>
          <span class="res-value">${d.totalInvested.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">F</div>
          <div class="res-content"><span>Final balance</span>
          <span class="res-value">${d.finalBalance.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">P</div>
          <div class="res-content"><span>Total profit</span>
          <span class="res-value green">${d.totalProfit.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">%</div>
          <div class="res-content"><span>Total ROI</span>
          <span class="res-value">${d.percentTotal.toFixed(2)}%</span></div>
        </div>

        <div class="res-item"><div class="res-icon">M</div>
          <div class="res-content"><span>Per month</span>
          <span class="res-value">${d.percentMonthly.toFixed(2)}%</span></div>
        </div>

        <div class="res-item"><div class="res-icon">Y</div>
          <div class="res-content"><span>Per year (APY)</span>
          <span class="res-value">${d.percentYearly.toFixed(2)}%</span></div>
        </div>

        <div class="res-item"><div class="res-icon">6</div>
          <div class="res-content"><span>At month 6</span>
          <span class="res-value">${d.month6.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">$</div>
          <div class="res-content"><span>Last month profit</span>
          <span class="res-value">${d.lastMonthProfit.toFixed(2)}$</span></div>
        </div>

      </div>
    `;
  }


  // ============================================================
  // CHART WITH LABELS, POINTS, MIN/MAX
  // ============================================================
  function drawChart(logs) {
    const box = G("inv-chart");
    box.innerHTML = "";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 380 190");
    svg.style.width = "100%";

    const vals = logs.map(l => l.balance);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;

    // Y axis labels
    const txtMin = document.createElementNS(svgNS, "text");
    txtMin.setAttribute("x", "0");
    txtMin.setAttribute("y", "180");
    txtMin.setAttribute("fill", "#888");
    txtMin.setAttribute("font-size", "10");
    txtMin.textContent = min.toFixed(2) + "$";
    svg.appendChild(txtMin);

    const txtMax = document.createElementNS(svgNS, "text");
    txtMax.setAttribute("x", "0");
    txtMax.setAttribute("y", "20");
    txtMax.setAttribute("fill", "#888");
    txtMax.setAttribute("font-size", "10");
    txtMax.textContent = max.toFixed(2) + "$";
    svg.appendChild(txtMax);

    // Path
    let d = "";
    logs.forEach((r, i) => {
      const x = 40 + (i / (logs.length - 1)) * 320;
      const y = 160 - ((r.balance - min) / span) * 120;
      d += `${i === 0 ? "M" : "L"}${x},${y} `;
    });

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", "#4bb8ff");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    svg.appendChild(path);

    // Points
    logs.forEach((r, i) => {
      const x = 40 + (i / (logs.length - 1)) * 320;
      const y = 160 - ((r.balance - min) / span) * 120;

      const dot = document.createElementNS(svgNS, "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", 3);
      dot.setAttribute("fill", "#4bb8ff");
      svg.appendChild(dot);
    });

    box.appendChild(svg);
  }

});
