document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 main.js: Página cargada e inicializando...");

  const body = document.body;
  const checkbox = document.querySelector(".theme-switch__checkbox");

  if (!body) {
    console.error("❌ ERROR FATAL: No se encontró el elemento <body>");
    return;
  }

  // === Elementos de UI (conexión y tiempo) ===
  const connectionStatus = document.createElement('div');
  connectionStatus.className = 'connection-status';
  connectionStatus.innerHTML = '<span class="dot"></span> Estado: Desconectado';
  const header = document.querySelector('header');
  if (header) header.after(connectionStatus);

  const lastUpdate = document.createElement('div');
  lastUpdate.className = 'last-update';
  lastUpdate.textContent = 'Última actualización: nunca';
  connectionStatus.after(lastUpdate);

  let lastDataTime = null;

  function updateLastUpdate() {
    if (!lastDataTime) {
      lastUpdate.textContent = 'Última actualización: nunca';
      return;
    }
    const diff = Math.floor((Date.now() - lastDataTime) / 1000);
    lastUpdate.textContent = `Última actualización: hace ${diff}s`;
  }

  setInterval(updateLastUpdate, 1000);

  // === Modo claro/oscuro ===
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

  // === Efectos visuales mejorados ===
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
    for (let i = 0; i < 70; i++) {
      const dot = document.createElement('div');
      dot.classList.add('particle');
      dot.style.left = Math.random() * 100 + 'vw';
      dot.style.top = Math.random() * 100 + 'vh';
      dot.style.opacity = Math.random() * 0.6 + 0.4;
      dot.style.animationDuration = (Math.random() * 6 + 4) + 's';
      dot.style.animationDelay = (Math.random() * 5) + 's';
      dot.style.setProperty('--delay', Math.random());
      particles.appendChild(dot);
    }
    document.body.appendChild(particles);
  }

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

  // === Cargar tema al iniciar ===
  loadTheme();

  if (checkbox) {
    checkbox.addEventListener("change", (e) => {
      setTheme(e.target.checked);
    });
  }

  // === Solo en mqtt.html: conectar a MQTT ===
  if (window.location.pathname.includes("mqtt.html")) {
    console.log("📡 Iniciando conexión MQTT en mqtt.html");

    if (typeof mqtt === 'undefined') {
      console.error("❌ ERROR: mqtt.js no se ha cargado. Verifica la ruta.");
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
      connectionStatus.className = 'connection-status connected';
      connectionStatus.innerHTML = '<span class="dot"></span> Estado: Conectado';

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

      // Formatear valores
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
      connectionStatus.className = 'connection-status';
      connectionStatus.innerHTML = '<span class="dot"></span> Estado: Error';
    });

    client.on("close", () => {
      connectionStatus.className = 'connection-status';
      connectionStatus.innerHTML = '<span class="dot"></span> Estado: Desconectado';
    });
  }
});
