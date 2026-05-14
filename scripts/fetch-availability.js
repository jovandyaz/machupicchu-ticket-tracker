#!/usr/bin/env node
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

const FUTURE_DAYS_TO_FETCH = [1, 2, 3];

async function fetchJSON(url, options = {}) {
  const resp = await fetch(url, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
  });
  if (!resp.ok) throw new Error(`${url} returned ${resp.status}`);
  return resp.json();
}

async function fetchServerTime() {
  const data = await fetchJSON(`${API_BASE}/comunes/tiempo-servidor`);
  return data.tiempoServidor;
}

function signRequest(timestamp) {
  const message = `${SECRET_KEY}:${timestamp}`;
  const hash = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(message)
    .digest("base64");
  return { hash, timestamp: timestamp.toString() };
}

async function getAvailabilityByRoute(fecha) {
  const serverMs = await fetchServerTime();
  const { hash, timestamp } = signRequest(serverMs);
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
    `${API_BASE}/recaudador/ticket/tickets-por-fecha/${fecha}`,
  );
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function buildRecord({ serverTime, date, time, targetDate, ticketsForTarget, routeAvailability }) {
  const routes = Array.isArray(routeAvailability)
    ? routeAvailability.map((r) => ({
        route: r.ruta,
        circuit: r.circuito,
        capacity: r.ncupo,
        available: r.ncupoActual,
        sold: r.ncupo - r.ncupoActual,
      }))
    : [];

  const total_capacity = routes.reduce((s, r) => s + r.capacity, 0);
  const total_sold = routes.reduce((s, r) => s + r.sold, 0);
  const total_available = routes.reduce((s, r) => s + r.available, 0);

  return {
    timestamp: serverTime,
    date,
    time,
    target_date: targetDate,
    tickets_sold_for_target_date: ticketsForTarget?.totalticket ?? null,
    total_capacity,
    total_sold,
    total_available,
    routes,
  };
}

async function main() {
  if (!SECRET_KEY) {
    console.error("Error: TUBOLETO_SECRET_KEY env var is required");
    process.exit(1);
  }

  const serverMs = await fetchServerTime();
  const peruDate = new Date(serverMs - 5 * 60 * 60 * 1000);
  const serverTime = peruDate.toISOString().replace("Z", "");
  const date = serverTime.split("T")[0];
  const time = serverTime.split("T")[1].split(".")[0];

  const targetDates = FUTURE_DAYS_TO_FETCH.map((offset) => addDays(date, offset));

  const results = await Promise.all(
    targetDates.map(async (targetDate) => {
      const [ticketsForTarget, routeAvailability] = await Promise.all([
        getTicketsSoldByDate(targetDate),
        getAvailabilityByRoute(targetDate),
      ]);
      return buildRecord({
        serverTime,
        date,
        time,
        targetDate,
        ticketsForTarget,
        routeAvailability,
      });
    }),
  );

  const year = date.split("-")[0];
  const month = date.split("-")[1];
  const monthDir = path.join(DATA_DIR, year, month);
  fs.mkdirSync(monthDir, { recursive: true });
  const dailyFile = path.join(monthDir, `${date}.jsonl`);
  const payload = results.map((r) => JSON.stringify(r)).join("\n") + "\n";
  fs.appendFileSync(dailyFile, payload);

  for (const record of results) {
    console.log(
      `[${record.timestamp}] target=${record.target_date} sold=${record.total_sold}/${record.total_capacity} (entregados:${record.tickets_sold_for_target_date})`,
    );
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
