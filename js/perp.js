// =========================
//  ONLINE / OFFLINE STATUS
// =========================
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
document.addEventListener("DOMContentLoaded", updateOnlineStatus);


// =========================
//  VALIDATION
// =========================
function getNumber(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const v = parseFloat(el.value);
    return isNaN(v) ? null : v;
}

function getText(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    return el.value.trim().toUpperCase();
}


// =========================
//  FETCH PRICE (ONLINE)
// =========================
async function fetchSymbolPrice(symbol) {
    if (!navigator.onLine) return null;
    if (!symbol) return null;

    // simple Binance ticker endpoint
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;

    try {
        const r = await fetch(url);
        if (!r.ok) return null;
        const data = await r.json();
        return parseFloat(data.price);
    } catch (err) {
        return null;
    }
}


// =========================
//  MAIN PERP CALCULATION
// =========================
function calcPerp() {
    const symbol = getText("symbol");
    const margin = getNumber("margin");
    const entry = getNumber("entry");
    const tp = getNumber("tp");
    const sl = getNumber("sl");
    const leverage = getNumber("leverage");
    const fee = getNumber("fee");
    const side = document.getElementById("side").value;

    const resultEl = document.getElementById("perp-result");
    if (!resultEl) return;

    // -------- Basic validation --------
    if (!margin || !entry || !tp || !leverage) {
        resultEl.innerHTML = `<div class="error">Fill margin, entry, TP, leverage.</div>`;
        return;
    }

    // -------- Position size --------
    // on futures: positionSize = margin * leverage / entry
    const size = (margin * leverage) / entry;

    // -------- Profit per coin --------
    let profitPer;
    if (side === "long") {
        profitPer = tp - entry;
    } else {
        profitPer = entry - tp;
    }

    const grossProfit = profitPer * size;

    // -------- Fees (entry + exit) --------
    const feeRate = (fee || 0) / 100;

    const notionalEntry = size * entry;
    const notionalExit = size * tp;

    const totalFees = (notionalEntry + notionalExit) * feeRate;

    const netProfit = grossProfit - totalFees;
    const roe = (netProfit / margin) * 100;

    let riskBlock = "";

    // ========================
    // STOP LOSS calculations
    // ========================
    if (sl) {
        let lossPer;
        if (side === "long") {
            lossPer = entry - sl;
        } else {
            lossPer = sl - entry;
        }

        if (lossPer > 0) {
            const grossLoss = lossPer * size;
            const notionalSL = size * sl;
            const totalFeesSL = (notionalEntry + notionalSL) * feeRate;
            const netLoss = grossLoss + totalFeesSL;
            const riskPct = (netLoss / margin) * 100;
            const rr = netLoss > 0 ? netProfit / netLoss : null;

            riskBlock = `
                <div class="rr-block">
                  <b>SL Risk:</b><br>
                  Potential loss: -${netLoss.toFixed(2)} $<br>
                  Risk on margin: -${riskPct.toFixed(2)} %<br>
                  R:R = ${rr ? rr.toFixed(2) : "—"}
                </div>
            `;
        }
    }

    // ========================
    // RENDER RESULT
    // ========================
    resultEl.innerHTML = `
        <div class="result-line"><b>Symbol:</b> ${symbol || "—"}</div>
        <div class="result-line"><b>Position size:</b> ${size.toFixed(6)} units</div>
        <div class="result-line"><b>Gross profit:</b> ${grossProfit.toFixed(2)} $</div>
        <div class="result-line"><b>Fees:</b> ${totalFees.toFixed(2)} $</div>
        <div class="result-line"><b>Net profit:</b> ${netProfit.toFixed(2)} $</div>
        <div class="result-line"><b>ROE:</b> ${roe.toFixed(2)} %</div>
        ${riskBlock}
    `;
}


// =========================
//  BUTTON EVENTS
// =========================
document.addEventListener("DOMContentLoaded", () => {
    const btnCalc = document.getElementById("btn-calc-perp");
    const btnFetch = document.getElementById("btn-fetch-price");

    if (btnCalc)
        btnCalc.addEventListener("click", calcPerp);

    if (btnFetch) {
        btnFetch.addEventListener("click", async () => {
            const symbol = getText("symbol");
            const entryInput = document.getElementById("entry");
            const resultEl = document.getElementById("perp-result");

            if (!symbol) {
                if (resultEl)
                    resultEl.innerHTML = `<div class="error">Enter symbol, e.g. ETHUSDT</div>`;
                return;
            }

            const px = await fetchSymbolPrice(symbol);
            if (!px) {
                resultEl.innerHTML = `<div class="error">Failed to fetch price (offline or wrong symbol).</div>`;
                return;
            }

            entryInput.value = px;
            resultEl.innerHTML = `<div class="success">Fetched price: ${px}</div>`;
        });
    }
});
