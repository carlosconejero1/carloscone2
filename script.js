// 🔗 TU GOOGLE SHEETS (CSV)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQy3o1VlJvYG3L3Rqx4EumcmlJKc5BGNcFljw4tSKzpqbJQ95ATatgvJYFBNtEihhVRgmd8ncIyZFy_/pub?gid=0&single=true&output=csv";

let player;
let isPlayerReady = false;
let tracks = [];
let activeIndex = -1;
let progressInterval;

// YouTube API
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '1',
    width: '1',
    videoId: '',
    playerVars: { controls: 0 },
    events: {
      onReady: () => { isPlayerReady = true; }
    }
  });
}

// Extraer ID de YouTube
function getYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Cargar Google Sheets
async function loadSheetTracks() {
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();
    parseCSV(text);
    renderButtons();
  } catch (err) {
    console.error("Error cargando Google Sheets:", err);
    document.getElementById("sheetControls").innerHTML =
      "<p class='loading'>No se pudieron cargar los audios</p>";
  }
}

// Parsear CSV (columnas: Étiqueta, Enlace)
function parseCSV(data) {
  const lines = data.trim().split("\n");
  const rows = lines.slice(1); // sin cabecera

  tracks = rows.map(line => {
    // Soporta comas dentro de celdas con comillas
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
      ?.map(v => v.replace(/^"|"$/g, '').trim()) || [];

    const label = values[0];
    const url = values[1];
    const videoId = getYouTubeVideoId(url || "");

    return (label && videoId) ? { label, videoId } : null;
  }).filter(Boolean);
}

// Pintar botones dinámicos
function renderButtons() {
  const container = document.getElementById("sheetControls");
  container.innerHTML = "";

  if (tracks.length === 0) {
    container.innerHTML = "<p class='loading'>No hay pistas válidas</p>";
    return;
  }

  tracks.forEach((track, index) => {
    const btn = document.createElement("button");
    btn.className = "sheet-btn";
    btn.textContent = track.label;
    btn.onclick = () => {
      playTrack(index);
      setActiveButton(index);
    };
    container.appendChild(btn);
  });

  // Autocargar la primera
  playTrack(0);
  setActiveButton(0);
}

// Reproducir pista
function playTrack(index) {
  if (!isPlayerReady) return;
  activeIndex = index;
  const id = tracks[index].videoId;
  player.loadVideoById(id);
  setThumbnail(id);
  startProgressTracking();
}

// Marcar botón activo
function setActiveButton(i) {
  const buttons = document.querySelectorAll(".sheet-btn");
  buttons.forEach((b, idx) => b.classList.toggle("active", idx === i));
}

// Carátula
function setThumbnail(id) {
  document.getElementById("thumbnail").src =
    `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

// Controles básicos
document.getElementById("playBtn").onclick = () => {
  if (isPlayerReady) player.playVideo();
};

document.getElementById("pauseBtn").onclick = () => {
  if (isPlayerReady) player.pauseVideo();
};

document.getElementById("coverOverlay").onclick = () => {
  if (isPlayerReady) player.playVideo();
};

// Volumen
document.getElementById("volumeRange").oninput = e => {
  if (isPlayerReady) player.setVolume(e.target.value);
};

// Formato tiempo
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// Barra de progreso
function startProgressTracking() {
  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    if (!isPlayerReady) return;
    const cur = player.getCurrentTime();
    const dur = player.getDuration();
    if (!dur) return;

    document.getElementById("progressFill").style.width = (cur / dur * 100) + "%";
    document.getElementById("currentTime").textContent = formatTime(cur);
    document.getElementById("duration").textContent = formatTime(dur);
  }, 500);
}

// Click para saltar
document.getElementById("progressBar").onclick = e => {
  if (!isPlayerReady) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  player.seekTo(player.getDuration() * percent, true);
};

// Cargar al iniciar
loadSheetTracks();
function updateVideoTitle() {
  if (!isPlayerReady) return;
  const data = player.getVideoData();
  if (data && data.title) {
    document.getElementById("videoTitle").textContent = data.title;
  }
}
