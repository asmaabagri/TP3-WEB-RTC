var div = document.getElementById("scratchPad");
var channel = prompt("Enter signaling channel name:");
// Identifiant unique pour ce pair (nécessaire pour le serveur pour identifier l'expéditeur)
var PEER_ID = Math.random().toString(36).substring(2);

// Fonction pour envoyer un message de signalisation (SDP ou ICE) via XHR (fetch)
function sendSignal(type, payload) {
  div.insertAdjacentHTML(
    "beforeEnd",
    `<p style="color:red">Sending signal: ${type}</p>`
  );

  fetch("/signal/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel: channel,
      senderId: PEER_ID,
      message: {
        type: type, // 'offer', 'answer', 'candidate'
        payload: payload,
      },
    }),
  })
    .then((response) => {
      if (!response.ok) {
        console.error("Failed to send signal via XHR.");
      }
    })
    .catch((e) => console.error("Error sending signal:", e));
}

// Fonction pour démarrer le Long Polling (réception de messages)
function startPolling() {
  div.insertAdjacentHTML(
    "beforeEnd",
    '<p style="color:green">Starting Long Polling...</p>'
  );

  function poll() {
    // Envoie une requête GET. Le serveur la maintient ouverte s'il n'y a pas de message.
    fetch(`/signal/poll?channel=${channel}&peerId=${PEER_ID}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.message && data.message.payload) {
          const signal = data.message.payload;
          const type = signal.type;

          div.insertAdjacentHTML(
            "beforeEnd",
            `<p style="color:blue">Received XHR signal: ${type}</p>`
          );
          console.log("Received signal via XHR:", signal);

          // --- Logique de gestion WebRTC ---
          if (type === "offer") {
            // Ici, vous appelleriez pc.setRemoteDescription et pc.createAnswer
          } else if (type === "answer") {
            // Ici, vous appelleriez pc.setRemoteDescription
          } else if (type === "candidate") {
            // Ici, vous appelleriez pc.addIceCandidate
          }
        }

        // Important : Réouvrir immédiatement une nouvelle requête de polling
        poll();
      })
      .catch((error) => {
        // Si la requête échoue ou timeout, réessayer après un délai
        console.error("Polling error, retrying in 2s...", error);
        div.insertAdjacentHTML(
          "beforeEnd",
          '<p style="color:red">Polling failed, retrying...</p>'
        );
        setTimeout(poll, 2000);
      });
  }

  poll(); // Démarrer la première requête de polling
}

if (channel !== "") {
  // Dans une application complète, vous appelleriez ici une fonction d'initialisation
  // qui gère la création/jointure de canal avant de démarrer le polling.
  startPolling();
}

// --- Fonctions d'exemple pour l'intégration WebRTC ---
// Ces fonctions seraient appelées par votre logique RTCPeerConnection (absente ici)

function sendOffer(sdp) {
  sendSignal("offer", sdp);
}
function sendAnswer(sdp) {
  sendSignal("answer", sdp);
}
function sendIceCandidate(candidate) {
  sendSignal("candidate", candidate);
}
