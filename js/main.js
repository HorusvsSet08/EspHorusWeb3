// === Configuración MQTT ===
const broker = "ws://broker.hivemq.com:8000/mqtt";
const clientId = "webClient_" + Math.random().toString(16).substr(2, 8);

// Conexión MQTT
const client = mqtt.connect(broker, {
  clientId: clientId,
  clean: true,
  connectTimeout: 10000,
  reconnectPeriod: 3000,
});

// === Temas MQTT que usa tu estación ===
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

// === Mapeo de elementos del DOM (evita errores de null) ===
const elements = {};
Object.keys(topics).forEach(key => {
  // Si el ID es windSpeed, usamos 'wind' como ID en el HTML
  const id = key === 'windSpeed' ? 'wind' : key;
  const el = document.getElementById(id);
  if (el) {
    elements[key] = el;
  } else {
    console.warn(`[main.js] Elemento no encontrado: #${id}`);
  }
});

// === Conexión MQTT exitosa ===
client.on("connect", () => {
  console.log("✅ Conectado a broker.hivemq.com:8000");
  Object.values(topics).forEach(topic => {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error("❌ Error al suscribirse a:", topic, err);
      } else {
        console.log("📌 Suscrito a:", topic);
      }
    });
  });
});

// === Recibir mensajes MQTT ===
client.on("message", (topic, payload) => {
  const value = payload.toString().trim();
  if (!value) return;

  // Busca qué sensor corresponde al tema
  const key = Object.keys(topics).find(k => topics[k] === topic);
  if (!key) return;

  const el = elements[key];
  if (!el) return;

  // Formato específico por tipo de dato
  if (key === "temp") {
    el.textContent = `${value} °C`;
  } else if (key === "press") {
    el.textContent = `${value} hPa`;
  } else if (key === "windSpeed") {
    el.textContent = `${value} km/h`;
  } else if (key === "windDir") {
    el.textContent = `${value} °`;
  } else if (key === "gas") {
    el.textContent = `${value} kΩ`;
  } else if (key === "lluvia") {
    el.textContent = `${value} mm`;
  } else {
    el.textContent = value;
  }
});

// === Manejo de errores MQTT ===
client.on("error", (err) => {
  console.error("❌ Error MQTT:", err.message || err);
});

// === Modo claro/oscuro con persistencia ===
const checkbox = document.querySelector(".theme-switch__checkbox");
const body = document.body;

// Cargar el tema guardado al iniciar
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

// Guardar y aplicar tema
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

// Inicializar tema al cargar la página
document.addEventListener("DOMContentLoaded", loadTheme);

// Escuchar cambios en el switch
if (checkbox) {
  checkbox.addEventListener("change", (e) => {
    setTheme(e.target.checked);
  });
}

// === Efectos visuales: partículas (claro) y lluvia (oscuro) ===
function updateBackgroundEffects() {
  // Eliminar efectos anteriores
  document.querySelector('.particles')?.remove();
  document.querySelector('.rain')?.remove();

  // Aplicar el efecto según el modo
  if (body.classList.contains('light-mode')) {
    createParticles();
  } else {
    createRain();
  }
}

// Crear partículas flotantes (modo claro)
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

// Crear efecto de lluvia (modo oscuro)
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
