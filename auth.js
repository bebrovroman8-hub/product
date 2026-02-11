import { auth } from './firebase.js';
import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// 🔥 ВЫНЕСЛИ НА ГЛОБАЛЬНЫЙ УРОВЕНЬ (не внутри DOMContentLoaded)
export let userId = null;

// 🔥 ФИКС: Ждём полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');

const authError = document.getElementById('auth-error');
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');

/* ===== РЕГИСТРАЦИЯ ===== */
registerBtn.addEventListener('click', async () => {
console.log('Кнопка регистрации нажата');

const email = emailInput.value.trim();
const password = passwordInput.value.trim();

if (!email || !password) {
authError.textContent = 'Введите email и пароль';
authError.style.color = '#b079f9';
return;
}

if (password.length < 6) {
authError.textContent = 'Пароль должен быть минимум 6 символов';
authError.style.color = '#bf79f9';
return;
}

try {
const userCredential =
await createUserWithEmailAndPassword(auth, email, password);

userId = userCredential.user.uid;
showAppScreen();
authError.textContent = '';

} catch (error) {
if (error.code === 'auth/email-already-in-use') {
authError.textContent =
'Этот email уже зарегистрирован. Нажмите «Войти».';
} else if (error.code === 'auth/weak-password') {
authError.textContent =
'Пароль должен быть минимум 6 символов.';
} else {
authError.textContent = error.message;
}
authError.style.color = '#b079f9';
}
});

/* ===== ВХОД ===== */
loginBtn.addEventListener('click', async () => {
console.log('Кнопка входа нажата');

const email = emailInput.value.trim();
const password = passwordInput.value.trim();

if (!email || !password) {
authError.textContent = 'Введите email и пароль';
authError.style.color = '#aa79f9';
return;
}

try {
const userCredential =
await signInWithEmailAndPassword(auth, email, password);

userId = userCredential.user.uid;
showAppScreen();
authError.textContent = '';

} catch (error) {
authError.textContent = 'Неверный email или пароль';
authError.style.color = '#b579f9';
}
});

/* ===== ВЫХОД ===== */
logoutBtn.addEventListener('click', async () => {
await signOut(auth);
userId = null;

authScreen.style.display = 'flex';
appScreen.style.display = 'none';
});

/* ===== ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ ===== */
function showAppScreen() {
authScreen.style.display = 'none';
appScreen.style.display = 'block';
}
});