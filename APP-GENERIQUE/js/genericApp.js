// --- Variables Globales ---
var localStream;
var pc; // RTCPeerConnection
var signalingConnection; // Instance de la connexion (Socket.io ou WebSocket)
var isInitiator = false;
var channel;
var dataType;
var localDataChannel; // Le canal de données créé (envoyeur)
var remoteDataChannel; // Le canal de données reçu (récepteur)

// Références DOM
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startAppButton = document.getElementById("startApp");
const hangupButton = document.getElementById("hangupButton");
const dataSend = document.getElementById("dataChannelSend");
const dataReceive = document.getElementById("dataChannelReceive");
const sendDataButton = document.getElementById("sendDataButton");
const scratchPad = document.getElementById("scratchPad");

// Configuration ICE/STUN
const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

startAppButton.onclick = initializeApplication;
// Ajout du gestionnaire pour le raccrochage
hangupButton.onclick = hangup;
sendDataButton.onclick = sendData;


// Fonctions de Signalisation

// Fonction pour envoyer un message de signalisation, indépendamment de la technologie
function sendMessage(message) {
  if (signalingConnection.tech === "socketio") {
    signalingConnection.send({ channel: channel, message: message });
  } else if (signalingConnection.tech === "websocket") {
    // Envoie un objet JSON standard
    signalingConnection.send(JSON.stringify({ 
        type: "signal", 
        channel: channel, 
        payload: message 
    }));
  }
  console.log("Signal sent:", message);
}

// Implémentation de WebSocket Natif 
function initWebSocketNative(channel) {
    const ws = new WebSocket('ws://localhost:8181'); 

    ws.onopen = () => {
        console.log("WS connected. Sending JOIN.");
        ws.send(JSON.stringify({ type: 'join', channel: channel }));
    };

    ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        // La logique du serveur WS doit relayer les messages 'join', 'signal', 'peerJoined', etc.
        if (data.type === 'peerJoined') { isInitiator = true; startCall(); }
        if (data.type === 'signal' && pc && data.payload) {
            await handleSignalingMessage(data.payload);
        }
    };

    return { tech: "websocket", send: (msg) => ws.send(msg) };
}

// Fonction pour initialiser la connexion Socket.io
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


// Logique WebRTC Core

async function startLocalMedia() {
  const constraints = { audio: true, video: true };
  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  localVideo.srcObject = localStream;
}

function startCall() {
  scratchPad.innerHTML += `<p>Connexion WebRTC démarrée (Initiateur: ${isInitiator})</p>`;
  document.getElementById("controls").style.display = "block"; // Afficher les contrôles

  pc = new RTCPeerConnection(servers);
  pc.onicecandidate = gotIceCandidate;
  pc.ontrack = gotRemoteStream;
  pc.onconnectionstatechange = handleConnectionStateChange;

  // Ajout du flux local
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  // Si le canal de données est demandé (RTCDataChannel)
  if (dataType === "rtc" && isInitiator) {
    localDataChannel = pc.createDataChannel("chat");
    localDataChannel.onopen = handleSendChannelStateChange;
    localDataChannel.onclose = handleSendChannelStateChange;
    console.log("RTCDataChannel créé.");
  }

  // Le récepteur attend ondatachannel pour recevoir le canal de données.
  pc.ondatachannel = (event) => {
    if (dataType === "rtc") {
        remoteDataChannel = event.channel;
        remoteDataChannel.onopen = handleReceiveChannelStateChange;
        remoteDataChannel.onclose = handleReceiveChannelStateChange;
        remoteDataChannel.onmessage = handleMessage;
      console.log("RTCDataChannel reçu.");
    }
  };

  if (isInitiator) {
    pc.createOffer().then(setLocalAndSendMessage).catch(onError);
  }
}

// Gestion des changements d'état de la connexion ICE
function handleConnectionStateChange() {
    scratchPad.innerHTML += `<p>État de connexion: ${pc.connectionState}</p>`;
}

// Gestion des changements d'état du canal de données ENVOYEUR
function handleSendChannelStateChange() {
    const readyState = localDataChannel.readyState;
    scratchPad.innerHTML += `<p>Canal de données (Envoi) état: ${readyState}</p>`;
    if (readyState === "open") {
        dataSend.disabled = false;
        sendDataButton.disabled = false;
        dataReceive.disabled = false; // Permet de voir la fenêtre de réception
    } else {
        dataSend.disabled = true;
        sendDataButton.disabled = true;
    }
}

// Gestion des changements d'état du canal de données RÉCEPTEUR
function handleReceiveChannelStateChange() {
    const readyState = remoteDataChannel.readyState;
    scratchPad.innerHTML += `<p>Canal de données (Réception) état: ${readyState}</p>`;
}

// Gestion de la réception de message via RTCDataChannel
function handleMessage(event) {
    console.log("Message reçu:", event.data);
    dataReceive.value += 'Pair: ' + event.data + '\n';
}

// Envoi de données via RTCDataChannel (ou simulé via WebSocket si mode différent)
function sendData() {
    const data = dataSend.value;
    if (dataType === 'rtc' && localDataChannel && localDataChannel.readyState === 'open') {
        localDataChannel.send(data);
        dataReceive.value += 'Moi: ' + data + '\n';
        dataSend.value = '';
    } else {
        alert("Le canal de données n'est pas prêt ou n'est pas en mode RTC.");
    }
}


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

// Fonction pour raccrocher la connexion (Fonctionnalité ajoutée)
function hangup() {
    if (localDataChannel) localDataChannel.close();
    if (remoteDataChannel) remoteDataChannel.close();
    if (pc) pc.close();
    pc = null;
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    
    // Rétablir l'interface de configuration
    document.getElementById("config").style.display = "block";
    document.getElementById("controls").style.display = "none";
    scratchPad.innerHTML += `<p style="color:blue">Session terminée et déconnectée.</p>`;
}




async function initializeApplication() {
  const sigTech = document.getElementById("signalingTech").value;
  dataType = document.getElementById("dataType").value;
  channel = document.getElementById("channelName").value;

  if (!channel) return alert("Veuillez entrer un nom de canal.");

  // 1. Démarrer la capture média
  try {
    await startLocalMedia();
  } catch (e) {
    return; // Arrêter si le média échoue
  }

  // 2. Initialiser la connexion de signalisation choisie
  if (sigTech === "socketio") {
    signalingConnection = initSocketIO(channel);
  } else if (sigTech === "websocket") {
    signalingConnection = initWebSocketNative(channel);
  } else {
      alert("Technologie de signalisation non supportée dans cette version.");
      return;
  }
  
  // Cacher l'interface de configuration
  document.getElementById("config").style.display = "none";
  scratchPad.innerHTML += `<p>Démarré avec Signalisation: ${sigTech}, Données: ${dataType}</p>`;
}
