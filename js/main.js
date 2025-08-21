// === Solo declaramos, no asignamos aún ===
let body, checkbox;

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

// === Elementos del DOM (evita null) ===
const elements = {};
Object.keys(topics).forEach(key => {
  const id = key === 'windSpeed' ? 'wind' : key;
  const el = document.getElementById(id);
  if (el) elements[key] = el;
});

// === Inicializar cuando el DOM esté listo ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 Página cargada, inicializando...");

  // ✅ Aseguramos que el body y el checkbox existan
  body = document.body;
  checkbox = document.querySelector(".theme-switch__checkbox");

  if (!body) {
    console.error("❌ <body> no encontrado");
    return;
  }

  // === Conexión MQTT ===
  const broker = "wss://broker.hivemq.com:8884/mqtt";
  const clientId = "webClient_" + Math.random().toString(16).substr(2, 8);

  const client = mqtt.connect(broker, {
    clientId: clientId,
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 3000,
    protocolVersion: 4
  });

  client.on("connect", () => {
    console.log("✅ Conectado a broker.hivemq.com:8884");
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
  });

  client.on("error", (err) => {
    console.error("❌ Error MQTT:", err.message || err);
  });

  // === Modo claro/oscuro (ahora seguro) ===
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

  // ✅ Cargar tema y escuchar cambios
  loadTheme();

  if (checkbox) {
    checkbox.addEventListener("change", (e) => {
      setTheme(e.target.checked);
    });
  }
});
