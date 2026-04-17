#!/usr/bin/env node
// Fetch Machu Picchu ticket availability per route and save to daily log
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const API_BASE = "https://api-tuboleto.cultura.pe";
const SECRET_KEY = process.env.TUBOLETO_SECRET_KEY;
const DATA_DIR = path.join(__dirname, "..", "data");

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  Origin: "https://www.tuboleto.cultura.pe",
  Referer: "https://www.tuboleto.cultura.pe/",
};

async function fetchJSON(url, options = {}) {
  const resp = await fetch(url, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
  });
  if (!resp.ok) throw new Error(`${url} returned ${resp.status}`);
  return resp.json();
}

async function generateHash() {
  const timeData = await fetchJSON(`${API_BASE}/comunes/tiempo-servidor`);
  const timestamp = timeData.tiempoServidor.toString();
  const message = `${SECRET_KEY}:${timestamp}`;
  const hash = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(message)
    .digest("base64");
  return { hash, timestamp };
}

async function getAvailabilityByRoute(fecha) {
  const { hash, timestamp } = await generateHash();
  return fetchJSON(`${API_BASE}/comunes/disponibilidad-actual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lugar: "llaqta_machupicchu",
      fecha,
      punto: 5,
      code: hash,
      timestamp,
    }),
  });
}

async function getTicketsSoldByDate(fecha) {
  return fetchJSON(
    `${API_BASE}/recaudador/ticket/tickets-por-fecha/${fecha}`
  );
}

function getNextDay(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

async function main() {
  if (!SECRET_KEY) {
    console.error("Error: TUBOLETO_SECRET_KEY env var is required");
    process.exit(1);
  }

  // Get server time (Peru timezone, UTC-5)
  const timeData = await fetchJSON(`${API_BASE}/comunes/tiempo-servidor`);
  const serverMs = timeData.tiempoServidor;
  const peruDate = new Date(serverMs - 5 * 60 * 60 * 1000);
  const serverTime = peruDate.toISOString().replace("Z", "");
  const date = serverTime.split("T")[0];
  const time = serverTime.split("T")[1].split(".")[0];
  const tomorrow = getNextDay(date);

  const year = date.split("-")[0];
  const month = date.split("-")[1];

  // Create directory
  const monthDir = path.join(DATA_DIR, year, month);
  fs.mkdirSync(monthDir, { recursive: true });

  // Fetch data
  const [ticketsToday, routeAvailability] = await Promise.all([
    getTicketsSoldByDate(date),
    getAvailabilityByRoute(tomorrow),
  ]);

  // Build per-route breakdown
  const routes = Array.isArray(routeAvailability)
    ? routeAvailability.map((r) => ({
        route: r.ruta,
        circuit: r.circuito,
        capacity: r.ncupo,
        available: r.ncupoActual,
        sold: r.ncupo - r.ncupoActual,
      }))
    : [];

  const totalCapacity = routes.reduce((s, r) => s + r.capacity, 0);
  const totalSold = routes.reduce((s, r) => s + r.sold, 0);
  const totalAvailable = routes.reduce((s, r) => s + r.available, 0);

  const record = {
    timestamp: serverTime,
    date,
    time,
    target_date: tomorrow,
    tickets_sold_today: ticketsToday.totalticket ?? null,
    total_capacity: totalCapacity,
    total_sold: totalSold,
    total_available: totalAvailable,
    routes,
  };

  // Append to daily JSONL file
  const dailyFile = path.join(monthDir, `${date}.jsonl`);
  fs.appendFileSync(dailyFile, JSON.stringify(record) + "\n");

  console.log(
    `[${serverTime}] Tickets sold today: ${ticketsToday.totalticket} | Tomorrow availability: ${totalSold}/${totalCapacity} sold`
  );
  routes.forEach((r) =>
    console.log(`  ${r.route}: ${r.sold}/${r.capacity} sold, ${r.available} available`)
  );
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
