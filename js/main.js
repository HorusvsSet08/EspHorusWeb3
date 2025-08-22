document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 main.js: Página cargada e inicializando...");

  const body = document.body;
  const checkbox = document.querySelector(".theme-switch__checkbox");

  if (!body) {
    console.error("❌ ERROR FATAL: No se encontró <body>");
    return;
  }

  // === Cargar tema guardado ===
  function loadTheme() {
    const isDark = localStorage.getItem("darkMode") === "true";
    if (isDark) {
      body.classList.replace("light-mode", "dark-mode");
      if (checkbox) checkbox.checked = true;
    } else {
      body.classList.replace("dark-mode", "light-mode");
      if (checkbox) checkbox.checked = false;
    }
    updateBackgroundEffects();
  }

  // === Guardar y aplicar tema ===
  function setTheme(isDark) {
    if (isDark) {
      body.classList.replace("light-mode", "dark-mode");
      localStorage.setItem("darkMode", "true");
    } else {
      body.classList.replace("dark-mode", "light-mode");
      localStorage.setItem("darkMode", "false");
    }
    updateBackgroundEffects();
  }

  // === Efectos visuales ===
  function updateBackgroundEffects() {
    document.querySelector('.particles')?.remove();
    document.querySelector('.rain')?.remove();

    if (body.classList.contains('light-mode')) {
      createParticles();
    } else {
      createRain();
    }
  }

  function createParticles() {
    const particles = document.createElement('div');
    particles.classList.add('particles');
    for (let i = 0; i < 40; i++) {
      const dot = document.createElement('div');
      dot.classList.add('particle');
      dot.style.left = Math.random() * 100 + 'vw';
      dot.style.top = Math.random() * 100 + 'vh';
      dot.style.opacity = Math.random() * 0.5 + 0.3;
      dot.style.animationDuration = (Math.random() * 10 + 5) + 's';
      particles.appendChild(dot);
    }
    document.body.appendChild(particles);
  }

  function createRain() {
    const rain = document.createElement('div');
    rain.classList.add('rain');
    for (let i = 0; i < 30; i++) {
      const drop = document.createElement('div');
      drop.classList.add('raindrop');
      drop.style.left = Math.random() * 100 + 'vw';
      drop.style.animationDuration = (Math.random() * 2 + 1) + 's';
      drop.style.opacity = Math.random() * 0.6 + 0.4;
      rain.appendChild(drop);
    }
    document.body.appendChild(rain);
  }

  // === Cargar tema y escuchar cambios ===
  loadTheme();

  if (checkbox) {
    checkbox.addEventListener("change", (e) => {
      setTheme(e.target.checked);
    });
  }

  // === Solo en mqtt.html: iniciar MQTT ===
  if (window.location.pathname.includes("mqtt.html")) {
    console.log("📡 Iniciando conexión MQTT en mqtt.html");

    if (typeof mqtt === 'undefined') {
      console.error("❌ ERROR: mqtt.js no se ha cargado.");
      return;
    }

    const broker = "wss://broker.hivemq.com:8884/mqtt";
    const client = mqtt.connect(broker, {
      clientId: "webClient_" + Math.random().toString(16).substr(2, 8),
