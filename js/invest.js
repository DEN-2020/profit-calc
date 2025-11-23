function getNum(id) {
  const v = parseFloat(document.getElementById(id).value);
  return isNaN(v) ? null : v;
}

document.getElementById("inv-calc-btn").addEventListener("click", calcInv);

function calcInv() {
  const amount = getNum("inv_amount");
  const pct = getNum("inv_pct");
  const months = getNum("inv_months");
  const comp = parseInt(document.getElementById("inv_compound").value);

  const out = document.getElementById("inv-result");

  if (!amount || !pct || !months) {
    out.innerHTML = "<div class='error'>Fill amount, % and months.</div>";
    return;
  }

  let balance = amount;
  const monthlyPct = pct / 100;
  let totalProfit = 0;

  let logs = [];
  let accProfit = 0; // копится до реинвеста

  for (let m = 1; m <= months; m++) {
    const profit = balance * monthlyPct;

    totalProfit += profit;
    accProfit += profit;

    // apply reinvest
    if (comp !== 0 && m % comp === 0) {
      balance += accProfit;
      accProfit = 0;
    }

    logs.push({
      month: m,
      profit: profit,
      balance: balance + accProfit
    });
  }

  const finalBalance = balance + accProfit;
  const avgMonthly = totalProfit / months;
  const roiPct = (totalProfit / amount) * 100;

  out.innerHTML = `
    <div class="result-grid">

      <div class="res-item">
        <div class="res-icon">S</div>
        <div class="res-content">
          <span class="res-label">Start</span>
          <span class="res-value">${amount.toFixed(2)}$</span>
        </div>
      </div>

      <div class="res-item">
        <div class="res-icon">F</div>
        <div class="res-content">
          <span class="res-label">Final amount</span>
          <span class="res-value green">${finalBalance.toFixed(2)}$</span>
        </div>
      </div>

      <div class="res-item">
        <div class="res-icon">P</div>
        <div class="res-content">
          <span class="res-label">Total profit</span>
          <span class="res-value green">${totalProfit.toFixed(2)}$</span>
        </div>
      </div>

      <div class="res-item">
        <div class="res-icon">%</div>
        <div class="res-content">
          <span class="res-label">ROI %</span>
          <span class="res-value">${roiPct.toFixed(2)}%</span>
        </div>
      </div>

      <div class="res-item">
        <div class="res-icon">≋</div>
        <div class="res-content">
          <span class="res-label">Avg / month</span>
          <span class="res-value">${avgMonthly.toFixed(2)}$</span>
        </div>
      </div>

    </div>

    <div class="inv-table">
      ${logs
        .slice(-6)
        .map(
          (r) => `
        <div class="inv-row">
          <span>Month ${r.month}</span>
          <span>${r.balance.toFixed(2)}$</span>
        </div>`
        )
        .join("")}
    </div>
  `;
}
