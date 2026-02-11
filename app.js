import { db } from "./firebase.js";
import {
collection,
addDoc,
getDocs,
deleteDoc,
doc,
query,
where,
orderBy,
setDoc,
getDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
const datePicker = document.getElementById("datePicker");
const actionNameInput = document.getElementById("actionName");
const actionScoreSelect = document.getElementById("actionScore");
const addActionBtn = document.getElementById("addActionBtn");
const actionsList = document.getElementById("actionsList");
const statsResult = document.getElementById("statsResult");
const dayStatsBtn = document.getElementById("dayStatsBtn");
const weekStatsBtn = document.getElementById("weekStatsBtn");
const monthStatsBtn = document.getElementById("monthStatsBtn");

let currentUserId = null;
let chartInstance = null;
let currentChartDays = 7;

datePicker.value = new Date().toISOString().split("T")[0];

onAuthStateChanged(auth, user => {
if (!user) return;

currentUserId = user.uid;
document.getElementById("auth-screen").style.display = "none";
document.getElementById("app-screen").style.display = "block";

createNoteBlock();
loadActionsByDate(datePicker.value);
loadDayNote(datePicker.value);
buildChart(currentChartDays);
});

async function loadActionsByDate(date) {
actionsList.innerHTML = "";
if (!currentUserId) return;

const q = query(
collection(db, "users", currentUserId, "actions"),
where("date", "==", date),
orderBy("createdAt")
);

const snap = await getDocs(q);

if (snap.empty) {
actionsList.innerHTML = `
<div style="text-align:center;padding:40px;color:#64748b;">
<i class="fas fa-clipboard-list" style="font-size:48px;margin-bottom:15px;"></i>
<p style="font-size:18px;font-weight:500;">Нет действий за этот день</p>
<p style="font-size:14px;color:#94a3b8;margin-top:8px;">Добавьте первое действие!</p>
</div>`;
return;
}

snap.forEach(d => {
const a = d.data();
const row = document.createElement("div");
row.className = "action-row";
row.innerHTML = `
<span style="font-size:16px;font-weight:600;color:#2d3748;">${a.name}</span>
<div class="action-right">
<strong style="font-size:18px;">${a.score}</strong>
<button class="delete-btn" title="Удалить">✕</button>
</div>
`;

row.querySelector(".delete-btn").onclick = async () => {
if (!confirm("Удалить это действие?")) return;
await deleteDoc(doc(db, "users", currentUserId, "actions", d.id));
loadActionsByDate(date);
buildChart(currentChartDays);
};

actionsList.appendChild(row);
});
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

await addDoc(collection(db, "users", currentUserId, "actions"), {
name,
score,
date,
createdAt: serverTimestamp()
});

actionNameInput.value = "";
loadActionsByDate(date);
buildChart(currentChartDays);
};

function createNoteBlock() {
if (document.getElementById("dayNote")) return;

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

const snap = await getDoc(
doc(db, "users", currentUserId, "dayNotes", date)
);

textarea.value = snap.exists() ? snap.data().text : "";
}

function getColor(v) {
if (v === 0) return "rgba(0,0,0,0)";
if (v < 2.5) return "#FF6B6B";
if (v < 3.8) return "#FFD166";
return "#06D6A0";
}

weekStatsBtn.onclick = () => {
currentChartDays = 7;
weekStatsBtn.classList.add("active");
dayStatsBtn.classList.remove("active");
monthStatsBtn.classList.remove("active");
buildChart(7);
};

monthStatsBtn.onclick = () => {
currentChartDays = 30;
monthStatsBtn.classList.add("active");
dayStatsBtn.classList.remove("active");
weekStatsBtn.classList.remove("active");
buildChart(30);
};

async function buildChart(days) {
if (!currentUserId) return;
if (chartInstance) chartInstance.destroy();

statsResult.innerHTML = `
<div class="chart-wrapper">
<canvas id="chart"></canvas>
</div>
`;

await new Promise(r => setTimeout(r, 50));

const ctx = document.getElementById("chart")?.getContext("2d");
if (!ctx) return;

const today = new Date();
const start = new Date();
start.setDate(today.getDate() - (days - 1));

const labels = [];
const values = [];
const colors = [];
const keys = [];

for (let i = 0; i < days; i++) {
const d = new Date(start);
d.setDate(start.getDate() + i);
const key = d.toISOString().split("T")[0];
keys.push(key);
labels.push(
d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
);
}

const q = query(
collection(db, "users", currentUserId, "actions"),
where("date", ">=", keys[0]),
where("date", "<=", keys[keys.length - 1])
);

const snap = await getDocs(q);
const grouped = {};

snap.forEach(d => {
const a = d.data();
if (!grouped[a.date]) grouped[a.date] = [];
grouped[a.date].push(a.score);
});

keys.forEach(k => {
if (grouped[k]) {
const avg =
grouped[k].reduce((a, b) => a + b, 0) / grouped[k].length;
values.push(Number(avg.toFixed(1)));
colors.push(getColor(avg));
} else {
values.push(0);
colors.push("rgba(0,0,0,0)");
}
});

chartInstance = new Chart(ctx, {
type: "bar",
data: {
labels,
datasets: [
{
label: "Средняя продуктивность",
data: values,
backgroundColor: colors,
borderRadius: 6,
barPercentage: days === 7 ? 0.7 : 0.9
}
]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { display: false }
},
scales: {
y: {
beginAtZero: true,
max: 5,
ticks: { stepSize: 1 }
},
x: { grid: { display: false } }
},
onClick: (_, elements) => {
if (!elements.length) return;
const i = elements[0].index;
datePicker.value = keys[i];
loadActionsByDate(keys[i]);
loadDayNote(keys[i]);
}
}
});
}
});