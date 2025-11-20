const express = require("express");
const http = require("http");
const Static = require("node-static");
const path = require("path");

const app = express();
const PORT = 8181;

// Configuration pour servir les fichiers statiques (index.html, scripts)
const fileServer = new Static.Server(path.join(__dirname));
app.use((req, res, next) => {
  // Si la requête ne correspond pas à une route Express, servir le fichier statique
  if (!req.path.startsWith("/signal")) {
    fileServer.serve(req, res, (e) => {
      if (e && e.status === 404) {
        // Si le fichier n'est pas trouvé
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    });
  } else {
    next();
  }
});

app.use(express.json()); // Pour analyser les corps de requêtes JSON (messages SDP/ICE)

// --- Stockage des messages et connexions en attente ---
const channelMessages = {}; // { 'channelName': [{ senderId: 'id', message: {} }, ...] }
const waitingPolls = {}; // { 'peerId': [response_object, ...] }

// --- 1. Endpoint pour ENVOYER les messages de signalisation ---
app.post("/signal/send", (req, res) => {
  const { channel, senderId, message } = req.body;

  if (!channel || !senderId || !message) {
    return res.status(400).send({ error: "Missing parameters." });
  }

  // Déterminer le pair cible (le seul autre pair dans le canal)
  if (!channelMessages[channel]) {
    channelMessages[channel] = [];
  }

  // Le message est stocké pour l'autre pair (le "destinataire")
  const signalMessage = { senderId, message };

  // Stocker le message
  channelMessages[channel].push(signalMessage);

  // Vérifier si le pair cible est en attente (Long Polling)
  const waitingRes = waitingPolls[channel];

  if (waitingRes && waitingRes.length > 0) {
    // Si le pair cible est en attente, répondre immédiatement
    waitingRes.forEach((response) => {
      response.json({ message: signalMessage });
    });
    waitingPolls[channel] = []; // Vider les requêtes en attente
  }

  res
    .status(200)
    .send({ status: "Message sent and relayed if peer was polling." });
});

// --- 2. Endpoint pour RECEVOIR les messages (Long Polling) ---
app.get("/signal/poll", (req, res) => {
  const { channel, peerId } = req.query;

  if (!channel || !peerId) {
    return res.status(400).send({ error: "Missing parameters." });
  }

  const messages = channelMessages[channel] || [];

  // 1. Chercher si des messages en attente existent pour CE peerId
  const messagesForPeer = messages.filter((msg) => {
    // Le serveur ne sait pas qui est l'autre pair, il doit donc laisser l'autre pair
    // identifier le message qui lui est destiné par son senderId.
    // Puisque nous sommes en P2P simple, on suppose que tout message non envoyé par
    // CE peerId est destiné à CE peerId.

    // Dans un système réel, une gestion des sessions/peers par canal serait nécessaire.
    return msg.senderId !== peerId;
  });

  if (messagesForPeer.length > 0) {
    // 2. Si des messages sont trouvés, les renvoyer et les supprimer
    const messageToRelay = messagesForPeer[0]; // Simplification : ne renvoie qu'un message

    // Supprimer le message après l'envoi (simplification pour le P2P)
    channelMessages[channel] = messages.filter((msg) => msg !== messageToRelay);

    return res.json({ message: messageToRelay });
  } else {
    // 3. Sinon, mettre la requête en attente (Long Polling)
    if (!waitingPolls[channel]) {
      waitingPolls[channel] = [];
    }
    waitingPolls[channel].push(res);

    // Optionnel : Définir un timeout (ex: 30 secondes) pour éviter que la connexion ne reste bloquée indéfiniment
    req.on("close", () => {
      // Supprimer cette requête de la liste si le client se déconnecte
      waitingPolls[channel] = waitingPolls[channel].filter((r) => r !== res);
    });
  }
});

http.createServer(app).listen(PORT, () => {
  console.log(`XHR Signaling Server running on http://localhost:${PORT}`);
});
