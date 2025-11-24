// DOM READY v=10 (fixed reinvest + correct monthly compounding)
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
      G("inv-result").innerHTML = `<div class="error">JS Error: ${e.message}</div>`;
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
      G("inv-chart").innerHTML = "";
      return;
    }

    let balance = start;
    let totalInvested = start;

    const logs = [];

    for (let m = 1; m <= months; m++) {

      // 1) прибыль месяца
      const profit = balance * pct;

      // 2) добавляем прибыль
      balance += profit;

      // 3) если настало время добавлять внешние деньги
      if (reinvEvery > 0 && reinvValue > 0 && m % reinvEvery === 0) {
        balance += reinvValue;
        totalInvested += reinvValue;
      }

      logs.push({
        m,
        balance,
        profit
      });
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
      month6: logs.find(x => x.m === 6)?.balance || start,
      logs
    });

    drawChart(logs);
  }

  // ============================
  // RESULT
  // ============================
  function renderResult(d) {

    const reinfText =
      d.reinvEvery > 0 && d.reinvValue > 0
        ? `Every ${d.reinvEvery} months: +${d.reinvValue}$`
        : "No reinvest";

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

        <div class="res-item"><div class="res-icon">6</div>
          <div class="res-content"><span>At month 6</span>
          <span class="res-value">${d.month6.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">$</div>
          <div class="res-content"><span>Last month profit</span>
          <span class="res-value">${d.lastMonthProfit.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">R</div>
          <div class="res-content"><span>Reinvest</span>
          <span class="res-value">${reinfText}</span></div>
        </div>

      </div>
    `;
  }

  // ============================
  // SVG CHART
  // ============================
  function drawChart(logs) {
    const box = G("inv-chart");
    box.innerHTML = "";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 400 180");
    svg.style.width = "100%";

    const vals = logs.map(x => x.balance);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;

    let pathD = "";
    logs.forEach((r, i) => {
      const x = 30 + (i / (logs.length - 1)) * 340;
      const y = 150 - ((r.balance - min) / span) * 120;
      pathD += `${i === 0 ? "M" : "L"}${x},${y} `;
    });

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathD);
    path.setAttribute("stroke", "#4bb8ff");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");

    svg.appendChild(path);

    // min/max labels
    const minText = document.createElementNS(svgNS, "text");
    minText.setAttribute("x", 5);
    minText.setAttribute("y", 150);
    minText.setAttribute("fill", "#888");
    minText.setAttribute("font-size", "10");
    minText.textContent = min.toFixed(0);

    const maxText = document.createElementNS(svgNS, "text");
    maxText.setAttribute("x", 5);
    maxText.setAttribute("y", 30);
    maxText.setAttribute("fill", "#888");
    maxText.setAttribute("font-size", "10");
    maxText.textContent = max.toFixed(0);

    svg.appendChild(minText);
    svg.appendChild(maxText);

    box.appendChild(svg);
  }

});
