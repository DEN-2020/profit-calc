export async function getPrice(symbol = "BTCUSDT") {
    try {
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error("Binance API error");
        const data = await r.json();
        return parseFloat(data.price);
    } catch (err) {
        console.error("Ошибка получения цены:", err);
        return null;
    }
}
