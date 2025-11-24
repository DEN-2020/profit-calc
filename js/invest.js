// Всё оборачиваем в DOMContentLoaded, чтобы точно были элементы
document.addEventListener("DOMContentLoaded", function () {
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

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus(); // первый вызов сразу

  // =======================
  // HELPERS
  // =======================
  const G = (id) => document.getElementById(id);

  const num = (id) => {
    const el = G(id);
    if (!el) return 0;
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : 0;
  };

  const btn = G("inv-calc-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      try {
        calcInvest();
      } catch (e) {
        console.error("Investment calc error:", e);
        const box = G("inv-result");
        if (box) {
          box.innerHTML = `<div class="error">JS error: ${e.message}</div>`;
        }
      }
    });
  }

  // =======================
  // MAIN CALC
  // =======================
  function calcInvest() {
    const start = num("inv_amount");       // начальный депозит
    const pctMonth = num("inv_pct") / 100; // месячный %
    const months = num("inv_months");      // срок в месяцах

    const selReinv = G("inv_reinvest_period");
    if (!selReinv) {
      throw new Error("Select inv_reinvest_period not found");
    }
    const reinvEvery = parseInt(selReinv.value, 10) || 0; // каждые N месяцев
    const reinvValue = num("inv_reinvest_value");         // сумма довноса

    const resultBox = G("inv-result");
    const chartBox = G("inv-chart");

    if (!resultBox || !chartBox) {
      throw new Error("Result or chart container not found");
    }

    if (!start || !pctMonth || !months) {
      resultBox.innerHTML =
        "<div class='error'>Fill amount, monthly % and period.</div>";
      chartBox.innerHTML = "";
      return;
    }

    // --- APR: простые проценты на тело депозита ---
    // principalAPR — тело депозита (initial + все довносы),
    // profitAPR    — накопленная прибыль (можно вывести каждый месяц).
    let principalAPR = start;
    let profitAPR = 0;

    // --- APY: ежемесячная капитализация (проценты сразу плюсуются к телу) ---
    let balAPY = start;

    let reinvEvents = 0; // сколько раз добавляли деньги
    const logs = [];

    for (let m = 1; m <= months; m++) {
      // ===== APR (simple) =====
      const monthProfitAPR = principalAPR * pctMonth;
      profitAPR += monthProfitAPR;
      const totalAPR = principalAPR + profitAPR;

      // ===== APY (monthly compounding) =====
      const monthProfitAPY = balAPY * pctMonth;
      balAPY += monthProfitAPY;

      // ===== внешние довносы (в конце месяца) =====
      if (reinvEvery > 0 && reinvValue > 0 && m % reinvEvery === 0) {
        principalAPR += reinvValue;
        balAPY += reinvValue;
        reinvEvents += 1;
      }

      logs.push({
        m,
        apr: totalAPR,
        apy: balAPY,
        monthProfitAPR,
        monthProfitAPY
      });
    }

    const totalInvested = start + reinvEvents * reinvValue;
    const finalAPR = logs[logs.length - 1].apr;
    const finalAPY = logs[logs.length - 1].apy;

    const profitAPR = finalAPR - totalInvested;
    const profitAPY = finalAPY - totalInvested;

    const roiAPR = totalInvested > 0 ? (profitAPR / totalInvested) * 100 : 0;
    const roiAPY = totalInvested > 0 ? (profitAPY / totalInvested) * 100 : 0;

    // Среднемесячная прибыль (по APR / APY)
    const avgMonthProfitAPR = profitAPR / months;
    const avgMonthProfitAPY = profitAPY / months;

    renderResult({
      start,
      totalInvested,
      finalAPR,
      finalAPY,
      profitAPR,
      profitAPY,
      roiAPR,
      roiAPY,
      avgMonthProfitAPR,
      avgMonthProfitAPY,
      logs
    });
    drawChart(logs);
  }

  // =======================
  // RESULT OUTPUT
  // =======================
  function renderResult(data) {
    const {
      start,
      totalInvested,
      finalAPR,
      finalAPY,
      profitAPR,
      profitAPY,
      roiAPR,
      roiAPY,
      avgMonthProfitAPR,
      avgMonthProfitAPY,
      logs
    } = data;

    const months = logs.length;
    const midMonth = Math.min(6, months);
    const mid = logs.find((r) => r.m === midMonth) || logs[0];

    const resultBox = G("inv-result");
    if (!resultBox) return;

    resultBox.innerHTML = `
      <div class="result-grid">

        <div class="res-item">
          <div class="res-icon">S</div>
          <div class="res-content">
            <span class="res-label">Initial</span>
            <span class="res-value">${start.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">Σ</div>
          <div class="res-content">
            <span class="res-label">Total invested</span>
            <span class="res-value">${totalInvested.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">A</div>
          <div class="res-content">
            <span class="res-label">Final APR</span>
            <span class="res-value">${finalAPR.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">Y</div>
          <div class="res-content">
            <span class="res-label">Final APY</span>
            <span class="res-value green">${finalAPY.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">P</div>
          <div class="res-content">
            <span class="res-label">APR profit</span>
            <span class="res-value">${profitAPR.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">P</div>
          <div class="res-content">
            <span class="res-label">APY profit</span>
            <span class="res-value green">${profitAPY.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">%</div>
          <div class="res-content">
            <span class="res-label">ROI APR</span>
            <span class="res-value">${roiAPR.toFixed(2)}%</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">%</div>
          <div class="res-content">
            <span class="res-label">ROI APY</span>
            <span class="res-value green">${roiAPY.toFixed(2)}%</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">$</div>
          <div class="res-content">
            <span class="res-label">Avg monthly (APR)</span>
            <span class="res-value">${avgMonthProfitAPR.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">$</div>
          <div class="res-content">
            <span class="res-label">Avg monthly (APY)</span>
            <span class="res-value green">${avgMonthProfitAPY.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">M</div>
          <div class="res-content">
            <span class="res-label">Month ${mid.m} (APY)</span>
            <span class="res-value">${mid.apy.toFixed(2)}$</span>
          </div>
        </div>

      </div>
    `;
  }

  // =======================
  // COMPACT SVG CHART (APY)
  // =======================
  function drawChart(logs) {
    const box = G("inv-chart");
    if (!box) return;
    box.innerHTML = "";

    if (!logs.length) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");

    svg.setAttribute("viewBox", "0 0 360 150");
    svg.style.width = "100%";

    const values = logs.map((l) => l.apy);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    const x = (i) => 20 + (i / Math.max(1, logs.length - 1)) * 320;
    const y = (v) => 120 - ((v - min) / span) * 100;

    let d = "";
    logs.forEach((row, i) => {
      const px = x(i);
      const py = y(row.apy);
      d += (i === 0 ? "M" : "L") + px + " " + py + " ";
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
