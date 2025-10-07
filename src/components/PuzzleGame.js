import interact from "https://cdn.jsdelivr.net/npm/interactjs@1.10.27/+esm";
import confetti from "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm";
import { Howl } from "https://cdn.jsdelivr.net/npm/howler@2.2.4/+esm";

// Configuración del juego
const CONFIG = {
  rows: 5,
  cols: 5,
  pieceSize: 70,
  imagePath: "./src/assets/img/renso-img.jpeg",
  audioPath: "./src/assets/audio/mp3-rio-roma.mp3", // Aquí pon tu audio
  messages: {
    celebration: "🎉 ¡Felicidades Katherine! Formaste el rompecabezas. Ahora ...",
    question: "¿Te gustaría ser mi compañera para Rosa y Clavel? 🌹 & 🌷",
    yesResponse: "¡Será una noche inolvidable! 💃🕺",
    noResponse: "Oh no... qué tristeza 😢"
  }
};

// Audio de celebración
const celebrationSound = new Howl({
  src: [CONFIG.audioPath],
  volume: 0.6,
  loop: false,
  onloaderror: function() {
    console.warn("No se pudo cargar el audio de celebración");
  }
});

export function initPuzzle() {
  const container = document.getElementById("puzzle-container");
  const { rows, cols } = CONFIG;
  const totalPieces = rows * cols;

  setupContainer(container, rows, cols);
  const shuffledPieces = shuffleArray(createPiecesArray(totalPieces));
  renderPieces(container, shuffledPieces, rows, cols);
  enableDragAndDrop(container);
}

function setupContainer(container, rows, cols) {
  container.classList.add("puzzle-grid");
  container.style.setProperty("--rows", rows);
  container.style.setProperty("--cols", cols);
}

function createPiecesArray(total) {
  return Array.from({ length: total }, (_, i) => i);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function renderPieces(container, pieces, rows, cols) {
  pieces.forEach((index) => {
    const piece = createPuzzlePiece(index, rows, cols);
    container.appendChild(piece);
  });
}

function createPuzzlePiece(index, rows, cols) {
  const piece = document.createElement("div");
  piece.classList.add("puzzle-piece");
  piece.setAttribute("data-index", index);
  piece.setAttribute("data-current-position", index);
  
  piece.style.backgroundImage = `url('${CONFIG.imagePath}')`;
  piece.style.backgroundSize = `${cols * CONFIG.pieceSize}px ${rows * CONFIG.pieceSize}px`;
  
  const col = index % cols;
  const row = Math.floor(index / cols);
  piece.style.backgroundPosition = `-${col * CONFIG.pieceSize}px -${row * CONFIG.pieceSize}px`;
  
  return piece;
}

function enableDragAndDrop(container) {
  interact(".puzzle-piece").draggable({
    inertia: false,
    autoScroll: false,
    modifiers: [
      interact.modifiers.snap({
        targets: [interact.snappers.grid({ x: CONFIG.pieceSize + 3, y: CONFIG.pieceSize + 3 })],
        range: Infinity,
        relativePoints: [{ x: 0, y: 0 }]
      })
    ],
    listeners: {
      start: handleDragStart,
      move: handleDragMove,
      end: (event) => handleDragEnd(event, container),
    },
  });
}

function handleDragStart(event) {
  const target = event.target;
  target.style.zIndex = "1000";
  target.style.transition = "none";
}

function handleDragMove(event) {
  const target = event.target;
  const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
  const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

  target.style.transform = `translate(${x}px, ${y}px)`;
  target.setAttribute("data-x", x);
  target.setAttribute("data-y", y);
}

function handleDragEnd(event, container) {
  const target = event.target;
  const rect = target.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  target.style.pointerEvents = "none";
  const dropzone = document.elementFromPoint(centerX, centerY);
  target.style.pointerEvents = "auto";
  
  if (dropzone?.classList.contains("puzzle-piece") && dropzone !== target) {
    swapPieces(target, dropzone);
    checkCompletion(container);
  }
  
  resetPiecePosition(target);
}

function resetPiecePosition(piece) {
  piece.style.transform = "";
  piece.style.zIndex = "";
  piece.style.transition = "";
  piece.removeAttribute("data-x");
  piece.removeAttribute("data-y");
}

function swapPieces(pieceA, pieceB) {
  const tempIndex = pieceA.getAttribute("data-index");
  pieceA.setAttribute("data-index", pieceB.getAttribute("data-index"));
  pieceB.setAttribute("data-index", tempIndex);

  const tempBgPos = pieceA.style.backgroundPosition;
  pieceA.style.backgroundPosition = pieceB.style.backgroundPosition;
  pieceB.style.backgroundPosition = tempBgPos;
  
  const tempCurrentPos = pieceA.getAttribute("data-current-position");
  pieceA.setAttribute("data-current-position", pieceB.getAttribute("data-current-position"));
  pieceB.setAttribute("data-current-position", tempCurrentPos);
}

function checkCompletion(container) {
  const pieces = Array.from(container.children);
  const isSolved = pieces.every((piece, idx) => {
    return parseInt(piece.getAttribute("data-index")) === idx;
  });
  
  if (isSolved) {
    celebrate(container);
  }
}

function celebrate(container) {
  interact(".puzzle-piece").unset();
  
  // Reproducir música de celebración
  celebrationSound.play();
  
  showMessage(container, CONFIG.messages.celebration);
  launchConfetti(200);

  setTimeout(() => {
    showFinalQuestion(container);
    launchConfetti(300);
  }, 4000);
}

function showMessage(container, message) {
  container.innerHTML = `
    <div class="celebration fade-in">
      <h2>${message}</h2>
    </div>
  `;
}

function showFinalQuestion(container) {
  container.innerHTML = `
    <div class="final-screen fade-in">
      <h2>${CONFIG.messages.question}</h2>
      <div class="btn-group-final">
        <button id="yesBtn" class="btn-final btn-yes">Sí, acepto! 💖</button>
        <button id="noBtn" class="btn-final btn-no">No puedo 😔</button>
      </div>
      <div id="result"></div>
    </div>
  `;

  document.getElementById("yesBtn").addEventListener("click", handleYesResponse);
  document.getElementById("noBtn").addEventListener("click", handleNoResponse);
}

function handleYesResponse() {
  const resultDiv = document.getElementById("result");
  const finalScreen = document.querySelector(".final-screen");
  
  // Eliminar pregunta y botones
  finalScreen.querySelector("h2").remove();
  finalScreen.querySelector(".btn-group-final").remove();
  
  // Mostrar resultado positivo
  resultDiv.innerHTML = `
    <div class="result-message fade-in party">
      <span class="emoji">🥳</span>
      <p>${CONFIG.messages.yesResponse}</p>
    </div>
  `;
  
  // Confetti extra
  launchConfetti(400, 120);
  setTimeout(() => launchConfetti(300, 100), 500);
}

function handleNoResponse() {
  const resultDiv = document.getElementById("result");
  const finalScreen = document.querySelector(".final-screen");
  
  // Eliminar pregunta y botones
  finalScreen.querySelector("h2").remove();
  finalScreen.querySelector(".btn-group-final").remove();
  
  // Mostrar resultado negativo
  resultDiv.innerHTML = `
    <div class="result-message fade-in">
      <span class="emoji">😢</span>
      <p>${CONFIG.messages.noResponse}</p>
    </div>
  `;
}

function launchConfetti(particleCount = 200, spread = 90) {
  confetti({
    particleCount,
    spread,
    origin: { y: 0.6 },
    colors: ['#ff4081', '#e73370', '#ffc107', '#ff6b9d']
  });
}