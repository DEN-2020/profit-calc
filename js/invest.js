// Всё оборачиваем в DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {

  // =======================
  // ONLINE / OFFLINE BADGE
  // =======================
  function updateOnlineStatus() {
    const el = document.getElementById("offline-indicator");
    if (!el) return;

    if (navigator.onLine) {
      el.classList.remove("offline");
      el.classList.add("online");
      el.textContent = "Online";
    } else {
      el.classList.remove("online");
      el.classList.add("offline");
      el.textContent = "Offline";
    }
  }
  updateOnlineStatus();
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  // =======================
  // HELPERS
  // =======================
  const G = (id) => document.getElementById(id);
  const num = (id) => parseFloat(G(id)?.value || 0);

  G("inv-calc-btn")?.addEventListener("click", () => {
    try {
      calcInvest();
    } catch (e) {
      console.error(e);
      G("inv-result").innerHTML = `<div class="error">JS Error: ${e.message}</div>`;
    }
  });

  // =======================
  // MAIN CALC
  // =======================
  function calcInvest() {
    const start = num("inv_amount");
    const pctMonth = num("inv_pct") / 100;
    const months = num("inv_months");

    const reinvEvery = parseInt(G("inv_reinvest_period").value) || 0;
    const reinvValue = num("inv_reinvest_value");

    if (!start || !pctMonth || !months) {
      G("inv-result").innerHTML = "<div class='error'>Fill amount, % and months.</div>";
      G("inv-chart").innerHTML = "";
      return;
    }

    // APR (simple)
    let principalAPR = start;
    let profitAPR = 0;

    // APY (compound)
    let balAPY = start;

    let reinvEvents = 0;
    let logs = [];

    for (let m = 1; m <= months; m++) {
      // APR
      const monthAPR = principalAPR * pctMonth;
      profitAPR += monthAPR;
      const totalAPR = principalAPR + profitAPR;

      // APY
      const monthAPY = balAPY * pctMonth;
      balAPY += monthAPY;

      // Top-up (external)
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
        monthAPY,
      });
    }

    const totalInvested = start + reinvEvents * reinvValue;
    const finalAPR = logs.at(-1).apr;
    const finalAPY = logs.at(-1).apy;

    const profitAPR = finalAPR - totalInvested;
    const profitAPY = finalAPY - totalInvested;

    renderResult({
      start,
      totalInvested,
      finalAPR,
      finalAPY,
      profitAPR,
      profitAPY,
      logs,
    });

    drawChart(logs);
  }

  // =======================
  // RESULT OUTPUT
  // =======================
  function renderResult(d) {
    const mid = d.logs.find((r) => r.m === 6) || d.logs[0];

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

        <div class="res-item"><div class="res-icon">A</div>
          <div class="res-content"><span class="res-label">Final APR</span>
          <span class="res-value">${d.finalAPR.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">Y</div>
          <div class="res-content"><span class="res-label">Final APY</span>
          <span class="res-value green">${d.finalAPY.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">P</div>
          <div class="res-content"><span class="res-label">APR profit</span>
          <span class="res-value">${d.profitAPR.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">P</div>
          <div class="res-content"><span class="res-label">APY profit</span>
          <span class="res-value green">${d.profitAPY.toFixed(2)}$</span></div>
        </div>

        <div class="res-item"><div class="res-icon">M</div>
          <div class="res-content"><span class="res-label">Month 6 (APY)</span>
          <span class="res-value">${mid.apy.toFixed(2)}$</span></div>
        </div>

      </div>
    `;
  }

  // =======================
  // CHART
  // =======================
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

    const x = (i) => 20 + (i / (logs.length - 1)) * 320;
    const y = (v) => 120 - ((v - min) / span) * 100;

    let d = "";
    logs.forEach((r, i) => {
      d += `${i === 0 ? "M" : "L"}${x(i)},${y(r.apy)} `;
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
