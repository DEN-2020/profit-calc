document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("spot-form");
  const resultEl = document.getElementById("spot-result");
  const chartEl = document.getElementById("spot-chart");
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

  function calcSpot() {
    const capital = +document.getElementById("spot-capital").value || 0;
    const entry   = +document.getElementById("spot-entry").value || 0;
    const tp      = +document.getElementById("spot-tp").value || 0;
    const slVal   = document.getElementById("spot-sl").value;
    const sl      = slVal ? +slVal : null;
    const feePct  = +document.getElementById("spot-fee").value || 0;

    if (!capital || !entry || !tp) {
      resultEl.textContent = "Fill: capital, entry, TP.";
      return;
    }

    const size = capital / entry;
    const gross = (tp - entry) * size;

    const feeRate = feePct / 100;
    const notionalEntry = size * entry;
    const notionalExit  = size * tp;
    const fees = (notionalEntry + notionalExit) * feeRate;

    const net = gross - fees;
    const roe = (net / capital) * 100;

    let riskBlock = "";

    if (sl && sl > 0 && sl < entry) {
      const lossPerCoin = entry - sl;
      const grossLoss = lossPerCoin * size;

      const slNotional = size * sl;
      const feesSl = (notionalEntry + slNotional) * feeRate;

      const netLoss = grossLoss + feesSl;
      const riskPct = (netLoss / capital) * 100;
      const rr = netLoss ? net / netLoss : null;

      riskBlock = `
        <br><b>Risk to SL:</b><br>
        Loss: -${netLoss.toFixed(2)} $<br>
        Risk vs capital: -${riskPct.toFixed(2)} %<br>
        R:R = ${rr ? rr.toFixed(2) : "—"}
      `;
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

  // events
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      calcSpot();
    });
  }

  const btnCalc = document.getElementById("btn-calc-spot");
  if (btnCalc) {
    btnCalc.addEventListener("click", (e) => {
      e.preventDefault();
      calcSpot();
    });
  }

  // пока fetch цены с биржи не делаем (нужен API + CORS)
  const btnFetch = document.getElementById("btn-fetch-spot-price");
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
