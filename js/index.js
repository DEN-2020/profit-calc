// Offline / Online indicator
function updateStatus() {
    const btn = document.getElementById("statusBtn");
        if (navigator.onLine) {
                btn.innerText = "ONLINE";
                        btn.classList.add("online");
                                btn.classList.remove("offline");
                                    } else {
                                            btn.innerText = "OFFLINE";
                                                    btn.classList.add("offline");
                                                            btn.classList.remove("online");
                                                                }
                                                                }
                                                                window.addEventListener("online", updateStatus);
                                                                window.addEventListener("offline", updateStatus);
                                                                updateStatus();

                                                                // Register service worker
                                                                if ("serviceWorker" in navigator) {
                                                                    navigator.serviceWorker.register("service-worker.js");
                                                                    }

                                                                    // Simple chart placeholder
                                                                    const canvas = document.getElementById("chart");
                                                                    const ctx = canvas.getContext("2d");

                                                                    function drawChart() {
                                                                        ctx.clearRect(0,0,canvas.width,canvas.height);
                                                                            ctx.strokeStyle = "#4bb8ff";
                                                                                ctx.lineWidth = 2;
                                                                                    ctx.beginPath();
                                                                                        ctx.moveTo(10, 150);
                                                                                            ctx.lineTo(80, 80);
                                                                                                ctx.lineTo(150, 120);
                                                                                                    ctx.lineTo(220, 60);
                                                                                                        ctx.lineTo(300, 110);
                                                                                                            ctx.stroke();
                                                                                                            }
                                                                                                            drawChart();