import { auth } from './firebase.js';
import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

export let userId = null;

document.addEventListener('DOMContentLoaded', () => {
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');

const authError = document.getElementById('auth-error');
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');

registerBtn.addEventListener('click', async () => {
const email = emailInput.value.trim();
const password = passwordInput.value.trim();

if (!email || !password) {
authError.textContent = 'Введите email и пароль';
return;
}

try {
const userCredential =
await createUserWithEmailAndPassword(auth, email, password);

userId = userCredential.user.uid;
showAppScreen();
authError.textContent = '';

} catch (error) {
authError.textContent = error.message;
}
});

loginBtn.addEventListener('click', async () => {
const email = emailInput.value.trim();
const password = passwordInput.value.trim();

if (!email || !password) {
authError.textContent = 'Введите email и пароль';
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
}
});

logoutBtn.addEventListener('click', async () => {
await signOut(auth);
userId = null;

authScreen.style.display = 'block';
appScreen.style.display = 'none';
});

function showAppScreen() {
authScreen.style.display = 'none';
appScreen.style.display = 'block';
}

authScreen.style.display = 'block';
appScreen.style.display = 'none';
});