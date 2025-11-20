// Remplacement de 'var socket = io.connect(...)'
var socket;
var channel = prompt("Enter signaling channel name:");

function connectWebSocket() {
  // Utiliser le protocole 'ws' (WebSocket)
  socket = new WebSocket("ws://localhost:8181");

  socket.onopen = function () {
    console.log("WebSocket connection opened.");
    // Envoyer l'événement 'create or join' encapsulé dans un JSON
    socket.send(JSON.stringify({ type: "join", channel: channel }));
  };

  socket.onmessage = function (event) {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "status") {
        // Gérer les messages de statut (création, jointure, etc.)
        console.log("Server Status:", data.message);
      } else if (data.type === "sdp" || data.type === "candidate") {
        // Gérer les messages de signalisation WebRTC (SDP ou ICE)
        // Appeler les fonctions de gestion de l'offre/réponse/candidat
        // ... logic to handle WebRTC signaling messages ...
        console.log("Received WebRTC signal:", data);
      }
    } catch (e) {
      console.error("Error parsing message:", e);
    }
  };

  // Gérer les fermetures et erreurs de connexion
  socket.onclose = function () {
    console.log("WebSocket connection closed.");
  };
  socket.onerror = function (error) {
    console.error("WebSocket error:", error);
  };
}

if (channel !== "") {
  connectWebSocket();
}

// Pour envoyer un message de signalisation (ex: une offre SDP)
function sendSignal(type, payload) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: type, // 'sdp', 'candidate', etc.
        channel: channel,
        payload: payload,
      })
    );
  }
}
