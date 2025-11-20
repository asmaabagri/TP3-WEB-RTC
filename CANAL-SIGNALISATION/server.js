// Importation des dépendances
const Static = require("node-static");
const http = require("http");
// Utilisation de l'importation moderne pour Socket.io (pour éviter l'erreur .listen)
const { Server } = require("socket.io");

// Fichier statique pour servir HTML/JS
const file = new Static.Server();

// Création du serveur HTTP
const app = http.createServer(function (req, res) {
  file.serve(req, res);
});

// Initialisation de Socket.io (Syntaxe V3+)
const io = new Server(app);

// Démarrage de l'écoute du serveur
app.listen(8181, () => {
  console.log("Server is running on http://localhost:8181");
});

// Logique de gestion des connexions Socket.io
io.on("connection", function (socket) {
  // Fonction utilitaire de log (envoie aussi le log au client)
  function log() {
    var array = [">>> "];
    for (var i = 0; i < arguments.length; i++) {
      array.push(arguments[i]);
    }
    socket.emit("log", array);
  }

  // Gestion de l'événement 'message' (relais de données de signalisation)
  socket.on("message", function (message) {
    log("S--> Got message:", message);
    // Envoie le message à tous les clients du canal, sauf l'émetteur
    socket.broadcast.to(message.channel).emit("message", message.message);
  });

  // Gestion de l'événement 'create or join' (gestion du canal et des clients)
  socket.on("create or join", function (channel) {
    // Obtient le nombre de clients dans la "room" (canal)
    const clients = io.sockets.adapter.rooms.get(channel);
    const numClients = clients ? clients.size : 0;

    console.log("numclients " + numClients);

    if (numClients === 0) {
      // Premier client : crée le canal
      socket.join(channel);
      socket.emit("created", channel);
    } else if (numClients === 1) {
      // Deuxième client : joint le canal
      // Notifie le premier pair (l'initiateur) qu'un autre a rejoint
      io.to(channel).emit("remotePeerJoining", channel);
      socket.join(channel);
      // Broadcast (envoie à tous sauf à l'émetteur)
      socket.broadcast
        .to(channel)
        .emit(
          "broadcast: joined",
          "S --> broadcast(): client " +
            socket.id +
            " joined channel " +
            channel
        );
    } else {
      // Canal plein
      console.log("Channel full!");
      socket.emit("full", channel);
    }
  });

  // Gestion de l'événement 'response' (relais d'une réponse de signalisation)
  socket.on("response", function (response) {
    log("S--> Got response: ", response);
    socket.broadcast.to(response.channel).emit("response", response.message);
  });

  // Gestion de la déconnexion initiée par 'Bye'
  socket.on("Bye", function (channel) {
    socket.broadcast.to(channel).emit("Bye");
    // Quitte le canal et la connexion
    socket.leave(channel);
    socket.disconnect();
  });

  // Gestion de l'acquittement 'Ack'
  socket.on("Ack", function () {
    console.log("Got an Ack!");
    socket.disconnect();
  });
});
