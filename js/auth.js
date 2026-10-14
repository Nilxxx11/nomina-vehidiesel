/**
 * Página de acceso: inicio de sesión y registro de usuarios.
 * Al registrarse se crea la cuenta (correo/contraseña) y se guarda
 * un documento en usuarios/{uid} con la cédula para vincular al empleado.
 */
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { DB_PATHS } from "./config.js";
import { normCedula, toast, humanError } from "./utils.js";

const $ = (sel) => document.querySelector(sel);
let registrando = false; // evita redirigir antes de guardar usuarios/{uid}

/* ------- pestañas ------- */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));
    const isLogin = tab.dataset.tab === "login";
    $("#form-login").classList.toggle("hidden", !isLogin);
    $("#form-register").classList.toggle("hidden", isLogin);
  });
});

/* ------- login ------- */
$("#form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#btn-login");
  btn.disabled = true; btn.textContent = "Ingresando…";
  try {
    await signInWithEmailAndPassword(auth, $("#login-email").value.trim(), $("#login-password").value);
    // onAuthStateChanged se encarga de redirigir
  } catch (err) {
    toast(humanError(err), "error");
    btn.disabled = false; btn.textContent = "Ingresar";
  }
});

/* ------- registro ------- */
$("#form-register").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = $("#reg-nombre").value.trim();
  const cedula = normCedula($("#reg-cedula").value);
  const email = $("#reg-email").value.trim();
  const pass = $("#reg-password").value;
  const pass2 = $("#reg-password2").value;

  if (cedula.length < 5) return toast("Ingresa un número de cédula válido.", "warn");
  if (pass !== pass2) return toast("Las contraseñas no coinciden.", "warn");

  const btn = $("#btn-register");
  btn.disabled = true; btn.textContent = "Creando cuenta…";
  registrando = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;
    try { await updateProfile(cred.user, { displayName: nombre }); } catch {}
    await set(ref(db, `${DB_PATHS.usuarios}/${uid}`), {
      email, nombre, cedula,
      creadoEn: Date.now(),
    });
    toast("Cuenta creada. ¡Bienvenido!", "ok");
    window.location.replace("dashboard.html");
  } catch (err) {
    registrando = false;
    toast(humanError(err), "error");
    btn.disabled = false; btn.textContent = "Crear mi cuenta";
  }
});

/* ------- sesión activa: ir al panel ------- */
onAuthStateChanged(auth, (user) => {
  if (user && !registrando) window.location.replace("dashboard.html");
});
