// Remplace 'socket.io'
const WebSocket = require("ws");
const http = require("http");
const file = new (require("node-static").Server)();

const server = http
  .createServer((req, res) => {
    file.serve(req, res);
  })
  .listen(8181);

const wss = new WebSocket.Server({ server });
const channels = {}; // Structure pour gérer les canaux

wss.on("connection", function connection(ws, req) {
  ws.on("message", function incoming(message) {
    // Le message doit inclure le type d'action (ex: 'join', 'message', 'offer', 'answer')
    // et le canal cible.

    try {
      const data = JSON.parse(message);
      const channel = data.channel;

      if (data.type === "join") {
        if (!channels[channel]) {
          channels[channel] = [];
        }
        if (channels[channel].length < 2) {
          // Limite à deux pairs
          ws.channel = channel; // Stocke le canal sur la connexion
          channels[channel].push(ws);
          // Logique similaire à 'created' ou 'remotePeerJoining'
          if (channels[channel].length === 1) {
            ws.send(
              JSON.stringify({
                type: "status",
                message: `Channel ${channel} created. Initiator.`,
              })
            );
          } else {
            // Notifier l'initiateur qu'un pair a rejoint
            channels[channel][0].send(
              JSON.stringify({
                type: "status",
                message: `Remote peer joined ${channel}.`,
              })
            );
            ws.send(
              JSON.stringify({
                type: "status",
                message: `Joined channel ${channel}.`,
              })
            );
          }
        } else {
          ws.send(
            JSON.stringify({
              type: "error",
              message: `Channel ${channel} is full.`,
            })
          );
        }
      } else if (data.type === "sdp" || data.type === "candidate") {
        // Relais de la signalisation (SDP ou ICE candidate)
        channels[channel].forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message); // Relais le message au pair
          }
        });
      }
    } catch (e) {
      console.error("Invalid JSON message:", e);
    }
  });

  ws.on("close", () => {
    // Gérer la déconnexion et la suppression de la connexion du canal
    if (ws.channel && channels[ws.channel]) {
      channels[ws.channel] = channels[ws.channel].filter(
        (client) => client !== ws
      );
    }
  });
});
