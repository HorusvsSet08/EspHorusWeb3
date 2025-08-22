// === main.js: Estación Meteorológica Horus ===
// Versión con logs para depuración y correcciones de errores
document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 main.js: Página cargada e inicializando...");

  // === 1. Elementos del DOM (modo oscuro) ===
  const body = document.body;
  const checkbox = document.querySelector(".theme-switch__checkbox");

  if (!body) {
    console.error("❌ ERROR FATAL: No se encontró el elemento <body>");
    return;
  }

  // === 2. Modo claro/oscuro (funciona en ambas páginas) ===
  function loadTheme() {
    const isDark = localStorage.getItem("darkMode") === "true";
    console.log("🔄 Cargando tema:", isDark ? "oscuro" : "claro");

    if (isDark) {
      body.classList.replace("light-mode", "dark-mode");
      if (checkbox) checkbox.checked = true;
      console.log("🌙 Modo oscuro aplicado");
    } else {
      body.classList.replace("dark-mode", "light-mode");
      if (checkbox) checkbox.checked = false;
      console.log("☀️ Modo claro aplicado");
    }
    updateBackgroundEffects();
  }

  function setTheme(isDark) {
    if (isDark) {
      body.classList.replace("light-mode", "dark-mode");
      localStorage.setItem("darkMode", "true");
      console.log("🌙 Modo oscuro activado");
    } else {
      body.classList.replace("dark-mode", "light-mode");
      localStorage.setItem("darkMode", "false");
      console.log("☀️ Modo claro activado");
    }
    updateBackgroundEffects();
  }

  // === 3. Efectos visuales (partículas o lluvia) ===
  function updateBackgroundEffects() {
    document.querySelector('.particles')?.remove();
    document.querySelector('.rain')?.remove();

    if (body.classList.contains('light-mode')) {
      createParticles();
      console.log("✨ Partículas creadas");
    } else {
      createRain();
      console.log("🌧️ Lluvia creada");
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

  // === 4. Cargar tema y escuchar cambios ===
  loadTheme();

  if (checkbox) {
    checkbox.addEventListener("change", (e) => {
      setTheme(e.target.checked);
    });
  } else {
    console.warn("⚠️ Switch de modo oscuro no encontrado (opcional)");
  }

  // === 5. Solo en mqtt.html: iniciar MQTT ===
  if (window.location.pathname.includes("mqtt.html")) {
    console.log("📡 Iniciando conexión MQTT en mqtt.html");

    // ✅ Verifica que mqtt.js se haya cargado
    if (typeof mqtt === 'undefined') {
      console.error("❌ ERROR: mqtt.js no se ha cargado.");
      console.error("   → Verifica:");
      console.error("     1. Que el archivo mqtt.js esté en js/mqtt.js");
      console.error("     2. Que se cargue ANTES que main.js");
      console.error("     3. Que el nombre sea mqtt.js (no .txt)");
      console.error("     4. Que GitHub lo sirva (no 404)");
      return;
    }

    // === Configuración del broker ===
    const broker = "wss://broker.hivemq.com:8884/mqtt";
    const clientId = "webClient_" + Math.random().toString(16).substr(2, 8);

    const client = mqtt.connect(broker, {
      clientId: clientId,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 3000,
      protocolVersion: 4
    });

    // === Temas MQTT ===
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

    // === Mapeo de elementos del DOM ===
    const elements = {};
    Object.keys(topics).forEach(key => {
      const id = key === 'windSpeed' ? 'wind' : key;
      const el = document.getElementById(id);
      if (el) {
        elements[key] = el;
        console.log(`✅ Elemento encontrado: #${id}`);
      } else {
        console.warn(`⚠️ Elemento no encontrado: #${id}`);
      }
    });

    // === Eventos MQTT ===
    client.on("connect", () => {
      console.log("✅ Conectado a broker.hivemq.com:8884");
      console.log("🔍 Intentando suscribirse a los temas...");

      Object.values(topics).forEach(topic => {
        client.subscribe(topic, (err) => {
          if (err) {
            console.error("❌ Error al suscribirse a:", topic, err.message || err);
          } else {
            console.log("📌 Suscrito a:", topic);
          }
        });
      });
    });

    client.on("message", (topic, payload) => {
      const value = payload.toString().trim();
      if (!value) {
        console.log("📩 Mensaje vacío recibido:", topic);
        return;
      }
      console.log("📩 MENSAJE RECIBIDO:", topic, "→", value);

      const key = Object.keys(topics).find(k => topics[k] === topic);
      const el = elements[key];
      if (!el) {
        console.warn("⚠️ No hay elemento para mostrar:", topic);
        return;
      }

      // Formato por tipo
      if (key === "temp") el.textContent = `${value} °C`;
      else if (key === "press") el.textContent = `${value} hPa`;
      else if (key === "windSpeed") el.textContent = `${value} km/h`;
      else if (key === "windDir") el.textContent = `${value} °`;
      else if (key === "gas") el.textContent = `${value} kΩ`;
      else if (key === "lluvia") el.textContent = `${value} mm`;
      else el.textContent = value;
    });

    client.on("error", (err) => {
      console.error("❌ Error MQTT:", err.message || err);
    });

    client.on("offline", () => {
      console.warn("🌐 Cliente desconectado (modo offline)");
    });

    client.on("reconnect", () => {
      console.log("🔁 Reconectando...");
    });
  }
  // Fin del bloque MQTT (solo en mqtt.html)
});
