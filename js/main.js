document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 main.js: Página cargada e inicializando...");

  // === Modo claro/oscuro (funciona en ambas páginas) ===
  const body = document.body;
  const checkbox = document.querySelector(".theme-switch__checkbox");

  if (!body) {
    console.error("❌ <body> no encontrado");
    return;
  }

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

  loadTheme();

  if (checkbox) {
    checkbox.addEventListener("change", (e) => {
      setTheme(e.target.checked);
    });
  }

  // === Solo en mqtt.html: iniciar MQTT ===
  if (window.location.pathname.includes("mqtt.html")) {
    console.log("📡 Iniciando conexión MQTT en mqtt.html");

    // ✅ Verifica que mqtt.js se haya cargado
    if (typeof mqtt === 'undefined') {
      console.error("❌ ERROR: mqtt.js no se ha cargado. Verifica:");
      console.error("   1. Que el archivo mqtt.js esté en js/mqtt.js");
      console.error("   2. Que se cargue ANTES que main.js");
      console.error("   3. Que el nombre sea mqtt.js (no .txt)");
      console.error("   4. Que GitHub lo sirva (no 404)");
      return;
    }

    // === Conexión MQTT (WSS para GitHub Pages) ===
    const broker = "wss://broker.hivemq.com:8884/mqtt";
    const client = mqtt.connect(broker, {
      clientId: "webClient_" + Math.random().toString(16).substr(2, 8),
      protocolVersion: 4,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 3000
    });

    client.on("connect", () => {
      console.log("✅ Conectado a broker.hivemq.com:8884");
      // Suscribe a tus temas aquí
    });

    client.on("message", (topic, payload) => {
      console.log("📩", topic, payload.toString());
      // Actualiza los datos aquí
    });

    client.on("error", (err) => {
      console.error("❌ Error MQTT:", err.message || err);
    });
  }
});
