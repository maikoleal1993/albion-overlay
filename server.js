const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// CONFIGURACIÓN FIJA
const PLAYER_NAME = "calisttenia";
const POLL_INTERVAL = 60000;

const sessions = {};

app.use(express.static("public"));

async function fetchEvents() {
  try {
    const url = `https://gameinfo.albiononline.com/api/gameinfo/players/${PLAYER_NAME}/kills`;
    const res = await axios.get(url);
    return res.data;
  } catch {
    return [];
  }
}

setInterval(async () => {
  const events = await fetchEvents();

  for (const key in sessions) {
    const session = sessions[key];

    for (const e of events) {
      if (session.processed.has(e.EventId)) continue;

      const eventTime = new Date(e.TimeStamp).getTime();
      if (eventTime < session.startTime) continue;

      session.processed.add(e.EventId);

      if (e.Killer?.Name === PLAYER_NAME) {
        session.kills++;
        session.profit += e.TotalVictimKillFame || 0;
      }

      if (e.Victim?.Name === PLAYER_NAME) {
        session.deaths++;
        session.profit -= e.TotalVictimKillFame || 0;
      }
    }
  }
}, POLL_INTERVAL);

app.get("/stats", (req, res) => {
  const sessionId = req.query.session || "default";
  const key = `${PLAYER_NAME}_${sessionId}`;

  if (!sessions[key]) {
    sessions[key] = {
      startTime: Date.now(),
      kills: 0,
      deaths: 0,
      profit: 0,
      processed: new Set()
    };
  }

  const s = sessions[key];
  res.json({
    player: PLAYER_NAME,
    kills: s.kills,
    deaths: s.deaths,
    profit: s.profit
  });
});

app.listen(PORT, () => {
  console.log("Albion Overlay activo");
});
