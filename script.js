const firebaseConfig = {
apiKey: "AIzaSyBY_5FtbLuUgLiOebfmzAMKqnDsvsbeDXc",
authDomain: "protencarp.firebaseapp.com",
projectId: "protencarp",
storageBucket: "protencarp.appspot.com",
messagingSenderId: "37899247050",
appId: "1:37899247050:web:e8464a6386510174e2c333",
databaseURL: "https://protencarp-default-rtdb.firebaseio.com/"
};

let db = null;
let storage = null;
let firebaseStarted = false;

let meals = [];
let tableStatus = {};
let archivesData = {};

let currentBranchView = "delivery";
let activeMainFilter = "all";

let waNum = "966506546313";
let currentBannerUrl = "";

let systemPasswords = {
main: "1234",
admin: "0000"
};

window.onload = function () {

const input = document.getElementById("mainLoginCode");

if (input) {
input.focus();

input.addEventListener("keydown", function (e) {
if (e.key === "Enter") {
loginMainSystem();
}
});
}

};

function loginMainSystem() {

const code = document.getElementById("mainLoginCode").value.trim();

if (
code !== systemPasswords.main &&
code !== "1234"
) {

customAlert(
"❌",
"رمز خاطئ",
"رمز الدخول غير صحيح"
);

return;
}

document.getElementById("mainLoginScreen").style.display = "none";

document.getElementById("app").style.display = "block";

connectFirebase();

}

function connectFirebase() {

if (firebaseStarted) return;

try {

if (!firebase.apps.length) {
firebase.initializeApp(firebaseConfig);
}

db = firebase.database();

try {
storage = firebase.storage();
} catch (e) {
storage = null;
}

firebaseStarted = true;

setStatus("⏳ جاري الاتصال بالسحابة...");

db.ref("pnc_data").on("value", function (snap) {

const data = snap.exists() ? snap.val() : {};

meals = Array.isArray(data.mealsList)
? data.mealsList
: [];

tableStatus = data.actions || {};

archivesData = data.archives || {};

waNum = data.whatsapp || "966506546313";

currentBannerUrl = data.bannerUrl || "";

if (data.passwords) {
systemPasswords = data.passwords;
}

applyDataToUI();

setStatus("🟢 متصل بالسحابة");

});

} catch (error) {

setStatus("❌ فشل تشغيل Firebase");

alert(error.message);

}

}

function applyDataToUI() {

const waLink = document.getElementById("waLink");

if (waLink) {
waLink.href = "https://wa.me/" + waNum;
}

if (
currentBannerUrl &&
document.getElementById("topBanner")
) {

document.getElementById(
"topBanner"
).style.backgroundImage =
"linear-gradient(rgba(15,23,42,.3),rgba(15,23,42,.9)),url('" +
currentBannerUrl +
"')";

}

renderCards();

recalculateStats();

renderArchives();

}

function setStatus(text) {

const el = document.getElementById("status");

if (el) {
el.innerHTML = text;
}

}

function customAlert(icon, title, message) {

document.getElementById(
"alertIcon"
).innerHTML = icon;

document.getElementById(
"alertTitle"
).innerHTML = title;

document.getElementById(
"alertMessage"
).innerHTML = message;

document.getElementById(
"modalActionButtons"
).style.display = "none";

document.getElementById(
"customAlertModal"
).style.display = "flex";

}

function closeCustomAlert() {

document.getElementById(
"customAlertModal"
).style.display = "none";

}

function toggleSidebarDrawer(open) {

document.getElementById(
"sidebarDrawer"
).className = open
? "sidebar-drawer open"
: "sidebar-drawer";

document.getElementById(
"drawerOverlay"
).className = open
? "drawer-overlay open"
: "drawer-overlay";

}

function switchBranchView(view) {

currentBranchView = view;

document.querySelectorAll(
".branch-filter-btn"
).forEach(function (b) {

b.classList.remove(
"active-branch-selected"
);

});

const btn = document.getElementById(
"btn-view-" + view
);

if (btn) {
btn.classList.add(
"active-branch-selected"
);
}

const names = {
delivery: "التوصيل",
batarji: "البترجي",
ruhaily: "الرحيلي"
};

document.getElementById(
"listTitle"
).innerHTML =
"قائمة فرز " + names[view];

renderCards();

recalculateStats();

}

function recalculateStats() {

let pending = 0;
let done = 0;
let cancel = 0;

meals.forEach(function (m) {

if (m.branch !== currentBranchView)
return;

const action =
tableStatus[m.number] || {};

if (action.status === "done") {
done++;
}
else if (
action.status === "cancel"
) {
cancel++;
}
else {
pending++;
}

});

document.getElementById(
"pendingMeals"
).innerHTML = pending;

document.getElementById(
"doneMeals"
).innerHTML = done;

document.getElementById(
"cancelMeals"
).innerHTML = cancel;

}

function renderCards() {

const container =
document.getElementById(
"mealCardsContainer"
);

if (!container) return;

container.innerHTML = "";

const query =
document.getElementById(
"mealInput"
).value.trim().toLowerCase();

let filtered = meals.filter(
m => m.branch === currentBranchView
);

if (query) {

filtered = filtered.filter(function (m) {

return (
String(m.number).includes(query) ||
String(m.name || "")
.toLowerCase()
.includes(query)
);

});

}

if (!filtered.length) {

container.innerHTML =
"<div class='status-line'>لا توجد نتائج</div>";

return;

}

filtered.forEach(function (meal) {

const action =
tableStatus[meal.number] || {};

let badge =
"<span style='color:#facc15;'>⏳ انتظار</span>";

if (action.status === "done") {
badge =
"<span style='color:#22c55e;'>✅ مستلم</span>";
}

if (action.status === "cancel") {
badge =
"<span style='color:#ef4444;'>❌ ملغى</span>";
}

const div = document.createElement("div");

div.className = "meal-row-card";

div.onclick = function () {
checkMeal(meal);
};

div.innerHTML =
"<div class='meal-card-main-info'>" +
"<span class='meal-card-num'>#" +
meal.number +
"</span>" +
badge +
"</div>" +
"<div class='meal-card-name'>" +
meal.name +
"</div>";

container.appendChild(div);

});

}

function checkMealFromInput() {

const value =
document.getElementById(
"mealInput"
).value.trim().toLowerCase();

if (!value) {

customAlert(
"⚠️",
"تنبيه",
"اكتب اسم أو رقم المشترك"
);

return;

}

const meal =
meals.find(
m => String(m.number) === value
) ||
meals.find(function (m) {

return String(m.name || "")
.toLowerCase()
.includes(value);

});

if (!meal) {

customAlert(
"🔍",
"غير موجود",
"لم يتم العثور على المشترك"
);

return;

}

checkMeal(meal);

}

function checkMeal(meal) {

const action =
tableStatus[meal.number] || {};

if (action.status === "done") {

customAlert(
"✅",
"تم التسليم",
"👤 " +
meal.name +
"<br>#" +
meal.number
);

return;

}

confirmDeliver(meal);

}

function confirmDeliver(meal) {

document.getElementById(
"alertIcon"
).innerHTML = "👤";

document.getElementById(
"alertTitle"
).innerHTML =
"تأكيد التسليم";

document.getElementById(
"alertMessage"
).innerHTML =
"<b>" +
meal.name +
"</b><br><br>#" +
meal.number;

document.getElementById(
"modalActionButtons"
).style.display = "flex";

document.getElementById(
"modalConfirmBtn"
).onclick = function () {

executeAction(
meal.number,
"done"
);

closeCustomAlert();

};

document.getElementById(
"modalCancelBtn"
).onclick = function () {

executeAction(
meal.number,
"cancel"
);

closeCustomAlert();

};

document.getElementById(
"customAlertModal"
).style.display = "flex";

}

function executeAction(number, action) {

const now = new Date();

const time =
now.toLocaleTimeString(
"ar-SA",
{
hour: "2-digit",
minute: "2-digit"
}
);

db.ref(
"pnc_data/actions/" + number
).set({
status: action,
time: time
});

}

async function processPDFFile() {

const fileInput =
document.getElementById(
"pdfFileInput"
);

const status =
document.getElementById(
"pdfStatus"
);

if (!fileInput.files.length) {

customAlert(
"⚠️",
"ملف غير موجود",
"اختر ملف PDF أولاً"
);

return;

}

try {

status.innerHTML =
"⏳ جاري قراءة PDF...";

pdfjsLib.GlobalWorkerOptions.workerSrc =
"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const buffer =
await fileInput.files[0]
.arrayBuffer();

const pdf =
await pdfjsLib
.getDocument({ data: buffer })
.promise;

const newMeals = [];

const seen = {};

let expectedTotal = 0;

for (
let pageNum = 1;
pageNum <= pdf.numPages;
pageNum++
) {

status.innerHTML =
"⏳ قراءة الصفحة " +
pageNum;

const page =
await pdf.getPage(pageNum);

const textContent =
await page.getTextContent();

const pageText =
textContent.items
.map(i => String(i.str || ""))
.join(" ");

const pageCountMatch =
pageText.match(
/Page\s+\d+\s+of\s+(\d+)/i
);

if (pageCountMatch) {

expectedTotal =
parseInt(
pageCountMatch[1],
10
);

}

const meal =
extractMealByBracketLine(
textContent.items,
pageText
);

if (
meal &&
!seen[meal.number]
) {

seen[meal.number] = true;

newMeals.push(meal);

}

}

if (!newMeals.length) {

customAlert(
"❌",
"فشل القراءة",
"لم يتم استخراج أي مشترك"
);

return;

}

await db.ref(
"pnc_data/mealsList"
).set(newMeals);

await db.ref(
"pnc_data/actions"
).remove();

status.innerHTML =
"✅ تم استخراج " +
newMeals.length +
" مشترك";

customAlert(
"✅",
"تم التحديث",
"تم استخراج " +
newMeals.length +
" مشترك"
);

}
catch (e) {

status.innerHTML =
"❌ خطأ قراءة PDF";

customAlert(
"❌",
"خطأ",
e.message
);

}

}
function extractMealByBracketLine(items, pageText) {

const lines =
groupPdfItemsIntoLines(items);

let targetLine = "";

for (let i = 0; i < lines.length; i++) {

if (/\[\d{4,8}\]/.test(lines[i])) {
targetLine = lines[i];
break;
}

}

if (!targetLine) return null;

let number = null;
let name = "";

let after =
targetLine.match(/\[(\d{4,8})\]\s*(.+)$/);

if (after) {
number = parseInt(after[1], 10);
name = after[2];
}

if (!name || name.length < 2) {

let before =
targetLine.match(/^(.+?)\s*\[(\d{4,8})\]/);

if (before) {
name = before[1];
number = parseInt(before[2], 10);
}

}

name = cleanSubscriberName(name);

if (!number || name.length < 2) {
return null;
}

return {
number: number,
name: name,
branch: detectBranch(pageText)
};

}

function groupPdfItemsIntoLines(items) {

const rows = [];

items.forEach(function (item) {

const text =
String(item.str || "").trim();

if (!text) return;

const y =
Math.round(
item.transform
? item.transform[5]
: 0
);

const x =
item.transform
? item.transform[4]
: 0;

let row =
rows.find(function (r) {
return Math.abs(r.y - y) <= 3;
});

if (!row) {
row = {
y: y,
items: []
};
rows.push(row);
}

row.items.push({
x: x,
text: text
});

});

rows.sort(function (a, b) {
return b.y - a.y;
});

return rows.map(function (row) {

const original =
row.items
.map(function (i) {
return i.text;
})
.join(" ");

const byX =
row.items
.slice()
.sort(function (a, b) {
return a.x - b.x;
})
.map(function (i) {
return i.text;
})
.join(" ");

if (/\[\d{4,8}\]/.test(original)) {
return original
.replace(/\s+/g, " ")
.trim();
}

return byX
.replace(/\s+/g, " ")
.trim();

});

}

function cleanSubscriberName(name) {

return String(name || "")

.replace(/\[\d{4,8}\]/g, "")

.replace(/PROTEIN\s+AND\s+CARB/gi, "")

.replace(/\bPlan\s+name\b.*$/i, "")

.replace(/\bItems\s+Count\b.*$/i, "")

.replace(/\bNotes\b.*$/i, "")

.replace(/\bDistrict\b.*$/i, "")

.replace(/\bCaptain\s+Name\b.*$/i, "")

.replace(/\bService\s+Type\b.*$/i, "")

.replace(/\bPickup\s+Branch\b.*$/i, "")

.replace(/\bPage\s+\d+\s+of\s+\d+\b/gi, "")

.replace(/^\d{8,20}\s*/, "")

.replace(/^\d{4}-\d{2}-\d{2}\s*/, "")

.replace(/\s+/g, " ")

.trim();

}

function normalizeBranchText(text) {

return String(text || "")

.toLowerCase()

.replace(/[\u200B-\u200D\uFEFF]/g, "")

.replace(/[•●·.،,_\-–—:؛]/g, " ")

.replace(/\s+/g, " ")

.trim();

}

function detectBranch(text) {

const lower =
normalizeBranchText(text);

if (
lower.includes("pickup branch") &&
(
lower.includes("albatarji") ||
lower.includes("batarji") ||
lower.includes("al batarji") ||
lower.includes("بترجي") ||
lower.includes("البترجي")
)
) {
return "batarji";
}

if (
lower.includes("pickup branch") &&
(
lower.includes("al rhili") ||
lower.includes("alrhili") ||
lower.includes("rhili") ||
lower.includes("ruhaily") ||
lower.includes("alruhaily") ||
lower.includes("al ruhaily") ||
lower.includes("رحيلي") ||
lower.includes("الرحيلي")
)
) {
return "ruhaily";
}

return "delivery";

}

function renderArchives() {

const container =
document.getElementById(
"archiveContainer"
);

if (!container) return;

container.innerHTML = "";

const keys =
Object.keys(archivesData || {});

if (!keys.length) {

container.innerHTML =
"<div class='status-line'>لا يوجد أرشيف</div>";

return;

}

keys.sort().reverse().forEach(function (key) {

const arc =
archivesData[key];

const div =
document.createElement("div");

div.className = "archive-item";

div.innerHTML =
"<div class='archive-info'>" +
"<b>📅 " +
escapeHtml(arc.date || "-") +
"</b><br>" +
"<span>المستلمين: " +
escapeHtml(arc.totalDone || 0) +
"</span>" +
"</div>" +
"<button class='archive-delete-btn' onclick=\"deleteArchive('" +
key +
"')\">🗑️ حذف</button>";

container.appendChild(div);

});

}

function deleteArchive(key) {

confirmModal(
"🗑️ حذف الأرشيف",
"هل تريد حذف هذا اليوم من الأرشيف؟",
function () {

if (!db) {

customAlert(
"❌",
"لا يوجد اتصال",
"انتظر الاتصال بالسحابة"
);

return;

}

db.ref(
"pnc_data/archives/" + key
).remove()
.then(function () {

customAlert(
"✅",
"تم الحذف",
"تم حذف الأرشيف بنجاح"
);

})
.catch(function (error) {

customAlert(
"❌",
"خطأ",
error.message
);

});

}
);

}

function confirmModal(title, message, onConfirm) {

document.getElementById(
"alertIcon"
).innerHTML = "⚠️";

document.getElementById(
"alertTitle"
).innerHTML = title;

document.getElementById(
"alertMessage"
).innerHTML = message;

document.getElementById(
"modalActionButtons"
).style.display = "flex";

document.getElementById(
"modalConfirmBtn"
).innerHTML = "✅ تأكيد";

document.getElementById(
"modalCancelBtn"
).innerHTML = "❌ إلغاء";

document.getElementById(
"modalConfirmBtn"
).onclick = function () {

closeCustomAlert();

if (typeof onConfirm === "function") {
onConfirm();
}

};

document.getElementById(
"modalCancelBtn"
).onclick = function () {

closeCustomAlert();

};

document.getElementById(
"customAlertModal"
).style.display = "flex";

}

function openAdminLogin() {

document.getElementById(
"adminLoginModal"
).style.display = "flex";

}

function closeAdminLogin() {

document.getElementById(
"adminLoginModal"
).style.display = "none";

}

function loginAdminPanel() {

const code =
document.getElementById(
"adminLoginCode"
).value.trim();

if (
code !== systemPasswords.admin &&
code !== "0000"
) {

customAlert(
"❌",
"رمز خاطئ",
"رمز الإشراف غير صحيح"
);

return;

}

closeAdminLogin();

document.getElementById(
"adminPanel"
).style.display = "block";

document.getElementById(
"adminPanel"
).scrollIntoView({
behavior: "smooth",
block: "start"
});

}

function closeAdminPanel() {

document.getElementById(
"adminPanel"
).style.display = "none";

}

function savePasswords() {

if (!db) {

customAlert(
"❌",
"لا يوجد اتصال",
"انتظر الاتصال بالسحابة"
);

return;

}

const main =
document.getElementById(
"mainCodeInput"
).value.trim();

const admin =
document.getElementById(
"adminCodeInput"
).value.trim();

db.ref(
"pnc_data/passwords"
).set({
main: main,
admin: admin
}).then(function () {

customAlert(
"✅",
"تم الحفظ",
"تم حفظ كلمات المرور"
);

});

}

async function uploadBannerImage() {

if (!storage || !db) {

customAlert(
"❌",
"التخزين غير متاح",
"Firebase Storage غير مفعل"
);

return;

}

const fileInput =
document.getElementById(
"bannerImageUpload"
);

const progress =
document.getElementById(
"uploadProgress"
);

if (!fileInput.files.length) {

customAlert(
"⚠️",
"لم يتم اختيار صورة",
"اختر صورة أولاً"
);

return;

}

const file =
fileInput.files[0];

progress.innerHTML =
"⏳ جاري رفع الصورة...";

try {

const ref =
storage.ref(
"banners/banner_" +
Date.now() +
"_" +
file.name
.replace(/[^\w.\-]/g, "_")
);

await ref.put(file);

const url =
await ref.getDownloadURL();

await db.ref(
"pnc_data/bannerUrl"
).set(url);

progress.innerHTML =
"✅ تم رفع الصورة";

}
catch (e) {

progress.innerHTML =
"❌ فشل رفع الصورة";

customAlert(
"❌",
"فشل رفع الصورة",
e.message
);

}

}

function calculateAllBranchesLiveReport() {

const stats = {
delivery: { done: 0, pending: 0 },
batarji: { done: 0, pending: 0 },
ruhaily: { done: 0, pending: 0 }
};

meals.forEach(function (meal) {

if (!stats[meal.branch]) return;

const action =
tableStatus[meal.number] || {};

const status =
action.status || "pending";

if (status === "done") {
stats[meal.branch].done++;
}
else if (status !== "cancel") {
stats[meal.branch].pending++;
}

});

document.getElementById(
"drawerDelSum"
).innerHTML =
stats.delivery.done +
" مستلم / " +
stats.delivery.pending +
" باقي";

document.getElementById(
"drawerBatSum"
).innerHTML =
stats.batarji.done +
" مستلم / " +
stats.batarji.pending +
" باقي";

document.getElementById(
"drawerRuhSum"
).innerHTML =
stats.ruhaily.done +
" مستلم / " +
stats.ruhaily.pending +
" باقي";

}

function openReports() {

document.getElementById(
"reportsOverlay"
).classList.add("open");

}

function closeReports() {

document.getElementById(
"reportsOverlay"
).classList.remove("open");

}

function switchTab(tab) {

activeTab = tab;

}

function updateReports() {}

function generatePDFReport() {

customAlert(
"📄",
"التقرير",
"ميزة التقرير موجودة، وسنضبطها بعد التأكد من قراءة PDF"
);

}

function escapeHtml(value) {

return String(value ?? "")
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");

         }
