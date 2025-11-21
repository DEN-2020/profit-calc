function calcPerp() {
        const cap = +document.getElementById("capital").value || 0;
            const entry = +document.getElementById("entry").value || 0;
                const exit = +document.getElementById("exit").value || 0;
                    const stop = +document.getElementById("stop").value || 0;
                        const lev = +document.getElementById("lev").value || 1;
                            const side = document.getElementById("side").value;
                                const feePct = +document.getElementById("fee").value || 0;

                                    if (!cap || !entry || !exit) {
                                            result.innerHTML = "Missing inputs";
                                                    return;
                                                        }

                                                            const size = (cap * lev) / entry;
                                                                const feeRate = feePct / 100;

                                                                    const entryNotional = size * entry;
                                                                        const exitNotional = size * exit;

                                                                            const fees = (entryNotional + exitNotional) * feeRate;

                                                                                const profitPerCoin = side === "long" ? exit - entry : entry - exit;

                                                                                    const gross = profitPerCoin * size;
                                                                                        const net = gross - fees;

                                                                                            let slBlock = "";

                                                                                                if (stop > 0) {
                                                                                                        const lossPer = side === "long" ? entry - stop : stop - entry;
                                                                                                                const loss = lossPer * size;

                                                                                                                        const slNotional = size * stop;
                                                                                                                                const slFees = (entryNotional + slNotional) * feeRate;

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