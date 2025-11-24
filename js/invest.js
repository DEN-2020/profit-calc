// DOM READY v=12 (simple %, реинвест каждые N месяцев)
document.addEventListener("DOMContentLoaded", () => {
  // -----------------------
  // ONLINE BADGE
  // -----------------------
  function updateOnlineStatus() {
    const el = document.getElementById("offline-indicator");
    if (!el) return;
    const online = navigator.onLine;
    el.textContent = online ? "Online" : "Offline";
    el.classList.toggle("online", online);
    el.classList.toggle("offline", !online);
  }
  updateOnlineStatus();
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  // -----------------------
  // HELPERS
  // -----------------------
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
        console.error(e);
        const box = G("inv-result");
        if (box) {
          box.innerHTML = `<div class="error">JS Error: ${e.message}</div>`;
        }
      }
    });
  }

  // -----------------------
  // MAIN CALC
  // -----------------------
  function calcInvest() {
    const start = num("inv_amount");        // начальный депозит
    const pct = num("inv_pct") / 100;       // месячный %
    const months = num("inv_months");       // срок в месяцах

    const reinvEvery = parseInt(G("inv_reinvest_period").value, 10) || 0; // каждые N месяцев
    const reinvExtra = num("inv_reinvest_value");                          // доп. взнос (опция)

    const resBox = G("inv-result");
    const chartBox = G("inv-chart");
    if (!resBox || !chartBox) return;

    if (!start || !pct || !months) {
      resBox.innerHTML = "<div class='error'>Fill the fields</div>";
      chartBox.innerHTML = "";
      return;
    }

    // principal — тело депозита, которое зарабатывает % каждый месяц
    // pot       — накопленная прибыль с последнего реинвеста (НЕ зарабатывает %)
    let principal = start;
    let pot = 0; // "кувшин" прибыли
    let totalInvested = start; // свои деньги (без начисленных %)

    let totalProfit = 0;
    const logs = [];

    for (let m = 1; m <= months; m++) {
      // 1) прибыль месяца: всегда от текущего principal
      const profit = principal * pct;
      pot += profit;
      totalProfit += profit;

      // баланс перед реинвестом (то, что у тебя "сколько накопится")
      let balance = principal + pot;

      // 2) реинвест каждые N месяцев:
      //    - добавляем накопленный pot к principal
      //    - по желанию добавляем ещё внешний взнос reinvExtra
      if (reinvEvery > 0 && m % reinvEvery === 0) {
        principal += pot;   // реинвест прибыли
        pot = 0;            // обнуляем кувшин

        if (reinvExtra > 0) {
          principal += reinvExtra;
          totalInvested += reinvExtra;
        }

        balance = principal; // после реинвеста баланс = новое тело
      }

      logs.push({
        m,
        balance,
        profit,      // прибыль в этот месяц
        principal,   // текущее тело после возможного реинвеста
        pot          // прибыль в кувшине после месяца/реинвеста
      });
    }

    const finalBalance = principal + pot;
    totalProfit = finalBalance - totalInvested; // на всякий случай пересчёт

    const last = logs[logs.length - 1];
    const monthN =
      reinvEvery > 0
        ? Math.min(reinvEvery, months)
        : Math.min(6, months); // "контрольный" месяц
    const pointN = logs.find((x) => x.m === monthN) || logs[0];

    const profitPerMonth = last.profit; // сколько капает в последний месяц
    const profitForPeriod = totalProfit;
    const yieldPeriodPct =
      totalInvested > 0 ? (profitForPeriod / totalInvested) * 100 : 0;
    const years = months / 12;
    const yieldYearPct = years > 0 ? yieldPeriodPct / years : 0;

    const reinvestText =
      reinvEvery > 0
        ? `Every ${reinvEvery} months${reinvExtra > 0 ? ` +${reinvExtra}$` : ""}`
        : "No reinvest";

    renderResult({
      start,
      months,
      totalInvested,
      finalBalance,
      profitPerMonth,
      profitForPeriod,
      yieldPeriodPct,
      yieldYearPct,
      reinvestText,
      monthN,
      balanceN: pointN.balance
    });

    drawChart(logs);
  }

  // -----------------------
  // RESULT RENDER
  // -----------------------
  function renderResult(d) {
    const box = G("inv-result");
    if (!box) return;

    box.innerHTML = `
      <div class="result-grid">

        <div class="res-item">
          <div class="res-icon">S</div>
          <div class="res-content">
            <span class="res-label">Initial</span>
            <span class="res-value">${d.start.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">Σ</div>
          <div class="res-content">
            <span class="res-label">Total Invested</span>
            <span class="res-value">${d.totalInvested.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">F</div>
          <div class="res-content">
            <span class="res-label">Final Balance</span>
            <span class="res-value">${d.finalBalance.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">P</div>
          <div class="res-content">
            <span class="res-label">Profit for period (${d.months}m)</span>
            <span class="res-value green">${d.profitForPeriod.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">M</div>
          <div class="res-content">
            <span class="res-label">Profit per month (last)</span>
            <span class="res-value">${d.profitPerMonth.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">R</div>
          <div class="res-content">
            <span class="res-label">Reinvest</span>
            <span class="res-value">${d.reinvestText}</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">${d.monthN}</div>
          <div class="res-content">
            <span class="res-label">At month ${d.monthN}</span>
            <span class="res-value">${d.balanceN.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">%</div>
          <div class="res-content">
            <span class="res-label">Yield for period</span>
            <span class="res-value">${d.yieldPeriodPct.toFixed(2)}%</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">Y</div>
          <div class="res-content">
            <span class="res-label">Annualized yield</span>
            <span class="res-value">${d.yieldYearPct.toFixed(2)}%</span>
          </div>
        </div>

      </div>
    `;
  }

  // -----------------------
  // SVG CHART (улучшенный)
  // -----------------------
  function drawChart(logs) {
    const box = G("inv-chart");
    if (!box) return;
    box.innerHTML = "";

    if (!logs.length) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 420 200");
    svg.style.width = "100%";

    const values = logs.map((r) => r.balance);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const span = maxVal - minVal || 1;

    const left = 40;
    const right = 400;
    const top = 20;
    const bottom = 170;

    const x = (i) =>
      left + (i / Math.max(1, logs.length - 1)) * (right - left);
    const y = (v) => bottom - ((v - minVal) / span) * (bottom - top);

    // линия
    let d = "";
    logs.forEach((r, i) => {
      const px = x(i);
      const py = y(r.balance);
      d += `${i === 0 ? "M" : "L"}${px},${py} `;
    });

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", "#4bb8ff");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    svg.appendChild(path);

    // точки: начало, середина, конец
    const markIdx = [0, Math.floor((logs.length - 1) / 2), logs.length - 1];
    markIdx.forEach((idx) => {
      const r = logs[idx];
      const cx = x(idx);
      const cy = y(r.balance);

      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", "3");
      circle.setAttribute("fill", "#4bb8ff");
      svg.appendChild(circle);

      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", cx);
      label.setAttribute("y", cy - 6);
      label.setAttribute("fill", "#aaa");
      label.setAttribute("font-size", "9");
      label.setAttribute("text-anchor", "middle");
      label.textContent = `m${r.m}`;
      svg.appendChild(label);
    });

    // подписи по оси Y (min / max)
    const minText = document.createElementNS(svgNS, "text");
    minText.setAttribute("x", 5);
    minText.setAttribute("y", bottom);
    minText.setAttribute("fill", "#777");
    minText.setAttribute("font-size", "10");
    minText.textContent = minVal.toFixed(0);
    svg.appendChild(minText);

    const maxText = document.createElementNS(svgNS, "text");
    maxText.setAttribute("x", 5);
    maxText.setAttribute("y", top + 10);
    maxText.setAttribute("fill", "#777");
    maxText.setAttribute("font-size", "10");
    maxText.textContent = maxVal.toFixed(0);
    svg.appendChild(maxText);

    box.appendChild(svg);
  }
});
