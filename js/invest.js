// DOM READY v=13 (simple %, реинвест каждые N месяцев + 2 линии на графике)
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

    // --- сценарий 1: С РЕИНВЕСТОМ (твоя логика) ---
    // principal — тело депозита, которое зарабатывает % каждый месяц
    // pot       — накопленная прибыль с последнего реинвеста (не зарабатывает %)
    let principal = start;
    let pot = 0;

    // --- сценарий 2: БЕЗ РЕИНВЕСТА прибыли (только процент от principal), для сравнения ---
    let principalNo = start;
    let potNo = 0;

    let totalInvested = start;
    let totalInvestedNo = start;

    let totalProfit = 0;
    let totalProfitNo = 0;

    const logs = [];

    for (let m = 1; m <= months; m++) {
      // --- WITH REINVEST (основной вариант) ---
      const profit = principal * pct;
      pot += profit;
      totalProfit += profit;

      let balance = principal + pot;
      let reinvestEvent = false;

      if (reinvEvery > 0 && m % reinvEvery === 0) {
        // реинвестируем накопленную прибыль
        if (pot !== 0) {
          principal += pot;
          pot = 0;
          reinvestEvent = true;
        }

        // доп. взнос (если задан)
        if (reinvExtra > 0) {
          principal += reinvExtra;
          totalInvested += reinvExtra;
        }

        balance = principal + pot;
      }

      // --- NO REINVEST (базовая линия для сравнения) ---
      const profitNo = principalNo * pct;
      potNo += profitNo;
      totalProfitNo += profitNo;

      let balanceNo = principalNo + potNo;
      // тут доп. взносы есть, но прибыль НИКОГДА не уходит в тело
      if (reinvEvery > 0 && reinvExtra > 0 && m % reinvEvery === 0) {
        principalNo += reinvExtra;
        totalInvestedNo += reinvExtra;
        balanceNo = principalNo + potNo;
      }

      logs.push({
        m,
        balance,    // линия "с реинвестом"
        balanceNo,  // линия "без реинвеста"
        profit,
        profitNo,
        reinvestEvent
      });
    }

    const finalBalance = principal + pot;
    const finalBalanceNo = principalNo + potNo;

    // пересчёт профитов от фактических балансов
    totalProfit = finalBalance - totalInvested;
    totalProfitNo = finalBalanceNo - totalInvestedNo;

    const last = logs[logs.length - 1];

    const profitPerMonth = last.profit; // прибыль в последний месяц (с реинвестом)
    const profitForPeriod = totalProfit;
    const yieldPeriodPct =
      totalInvested > 0 ? (profitForPeriod / totalInvested) * 100 : 0;
    const years = months / 12;
    const yieldYearPct = years > 0 ? yieldPeriodPct / years : 0;

    const extraProfitVsNo = totalProfit - totalProfitNo;

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
      finalBalanceNo,
      totalProfitNo,
      extraProfitVsNo
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
            <span class="res-label">Final Balance (with reinvest)</span>
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

        <div class="res-item">
          <div class="res-icon">W</div>
          <div class="res-content">
            <span class="res-label">Final (no reinvest)</span>
            <span class="res-value">${d.finalBalanceNo.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">Δ</div>
          <div class="res-content">
            <span class="res-label">Extra profit vs no reinvest</span>
            <span class="res-value green">${d.extraProfitVsNo.toFixed(2)}$</span>
          </div>
        </div>

      </div>
    `;
  }

  // -----------------------
  // SVG CHART: 2 линии + реинвест-метки
  // -----------------------
  function drawChart(logs) {
    const box = G("inv-chart");
    if (!box) return;
    box.innerHTML = "";
    if (!logs.length) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 440 220");
    svg.style.width = "100%";

    const balancesWith = logs.map((r) => r.balance);
    const balancesNo = logs.map((r) => r.balanceNo);
    const allVals = balancesWith.concat(balancesNo);

    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    const span = maxVal - minVal || 1;

    const left = 40;
    const right = 410;
    const top = 20;
    const bottom = 180;

    const x = (i) =>
      left + (i / Math.max(1, logs.length - 1)) * (right - left);
    const y = (v) => bottom - ((v - minVal) / span) * (bottom - top);

    // --- линия "с реинвестом" ---
    let dWith = "";
    logs.forEach((r, i) => {
      const px = x(i);
      const py = y(r.balance);
      dWith += `${i === 0 ? "M" : "L"}${px},${py} `;
    });
    const pathWith = document.createElementNS(svgNS, "path");
    pathWith.setAttribute("d", dWith);
    pathWith.setAttribute("stroke", "#4bb8ff");
    pathWith.setAttribute("stroke-width", "2");
    pathWith.setAttribute("fill", "none");
    svg.appendChild(pathWith);

    // --- линия "без реинвеста" ---
    let dNo = "";
    logs.forEach((r, i) => {
      const px = x(i);
      const py = y(r.balanceNo);
      dNo += `${i === 0 ? "M" : "L"}${px},${py} `;
    });
    const pathNo = document.createElementNS(svgNS, "path");
    pathNo.setAttribute("d", dNo);
    pathNo.setAttribute("stroke", "#ff7f50");
    pathNo.setAttribute("stroke-width", "2");
    pathNo.setAttribute("fill", "none");
    pathNo.setAttribute("stroke-dasharray", "4 2");
    svg.appendChild(pathNo);

    // --- отметки реинвест-эвентов (если были) ---
    logs.forEach((r, i) => {
      if (!r.reinvestEvent) return;
      const vx = x(i);
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", vx);
      line.setAttribute("y1", top);
      line.setAttribute("x2", vx);
      line.setAttribute("y2", bottom);
      line.setAttribute("stroke", "#888");
      line.setAttribute("stroke-width", "1");
      line.setAttribute("stroke-dasharray", "3 3");
      svg.appendChild(line);

      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", vx);
      label.setAttribute("y", top + 10);
      label.setAttribute("fill", "#aaa");
      label.setAttribute("font-size", "9");
      label.setAttribute("text-anchor", "middle");
      label.textContent = `R${r.m}`;
      svg.appendChild(label);
    });

    // --- точки: начало и конец (для сценария с реинвестом) ---
    const markIdx = [0, logs.length - 1];
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

    // --- подписи по оси Y (min / max) ---
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

    // --- легенда ---
    const legendY = 18;

    const rect1 = document.createElementNS(svgNS, "rect");
    rect1.setAttribute("x", 250);
    rect1.setAttribute("y", legendY);
    rect1.setAttribute("width", 10);
    rect1.setAttribute("height", 10);
    rect1.setAttribute("fill", "#4bb8ff");
    svg.appendChild(rect1);

    const txt1 = document.createElementNS(svgNS, "text");
    txt1.setAttribute("x", 266);
    txt1.setAttribute("y", legendY + 9);
    txt1.setAttribute("fill", "#ccc");
    txt1.setAttribute("font-size", "10");
    txt1.textContent = "With reinvest";
    svg.appendChild(txt1);

    const rect2 = document.createElementNS(svgNS, "rect");
    rect2.setAttribute("x", 250);
    rect2.setAttribute("y", legendY + 16);
    rect2.setAttribute("width", 10);
    rect2.setAttribute("height", 10);
    rect2.setAttribute("fill", "none");
    rect2.setAttribute("stroke", "#ff7f50");
    rect2.setAttribute("stroke-width", "2");
    svg.appendChild(rect2);

    const txt2 = document.createElementNS(svgNS, "text");
    txt2.setAttribute("x", 266);
    txt2.setAttribute("y", legendY + 25);
    txt2.setAttribute("fill", "#ccc");
    txt2.setAttribute("font-size", "10");
    txt2.textContent = "No reinvest";
    svg.appendChild(txt2);

    box.appendChild(svg);
  }
});
