// DOM READY v=4
document.addEventListener("DOMContentLoaded", () => {

  // ONLINE INDICATOR
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

  // MAIN CALC
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

    let principalAPR = start;
    let profitAPR = 0;
    let balAPY = start;

    let reinvEvents = 0;
    const logs = [];

    for (let m = 1; m <= months; m++) {
      const monthAPR = principalAPR * pct;
      profitAPR += monthAPR;
      const totalAPR = principalAPR + profitAPR;

      const monthAPY = balAPY * pct;
      balAPY += monthAPY;

      if (reinvEvery > 0 && reinvValue > 0 && m % reinvEvery === 0) {
        principalAPR += reinvValue;
        balAPY += reinvValue;
        reinvEvents++;
      }

      logs.push({
        m,
        apr: totalAPR,
        apy: balAPY,
        monthAPR,
        monthAPY
      });
    }

    const totalInvested = start + reinvEvents * reinvValue;

    renderResult({
      start,
      totalInvested,
      finalAPR: logs.at(-1).apr,
      finalAPY: logs.at(-1).apy,
      profitAPR: logs.at(-1).apr - totalInvested,
      profitAPY: logs.at(-1).apy - totalInvested,
      avgAPR: (logs.at(-1).apr - totalInvested) / months,
      avgAPY: (logs.at(-1).apy - totalInvested) / months,
      logs
    });

    drawChart(logs);
  }

  // RESULT BOX
  function renderResult(d) {
    const mid = d.logs.find((x) => x.m === 6) || d.logs[0];

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

        <div class="res-item"><div class="res-icon">A</div>
          <div class="res-content"><span>Final APR</span>
          <span class="res-value">${d.finalAPR.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">Y</div>
          <div class="res-content"><span>Final APY</span>
          <span class="res-value green">${d.finalAPY.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">$</div>
          <div class="res-content"><span>Monthly APR profit</span>
          <span class="res-value">${d.avgAPR.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">$</div>
          <div class="res-content"><span>Monthly APY profit</span>
          <span class="res-value green">${d.avgAPY.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">M</div>
          <div class="res-content"><span>Month 6 (APY)</span>
          <span class="res-value">${mid.apy.toFixed(2)}$</span></div>
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

    const vals = logs.map((l) => l.apy);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;

    let d = "";
    logs.forEach((r, i) => {
      const x = 20 + (i / (logs.length - 1)) * 320;
      const y = 120 - ((r.apy - min) / span) * 100;
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
