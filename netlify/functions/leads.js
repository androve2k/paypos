const https = require("https");

// Legge i leads da Firebase Realtime Database usando REST API + secret token
// Le credenziali non sono mai esposte al client

exports.handler = async (event) => {

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // ── Verifica API Key ────────────────────────────────────────────
  // L'altro sito deve passare l'header: X-API-Key: <valore>
  const API_KEY = process.env.LEADS_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server non configurato correttamente" }),
    };
  }

  const requestKey = event.headers["x-api-key"];
  if (!requestKey || requestKey !== API_KEY) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Non autorizzato" }),
    };
  }

  // ── Legge da Firebase via REST API ─────────────────────────────
  // Usa il Database Secret (variabile d'ambiente, mai nel codice)
  const DB_URL = process.env.FIREBASE_DB_URL;
  const DB_SECRET = process.env.FIREBASE_DB_SECRET;

  if (!DB_URL || !DB_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configurazione Firebase mancante" }),
    };
  }

  const url = `${DB_URL}/leads.json?auth=${DB_SECRET}`;

  try {
    const data = await fetchJson(url);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Errore lettura database: " + err.message }),
    };
  }
};

// Helper: fetch con https nativo (no dipendenze esterne)
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error("Risposta non valida dal database"));
        }
      });
    }).on("error", reject);
  });
}
