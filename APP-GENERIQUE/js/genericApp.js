// --- Variables Globales ---
var localStream;
var pc; // RTCPeerConnection
var signalingConnection; // Instance de la connexion (Socket.io ou WebSocket)
var isInitiator = false;
var channel;
var dataType;

// Références DOM
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startAppButton = document.getElementById("startApp");
const scratchPad = document.getElementById("scratchPad");

// Configuration ICE/STUN (Utilisation de Google STUN public)
const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

startAppButton.onclick = initializeApplication;

// --- A. Fonctions Génériques de Signalisation ---

// Fonction pour envoyer un message de signalisation, indépendamment de la technologie
function sendMessage(message) {
  if (signalingConnection.tech === "socketio") {
    signalingConnection.send({ channel: channel, message: message });
  } else if (signalingConnection.tech === "websocket") {
    signalingConnection.send(
      JSON.stringify({ type: "signal", channel: channel, payload: message })
    );
  }
  console.log("Signal sent:", message);
}

// Fonction pour initialiser la connexion Socket.io (utilise le code du TP)
function initSocketIO(channel) {
  const socket = io.connect("http://localhost:8181");
  socket.emit("create or join", channel);

  socket.on("created", () => {
    isInitiator = true;
    startCall();
  });
  socket.on("remotePeerJoining", () => {
    if (localStream) startCall();
  });

  socket.on("message", async (message) => {
    if (pc && message.type) {
      await handleSignalingMessage(message);
    }
  });

  return { tech: "socketio", send: (msg) => socket.emit("message", msg) };
}

// NOTE: Pour l'implémentation complète de 'websocket', il faudrait l'intégrer ici
// en utilisant la logique 'new WebSocket(...)' et en gérant les événements 'onmessage' etc.

// --- B. Logique WebRTC Core (Partie Complémentaire du TP) ---

async function startLocalMedia() {
  const constraints = { audio: true, video: true };
  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  localVideo.srcObject = localStream;
}

function startCall() {
  scratchPad.innerHTML += `<p>Connexion WebRTC démarrée (Initiateur: ${isInitiator})</p>`;

  pc = new RTCPeerConnection(servers);
  pc.onicecandidate = gotIceCandidate;
  pc.ontrack = gotRemoteStream;

  // Ajout du flux local
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  // Si le canal de données est demandé, le crée
  if (dataType === "rtc" && isInitiator) {
    const dataChannel = pc.createDataChannel("chat");
    // Vous devez ajouter ici les gestionnaires onopen, onmessage etc.
    console.log("RTCDataChannel créé.");
  }

  // Le récepteur attend ondatachannel pour recevoir le canal de données.
  pc.ondatachannel = (event) => {
    if (dataType === "rtc") {
      // Vous devez ajouter ici les gestionnaires pour le canal de réception
      console.log("RTCDataChannel reçu.");
    }
  };

  if (isInitiator) {
    pc.createOffer().then(setLocalAndSendMessage).catch(onError);
  }
}

// Gestion des messages de signalisation reçus
async function handleSignalingMessage(message) {
  if (message.type === "offer") {
    await pc.setRemoteDescription(new RTCSessionDescription(message));
    pc.createAnswer().then(setLocalAndSendMessage).catch(onError);
  } else if (message.type === "answer" && pc.remoteDescription === null) {
    await pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === "candidate") {
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate,
    });
    await pc.addIceCandidate(candidate);
  }
}

function gotIceCandidate(event) {
  if (event.candidate) {
    sendMessage({
      type: "candidate",
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
    });
  }
}

function gotRemoteStream(event) {
  if (remoteVideo.srcObject !== event.streams[0]) {
    remoteVideo.srcObject = event.streams[0];
    scratchPad.innerHTML += `<p style="color:red">Flux vidéo distant reçu!</p>`;
  }
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  sendMessage(sessionDescription);
}

function onError(error) {
  console.error("WebRTC Error:", error);
}

// --- C. Fonction Principale d'Initialisation (Extension 3) ---

async function initializeApplication() {
  const sigTech = document.getElementById("signalingTech").value;
  dataType = document.getElementById("dataType").value;
  channel = document.getElementById("channelName").value;

  if (!channel) return alert("Veuillez entrer un nom de canal.");

  // 1. Démarrer la capture média (Commune à tous les modes)
  try {
    await startLocalMedia();
  } catch (e) {
    return; // Arrêter si le média échoue
  }

  // 2. Initialiser la connexion de signalisation choisie
  if (sigTech === "socketio") {
    signalingConnection = initSocketIO(channel);
  } else if (sigTech === "websocket") {
    // Logique pour WebSocket natif ici (non détaillée car elle est complexe)
    alert(
      "L'implémentation WebSocket native est complexe et nécessite un serveur différent."
    );
    return;
  }

  // Cacher l'interface de configuration
  document.getElementById("config").style.display = "none";
  scratchPad.innerHTML += `<p>Démarré avec Signalisation: ${sigTech}, Données: ${dataType}</p>`;
}
