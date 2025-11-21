// spot.js — final stable version

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("spot-form");
    const resultEl = document.getElementById("spot-result");

    document.getElementById("btn-calc-spot").addEventListener("click", calcSpot);
    document.getElementById("btn-fetch-price-spot").addEventListener("click", fetchPriceSpot);

    updateOfflineStatus();
    window.addEventListener("online", updateOfflineStatus);
    window.addEventListener("offline", updateOfflineStatus);


    function calcSpot() {
        const symbol = document.getElementById("symbol").value.trim().toUpperCase();
        const capital = parseFloat(document.getElementById("capital").value) || 0;
        const entry = parseFloat(document.getElementById("entry").value) || 0;
        const tp = parseFloat(document.getElementById("tp").value) || 0;
        const slVal = document.getElementById("sl").value;
        const sl = slVal ? parseFloat(slVal) : null;
        const feePct = parseFloat(document.getElementById("fee").value) || 0;

        if (!capital || !entry || !tp) {
            resultEl.innerHTML = "<b style='color:#f55'>Fill required fields.</b>";
            return;
        }

        const size = capital / entry; // how much coin you get

        const profitPerCoin = tp - entry;
        const grossProfit = profitPerCoin * size;

        const feeRate = feePct / 100;
        const feeBuy = capital * feeRate;
        const feeSell = (size * tp) * feeRate;
        const totalFees = feeBuy + feeSell;

        const netProfit = grossProfit - totalFees;
        const roe = (netProfit / capital) * 100;

        let slBlock = "";
        if (sl && sl > 0) {
            const lossPerCoin = entry - sl;
            if (lossPerCoin > 0) {
                const grossLoss = lossPerCoin * size;
                const feeStop = (size * sl) * feeRate;
                const netLoss = grossLoss + feeBuy + feeStop;
                const riskPct = (netLoss / capital) * 100;
                const rr = netLoss > 0 ? netProfit / netLoss : null;

                slBlock = `
                    <br><b>Stop-loss:</b><br>
                    SL loss: -${netLoss.toFixed(2)} $<br>
                    Risk: -${riskPct.toFixed(2)} %<br>
                    R:R = ${rr ? rr.toFixed(2) : "—"}
                `;
            }
        }

        resultEl.innerHTML = `
            <b>Symbol:</b> ${symbol || "-"}<br>
            Size: ${size.toFixed(6)}<br>
            Gross profit: ${grossProfit.toFixed(2)} $<br>
            Fees: ${totalFees.toFixed(2)} $<br>
            <b>Net profit: ${netProfit.toFixed(2)} $</b><br>
            ROE: ${roe.toFixed(2)} %
            ${slBlock}
        `;
    }


    async function fetchPriceSpot() {
        const symbol = document.getElementById("symbol").value.trim().toUpperCase();
        if (!symbol) {
            resultEl.innerHTML = "<b style='color:#f55'>Enter symbol first.</b>";
            return;
        }
        if (!navigator.onLine) {
            resultEl.innerHTML = "<b style='color:#f55'>Offline.</b>";
            return;
        }

        try {
            const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
            const data = await res.json();

            if (data.price) {
                document.getElementById("entry").value = parseFloat(data.price);
                resultEl.innerHTML = `<b>Fetched price:</b> ${data.price}`;
            } else {
                resultEl.innerHTML = "<b style='color:#f55'>Symbol not found.</b>";
            }
        } catch (e) {
            resultEl.innerHTML = "<b style='color:#f55'>Fetch error.</b>";
        }
    }


    function updateOfflineStatus() {
        const indicator = document.getElementById("offline-indicator");
        if (navigator.onLine) {
            indicator.textContent = "Online";
            indicator.classList.remove("offline");
            indicator.classList.add("online");
        } else {
            indicator.textContent = "Offline";
            indicator.classList.remove("online");
            indicator.classList.add("offline");
        }
    }
});
