
import { questions } from "./questions.js";
import { firebaseConfig, configured } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
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

// INICIAR FIREBASE

async function iniciarFirebase() {
  if (!configured) {
    mensajeInicio.textContent =
      "Firebase todavía no está configurado. Solicita ayuda a la docente.";
    btnIniciar.disabled = true;
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);

    auth = getAuth(app);
    db = getFirestore(app);

    btnIniciar.disabled = true;
    mensajeInicio.textContent = "Conectando con la competencia...";

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        usuario = user;
        btnIniciar.disabled = false;
        mensajeInicio.textContent = "";
        escucharRanking();
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          mensajeInicio.textContent =
            "No fue posible iniciar sesión. Verifica la configuración de Firebase.";
          console.error(error);
        }
      }
    });

  } catch (error) {
    console.error(error);
    mensajeInicio.textContent =
      "Error de conexión con Firebase.";
  }
}

// REGISTRAR PARTICIPANTE

btnIniciar.addEventListener("click", async () => {
  const nombre = nombreInput.value.trim();
  const modalidad = modalidadInput.value;

  if (!nombre || nombre.length < 2) {
    mensajeInicio.textContent =
      "Escribe un nombre de al menos dos caracteres.";
    return;
  }

  if (!usuario || !db) {
    mensajeInicio.textContent =
      "Espera a que se establezca la conexión.";
    return;
  }

  btnIniciar.disabled = true;

  jugador = {
    uid: usuario.uid,
    nombre: nombre,
    modalidad: modalidad,
    puntos: 0,
    banderas: 0,
    nivel: 1,
    finalizado: false
  };

  try {
    await setDoc(doc(db, "participantes", usuario.uid), {
      ...jugador,
      creado: serverTimestamp(),
      actualizado: serverTimestamp()
    });

    inicio.classList.add("oculto");
    juego.classList.remove("oculto");

    indice = 0;
    puntos = 0;
    banderas = 0;

    document.getElementById("nombreJugador").textContent = nombre;

    actualizarMarcadores();
    mostrarPregunta();

  } catch (error) {
    console.error(error);
    mensajeInicio.textContent =
      "No se pudo registrar. Revisa las reglas de Firestore.";
    btnIniciar.disabled = false;
  }
});

// MOSTRAR PREGUNTA

function mostrarPregunta() {
  const pregunta = questions[indice];

  respondida = false;
  pistaUsada = false;

  document.getElementById("numeroPregunta").textContent =
    `MISIÓN ${indice + 1} DE ${questions.length}`;

  document.getElementById("tituloPregunta").textContent =
    "🚩 " + pregunta.title;

  document.getElementById("nivelPregunta").textContent =
    "Nivel: " + pregunta.level;

  document.getElementById("codigoPython").textContent =
    pregunta.code;

  document.getElementById("enunciado").textContent =
    pregunta.question;

  document.getElementById("mensajeRespuesta").textContent = "";

  document.getElementById("textoPista").textContent = "";
  document.getElementById("textoPista").classList.add("oculto");

  btnPista.disabled = false;
  btnSiguiente.classList.add("oculto");

  opciones.innerHTML = "";

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
  const mensaje = document.getElementById("mensajeRespuesta");

  if (posicion !== pregunta.answer) {
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
    await updateDoc(doc(db, "participantes", usuario.uid), {
      puntos: nuevosPuntos,
      banderas: nuevasBanderas,
      nivel: indice + 1,
      finalizado: nuevasBanderas === questions.length,
      actualizado: serverTimestamp()
    });

    puntos = nuevosPuntos;
    banderas = nuevasBanderas;
    respondida = true;

    boton.classList.add("correcta");

    opciones.querySelectorAll("button").forEach(b => {
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
  if (respondida) return;

  const pregunta = questions[indice];

  document.getElementById("textoPista").textContent =
    "💡 " + pregunta.hint +
    " (Se descontarán 20 puntos al acertar).";

  document.getElementById("textoPista").classList.remove("oculto");

  pistaUsada = true;
  btnPista.disabled = true;
});

// SIGUIENTE PREGUNTA

btnSiguiente.addEventListener("click", () => {
  if (!respondida) return;

  indice++;

  if (indice >= questions.length) {
    finalizarJuego();
  } else {
    mostrarPregunta();
  }
});

// ACTUALIZAR MARCADORES

function actualizarMarcadores() {
  document.getElementById("puntos").textContent = puntos;
  document.getElementById("banderas").textContent = banderas;

  const porcentaje = (banderas / questions.length) * 100;

  document.getElementById("barraProgreso").style.width =
    porcentaje + "%";
}

// CLASIFICACIÓN EN TIEMPO REAL

function escucharRanking() {
  const consulta = query(
    collection(db, "participantes"),
    orderBy("puntos", "desc"),
    limit(50)
  );

  onSnapshot(consulta, (snapshot) => {
    ranking.innerHTML = "";

    if (snapshot.empty) {
      const fila = document.createElement("tr");
      const celda = document.createElement("td");

      celda.colSpan = 4;
      celda.textContent = "Todavía no hay participantes.";

      fila.appendChild(celda);
      ranking.appendChild(fila);
      return;
    }

    let posicion = 1;

    snapshot.forEach((documento) => {
      const datos = documento.data();

      const fila = document.createElement("tr");

      const valores = [
        posicion,
        datos.nombre || "Sin nombre",
        datos.puntos || 0,
        datos.banderas || 0
      ];

      valores.forEach((valor) => {
        const celda = document.createElement("td");
        celda.textContent = valor;
        fila.appendChild(celda);
      });

      ranking.appendChild(fila);
      posicion++;
    });

  }, (error) => {
    console.error(error);
    ranking.innerHTML = "";

    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 4;
    celda.textContent =
      "No se pudo cargar la clasificación.";

    fila.appendChild(celda);
    ranking.appendChild(fila);
  });
}

// FINALIZAR

function finalizarJuego() {
  juego.classList.add("oculto");
  final.classList.remove("oculto");

  document.getElementById("resultadoFinal").textContent =
    `${jugador.nombre}: ${puntos} puntos y ${banderas} banderas.`;

  window.scrollTo(0, 0);
}

// INICIAR

iniciarFirebase();
