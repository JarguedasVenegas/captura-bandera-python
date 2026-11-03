
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

// ELEMENTOS DE LA PÁGINA

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

// VARIABLES DEL JUEGO

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
let intentos = 0;

let cancelarRanking = null;

// INICIAR FIREBASE

async function iniciarFirebase() {
  if (!configured) {
    mensajeInicio.textContent =
      "Firebase todavía no está configurado.";
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
      if (user) {
        usuario = user;

        if (!cancelarRanking) {
          escucharRanking();
        }

        await recuperarPartida();

      } else {
        usuario = null;

        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error(error);
          mensajeInicio.textContent =
            "No fue posible iniciar sesión.";
        }
      }
    });

  } catch (error) {
    console.error(error);
    mensajeInicio.textContent =
      "Error de conexión con Firebase.";
  }
}

// RECUPERAR UNA PARTIDA EXISTENTE

async function recuperarPartida() {
  if (!usuario) return;

  btnIniciar.disabled = true;

  try {
    const referencia = doc(
      db,
      "participantes",
      usuario.uid
    );

    const resultado = await getDoc(referencia);

    if (resultado.exists()) {
      jugador = resultado.data();

      puntos = Number(jugador.puntos) || 0;
      banderas = Number(jugador.banderas) || 0;

      indice = Math.min(
        banderas,
        questions.length
      );

      nombreInput.value = jugador.nombre || "";
      modalidadInput.value =
        jugador.modalidad || "Individual";

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

    } else {
      btnIniciar.disabled = false;
      mensajeInicio.textContent = "";
    }

  } catch (error) {
    console.error(error);
    mensajeInicio.textContent =
      "No se pudo recuperar la partida.";
    btnIniciar.disabled = false;
  }
}

// REGISTRAR NUEVO PARTICIPANTE

btnIniciar.addEventListener("click", async () => {
  if (guardando) return;

  const nombre = nombreInput.value.trim();
  const modalidad = modalidadInput.value;

  if (nombre.length < 2) {
    mensajeInicio.textContent =
      "Escribe un nombre de al menos dos caracteres.";
    return;
  }

  if (!usuario || !db) {
    mensajeInicio.textContent =
      "Espera a que se establezca la conexión.";
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
      nombre: nombre,
      modalidad: modalidad,
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

    inicio.classList.add("oculto");
    final.classList.add("oculto");
    juego.classList.remove("oculto");

    document.getElementById("nombreJugador")
      .textContent = nombre;

    actualizarMarcadores();
    mostrarPregunta();

  } catch (error) {
    console.error(error);
    mensajeInicio.textContent =
      "No se pudo registrar el participante.";
    btnIniciar.disabled = false;

  } finally {
    guardando = false;
  }
});

// MOSTRAR PREGUNTA

function mostrarPregunta() {
  if (indice >= questions.length) {
    finalizarJuego();
    return;
  }

  const pregunta = questions[indice];

  respondida = false;
  pistaUsada = false;
  intentos = 0;

  document.getElementById("numeroPregunta")
    .textContent =
      `MISIÓN ${indice + 1} DE ${questions.length}`;

  document.getElementById("tituloPregunta")
    .textContent =
      "🚩 " + pregunta.title;

  document.getElementById("nivelPregunta")
    .textContent =
      "Nivel: " + pregunta.level;

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

  opciones.replaceChildren();

  pregunta.options.forEach((opcion, posicion) => {
    const boton = document.createElement("button");

    boton.className = "opcion";
    boton.textContent = opcion;

    boton.addEventListener("click", () => {
      comprobarRespuesta(posicion, boton);
    });

    opciones.appendChild(boton);
  });
}

// COMPROBAR RESPUESTA

async function comprobarRespuesta(posicion, boton) {
  if (respondida || guardando) return;

  const pregunta = questions[indice];

  const mensaje =
    document.getElementById("mensajeRespuesta");

  if (posicion !== pregunta.answer) {
    intentos++;

    boton.classList.add("incorrecta");
    boton.disabled = true;

    mensaje.textContent =
      "❌ Respuesta incorrecta. Analiza el código e intenta nuevamente.";

    return;
  }

  guardando = true;

  const puntosGanados = Math.max(
    10,
    pregunta.points - (pistaUsada ? 20 : 0)
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

  } catch (error) {
    console.error(error);
    mensaje.textContent =
      "No se pudo guardar la bandera. Intenta nuevamente.";

  } finally {
    guardando = false;
  }
}

// MOSTRAR PISTA

btnPista.addEventListener("click", () => {
  if (respondida || guardando || pistaUsada) {
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

// SIGUIENTE PREGUNTA

btnSiguiente.addEventListener("click", () => {
  if (!respondida || guardando) return;

  indice++;

  if (indice >= questions.length) {
    finalizarJuego();
  } else {
    mostrarPregunta();
  }
});

// ACTUALIZAR MARCADORES

function actualizarMarcadores() {
  document.getElementById("puntos")
    .textContent = puntos;

  document.getElementById("banderas")
    .textContent = banderas;

  const porcentaje =
    (banderas / questions.length) * 100;

  document.getElementById("barraProgreso")
    .style.width = porcentaje + "%";
}

// RANKING EN TIEMPO REAL

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

        const valores = [
          posicion++,
          datos.nombre || "Sin nombre",
          Number(datos.puntos) || 0,
          Number(datos.banderas) || 0
        ];

        valores.forEach((valor) => {
          const celda = fila.insertCell();
          celda.textContent = String(valor);
        });
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

// FINALIZAR JUEGO

function finalizarJuego() {
  inicio.classList.add("oculto");
  juego.classList.add("oculto");
  final.classList.remove("oculto");

  const nombre =
    jugador?.nombre || "Participante";

  document.getElementById("resultadoFinal")
    .textContent =
      `${nombre}: ${puntos} puntos y ${banderas} banderas.`;

  window.scrollTo(0, 0);
}

// INICIAR
iniciarFirebase();
