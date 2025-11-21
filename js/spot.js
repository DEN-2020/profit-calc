// --------------------------
// Offline Indicator
// --------------------------
function updateOfflineStatus() {
  const ind = document.getElementById("offline-indicator");
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
// Local Storage
// --------------------------
function loadSaved() {
  ["symbol","capital","entry","tp","sl","fee"].forEach(id=>{
    const val = localStorage.getItem("spot_"+id);
    if(val!==null) document.getElementById(id).value = val;
  });
}
function saveValue(id) {
  localStorage.setItem("spot_"+id, document.getElementById(id).value);
}

["symbol","capital","entry","tp","sl","fee"].forEach(id=>{
  document.getElementById(id).addEventListener("input", ()=>saveValue(id));
});
loadSaved();


// --------------------------
// MAIN CALCULATOR
// --------------------------
document.getElementById("spot-calc-btn").addEventListener("click", ()=>{

  const sym  = document.getElementById("symbol").value.trim();
  const capital = parseFloat(document.getElementById("capital").value);
  const entry   = parseFloat(document.getElementById("entry").value);
  const tp      = parseFloat(document.getElementById("tp").value);
  const slVal   = document.getElementById("sl").value;
  const sl      = slVal===""? null : parseFloat(slVal);
  const feePct  = parseFloat(document.getElementById("fee").value);

  const out = document.getElementById("spot-result");

  if(!capital || !entry || !tp){
    out.innerHTML = `<div class='error'>Fill capital, entry and TP</div>`;
    return;
  }

  const size = capital / entry;
  const profit = (tp - entry) * size;

  const feeRate = feePct/100;
  const feeEntry = size*entry * feeRate;
  const feeExit  = size*tp    * feeRate;
  const totalFees = feeEntry + feeExit;

  const net = profit - totalFees;
  const roe = (net/capital)*100;

  let riskBlock = "";
  if(sl){
    const slLoss = (entry - sl) * size;
    const feeSlExit = size*sl * feeRate;
    const netLoss = slLoss + feeEntry + feeSlExit;
    const riskPct = (netLoss/capital)*100;
    const rr = netLoss>0 ? net/netLoss : null;

    riskBlock = `
      <br><b>SL Risk:</b><br>
      Loss: -${netLoss.toFixed(2)}$<br>
      Risk %: -${riskPct.toFixed(2)}%<br>
      R:R = ${rr? rr.toFixed(2):"—"}
    `;
  }

  out.innerHTML = `
    <b>Symbol:</b> ${sym || "—"} <br>
    <b>Position size:</b> ${size.toFixed(6)} ${sym || ""}<br>
    <b>Gross profit:</b> ${profit.toFixed(2)}$<br>
    <b>Total fees:</b> ${totalFees.toFixed(2)}$<br>
    <b>Net profit:</b> ${net.toFixed(2)}$<br>
    <b>ROE:</b> ${roe.toFixed(2)}%
    ${riskBlock}
  `;

  drawChart(entry, tp, sl);

  // --------------------------
// Position chart (Entry / TP / SL on a line)
// --------------------------
function drawChart(entry, tp, sl) {
  const box = document.getElementById("spot-chart");
  box.innerHTML = "";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 320 160");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "160");

  // background
  const bg = document.createElementNS(svgNS, "rect");
  bg.setAttribute("x", 0);
  bg.setAttribute("y", 0);
  bg.setAttribute("width", 320);
  bg.setAttribute("height", 160);
  bg.setAttribute("rx", 12);
  bg.setAttribute("fill", "#11161f");
  svg.appendChild(bg);

  const values = sl ? [entry, tp, sl] : [entry, tp];
  let minP = Math.min(...values);
  let maxP = Math.max(...values);

  if (maxP === minP) {         // защита от деления на 0
    maxP += 1;
    minP -= 1;
  }

  const pad = (maxP - minP) * 0.15;
  minP -= pad;
  maxP += pad;

  // конвертация цены в X-координату
  function x(price) {
    const left = 30;
    const right = 290;
    return left + ((price - minP) / (maxP - minP)) * (right - left);
  }

  const baseY = 110;
  const topY  = 45;

  // базовая линия
  const base = document.createElementNS(svgNS, "line");
  base.setAttribute("x1", 30);
  base.setAttribute("x2", 290);
  base.setAttribute("y1", baseY);
  base.setAttribute("y2", baseY);
  base.setAttribute("stroke", "#303645");
  base.setAttribute("stroke-width", "2");
  svg.appendChild(base);

  function drawMarker(price, color, label) {
    const xPos = x(price);

    // вертикальная линия
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", xPos);
    line.setAttribute("x2", xPos);
    line.setAttribute("y1", baseY);
    line.setAttribute("y2", topY);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);

    // кружочек на вершине
    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("cx", xPos);
    dot.setAttribute("cy", topY);
    dot.setAttribute("r", 4);
    dot.setAttribute("fill", color);
    svg.appendChild(dot);

    // подпись под осью
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", xPos);
    text.setAttribute("y", baseY + 18);
    text.setAttribute("fill", color);
    text.setAttribute("font-size", "11");
    text.setAttribute("text-anchor", "middle");
    text.textContent = `${label} ${price}`;
    svg.appendChild(text);
  }

  // порядок: SL — Entry — TP (если цены соответствуют)
  if (sl != null && !Number.isNaN(sl)) {
    drawMarker(sl, "#ff5e5e", "SL");
  }
  drawMarker(entry, "#4bb8ff", "Entry");
  drawMarker(tp, "#51ff84", "TP");

  box.appendChild(svg);
}
