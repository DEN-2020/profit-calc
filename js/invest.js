// DOM READY v=8 — простые % с реинвестом каждые N месяцев
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
  const G   = (id) => document.getElementById(id);
  const num = (id) => parseFloat(G(id)?.value || 0);

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
    const start   = num("inv_amount");   // начальный депозит
    const pct     = num("inv_pct") / 100; // % в месяц (0.034)
    const months  = num("inv_months");   // срок в месяцах

    const reinvEvery = parseInt(G("inv_reinvest_period")?.value || "0", 10); // каждые N месяцев
    const addValue   = num("inv_reinvest_value"); // доп. взнос при реинвесте (внешние деньги)

    const resBox   = G("inv-result");
    const chartBox = G("inv-chart");

    if (!start || !pct || !months) {
      if (resBox) resBox.innerHTML = "<div class='error'>Fill the fields</div>";
      if (chartBox) chartBox.innerHTML = "";
      return;
    }

    // principal — тело вклада, на которое каждый месяц считаются %
    // profitAcc — накопленный профит внутри текущего периода до реинвеста
    let principal    = start;
    let profitAcc    = 0;
    let totalInvested = start; // сколько СВОИХ денег внесено (без учёта профита)

    const logs = [];

    for (let m = 1; m <= months; m++) {
      // прибыль за месяц считается от ТЕКУЩЕГО тела, а не от баланса
      const monthProfit = principal * pct;
      profitAcc += monthProfit;

      // текущий баланс = тело + накопленные проценты периода
      const balance = principal + profitAcc;

      logs.push({
        m,
        principal,
        balance,
        monthProfit
      });

      // ----- реинвест каждые N месяцев -----
      if (reinvEvery > 0 && m % reinvEvery === 0) {
        // добавляем накопленный профит к телу
        principal += profitAcc;
        profitAcc = 0;

        // плюс опциональный внешний довнос
        if (addValue > 0) {
          principal     += addValue;
          totalInvested += addValue;
        }
      } else if (reinvEvery === 0 && addValue > 0) {
        // режим "Never + Amount>0" — просто каждый месяц докидываем фикс. сумму
        principal     += addValue;
        totalInvested += addValue;
      }
    }

    // Финальное состояние: тело + остаток профита (если период не завершён ровно на реинвесте)
    const last       = logs[logs.length - 1];
    const finalBal   = last.balance;
    const totalProfit = finalBal - totalInvested;

    const lastMonthProfit = last.monthProfit;
    const monthK = Math.min(6, logs.length); // "контрольный" месяц для вывода
    const atMonthK = logs.find(r => r.m === monthK)?.balance ?? finalBal;
    const avgPerMonth = totalProfit / logs.length;

    renderResult({
      start,
      totalInvested,
      finalBal,
      totalProfit,
      lastMonthProfit,
      monthK,
      atMonthK,
      avgPerMonth,
      logs
    });

    drawChart(logs);
  }

  // -----------------------
  // RESULT BLOCK
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
            <span class="res-label">Total invested</span>
            <span class="res-value">${d.totalInvested.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">F</div>
          <div class="res-content">
            <span class="res-label">Final balance</span>
            <span class="res-value">${d.finalBal.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">P</div>
          <div class="res-content">
            <span class="res-label">Total profit</span>
            <span class="res-value green">${d.totalProfit.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">${d.monthK}</div>
          <div class="res-content">
            <span class="res-label">At month ${d.monthK}</span>
            <span class="res-value">${d.atMonthK.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">$</div>
          <div class="res-content">
            <span class="res-label">Last month profit</span>
            <span class="res-value">${d.lastMonthProfit.toFixed(2)}$</span>
          </div>
        </div>

        <div class="res-item">
          <div class="res-icon">~</div>
          <div class="res-content">
            <span class="res-label">Avg per month</span>
            <span class="res-value">${d.avgPerMonth.toFixed(2)}$</span>
          </div>
        </div>

      </div>
    `;
  }

  // -----------------------
  // CHART (balance)
  // -----------------------
  function drawChart(logs) {
    const box = G("inv-chart");
    if (!box) return;
    box.innerHTML = "";

    if (!logs.length) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg   = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 360 150");
    svg.style.width = "100%";

    const vals = logs.map(l => l.balance);
    const min  = Math.min(...vals);
    const max  = Math.max(...vals);
    const span = max - min || 1;

    let d = "";
    logs.forEach((r, i) => {
      const x = 20 + (i / Math.max(1, logs.length - 1)) * 320;
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
