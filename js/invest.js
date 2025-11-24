// Investment Calc — clean version v5
document.addEventListener("DOMContentLoaded", () => {

  // ONLINE STATUS
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

  G("inv-calc-btn")?.addEventListener("click", () => {
    try {
      calcInvest();
    } catch (e) {
      G("inv-result").innerHTML = `<div class="error">JS Error: ${e.message}</div>`;
      console.error(e);
    }
  });

  // MAIN CALC — **NO APY**
  function calcInvest() {
    const start = num("inv_amount");
    const pct = num("inv_pct") / 100;
    const months = num("inv_months");

    const reinvEvery = parseInt(G("inv_reinvest_period").value) || 0;
    const reinvValue = num("inv_reinvest_value");

    if (!start || !pct || !months) {
      G("inv-result").innerHTML = "<div class='error'>Fill all fields</div>";
      G("inv-chart").innerHTML = "";
      return;
    }

    let balance = start;
    let reinvEvents = 0;

    const logs = [];

    for (let m = 1; m <= months; m++) {
      const profit = balance * pct;
      balance += profit;

      if (reinvEvery > 0 && m % reinvEvery === 0) {
        if (reinvValue > 0) {
          balance += reinvValue;
          reinvEvents++;
        }
      }

      logs.push({
        m,
        balance,
        profitMonth: profit
      });
    }

    const totalInvested = start + reinvEvents * reinvValue;
    const finalBalance = logs.at(-1).balance;
    const totalProfit = finalBalance - totalInvested;
    const avgProfit = totalProfit / months;

    renderResult({
      start,
      totalInvested,
      finalBalance,
      totalProfit,
      avgProfit,
      logs
    });

    drawChart(logs);
  }

  // RESULT OUTPUT
  function renderResult(d) {
    const mid = d.logs.find((x) => x.m === 6) || d.logs[0];

    G("inv-result").innerHTML = `
      <div class="result-grid">

        <div class="res-item"><div class="res-icon">S</div>
          <div class="res-content"><span class="res-label">Initial</span>
          <span class="res-value">${d.start.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">Σ</div>
          <div class="res-content"><span class="res-label">Total invested</span>
          <span class="res-value">${d.totalInvested.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">F</div>
          <div class="res-content"><span class="res-label">Final balance</span>
          <span class="res-value">${d.finalBalance.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">P</div>
          <div class="res-content"><span class="res-label">Total profit</span>
          <span class="res-value green">${d.totalProfit.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">$</div>
          <div class="res-content"><span class="res-label">Avg per month</span>
          <span class="res-value">${d.avgProfit.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">6</div>
          <div class="res-content"><span class="res-label">At month ${mid.m}</span>
          <span class="res-value">${mid.balance.toFixed(2)}$</span></div>
        </div>

      </div>`;
  }

  // CHART
  function drawChart(logs) {
    const box = G("inv-chart");
    box.innerHTML = "";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 360 150");
    svg.style.width = "100%";

    const vals = logs.map((l) => l.balance);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;

    let d = "";
    logs.forEach((r, i) => {
      const x = 20 + (i / (logs.length - 1)) * 320;
      const y = 120 - ((r.balance - min) / span) * 100;
      d += `${i === 0 ? "M" : "L"}${x},${y} `;
    });

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", "#4bb8ff");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");

    svg.appendChild(path);
    box.appendChild(svg);
  }

});
