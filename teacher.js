
import { firebaseConfig } from "./firebase-config.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// CONEXIÓN CON FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ELEMENTOS DEL PANEL
const acceso = document.getElementById("accesoDocente");
const contenido = document.getElementById("contenidoDocente");
const formulario = document.getElementById("formLogin");
const correo = document.getElementById("correoDocente");
const clave = document.getElementById("claveDocente");
const mensaje = document.getElementById("mensajeLogin");
const estado = document.getElementById("estadoPanel");
const tabla = document.getElementById("tablaDocente");
const btnSalir = document.getElementById("btnSalir");

let cancelarEscucha = null;
let revisionActual = 0;

function mostrarAcceso() {
  contenido.classList.add("oculto");
  acceso.classList.remove("oculto");
}

function mostrarPanel() {
  acceso.classList.add("oculto");
  contenido.classList.remove("oculto");
}

function detenerEscucha() {
  if (cancelarEscucha) {
    cancelarEscucha();
    cancelarEscucha = null;
  }
}

// INICIAR SESIÓN
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  mensaje.textContent = "Verificando acceso...";

  try {
    await signInWithEmailAndPassword(
      auth,
      correo.value.trim(),
      clave.value
    );

    clave.value = "";
  } catch (error) {
    mensaje.textContent =
      "No se pudo iniciar sesión. Revisa tu correo y contraseña.";
  }
});

// VERIFICAR QUE SEA LA DOCENTE
onAuthStateChanged(auth, async (usuario) => {
  const revision = ++revisionActual;
  detenerEscucha();

  if (!usuario) {
    mostrarAcceso();
    return;
  }

  try {
    const referencia = doc(db, "admins", usuario.uid);
    const resultado = await getDoc(referencia);

    if (revision !== revisionActual) return;

    if (!resultado.exists() ||
        resultado.data().enabled !== true) {
      mensaje.textContent =
        "Esta cuenta no tiene permisos de docente.";
      await signOut(auth);
      return;
    }

    mensaje.textContent = "";
    mostrarPanel();
    escucharParticipantes();

  } catch (error) {
    if (revision !== revisionActual) return;

    mensaje.textContent =
      "No fue posible verificar los permisos docentes.";

    mostrarAcceso();
  }
});

// ESCUCHAR LOS RESULTADOS EN TIEMPO REAL
function escucharParticipantes() {
  estado.textContent = "Conectando con los resultados...";

  cancelarEscucha = onSnapshot(
    collection(db, "participantes"),

    (snapshot) => {
      const participantes = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...documento.data()
      }));

      participantes.sort((a, b) =>
        (Number(b.puntos) || 0) -
        (Number(a.puntos) || 0)
      );

      actualizarResumen(participantes);
      actualizarTabla(participantes);

      estado.textContent =
        "Resultados actualizados en tiempo real.";
    },

    (error) => {
      estado.textContent =
        "Error al consultar los resultados. Revisa los permisos de Firestore.";
    }
  );
}

// ACTUALIZAR INDICADORES
function actualizarResumen(participantes) {
  const cantidad = participantes.length;

  const finalizados = participantes.filter(
    (p) => p.finalizado === true
  ).length;

  const sumaPuntos = participantes.reduce(
    (total, p) => total + (Number(p.puntos) || 0),
    0
  );

  const banderas = participantes.reduce(
    (total, p) => total + (Number(p.banderas) || 0),
    0
  );

  const promedio = cantidad > 0
    ? Math.round(sumaPuntos / cantidad)
    : 0;

  document.getElementById("totalParticipantes")
    .textContent = cantidad;

  document.getElementById("totalFinalizados")
    .textContent = finalizados;

  document.getElementById("promedioPuntos")
    .textContent = promedio;

  document.getElementById("totalBanderas")
    .textContent = banderas;
}

// CREAR TABLA DE CLASIFICACIÓN
function actualizarTabla(participantes) {
  tabla.replaceChildren();

  if (participantes.length === 0) {
    const fila = tabla.insertRow();
    const celda = fila.insertCell();

    celda.colSpan = 7;
    celda.textContent =
      "Todavía no hay participantes registrados.";
    return;
  }

  participantes.forEach((p, indice) => {
    const fila = tabla.insertRow();

    const datos = [
      indice + 1,
      p.nombre || "Sin nombre",
      p.modalidad || "Individual",
      Number(p.puntos) || 0,
      Number(p.banderas) || 0,
      Number(p.nivel) || 1,
      p.finalizado ? "Finalizado" : "En progreso"
    ];

    datos.forEach((dato) => {
      const celda = fila.insertCell();
      celda.textContent = String(dato);
    });
  });
}

// CERRAR SESIÓN
btnSalir.addEventListener("click", async () => {
  detenerEscucha();
  await signOut(auth);
  mostrarAcceso();
});
