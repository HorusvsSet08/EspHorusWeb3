document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 main.js: Página cargada e inicializando...");

  const body = document.body;
  const checkbox = document.querySelector(".theme-switch__checkbox");

  if (!body) {
    console.error("❌ ERROR FATAL: No se encontró <body>");
    return;
  }

  // === Elementos de UI (solo en mqtt.html) ===
  let connectionStatus = null;
  let statusText = null;
  let lastUpdate = null;
  let lastDataTime = null;

  // === Cargar tema guardado ===
  const isDark = localStorage.getItem("darkMode") === "true";
  body.classList.toggle("dark-mode", isDark);
  body.classList.toggle("light-mode", !isDark);

  if (checkbox) {
    checkbox.checked = isDark;
  }

  // === Crear estado de conexión (solo en mqtt.html) ===
  if (window.location.pathname.includes("mqtt.html")) {
    connectionStatus = document.createElement('div');
    connectionStatus.className = 'connection-status-small';
    connectionStatus.innerHTML = `
      <span class="status-dot"></span>
      <span class="status-text">Desconectado</span>
      <div class="last-update">última: nunca</div>
    `;
    document.querySelector('header')?.after(connectionStatus);

    statusText = connectionStatus.querySelector('.status-text');
    lastUpdate = connectionStatus.querySelector('.last-update');

    // Actualizar tiempo desde último dato
    const updateLastUpdate = () => {
      if (!lastDataTime) {
        lastUpdate.textContent = 'última: nunca';
        return;
      }
      const diff = Math.floor((Date.now() - lastDataTime) / 1000);
      lastUpdate.textContent = `última: hace ${diff}s`;
    };
    setInterval(updateLastUpdate, 1000);
  }

  // === Aplicar tema y efectos visuales ===
  function setTheme(isDarkMode) {
    body.classList.toggle("dark-mode", isDarkMode);
    body.classList.toggle("light-mode", !isDarkMode);
    localStorage.setItem("darkMode", isDarkMode);

    // Actualizar efectos
    updateVisualEffects(isDarkMode);
  }

  // === Efectos visuales (partículas o lluvia) ===
  function updateVisualEffects(isDarkMode) {
    document.querySelector('.particles')?.remove();
    document.querySelector('.rain')?.remove();

    if (isDarkMode) {
      createRain();
    } else {
      createParticles();
    }
  }

  // === Partículas (modo claro) ===
  function createParticles() {
    const particles = document.createElement('div');
    particles.classList.add('particles');
    for (let i = 0; i < 60; i++) {
      const dot = document.createElement('div');
      dot.classList.add('particle');
      dot.style.left = Math.random() * 100 + 'vw';
      dot.style.top = Math.random() * 100 + 'vh';
      dot.style.opacity = Math.random() * 0.5 + 0.3;
      dot.style.animationDuration = (Math.random() * 10 + 5) + 's';
      dot.style.setProperty('--delay', Math.random());
      particles.appendChild(dot);
    }
    document.body.appendChild(particles);
  }

  // === Lluvia (modo oscuro) ===
  function createRain() {
    const rain = document.createElement('div');
    rain.classList.add('rain');
    for (let i = 0; i < 40; i++) {
      const drop = document.createElement('div');
      drop.classList.add('raindrop');
      drop.style.left = Math.random() * 100 + 'vw';
      drop.style.animationDuration = (Math.random() * 2 + 1) + 's';
      drop.style.opacity = Math.random() * 0.6 + 0.4;
      drop.style.animationDelay = (Math.random() * 3) + 's';
      drop.style.setProperty('--delay', Math.random());
      rain.appendChild(drop);
    }
    document.body.appendChild(rain);
  }

  // === Escuchar cambios en el switch ===
  if (checkbox) {
    checkbox.addEventListener("change", (e) => {
      setTheme(e.target.checked);
    });
  }

  // === Inicializar efectos al cargar ===
  setTheme(isDark); // Esto llama a updateVisualEffects

  // === Solo en mqtt.html: conectar a MQTT ===
  if (window.location.pathname.includes("mqtt.html")) {
    if (typeof mqtt === 'undefined') {
      console.error("❌ ERROR: mqtt.js no se ha cargado.");
      return;
    }

    const broker = "wss://broker.hivemq.com:8884/mqtt";
    const client = mqtt.connect(broker, {
      clientId: "webClient_" + Math.random().toString(16).substr(2, 8),
      protocolVersion: 4,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 3000
    });

    const topics = {
      temp: "horus/vvb/temperatura",
      hum: "horus/vvb/humedad",
      press: "horus/vvb/presion",
      alt: "horus/vvb/altitud",
      pm25: "horus/vvb/pm25",
      pm10: "horus/vvb/pm10",
      windSpeed: "horus/vvb/wind_speed",
      windDir: "horus/vvb/wind_direction",
      gas: "horus/vvb/gas",
      lluvia: "horus/vvb/lluvia"
    };

    const elements = {};
    Object.keys(topics).forEach(key => {
      const id = key === 'windSpeed' ? 'wind' : key;
      const el = document.getElementById(id);
      if (el) elements[key] = el;
    });

    client.on("connect", () => {
      console.log("✅ Conectado a broker.hivemq.com:8884");
      statusText.textContent = "Conectado";
      connectionStatus.classList.add('connected');
      Object.values(topics).forEach(topic => {
        client.subscribe(topic, (err) => {
          if (err) {
            console.error("❌ Error al suscribirse a:", topic);
          } else {
            console.log("📌 Suscrito a:", topic);
          }
        });
      });
    });

    client.on("message", (topic, payload) => {
      const value = payload.toString().trim();
      if (!value) return;

      const key = Object.keys(topics).find(k => topics[k] === topic);
      const el = elements[key];
      if (!el) return;

      if (key === "temp") el.textContent = `${value} °C`;
      else if (key === "press") el.textContent = `${value} hPa`;
      else if (key === "windSpeed") el.textContent = `${value} km/h`;
      else if (key === "windDir") el.textContent = `${value} °`;
      else if (key === "gas") el.textContent = `${value} kΩ`;
      else if (key === "lluvia") el.textContent = `${value} mm`;
      else el.textContent = value;

      lastDataTime = Date.now(); // Marcar tiempo del último dato
    });

    client.on("error", (err) => {
      console.error("❌ Error MQTT:", err.message || err);
      statusText.textContent = "Error";
      connectionStatus.classList.remove('connected');
    });

    client.on("close", () => {
      statusText.textContent = "Desconectado";
      connectionStatus.classList.remove('connected');
    });
  }
});
