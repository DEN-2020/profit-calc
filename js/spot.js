function calcSpot() {
        const cap = +document.getElementById("capital").value || 0;
            const entry = +document.getElementById("entry").value || 0;
                const exit = +document.getElementById("exit").value || 0;
                    const stop = +document.getElementById("stop").value || 0;
                        const feePct = +document.getElementById("fee").value || 0;

                            if (!cap || !entry || !exit) {
                                    result.innerHTML = "Missing inputs";
                                            return;
                                                }

                                                    const size = cap / entry;
                                                        const gross = (exit - entry) * size;

                                                            const feeRate = feePct / 100;
                                                                const fees = (size * entry + size * exit) * feeRate;

                                                                    const net = gross - fees;

                                                                        let slBlock = "";

                                                                            if (stop > 0 && stop < entry) {
                                                                                    const loss = (entry - stop) * size;
                                                                                            const slFees = (size * entry + size * stop) * feeRate;
                                                                                                    const netLoss = loss + slFees;
                                                                                                            const rr = net / netLoss;

                                                                                                                    slBlock = `
                                                                                                                                <br><b>Stop-loss:</b><br>
                                                                                                                                            Risk: -${netLoss.toFixed(2)}$<br>
                                                                                                                                                        R:R = ${rr.toFixed(2)}
                                                                                                                                                                `;
                                                                                                                                                                    }

                                                                                                                                                                        result.innerHTML = `
                                                                                                                                                                                <b>TP Profit:</b><br>
                                                                                                                                                                                        Size: ${size.toFixed(6)}<br>
                                                                                                                                                                                                Gross: ${gross.toFixed(2)}$<br>
                                                                                                                                                                                                        Fees: ${fees.toFixed(2)}$<br>
                                                                                                                                                                                                                <b>Net: ${net.toFixed(2)}$</b>
                                                                                                                                                                                                                        ${slBlock}
                                                                                                                                                                                                                            `;
                                                                                                                                                                                                                            }
}