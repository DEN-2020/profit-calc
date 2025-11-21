document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("perp-form");
  const resultEl = document.getElementById("perp-result");
  const chartEl = document.getElementById("perp-chart");
  const calcBtn = document.getElementById("btn-calc-perp");
  const fetchBtn = document.getElementById("btn-fetch-price");
  const statusEl = document.getElementById("offline-indicator");

  // --- online / offline индикатор ---
  function updateStatus() {
    if (!statusEl) return;
    if (navigator.onLine) {
      statusEl.textContent = "Online";
      statusEl.classList.add("online");
      statusEl.classList.remove("offline");
    } else {
      statusEl.textContent = "Offline";
      statusEl.classList.add("offline");
      statusEl.classList.remove("online");
    }
  }

  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  updateStatus();

  // --- логика расчёта ---
  function calcPerp() {
    const symbol = (document.getElementById("symbol").value || "").trim();
    const margin = parseFloat(document.getElementById("margin").value) || 0;
    const entry = parseFloat(document.getElementById("entry").value) || 0;
    const tp = parseFloat(document.getElementById("tp").value) || 0;
    const slVal = document.getElementById("sl").value;
    const sl = slVal ? parseFloat(slVal) : null;
    const leverage = parseFloat(document.getElementById("leverage").value) || 1;
    const side = document.getElementById("side").value;
    const feePct = parseFloat(document.getElementById("fee").value) || 0;

    if (!margin || !entry || !tp) {
      resultEl.textContent = "Fill Margin, Entry and Take Profit.";
      return;
    }

    const size = (margin * leverage) / entry;       // сколько монеты в позиции
    const feeRate = feePct / 100;

    // прибыль к тейку
    const profitPerCoin = side === "long" ? (tp - entry) : (entry - tp);
    const grossProfit = profitPerCoin * size;

    const notionalEntry = size * entry;
    const notionalTp = size * tp;
    const totalFeesTp = (notionalEntry + notionalTp) * feeRate;

    const netProfit = grossProfit - totalFeesTp;
    const roe = (netProfit / margin) * 100;

    // блок про риск и стоп
    let slBlock = "";
    if (sl && sl > 0) {
      let lossPerCoin = 0;
      if (side === "long" && sl < entry) {
        lossPerCoin = entry - sl;
      } else if (side === "short" && sl > entry) {
        lossPerCoin = sl - entry;
      }

      if (lossPerCoin > 0) {
        const grossLoss = lossPerCoin * size;
        const notionalSl = size * sl;
        const totalFeesSl = (notionalEntry + notionalSl) * feeRate;
        const netLoss = grossLoss + totalFeesSl;  // убыток + комиссии
        const riskPct = (netLoss / margin) * 100;
        const rr = netLoss > 0 ? (netProfit / netLoss) : null;

        slBlock = `
          <br><br><b>Risk (to SL):</b><br>
          Potential loss: -${netLoss.toFixed(2)} $<br>
          Risk vs margin: -${riskPct.toFixed(2)} %<br>
          R:R = ${rr ? rr.toFixed(2) : "—"}
        `;
      }
    }

    resultEl.innerHTML = `
      <b>${symbol || "Position"} (Perp)</b><br>
      Size: ${size.toFixed(6)}<br>
      Leverage: x${leverage.toFixed(0)}<br>
      Side: ${side.toUpperCase()}<br><br>

      <b>TP Profit:</b><br>
      Gross: ${grossProfit.toFixed(2)} $<br>
      Fees: ${totalFeesTp.toFixed(2)} $<br>
      <b>Net: ${netProfit.toFixed(2)} $</b><br>
      ROE: ${roe.toFixed(2)} %
      ${slBlock}
    `;

    renderChart({ entry, tp, sl, side });
  }

  // --- простой "график" уровней ---
  function renderChart({ entry, tp, sl, side }) {
    if (!chartEl || !entry || !tp) return;

    const levels = [entry, tp];
    if (sl && sl > 0) levels.push(sl);

    const min = Math.min(...levels);
    const max = Math.max(...levels);
    const span = max - min || 1;

    const pos = (v) => ((v - min) / span) * 100;

    const entryPos = pos(entry);
    const tpPos = pos(tp);
    const slPos = sl && sl > 0 ? pos(sl) : null;

    chartEl.innerHTML = `
      <div class="chart-line">
        <div class="chart-marker entry" style="left:${entryPos}%">
          Entry<br>${entry}
        </div>
        <div class="chart-marker tp" style="left:${tpPos}%">
          TP<br>${tp}
        </div>
        ${
          slPos !== null
            ? `<div class="chart-marker sl" style="left:${slPos}%">
                 SL<br>${sl}
               </div>`
            : ""
        }
      </div>
    `;
  }

  // --- кнопка расчёта ---
  if (calcBtn) {
    calcBtn.addEventListener("click", (e) => {
      e.preventDefault();
      calcPerp();
    });
  }

  // --- кнопка получения цены (онлайн) ---
  if (fetchBtn) {
    fetchBtn.addEventListener("click", async () => {
      const symbolInput = document.getElementById("symbol");
      const sym = (symbolInput.value || "").trim().toUpperCase();
      if (!sym) {
        alert("Enter symbol, e.g. ETHUSDT");
        return;
      }

      if (!navigator.onLine) {
        alert("No internet: manual mode only.");
        return;
      }

      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${sym}`
        );
        if (!res.ok) throw new Error("Bad response");
        const data = await res.json();
        const price = parseFloat(data.price);
        if (!isNaN(price)) {
          document.getElementById("entry").value = price.toFixed(2);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to fetch price.");
      }
    });
  }
});
