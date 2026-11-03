import { questions } from "./questions.js";
import { firebaseConfig, configured } from "./firebase-config.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// ========================================
// ELEMENTOS DEL VIDEOJUEGO
// ========================================

const inicio = document.getElementById("pantallaInicio");
const juego = document.getElementById("pantallaJuego");
const final = document.getElementById("pantallaFinal");

const nombreInput = document.getElementById("nombre");
const modalidadInput = document.getElementById("modalidad");
const mensajeInicio = document.getElementById("mensajeInicio");

const btnIniciar = document.getElementById("btnIniciar");
const btnSiguiente = document.getElementById("btnSiguiente");
const btnPista = document.getElementById("btnPista");

const opciones = document.getElementById("opciones");
const ranking = document.getElementById("tablaRanking");

// ========================================
// VARIABLES
// ========================================

let auth;
let db;
let usuario = null;
let jugador = null;

let indice = 0;
let puntos = 0;
let banderas = 0;

let respondida = false;
let pistaUsada = false;
let guardando = false;
let intentosFallidos = 0;
let esperandoReintento = false;

let cancelarRanking = null;

// ========================================
// CONECTAR FIREBASE
// ========================================

function iniciarFirebase() {
  if (!configured) {
    mensajeInicio.textContent =
      "Firebase no está configurado.";
    btnIniciar.disabled = true;
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);

    auth = getAuth(app);
    db = getFirestore(app);

    btnIniciar.disabled = true;
    mensajeInicio.textContent =
      "Conectando con la competencia...";

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        usuario = null;

        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error(error);
          mensajeInicio.textContent =
            "No se pudo conectar con Firebase.";
        }
        return;
      }

      usuario = user;

      if (!cancelarRanking) {
        escucharRanking();
      }

      await recuperarPartida();
    });

  } catch (error) {
    console.error(error);
    mensajeInicio.textContent =
      "Error al iniciar el videojuego.";
  }
}

// ========================================
// RECUPERAR PROGRESO
// ========================================

async function recuperarPartida() {
  if (!usuario || !db) return;

  btnIniciar.disabled = true;

  try {
    const referencia = doc(
      db,
      "participantes",
      usuario.uid
    );

    const resultado = await getDoc(referencia);

    if (!resultado.exists()) {
      btnIniciar.disabled = false;
      mensajeInicio.textContent = "";
      return;
    }

    jugador = resultado.data();

    puntos = Number(jugador.puntos) || 0;
    banderas = Number(jugador.banderas) || 0;

    indice = Math.min(banderas, questions.length);

    nombreInput.value = jugador.nombre || "";

    const modalidadGuardada = jugador.modalidad;
    const existeModalidad = Array.from(
      modalidadInput.options
    ).some(op => op.value === modalidadGuardada);

    if (existeModalidad) {
      modalidadInput.value = modalidadGuardada;
    }

    document.getElementById("nombreJugador")
      .textContent = jugador.nombre || "Participante";

    actualizarMarcadores();

    inicio.classList.add("oculto");

    if (jugador.finalizado ||
        indice >= questions.length) {
      finalizarJuego();
    } else {
      final.classList.add("oculto");
      juego.classList.remove("oculto");
      mostrarPregunta();
    }

  } catch (error) {
    console.error(error);
    mensajeInicio.textContent =
      "No se pudo recuperar el progreso.";
    btnIniciar.disabled = false;
  }
}

// ========================================
// REGISTRAR PARTICIPANTE
// ========================================

btnIniciar.addEventListener("click", async () => {
  if (guardando) return;

  const nombre = nombreInput.value.trim();
  const modalidad = modalidadInput.value;

  if (nombre.length < 2 || nombre.length > 60) {
    mensajeInicio.textContent =
      "Escribe un nombre de 2 a 60 caracteres.";
    return;
  }

  if (!usuario || !db) {
    mensajeInicio.textContent =
      "Espera a que Firebase se conecte.";
    return;
  }

  guardando = true;
  btnIniciar.disabled = true;

  try {
    const referencia = doc(
      db,
      "participantes",
      usuario.uid
    );

    const existente = await getDoc(referencia);

    if (existente.exists()) {
      await recuperarPartida();
      return;
    }

    jugador = {
      uid: usuario.uid,
      nombre,
      modalidad,
      puntos: 0,
      banderas: 0,
      nivel: 1,
      finalizado: false
    };

    await setDoc(referencia, {
      ...jugador,
      creado: serverTimestamp(),
      actualizado: serverTimestamp()
    });

    puntos = 0;
    banderas = 0;
    indice = 0;

    document.getElementById("nombreJugador")
      .textContent = nombre;

    inicio.classList.add("oculto");
    final.classList.add("oculto");
    juego.classList.remove("oculto");

    actualizarMarcadores();
    mostrarPregunta();

  } catch (error) {
    console.error(error);
    mensajeInicio.textContent =
      "No se pudo registrar. Revisa Firebase.";
    btnIniciar.disabled = false;

  } finally {
    guardando = false;
  }
});

// ========================================
// MOSTRAR PREGUNTAS
// ========================================

function mostrarPregunta() {
  if (indice >= questions.length) {
    finalizarJuego();
    return;
  }

  const pregunta = questions[indice];

  respondida = false;
  pistaUsada = false;
  intentosFallidos = 0;
  esperandoReintento = false;

  document.getElementById("numeroPregunta")
    .textContent =
      `MISIÓN ${indice + 1} DE ${questions.length}`;

  document.getElementById("tituloPregunta")
    .textContent = "🚩 " + pregunta.title;

  document.getElementById("nivelPregunta")
    .textContent = "Nivel: " + pregunta.level;

  document.getElementById("codigoPython")
    .textContent = pregunta.code;

  document.getElementById("enunciado")
    .textContent = pregunta.question;

  document.getElementById("mensajeRespuesta")
    .textContent = "";

  const textoPista =
    document.getElementById("textoPista");

  textoPista.textContent = "";
  textoPista.classList.add("oculto");

  btnPista.disabled = false;
  btnSiguiente.classList.add("oculto");
  quitarBotonReintentar();

  opciones.replaceChildren();

  pregunta.options.forEach((opcion, posicion) => {
    const boton = document.createElement("button");

    boton.type = "button";
    boton.className = "opcion";
    boton.textContent = opcion;

    boton.addEventListener("click", () => {
      comprobarRespuesta(posicion, boton);
    });

    opciones.appendChild(boton);
  });
}

// ========================================
// COMPROBAR RESPUESTAS
// ========================================

async function comprobarRespuesta(posicion, boton) {
  if (respondida || guardando || esperandoReintento) return;

  const pregunta = questions[indice];

  const mensaje =
    document.getElementById("mensajeRespuesta");

  if (posicion !== pregunta.answer) {
    // Un intento fallido bloquea todas las opciones hasta pulsar Reintentar.
    intentosFallidos++;
    esperandoReintento = true;
    boton.classList.add("incorrecta", "sacudida");
    opciones.querySelectorAll("button").forEach(b => b.disabled = true);
    mensaje.textContent = `❌ Respuesta incorrecta. Intento ${intentosFallidos}. Perderás ${Math.min(intentosFallidos * 25, Math.max(0, pregunta.points - 10))} puntos del valor de esta misión si aciertas.`;
    reproducirEfecto("error");
    mostrarBotonReintentar();
    return;
  }

  reproducirEfecto("acierto");
  guardando = true;

  const puntosGanados = Math.max(
    10,
    pregunta.points - (pistaUsada ? 20 : 0) - (intentosFallidos * 25)
  );

  const nuevosPuntos = puntos + puntosGanados;
  const nuevasBanderas = banderas + 1;

  mensaje.textContent = "Guardando bandera...";

  try {
    await updateDoc(
      doc(db, "participantes", usuario.uid),
      {
        puntos: nuevosPuntos,
        banderas: nuevasBanderas,
        nivel: nuevasBanderas,
        finalizado:
          nuevasBanderas === questions.length,
        actualizado: serverTimestamp()
      }
    );

    puntos = nuevosPuntos;
    banderas = nuevasBanderas;
    respondida = true;

    boton.classList.add("correcta");

    opciones.querySelectorAll("button")
      .forEach(b => {
        b.disabled = true;
      });

    mensaje.textContent =
      `✅ ¡Bandera capturada! +${puntosGanados} puntos.`;

    btnPista.disabled = true;
    btnSiguiente.classList.remove("oculto");

    btnSiguiente.textContent =
      indice === questions.length - 1
        ? "🏆 Finalizar misión"
        : "Siguiente misión ➡️";

    actualizarMarcadores();

    // Celebración solo después de guardar.
    mostrarCelebracion(puntosGanados);

  } catch (error) {
    console.error(error);

    mensaje.textContent =
      "No se pudo guardar la bandera. Intenta otra vez.";

  } finally {
    guardando = false;
  }
}

// ========================================
// MOSTRAR PISTAS
// ========================================

btnPista.addEventListener("click", () => {
  if (respondida || guardando || pistaUsada || esperandoReintento) {
    return;
  }

  const pregunta = questions[indice];

  const textoPista =
    document.getElementById("textoPista");

  textoPista.textContent =
    "💡 " + pregunta.hint +
    " (Se descontarán 20 puntos al acertar).";

  textoPista.classList.remove("oculto");

  pistaUsada = true;
  btnPista.disabled = true;
});

// ========================================
// AVANZAR DE MISIÓN
// ========================================

btnSiguiente.addEventListener("click", () => {
  if (!respondida || guardando) return;

  indice++;

  if (indice >= questions.length) {
    finalizarJuego();
  } else {
    mostrarPregunta();
  }
});

// ========================================
// ACTUALIZAR PUNTOS Y BANDERAS
// ========================================

function actualizarMarcadores() {
  const marcadorPuntos =
    document.getElementById("puntos");

  marcadorPuntos.textContent = puntos;

  document.getElementById("banderas")
    .textContent = banderas;

  const porcentaje =
    (banderas / questions.length) * 100;

  document.getElementById("barraProgreso")
    .style.width = porcentaje + "%";
}

// ========================================
// CELEBRACIÓN DE BANDERA
// ========================================

function mostrarCelebracion(puntosGanados) {
  const anterior = document.querySelector(
    ".celebracion-bandera"
  );

  if (anterior) anterior.remove();

  const celebracion = document.createElement("div");
  celebracion.className = "celebracion-bandera";

  const contenido = document.createElement("div");
  contenido.className = "celebracion-contenido";
  contenido.setAttribute("role", "dialog");
  contenido.setAttribute("aria-modal", "true");
  contenido.setAttribute(
    "aria-label",
    "Bandera capturada"
  );

  const icono = document.createElement("div");
  icono.className = "celebracion-icono";
  icono.textContent = "🚩";

  const titulo = document.createElement("h2");
  titulo.className = "celebracion-titulo";
  titulo.textContent = "¡BANDERA CAPTURADA!";

  const felicitacion = document.createElement("p");
  felicitacion.textContent = "¡Excelente trabajo!";

  const premio = document.createElement("div");
  premio.className = "celebracion-puntos";
  premio.textContent = `+${puntosGanados} PUNTOS`;

  const mensaje = document.createElement("p");
  mensaje.textContent =
    "🏆 ¡Continúa conquistando misiones!";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "celebracion-boton";
  boton.textContent = "¡CONTINUAR!";

  contenido.append(
    icono,
    titulo,
    felicitacion,
    premio,
    mensaje,
    boton
  );

  reproducirEfecto("bandera");
  celebracion.appendChild(contenido);
  document.body.appendChild(celebracion);

  const marcador = document.getElementById("puntos");

  marcador.classList.remove("puntos-animados");
  void marcador.offsetWidth;
  marcador.classList.add("puntos-animados");

  boton.focus();

  boton.addEventListener("click", () => {
    celebracion.remove();
    btnSiguiente.focus();
  });
}

// ========================================
// CLASIFICACIÓN EN TIEMPO REAL
// ========================================

function escucharRanking() {
  const consulta = query(
    collection(db, "participantes"),
    orderBy("puntos", "desc"),
    limit(50)
  );

  cancelarRanking = onSnapshot(
    consulta,

    (snapshot) => {
      ranking.replaceChildren();

      if (snapshot.empty) {
        const fila = ranking.insertRow();
        const celda = fila.insertCell();

        celda.colSpan = 4;
        celda.textContent =
          "Todavía no hay participantes.";

        return;
      }

      let posicion = 1;

      snapshot.forEach((documento) => {
        const datos = documento.data();
        const fila = ranking.insertRow();

        let medalla = String(posicion);

        if (posicion === 1) {
          medalla = "🥇 1.º";
          fila.classList.add("primero-ranking");

        } else if (posicion === 2) {
          medalla = "🥈 2.º";
          fila.classList.add("segundo-ranking");

        } else if (posicion === 3) {
          medalla = "🥉 3.º";
          fila.classList.add("tercero-ranking");
        }

        const valores = [
          medalla,
          datos.nombre || "Sin nombre",
          Number(datos.puntos) || 0,
          Number(datos.banderas) || 0
        ];

        valores.forEach((valor) => {
          const celda = fila.insertCell();
          celda.textContent = String(valor);
        });

        posicion++;
      });
    },

    (error) => {
      console.error(error);

      ranking.replaceChildren();

      const fila = ranking.insertRow();
      const celda = fila.insertCell();

      celda.colSpan = 4;
      celda.textContent =
        "No se pudo cargar la clasificación.";
    }
  );
}

// ========================================
// PREMIACIÓN FINAL
// ========================================

function finalizarJuego() {
  inicio.classList.add("oculto");
  juego.classList.add("oculto");
  final.classList.remove("oculto");

  const resultado =
    document.getElementById("resultadoFinal");

  resultado.replaceChildren();

  const premio = document.createElement("div");
  premio.className = "premiacion-final";

  const trofeo = document.createElement("div");
  trofeo.className = "premiacion-trofeo";
  trofeo.textContent = "🏆";

  const titulo = document.createElement("h2");
  titulo.textContent = "¡MISIÓN COMPLETADA!";

  const nombre = document.createElement("h3");
  nombre.textContent =
    jugador?.nombre || "Participante";

  const felicitacion = document.createElement("p");
  felicitacion.textContent =
    "¡Felicitaciones por completar el desafío Python!";

  const puntuacion = document.createElement("div");
  puntuacion.className = "premiacion-puntos";
  puntuacion.textContent = `${puntos} PUNTOS`;

  const insignias = document.createElement("p");
  insignias.textContent =
    `🚩 ${banderas} de ${questions.length} banderas capturadas`;

  const mensaje = document.createElement("p");
  mensaje.textContent =
    "¡Has superado el desafío de programación!";

  premio.append(
    trofeo,
    titulo,
    nombre,
    felicitacion,
    puntuacion,
    insignias,
    mensaje
  );

  reproducirEfecto("final");
  resultado.appendChild(premio);

  window.scrollTo(0, 0);
}

// ========================================
// INICIAR EL VIDEOJUEGO
// ========================================


// ========================================
// REINTENTO CON PENALIZACIÓN
// ========================================
function quitarBotonReintentar() {
  document.getElementById("btnReintentar")?.remove();
}

function mostrarBotonReintentar() {
  quitarBotonReintentar();
  const boton = document.createElement("button");
  boton.id = "btnReintentar";
  boton.type = "button";
  boton.textContent = "🔄 Reintentar (con menos puntos)";
  boton.addEventListener("click", () => {
    esperandoReintento = false;
    opciones.querySelectorAll("button").forEach(b => {
      b.disabled = false;
      b.classList.remove("incorrecta", "sacudida");
    });
    document.getElementById("mensajeRespuesta").textContent =
      `Nuevo intento. Penalización acumulada: ${intentosFallidos * 25} puntos. Mínimo por acierto: 10 puntos.`;
    quitarBotonReintentar();
  });
  opciones.after(boton);
}

// ========================================
// SONIDOS ORIGINALES CON WEB AUDIO
// No necesita archivos MP3 externos.
// El usuario activa el sonido con un clic.
// ========================================
let contextoAudio = null;
let musicaActiva = false;
let intervaloMusica = null;
let notaMusica = 0;
const notasMusica = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23];

function obtenerAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!contextoAudio) contextoAudio = new AudioContextClass();
  if (contextoAudio.state === "suspended") contextoAudio.resume();
  return contextoAudio;
}

function tocarNota(frecuencia, duracion = 0.12, volumen = 0.035, tipo = "sine") {
  const ctx = obtenerAudio();
  if (!ctx) return;
  const oscilador = ctx.createOscillator();
  const ganancia = ctx.createGain();
  oscilador.type = tipo;
  oscilador.frequency.value = frecuencia;
  ganancia.gain.setValueAtTime(volumen, ctx.currentTime);
  ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracion);
  oscilador.connect(ganancia);
  ganancia.connect(ctx.destination);
  oscilador.start();
  oscilador.stop(ctx.currentTime + duracion);
}

function reproducirEfecto(tipo) {
  // Los efectos se escuchan solo cuando el usuario activó el audio.
  if (!musicaActiva) return;
  if (tipo === "error") {
    tocarNota(180, 0.22, 0.055, "triangle");
  } else if (tipo === "acierto") {
    tocarNota(523.25, 0.14, 0.045, "sine");
  } else if (tipo === "bandera" || tipo === "final") {
    [392, 523.25, 659.25, 783.99].forEach((nota, i) => {
      // Web Audio programa el inicio sin depender de temporizadores.
      const ctx = obtenerAudio();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.12;
      osc.type = "triangle";
      osc.frequency.value = nota;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.055, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }
}

function crearControlAudio() {
  const boton = document.createElement("button");
  boton.id = "btnMusica";
  boton.type = "button";
  boton.textContent = "🔇 Activar música";
  boton.setAttribute("aria-pressed", "false");
  boton.addEventListener("click", () => {
    musicaActiva = !musicaActiva;
    boton.textContent = musicaActiva ? "🔊 Silenciar música" : "🔇 Activar música";
    boton.setAttribute("aria-pressed", String(musicaActiva));
    if (musicaActiva) {
      obtenerAudio();
      notaMusica = 0;
      tocarNota(notasMusica[notaMusica++], 0.18, 0.018);
      intervaloMusica = setInterval(() => {
        if (document.hidden) return;
        tocarNota(notasMusica[notaMusica++ % notasMusica.length], 0.17, 0.018);
      }, 430);
    } else {
      clearInterval(intervaloMusica);
      intervaloMusica = null;
    }
  });
  (document.querySelector("header") || document.body).appendChild(boton);
}

crearControlAudio();

iniciarFirebase();
