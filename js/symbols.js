export async function loadSymbols() {
  // 1. читаем кеш если есть
  const cached = localStorage.getItem("binance_symbols");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  // 2. тянем с биржи
  try {
    const url = "https://api.binance.com/api/v3/exchangeInfo";
    const r = await fetch(url);
    const data = await r.json();

    // только SPOT + USDT
    const list = data.symbols
      .filter(s => s.status === "TRADING" && s.quoteAsset === "USDT")
      .map(s => s.symbol);

    // 3. кешируем на 24 часа
    localStorage.setItem("binance_symbols", JSON.stringify(list));

    return list;
  } catch (e) {
    console.error("Symbol load error:", e);
    return [];
  }
}
