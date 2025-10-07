import { initPuzzle } from "./components/PuzzleGame.js";


document.addEventListener("DOMContentLoaded", () => {
  initPuzzle();
  document.getElementById("year").textContent = new Date().getFullYear();
});
