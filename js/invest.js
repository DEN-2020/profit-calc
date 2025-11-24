// DOM READY v6 — simple monthly % calculator (NO APY)
document.addEventListener("DOMContentLoaded", () => {

  // --------------------------
  // ONLINE INDICATOR
  // --------------------------
  function updateOnlineStatus() {
    const el = document.getElementById("offline-indicator");
    if (el) {
      el.textContent = navigator.onLine ? "Online" : "Offline";
      el.classList.toggle("online", navigator.onLine);
      el.classList.toggle("offline", !navigator.onLine);
    }
  }
  updateOnlineStatus();
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  // --------------------------
  // HELPERS
  // --------------------------
  const G = (id) => document.getElementById(id);
  const num = (id) => parseFloat(G(id)?.value || 0);

  G("inv-calc-btn")?.addEventListener("click", calcInvest);



  // ====================================================
  // MAIN LOGIC — EXACTLY LIKE YOUR PHONE EXAMPLE
  // ====================================================
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
    let totalInvested = start;
    let totalProfit = 0;

    const logs = [];

    for (let m = 1; m <= months; m++) {

      // -------- MONTHLY PROFIT (simple)
      const profit = balance * pct;

      balance += profit;
      totalProfit += profit;

      // -------- REINVEST HANDLER
      if (reinvEvery > 0 && reinvValue > 0 && m % reinvEvery === 0) {
        balance += reinvValue;
        totalInvested += reinvValue;
      }

      logs.push({
        m,
        balance: balance,
        profit: profit
      });
    }


    renderResult({
      start,
      totalInvested,
      finalBalance: balance,
      totalProfit,
      first6: logs[5]?.balance || logs.at(-1).balance,
      profitPerMonth: balance - balance / (1 + pct) // last month's profit
    });

    drawChart(logs);
  }



  // ====================================================
  // RESULT OUTPUT
  // ====================================================
  function renderResult(d) {

    G("inv-result").innerHTML = `
      <div class="result-grid">

        <div class="res-item">
          <div class="res-icon">S</div>
          <div class="res-content">
            <span>Initial</span>
            <span class="res-value">${d.start.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">Σ</div>
          <div class="res-content">
            <span>Total invested</span>
            <span class="res-value">${d.totalInvested.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">F</div>
          <div class="res-content">
            <span>Final balance</span>
            <span class="res-value">${d.finalBalance.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">P</div>
          <div class="res-content">
            <span>Total profit</span>
            <span class="res-value green">${d.totalProfit.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">6</div>
          <div class="res-content">
            <span>At month 6</span>
            <span class="res-value">${d.first6.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">$</div>
          <div class="res-content">
            <span>Last month profit</span>
            <span class="res-value">${(d.finalBalance * (num("inv_pct") / 100)).toFixed(2)}$</span>
          </div>
        </div>

      </div>
    `;
  }



  // ====================================================
  // SVG LINE CHART (simple)
  // ====================================================
  function drawChart(logs) {
    const box = G("inv-chart");
    box.innerHTML = "";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 360 150");
    svg.style.width = "100%";

    const values = logs.map((l) => l.balance);
    const min = Math.min(...values);
    const max = Math.max(...values);
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
