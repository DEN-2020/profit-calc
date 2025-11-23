// js/strategy.js

// --------------------------
// Offline Indicator (как на spot)
// --------------------------
function updateOfflineStatus() {
  const ind = document.getElementById("offline-indicator");
  if (!ind) return;

  if (navigator.onLine) {
    ind.textContent = "Online";
    ind.classList.remove("offline");
    ind.classList.add("online");
  } else {
    ind.textContent = "Offline";
    ind.classList.remove("online");
    ind.classList.add("offline");
  }
}

window.addEventListener("online", updateOfflineStatus);
window.addEventListener("offline", updateOfflineStatus);
updateOfflineStatus();


// --------------------------
// LocalStorage для полей
// --------------------------
const STRAT_FIELDS = [
  "start_capital",
  "winrate",
  "rr",
  "risk_pct",
  "trades",
  "fee_pct",
];

function loadStratSaved() {
  STRAT_FIELDS.forEach((id) => {
    const val = localStorage.getItem("strategy_" + id);
    const el = document.getElementById(id);
    if (el && val !== null) el.value = val;
  });
}

function saveStratField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  localStorage.setItem("strategy_" + id, el.value);
}

STRAT_FIELDS.forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => saveStratField(id));
});

loadStratSaved();


// --------------------------
// Helpers
// --------------------------
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function fmtPct(v, digits = 2) {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(digits) + "%";
}

function fmtNum(v, digits = 2) {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

function fmtMoney(v, digits = 0) {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(digits) + "$";
}


// --------------------------
// Основная логика анализа стратегии
// --------------------------
const btn = document.getElementById("strategy-calc-btn");
const resBox = document.getElementById("strategy-result");
const sumBox = document.getElementById("strategy-summary");
const chartBox = document.getElementById("strategy-chart");

if (btn) {
  btn.addEventListener("click", () => {
    const startCap = parseFloat(document.getElementById("start_capital").value);
    const winratePct = parseFloat(document.getElementById("winrate").value);
    const rr = parseFloat(document.getElementById("rr").value);
    const riskPct = parseFloat(document.getElementById("risk_pct").value);
    const trades = parseInt(document.getElementById("trades").value, 10);
    const feePct = parseFloat(document.getElementById("fee_pct").value) || 0;

    if (!resBox || !sumBox || !chartBox) return;

    // простая валидация
    if (
      !startCap || startCap <= 0 ||
      !winratePct || winratePct <= 0 || winratePct >= 100 ||
      !rr || rr <= 0 ||
      !riskPct || riskPct <= 0 ||
      !trades || trades <= 0
    ) {
      resBox.innerHTML =
        "<div class='error'>Fill all fields with valid positive values (winrate &lt; 100).</div>";
      sumBox.innerHTML = "";
      chartBox.innerHTML = "";
      return;
    }

    const w = winratePct / 100;      // 0..1
    const R = rr;                    // reward:risk
    const riskPerTrade = riskPct;    // % от депо
    const N = trades;
    const fee = feePct / 100;        // 0..1 per round-trip

    // --- Edge (EV) ---
    // базовое матожидание в "R" (без комиссий)
    let evR = w * R - (1 - w); // 1R = размер риска

    // комиссию считаем как "съедание" части среднего выигрыша
    // грубо: уменьшаем EV на fee * R (приближение)
    evR -= fee * R;

    // EV в процентах от риска за сделку
    const evAsRiskPct = evR * 100;

    // EV в % от депозита (riskPct используется как множитель)
    const evPerTradePctOfEquity = evR * riskPerTrade;

    // --- Profit Factor ---
    let pf;
    if (w === 1) {
      pf = Infinity;
    } else {
      pf = (w * R) / (1 - w);
    }

    // --- Approx final capital (при грубом экспон. росте) ---
    const startEq = startCap;
    const growthPerTrade = 1 + evPerTradePctOfEquity / 100;
    const finalEq =
      growthPerTrade > 0
        ? startEq * Math.pow(growthPerTrade, N)
        : 0;

    // --- Approx max DD ---
    // грубое приближение, больше как "чувство масштаба"
    const maxDDapprox = clamp(
      riskPerTrade * Math.sqrt(N * (1 - w)),
      0,
      100
    );

    // --- Approx probability of ruin (очень грубо) ---
    let ruinScore =
      40 - evAsRiskPct * 0.8 + riskPerTrade * 1.6 + (1 - w) * 40;
    let ruinProb = clamp(ruinScore, 0, 100);

    // --- Health grade ---
    const health = assessHealth(evR, pf, riskPerTrade, ruinProb);

    // summary
    sumBox.innerHTML = renderSummary(health, evAsRiskPct, pf, ruinProb);

    // details
    resBox.innerHTML = renderDetails({
      winratePct,
      rr,
      riskPerTrade,
      N,
      feePct,
      evAsRiskPct,
      evPerTradePctOfEquity,
      pf,
      finalEq,
      maxDDapprox,
      ruinProb,
      startEq,
    });

    // chart
    renderChart({
      evAsRiskPct,
      ruinProb,
      maxDDapprox,
    });
  });
}


// --------------------------
// Health assessment
// --------------------------
function assessHealth(evR, pf, riskPct, ruinProb) {
  // evR — expected value in R units, pf — profit factor
  const evAbs = evR;

  if (!Number.isFinite(evAbs) || !Number.isFinite(pf)) {
    return { grade: "F", main: "Invalid input", sub: "Check parameters." };
  }

  if (evAbs <= 0 || pf <= 1) {
    return {
      grade: "F",
      main: "Negative edge",
      sub: "Math is against you. This strategy will lose money long-term.",
    };
  }

  if (evAbs > 0.4 && pf > 2 && riskPct <= 2 && ruinProb < 20) {
    return {
      grade: "A",
      main: "Strong positive edge",
      sub: "Great expectancy and controlled risk. Good for long-term growth.",
    };
  }

  if (evAbs > 0.2 && pf > 1.5 && riskPct <= 3 && ruinProb < 30) {
    return {
      grade: "B",
      main: "Profitable but aggressive",
      sub: "Good math, but drawdown management is important.",
    };
  }

  if (evAbs > 0.05 && pf > 1.2) {
    return {
      grade: "C",
      main: "Weak but positive edge",
      sub: "Small advantage. Fees and mistakes can erase profit.",
    };
  }

  return {
    grade: "D",
    main: "Fragile / borderline strategy",
    sub: "Barely profitable. Needs better entries or higher R:R.",
  };
}


// --------------------------
// Render summary
// --------------------------
function renderSummary(health, evAsRiskPct, pf, ruinProb) {
  const gradeClass = "health-" + health.grade;

  const evText =
    evAsRiskPct > 0
      ? `+${evAsRiskPct.toFixed(2)}% per 1R`
      : `${evAsRiskPct.toFixed(2)}% per 1R`;

  const pfText = Number.isFinite(pf) ? pf.toFixed(2) : "∞";

  return `
<div class="health-badge">
  <div class="health-grade ${gradeClass}">${health.grade}</div>
  <div class="health-text">
    <div class="health-text-main">${health.main}</div>
    <div class="health-text-sub">${health.sub}</div>
  </div>
</div>

<div class="result-grid">
  <div class="res-item">
    <div class="res-icon">EV</div>
    <div class="res-content">
      <span class="res-label">Expected value</span>
      <span class="res-value ${evAsRiskPct >= 0 ? "green" : "red"}">${evText}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">PF</div>
    <div class="res-content">
      <span class="res-label">Profit factor</span>
      <span class="res-value ${pf > 1 ? "green" : "red"}">${pfText}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">⚠</div>
    <div class="res-content">
      <span class="res-label">Ruin probability (approx)</span>
      <span class="res-value ${ruinProb > 50 ? "red" : ruinProb > 25 ? "orange" : "green"}">
        ${fmtPct(ruinProb, 1)}
      </span>
    </div>
  </div>
</div>
`;
}


// --------------------------
// Render details
// --------------------------
function renderDetails(d) {
  const {
    winratePct,
    rr,
    riskPerTrade,
    N,
    feePct,
    evAsRiskPct,
    evPerTradePctOfEquity,
    pf,
    finalEq,
    maxDDapprox,
    ruinProb,
    startEq,
  } = d;

  const pfText = Number.isFinite(pf) ? pf.toFixed(2) : "∞";

  return `
<div class="result-grid">

  <div class="res-item">
    <div class="res-icon">W</div>
    <div class="res-content">
      <span class="res-label">Winrate</span>
      <span class="res-value">${fmtPct(winratePct, 1)}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">R</div>
    <div class="res-content">
      <span class="res-label">Reward : Risk</span>
      <span class="res-value">${fmtNum(rr, 2)} : 1</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">Risk</div>
    <div class="res-content">
      <span class="res-label">Risk per trade</span>
      <span class="res-value">${fmtPct(riskPerTrade, 2)}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">N</div>
    <div class="res-content">
      <span class="res-label">Trades</span>
      <span class="res-value">${N}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">Fee</div>
    <div class="res-content">
      <span class="res-label">Fees per round-trip</span>
      <span class="res-value">${fmtPct(feePct, 2)}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">EV</div>
    <div class="res-content">
      <span class="res-label">EV per 1R (after fees)</span>
      <span class="res-value ${evAsRiskPct >= 0 ? "green" : "red"}">
        ${evAsRiskPct >= 0 ? "+" : ""}${evAsRiskPct.toFixed(2)}%
      </span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">EV</div>
    <div class="res-content">
      <span class="res-label">EV per trade (equity)</span>
      <span class="res-value ${evPerTradePctOfEquity >= 0 ? "green" : "red"}">
        ${evPerTradePctOfEquity >= 0 ? "+" : ""}${evPerTradePctOfEquity.toFixed(3)}%
      </span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">PF</div>
    <div class="res-content">
      <span class="res-label">Profit factor</span>
      <span class="res-value ${pf > 1 ? "green" : "red"}">${pfText}</span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">EQ</div>
    <div class="res-content">
      <span class="res-label">Approx. final equity</span>
      <span class="res-value ${finalEq >= startEq ? "green" : "red"}">
        ${fmtMoney(finalEq, 0)}
      </span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">DD</div>
    <div class="res-content">
      <span class="res-label">Approx. max drawdown</span>
      <span class="res-value ${maxDDapprox > 30 ? "red" : maxDDapprox > 15 ? "orange" : "green"}">
        ${fmtPct(maxDDapprox, 1)}
      </span>
    </div>
  </div>

  <div class="res-item">
    <div class="res-icon">⚠</div>
    <div class="res-content">
      <span class="res-label">Ruin probability (approx)</span>
      <span class="res-value ${ruinProb > 50 ? "red" : ruinProb > 25 ? "orange" : "green"}">
        ${fmtPct(ruinProb, 1)}
      </span>
    </div>
  </div>

</div>
`;
}


// --------------------------
// Render chart (bars)
// --------------------------
function renderChart(d) {
  const { evAsRiskPct, ruinProb, maxDDapprox } = d;
  if (!chartBox) return;

  const edgeNorm = clamp((evAsRiskPct + 20) / 40, 0, 1); // -20..+20 -> 0..1
  const riskNorm = clamp(ruinProb / 100, 0, 1);
  const stabNorm = clamp(1 - maxDDapprox / 100, 0, 1);

  chartBox.innerHTML = `
<div class="strat-bars">

  <div class="strat-bar-row">
    <div class="strat-bar-label">
      Edge strength (EV per R)
    </div>
    <div class="strat-bar-track">
      <div class="strat-bar-fill bar-edge" style="width: ${(edgeNorm * 100).toFixed(0)}%;"></div>
    </div>
  </div>

  <div class="strat-bar-row">
    <div class="strat-bar-label">
      Ruin risk (higher = worse)
    </div>
    <div class="strat-bar-track">
      <div class="strat-bar-fill bar-risk" style="width: ${(riskNorm * 100).toFixed(0)}%;"></div>
    </div>
  </div>

  <div class="strat-bar-row">
    <div class="strat-bar-label">
      Stability / DD tolerance
    </div>
    <div class="strat-bar-track">
      <div class="strat-bar-fill bar-stability" style="width: ${(stabNorm * 100).toFixed(0)}%;"></div>
    </div>
  </div>

</div>
`;
}
