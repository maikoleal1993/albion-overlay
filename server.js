const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// CONFIGURACIÓN
const PLAYER_ID = "PEGA_AQUI_EL_ID_DE_CALISTTENIA";
const PLAYER_NAME = "Calisttenia";
const SERVER = "Europe";

// Estado en memoria
let stats = {
  kills: 0,
  deaths: 0,
  profit: 0,
  lastEventId: null
};

// Servir frontend
app.use(express.static("public"));

// Endpoint para el overlay
app.get("/stats", (req, res) => {
  res.json(stats);
});

// Actualización desde Albion
async function updateStats() {
  try {
    const url = `https://gameinfo.albiononline.com/api/gameinfo/players/${PLAYER_ID}/events?limit=10&offset=0&server=${SERVER}`;
    const response = await fetch(url);
    const events = await response.json();

    if (!Array.isArray(events) || events.length === 0) return;

    for (const event of events.reverse()) {
      if (event.EventId === stats.lastEventId) continue;

      const victimValue =
        (event.Victim?.Equipment?.EstimatedValue || 0) +
        (event.Victim?.Inventory?.EstimatedValue || 0);

      // Kill
      if (event.Killer?.Id === PLAYER_ID) {
        stats.kills += 1;
        stats.profit += victimValue;
      }

      // Death
      if (event.Victim?.Id === PLAYER_ID) {
        stats.deaths += 1;
        stats.profit -= victimValue;
      }

      stats.lastEventId = event.EventId;
    }
  } catch (err) {
    console.error("Error actualizando stats:", err.message);
  }
}

// Polling cada 15s
setInterval(updateStats, 15000);

// Arranque
app.listen(PORT, () => {
  console.log("🔥 Albion Overlay Calisttenia EU – Silver estimado activo");
});
