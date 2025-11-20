// Compatibilité entre navigateurs
navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia;

const videoElement = document.querySelector("#localVideo");

// Ajout des contraintes de capture
const constraints = {
  audio: true,
  video: {
    width: { ideal: 1280 }, // largeur idéale
    height: { ideal: 720 }, // hauteur idéale
    frameRate: { ideal: 30, max: 60 }, // images par seconde
  },
};

// Fonction de succès : affiche la vidéo
function successCallback(stream) {
  window.stream = stream;
  if ("srcObject" in videoElement) {
    videoElement.srcObject = stream;
  } else {
    videoElement.src = window.URL.createObjectURL(stream);
  }
  videoElement.play();
}

// Fonction d’erreur
function errorCallback(error) {
  console.error("Erreur getUserMedia : ", error);
  alert("Impossible d’accéder à la caméra/micro. Vérifie les autorisations.");
}

// Appel à getUserMedia avec contraintes
navigator.mediaDevices
  .getUserMedia(constraints)
  .then(successCallback)
  .catch(errorCallback);
