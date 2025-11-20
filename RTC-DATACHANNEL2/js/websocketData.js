var socket; // La connexion WebSocket
var sendButton = document.getElementById("sendButton");
var startButton = document.getElementById("startButton");
var closeButton = document.getElementById("closeButton");
var dataChannelSend = document.getElementById("dataChannelSend");
var dataChannelReceive = document.getElementById("dataChannelReceive");

startButton.onclick = createWebSocketConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeWebSocket;

// Initialisation de l'état des boutons
startButton.disabled = false;
sendButton.disabled = true;
closeButton.disabled = true;
dataChannelSend.disabled = true;

function createWebSocketConnection() {
  // Remplacer par l'adresse de votre serveur (ex: le serveur NodeJS de la partie 3)
  var serverAddress = "ws://localhost:8181";
  socket = new WebSocket(serverAddress);

  // Événements WebSocket
  socket.onopen = function (event) {
    console.log("WebSocket connected.");
    startButton.disabled = true;
    sendButton.disabled = false;
    closeButton.disabled = false;
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    dataChannelSend.placeholder = "";
  };

  socket.onmessage = function (event) {
    console.log("Received message:", event.data);
    // Affiche les données reçues
    dataChannelReceive.value = event.data;
  };

  socket.onclose = function (event) {
    console.log("WebSocket disconnected.");
    resetUI();
  };

  socket.onerror = function (error) {
    console.error("WebSocket error:", error);
    resetUI();
  };
}

function sendData() {
  var data = dataChannelSend.value;
  if (socket && socket.readyState === WebSocket.OPEN) {
    // Envoie les données au serveur
    socket.send(data);
    console.log("Sent data:", data);
    dataChannelSend.value = ""; // Efface la zone d'envoi après l'envoi
  } else {
    alert("WebSocket is not open.");
  }
}

function closeWebSocket() {
  if (socket) {
    socket.close();
  }
  resetUI();
}

function resetUI() {
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.disabled = true;
  dataChannelSend.value = "";
  dataChannelReceive.value = "";
  dataChannelSend.placeholder =
    "1: Press Connect; 2: Enter text; 3: Press Send.";
}
