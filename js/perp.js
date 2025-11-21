document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("perp-form");
  const resultEl = document.getElementById("perp-result");
  const chartEl = document.getElementById("perp-chart");
  const statusEl = document.getElementById("offline-indicator");

  function updateStatus() {
    if (!statusEl) return;
    if (navigator.onLine) {
      statusEl.textContent = "Online";
      statusEl.classList.remove("offline");
      statusEl.classList.add("online");
    } else {
      statusEl.textContent = "Offline";
      statusEl.classList.remove("online");
      statusEl.classList.add("offline");
    }
  }

  function renderChart(entry, tp, sl) {
    if (!chartEl || !entry || !tp) return;

    const min = Math.min(entry, tp, sl || entry);
    const max = Math.max(entry, tp, sl || entry);
    const span = max - min || 1;

    function pos(v) {
      return 12 + ((v - min) / span) * (chartEl.clientWidth - 24 || 100);
    }

    chartEl.innerHTML = `
      <div class="chart-axis"></div>
      <div class="chart-marker entry" style="left:${pos(entry)}px"></div>
      <div class="chart-label" style="left:${pos(entry)}px">Entry ${entry}</div>
      <div class="chart-marker tp" style="left:${pos(tp)}px"></div>
      <div class="chart-label" style="left:${pos(tp)}px">TP ${tp}</div>
      ${sl ? `
        <div class="chart-marker sl" style="left:${pos(sl)}px"></div>
        <div class="chart-label sl" style="left:${pos(sl)}px">SL ${sl}</div>
      ` : ""}
    `;
  }

  function calcPerp() {
    const margin = +document.getElementById("margin").value || 0;
    const entry  = +document.getElementById("entry").value || 0;
    const tp     = +document.getElementById("tp").value || 0;
    const slVal  = document.getElementById("sl").value;
    const sl     = slVal ? +slVal : null;
    const lev    = +document.getElementById("leverage").value || 1;
    const side   = document.getElementById("side").value || "long";
    const feePct = +document.getElementById("fee").value || 0;

    if (!margin || !entry || !tp) {
      resultEl.textContent = "Fill: margin, entry, TP.";
      return;
    }

    const size = (margin * lev) / entry;

    const feeRate = feePct / 100;
    const entryNotional = size * entry;
    const exitNotional  = size * tp;
    const fees = (entryNotional + exitNotional) * feeRate;

    let gross;
    if (side === "short") {
      gross = (entry - tp) * size;
    } else {
      gross = (tp - entry) * size;
    }

    const net = gross - fees;
    const roe = (net / margin) * 100;

    let riskBlock = "";

    if (sl && sl > 0) {
      let grossLoss;
      const slNotional = size * sl;

      if (side === "short") {
        // для шорта убыток, если цена идёт вверх к SL
        grossLoss = (sl - entry) * size;
      } else {
        // для лонга убыток, если цена идёт вниз к SL
        grossLoss = (entry - sl) * size;
      }

      if (grossLoss > 0) {
        const feesSl = (entryNotional + slNotional) * feeRate;
        const netLoss = grossLoss + feesSl;
        const riskPct = (netLoss / margin) * 100;
        const rr = netLoss ? net / netLoss : null;

        riskBlock = `
          <br><b>Risk to SL:</b><br>
          Loss: -${netLoss.toFixed(2)} $<br>
          Risk vs margin: -${riskPct.toFixed(2)} %<br>
          R:R = ${rr ? rr.toFixed(2) : "—"}
        `;
      }
    }

    resultEl.innerHTML = `
      <b>TP result:</b><br>
      Size: ${size.toFixed(6)}<br>
      Gross: ${gross.toFixed(2)} $<br>
      Fees: ${fees.toFixed(2)} $<br>
      <b>Net: ${net.toFixed(2)} $</b><br>
      ROE: ${roe.toFixed(2)} %
      ${riskBlock}
    `;

    renderChart(entry, tp, sl || null);
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      calcPerp();
    });
  }

  const btnCalc = document.getElementById("btn-calc-perp");
  if (btnCalc) {
    btnCalc.addEventListener("click", (e) => {
      e.preventDefault();
      calcPerp();
    });
  }

  const btnFetch = document.getElementById("btn-fetch-price");
  if (btnFetch) {
    btnFetch.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Online price fetch: to be implemented later.");
    });
  }

  updateStatus();
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
});
