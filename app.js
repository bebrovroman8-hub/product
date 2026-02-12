import { db } from "./firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", async () => {
const datePicker = document.getElementById("datePicker");
const actionNameInput = document.getElementById("actionName");
const actionScoreSelect = document.getElementById("actionScore");
const addActionBtn = document.getElementById("addActionBtn");
const actionsList = document.getElementById("actionsList");
const statsResult = document.getElementById("statsResult");
const weekStatsBtn = document.getElementById("weekStatsBtn");
const monthStatsBtn = document.getElementById("monthStatsBtn");

let currentUserId = null;
let chartInstance = null;
let currentChartDays = 7;
let chartKeys = [];

datePicker.value = new Date().toISOString().split("T")[0];

document.getElementById('auth-screen').style.display = 'block';
document.getElementById('app-screen').style.display = 'none';

async function loadActionsByDate(date) {
actionsList.innerHTML = "";
if (!currentUserId) return;

try {
const q = query(
collection(db, "users", currentUserId, "actions"),
where("date", "==", date),
orderBy("createdAt")
);
const snap = await getDocs(q);

if (snap.empty) {
actionsList.innerHTML = `
<div style="text-align:center;padding:40px;color:#6B5B95;">
<i class="fas fa-clipboard-list" style="font-size:48px;margin-bottom:15px;"></i>
<p style="font-size:18px;font-weight:500;">Нет действий за этот день</p>
<p style="font-size:14px;color:#94a3b8;margin-top:8px;">Добавьте первое действие!</p>
</div>
`;
return;
}

snap.forEach((d) => {
const a = d.data();
const row = document.createElement("div");
row.className = "action-row";
row.innerHTML = `
<span class="action-name">${a.name}</span>
<div class="action-right">
<strong class="action-score">${a.score}</strong>
<button class="delete-btn" title="Удалить">✕</button>
</div>
`;
row.querySelector(".delete-btn").onclick = async () => {
if (confirm("Удалить действие?")) {
try {
await deleteDoc(doc(db, "users", currentUserId, "actions", d.id));
loadActionsByDate(date);
buildChart(currentChartDays);
} catch (error) {
console.error("Ошибка удаления:", error);
alert("Ошибка при удалении действия");
}
}
};
actionsList.appendChild(row);
});
} catch (error) {
console.error("Ошибка загрузки действий:", error);
}
}

datePicker.onchange = () => {
loadActionsByDate(datePicker.value);
loadDayNote(datePicker.value);
};

addActionBtn.onclick = async () => {
const name = actionNameInput.value.trim();
const score = Number(actionScoreSelect.value);
const date = datePicker.value;

if (!name || !currentUserId) {
alert("Введите название действия");
return;
}

try {
await addDoc(collection(db, "users", currentUserId, "actions"), {
name,
score,
date,
createdAt: new Date(),
});
actionNameInput.value = "";
loadActionsByDate(date);
buildChart(currentChartDays);
} catch (error) {
console.error("Ошибка добавления действия:", error);
}
};

function createNoteBlock() {
const block = document.createElement("div");
block.className = "block";
block.innerHTML = `
<h3><i class="fas fa-sticky-note"></i> Комментарий к дню</h3>
<textarea id="dayNote" placeholder="Что получилось / не получилось и почему?"></textarea>
<button id="saveNoteBtn"><i class="fas fa-save"></i> Сохранить комментарий</button>
`;
document.getElementById("app-screen").appendChild(block);
document.getElementById("saveNoteBtn").onclick = saveDayNote;
}

async function saveDayNote() {
const text = document.getElementById("dayNote").value;
const date = datePicker.value;
if (!currentUserId) return;

await setDoc(doc(db, "users", currentUserId, "dayNotes", date), {
text,
date
});
alert("Комментарий сохранён!");
}

async function loadDayNote(date) {
const textarea = document.getElementById("dayNote");
if (!textarea || !currentUserId) return;

const ref = doc(db, "users", currentUserId, "dayNotes", date);
const snap = await getDoc(ref);
textarea.value = snap.exists() ? snap.data().text : "";
}

function getColor(v) {
if (v === 0) return "rgba(0,0,0,0.1)";
if (v < 2.5) return "#F0ABFC";
if (v < 3.8) return "#D8B4FE";
return "#A78BFA";
}

if (weekStatsBtn) {
weekStatsBtn.onclick = () => {
currentChartDays = 7;
buildChart(7);
};
}

if (monthStatsBtn) {
monthStatsBtn.onclick = () => {
currentChartDays = 30;
buildChart(30);
};
}

async function buildChart(days) {
if (!currentUserId) return;
if (chartInstance) chartInstance.destroy();

statsResult.innerHTML = `
<div class="chart-scroll">
<div class="chart-wrapper ${days === 30 ? "month" : ""}">
<canvas id="chart" style="width:100%;height:400px;"></canvas>
</div>
</div>
`;

await new Promise((r) => setTimeout(r, 100));

const ctx = document.getElementById("chart").getContext("2d");

const today = new Date();
const start = new Date();
start.setDate(today.getDate() - (days - 1));

const labels = [];
const values = [];
const colors = [];
chartKeys = [];

for (let i = 0; i < days; i++) {
const d = new Date(start);
d.setDate(start.getDate() + i);
const key = d.toISOString().split("T")[0];
chartKeys.push(key);
labels.push(d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }));
}

const q = query(
collection(db, "users", currentUserId, "actions"),
where("date", ">=", chartKeys[0]),
where("date", "<=", chartKeys[chartKeys.length - 1])
);
const snap = await getDocs(q);
const grouped = {};

snap.forEach((d) => {
const a = d.data();
if (!grouped[a.date]) grouped[a.date] = [];
grouped[a.date].push(a.score);
});

chartKeys.forEach((k) => {
if (grouped[k]) {
const avg = grouped[k].reduce((a, b) => a + b, 0) / grouped[k].length;
values.push(parseFloat(avg.toFixed(1)));
colors.push(getColor(avg));
} else {
values.push(0);
colors.push("rgba(0,0,0,0.1)");
}
});

chartInstance = new Chart(ctx, {
type: "bar",
data: {
labels: labels,
datasets: [{
label: "Средняя продуктивность",
data: values,
backgroundColor: colors,
borderWidth: 2,
borderColor: colors,
borderRadius: 6
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
scales: {
y: {
min: 1,
max: 5
}
},
onClick: (event, elements) => {
if (!elements.length) return;

const index = elements[0].index;
const selectedDate = chartKeys[index];

datePicker.value = selectedDate;
loadActionsByDate(selectedDate);
loadDayNote(selectedDate);

setTimeout(() => {
actionsList.scrollIntoView({ behavior: "smooth" });
}, 100);
}
}
});
}

onAuthStateChanged(auth, async (user) => {
if (user) {
currentUserId = user.uid;
document.getElementById('auth-screen').style.display = 'none';
document.getElementById('app-screen').style.display = 'block';

await loadActionsByDate(datePicker.value);
await loadDayNote(datePicker.value);
await buildChart(currentChartDays);
} else {
currentUserId = null;
}
});

createNoteBlock();
});