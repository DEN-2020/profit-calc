// =============== Spot Calculator Logic ===============
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btn-calc-spot");
    const resultBlock = document.getElementById("spot-result");

    if (!btn) return;

    btn.addEventListener("click", () => {
        const capital = parseFloat(document.getElementById("capital")?.value);
        const entry   = parseFloat(document.getElementById("entry")?.value);
        const exit    = parseFloat(document.getElementById("exit")?.value);
        const stopVal = document.getElementById("sl")?.value;
        const stop    = stopVal ? parseFloat(stopVal) : null;
        const feePct  = parseFloat(document.getElementById("fee")?.value);

        // ---- VALIDATION ----
        if (!capital || capital <= 0) return showError("Enter valid margin.");
        if (!entry || entry <= 0)     return showError("Entry price required.");
        if (!exit || exit <= 0)       return showError("Exit price required.");
        if (!feePct || feePct < 0)    return showError("Fee must be >= 0.");

        // ---- CALCULATIONS ----
        const positionSize = capital / entry; // amount of coin (spot always x1)

        const grossProfit = (exit - entry) * positionSize;

        const feeRate = feePct / 100;

        const volumeEntry = positionSize * entry;
        const volumeExit  = positionSize * exit;

        const totalFees = (volumeEntry + volumeExit) * feeRate;

        const netProfit = grossProfit - totalFees;
        const roe = (netProfit / capital) * 100;

        let riskHTML = "";

        // ---- STOP LOSS CALC ----
        if (stop && stop > 0) {
            const lossPerCoin = entry - stop;

            if (lossPerCoin > 0) {
                const grossLoss = lossPerCoin * positionSize;

                const volumeStop = positionSize * stop;
                const feesSL = (volumeEntry + volumeStop) * feeRate;

                const netLoss = grossLoss + feesSL;
                const riskPct = (netLoss / capital) * 100;
                const rr = netLoss > 0 ? netProfit / netLoss : "---";

                riskHTML = `
                    <div class="result-item risk">
                        <h4>Risk</h4>
                        <p>Potential loss: <b>-${netLoss.toFixed(2)}$</b></p>
                        <p>Risk %: <b>-${riskPct.toFixed(2)}%</b></p>
                        <p>R:R = <b>${typeof rr === "number" ? rr.toFixed(2) : rr}</b></p>
                    </div>
                `;
            }
        }

        // ---- RENDER RESULT ----
        resultBlock.innerHTML = `
            <div class="result-item">
                <p><b>Position size:</b> ${positionSize.toFixed(6)} units</p>
                <p><b>Gross profit:</b> ${grossProfit.toFixed(2)}$</p>
                <p><b>Total fees:</b> ${totalFees.toFixed(2)}$</p>
                <p><b>Net profit:</b> ${netProfit.toFixed(2)}$</p>
                <p><b>ROE:</b> ${roe.toFixed(2)}%</p>
            </div>
            ${riskHTML}
        `;
    });

    // === Helper: show errors ===
    function showError(msg) {
        resultBlock.innerHTML = `<div class="error">${msg}</div>`;
    }
});
