var defaultBanner = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000";
var firebaseConfig = {
  apiKey: "AIzaSyBY_5FtbLuUgLiOebfmzAMKqnDsvsbeDXc",
  authDomain: "protencarp.firebaseapp.com",
  projectId: "protencarp",
  storageBucket: "protencarp.firebasestorage.app",
  messagingSenderId: "37899247050",
  appId: "1:37899247050:web:e8464a6386510174e2c333",
  databaseURL: "https://protencarp-default-rtdb.firebaseio.com/"
};

var db, meals = [], tableStatus = {}, archivesData = {}, activeTab = "done", waNum = "966506546313", currentBannerUrl = defaultBanner;
var currentBranchView = "delivery";
var currentCoolingTemp = "";
var activeMainFilter = "all";
var currentLoggedStaff = { delivery: null, batarji: null, ruhaily: null };
var staffData = { batarji: [{name:"", code:""}, {name:"", code:""}, {name:"", code:""}], ruhaily: [{name:"", code:""}], delivery: [{name:"", code:""}] };

window.onload = function() { startFirebaseConnection(); };

function startFirebaseConnection() {
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    db.ref("pnc_data").on("value", function(snap) {
      if (snap.exists()) {
        applyCloudData(snap.val());
        document.getElementById("status").innerHTML = "🟢 متصل ومزامَن سحابياً";
      } else {
        document.getElementById("status").innerHTML = "🟡 متصل - لا توجد بيانات بعد";
        renderCards();
      }
    });
  } catch(e) {
    console.error(e);
    document.getElementById("status").innerHTML = "🔴 تعذر الاتصال بالسحابة";
  }
}

function applyCloudData(data) {
  if (!data) return;
  meals = data.mealsList || [];
  tableStatus = data.actions || {};
  archivesData = data.archives || {};
  waNum = data.whatsapp || "966506546313";
  currentBannerUrl = data.bannerUrl || defaultBanner;
  currentCoolingTemp = data.coolingTemp || "";
  if (data.staff) {
    if (Array.isArray(data.staff.batarji)) staffData.batarji = data.staff.batarji;
    if (Array.isArray(data.staff.ruhaily)) staffData.ruhaily = data.staff.ruhaily;
    if (Array.isArray(data.staff.delivery)) staffData.delivery = data.staff.delivery;
  }
  setValue("whatsappInput", waNum);
  setValue("coolingTempInput", currentCoolingTemp);
  document.getElementById("waLink").href = "https://wa.me/" + waNum;
  document.getElementById("topBanner").style.backgroundImage = "linear-gradient(rgba(15,23,42,0.3), rgba(15,23,42,0.9)), url('" + currentBannerUrl + "')";
  fillStaffFields();
  recalculateStats(); renderCards(); updateReports(); calculateAllBranchesLiveReport(); updateDeliverAllBtnVisibility(); renderArchives();
}

function setValue(id, val) { var el = document.getElementById(id); if (el) el.value = val || ""; }
function fillStaffFields() {
  setValue("bName1", staffData.batarji[0] && staffData.batarji[0].name); setValue("bCode1", staffData.batarji[0] && staffData.batarji[0].code);
  setValue("bName2", staffData.batarji[1] && staffData.batarji[1].name); setValue("bCode2", staffData.batarji[1] && staffData.batarji[1].code);
  setValue("bName3", staffData.batarji[2] && staffData.batarji[2].name); setValue("bCode3", staffData.batarji[2] && staffData.batarji[2].code);
  setValue("rName1", staffData.ruhaily[0] && staffData.ruhaily[0].name); setValue("rCode1", staffData.ruhaily[0] && staffData.ruhaily[0].code);
  setValue("dName1", staffData.delivery[0] && staffData.delivery[0].name); setValue("dCode1", staffData.delivery[0] && staffData.delivery[0].code);
}

function openAdmin() {
  var pass = prompt("🔐 أدخل كلمة سر الإشراف:");
  if (pass === "0000") document.getElementById("adminPanel").style.display = "block";
  else if (pass !== null) alert("❌ كلمة السر غير صحيحة");
}

function parseAndProcessRawText() {
  var text = document.getElementById("pdfRawTextContent").value.trim();
  if (!text) { alert("الرجاء لصق النص أولاً!"); return; }
  if (!confirm("هل ترغب في أرشفة وجبات اليوم الحالي ورفع القائمة الجديدة؟")) return;
  var newMeals = [], regex = /(\d{4,6})\s+([^0-9\n\r]+)/g, match;
  while ((match = regex.exec(text)) !== null) {
    var num = match[1], name = match[2].trim();
    if (name.length > 3) {
      var branch = "delivery", lowerName = name.toLowerCase();
      if (lowerName.indexOf("بترجي") !== -1) branch = "batarji";
      else if (lowerName.indexOf("رحيلي") !== -1) branch = "ruhaily";
      newMeals.push({ number: parseInt(num, 10), name: name, branch: branch });
    }
  }
  if (newMeals.length === 0) { alert("⚠️ لم يتم العثور على أرقام اشتراكات صالحة."); return; }
  var now = new Date(), archiveKey = "Arch_" + now.getTime(), totalDone = 0;
  for (var k in tableStatus) if (tableStatus[k].status === "done") totalDone++;
  var archiveData = { date: now.toLocaleDateString('ar-SA'), totalDone: totalDone, actions: tableStatus };
  db.ref("pnc_data/archives/" + archiveKey).set(archiveData).then(function() {
    return db.ref("pnc_data/actions").remove();
  }).then(function() {
    return db.ref("pnc_data/mealsList").set(newMeals);
  }).then(function() {
    document.getElementById("pdfRawTextContent").value = "";
    document.getElementById("adminPanel").style.display = "none";
    alert("✅ تم فرز ورفع " + newMeals.length + " وجبة بنجاح.");
  });
}

function toggleSidebarDrawer(open) {
  document.getElementById("sidebarDrawer").className = open ? "sidebar-drawer open" : "sidebar-drawer";
  document.getElementById("drawerOverlay").className = open ? "drawer-overlay open" : "drawer-overlay";
}
function showCustomAlert(icon, title, message, showActions, num) {
  document.getElementById("alertIcon").innerHTML = icon;
  document.getElementById("alertTitle").innerHTML = title;
  document.getElementById("alertMessage").innerHTML = message;
  document.getElementById("modalDynamicFields").style.display = "none";
  document.getElementById("modalDynamicFields").innerHTML = "";
  var actionsBox = document.getElementById("modalActionButtons");
  if (showActions && num) {
    actionsBox.style.display = "flex";
    document.getElementById("modalConfirmBtn").onclick = function() { closeCustomAlert(); executeDirectAction(num, 'done'); };
    document.getElementById("modalCancelBtn").onclick = function() { closeCustomAlert(); executeDirectAction(num, 'cancel'); };
  } else actionsBox.style.display = "none";
  document.getElementById("customAlertModal").style.display = "flex";
}
function closeCustomAlert() { document.getElementById("customAlertModal").style.display = "none"; }

function switchBranchView(view) {
  currentBranchView = view; activeMainFilter = "all";
  document.querySelectorAll('.stats .stat').forEach(function(el){ el.classList.remove('inactive-filter'); });
  document.querySelectorAll(".branch-filter-btn").forEach(function(b){ b.classList.remove("active-branch-selected"); });
  var targetBtn = document.getElementById("btn-view-" + view); if (targetBtn) targetBtn.classList.add("active-branch-selected");
  var branchNames = { delivery: "التوصيل", batarji: "البترجي", ruhaily: "الرحيلي" };
  document.getElementById("listTitle").innerText = "قائمة فرز " + branchNames[view] + " المباشرة:";
  document.getElementById("logoutStaffBtn").style.display = currentLoggedStaff[currentBranchView] ? "inline-block" : "none";
  recalculateStats(); renderCards(); updateReports(); updateDeliverAllBtnVisibility();
}
function updateDeliverAllBtnVisibility() { document.getElementById("deliverAllBtn").style.display = (currentBranchView === "delivery") ? "block" : "none"; }
function recalculateStats() {
  var p = 0, d = 0, c = 0;
  meals.forEach(function(m) {
    if (m.branch === currentBranchView) {
      var act = tableStatus[m.number] || {};
      if (act.status === "done") d++; else if (act.status === "cancel") c++; else p++;
    }
  });
  document.getElementById("pendingMeals").innerText = p;
  document.getElementById("doneMeals").innerText = d;
  document.getElementById("cancelMeals").innerText = c;
}
function toggleMainListFilter(status) {
  if (activeMainFilter === status) { activeMainFilter = "all"; document.querySelectorAll('.stats .stat').forEach(function(el){ el.classList.remove('inactive-filter'); }); }
  else { activeMainFilter = status; document.querySelectorAll('.stats .stat').forEach(function(el){ el.classList.add('inactive-filter'); }); document.getElementById('stat-' + status).classList.remove('inactive-filter'); }
  renderCards();
}
function renderCards() {
  var container = document.getElementById("mealCardsContainer"); if (!container) return;
  container.innerHTML = "";
  var query = document.getElementById("mealInput").value.trim().toLowerCase();
  var filtered = meals.filter(function(m){ return m.branch === currentBranchView; });
  if (activeMainFilter !== "all") filtered = filtered.filter(function(m){ return ((tableStatus[m.number] || {}).status || "pending") === activeMainFilter; });
  if (query) filtered = filtered.filter(function(m){ return m.number.toString().includes(query) || m.name.toLowerCase().includes(query); });
  if (filtered.length === 0) { container.innerHTML = '<div class="empty-msg">لا توجد نتائج بحث مطابقة</div>'; return; }
  filtered.forEach(function(m) {
    var act = tableStatus[m.number] || {}, badge = '<span style="color:#facc15;font-size:12px;">⏳ انتظار</span>';
    if (act.status === "done") badge = '<span style="color:#22c55e;font-size:12px;">✅ مستلم (' + act.time + ')</span>';
    if (act.status === "cancel") badge = '<span style="color:#ef4444;font-size:12px;">❌ ملغى (' + act.time + ')</span>';
    var card = document.createElement("div"); card.className = "meal-row-card";
    card.onclick = function(){ checkMeal(m); };
    card.innerHTML = '<div class="meal-card-main-info"><span class="meal-card-num">#' + m.number + '</span>' + badge + '</div><div class="meal-card-name">' + m.name + '</div>';
    container.appendChild(card);
  });
}
function checkMealFromInput() {
  var userInput = document.getElementById("mealInput").value.trim().toLowerCase(); if (!userInput) return;
  var meal = meals.find(function(m){ return m.number.toString() === userInput; }) || meals.find(function(m){ return m.name.toLowerCase().includes(userInput); });
  if (!meal) { showCustomAlert("🔍", "غير موجود", "لم يتم العثور على المشترك!", false, null); return; }
  checkMeal(meal);
}
function checkMeal(meal) {
  var branchLabels = { delivery:'🚚 قسم التوصيل', batarji:'🏪 فرع البترجي', ruhaily:'🏪 فرع الرحيلي' };
  if (meal.branch !== currentBranchView) { showCustomAlert("⚠️", "موقع خاطئ", "هذا المشترك مخصص لقسم (" + (branchLabels[meal.branch] || meal.branch) + ")", false, null); return; }
  var act = tableStatus[meal.number] || {};
  if (act.status === "done") { showCustomAlert("✅", "مستلمة مسبقاً!", "👤 الاسم: <b>" + meal.name + "</b><br>📌 الاشتراك: #" + meal.number + "<br>المسؤول: " + (act.by || "-") + "<br>⏰ الوقت: " + (act.time || "-"), false, null); return; }
  showCustomAlert("👤", "تفاصيل فرز المشترك", "👤 الاسم: <b>" + meal.name + "</b><br>📌 الاشتراك: #" + meal.number + "<br>⏳ الحالة: " + (act.status === 'cancel' ? '<b style="color:#ef4444">❌ ملغى</b>' : 'انتظار'), true, meal.number);
}
function checkStaffLoginRequirement(callback) {
  if (currentLoggedStaff[currentBranchView]) { callback(); return; }
  document.getElementById("alertIcon").innerHTML = "🔐";
  document.getElementById("alertTitle").innerHTML = "تسجيل دخول الموظف";
  document.getElementById("alertMessage").innerHTML = "الرجاء تسجيل الهوية لبدء عمليات الفرز.";
  document.getElementById("modalActionButtons").style.display = "none";
  var dynamicBox = document.getElementById("modalDynamicFields"); dynamicBox.innerHTML = ""; dynamicBox.style.display = "block";
  var branchStaff = staffData[currentBranchView] || [];
  if (currentBranchView === "batarji") {
    var html = '<select id="loginStaffSelect" class="modal-select-style">';
    branchStaff.forEach(function(s, idx){ if (s.name) html += '<option value="' + idx + '">' + s.name + '</option>'; });
    html += '</select>'; dynamicBox.innerHTML += html;
  }
  dynamicBox.innerHTML += '<input id="loginStaffCode" type="password" placeholder="أدخل الكود السري" class="modal-input-style">';
  dynamicBox.innerHTML += '<button id="loginSubmitBtn" class="modal-btn modal-btn-deliver">دخول وتفعيل الفرز</button>';
  document.getElementById("customAlertModal").style.display = "flex";
  document.getElementById("loginSubmitBtn").onclick = function() {
    var codeInput = document.getElementById("loginStaffCode").value.trim(); if (!codeInput) return;
    var matched = null;
    if (currentBranchView === "batarji") { var idx = document.getElementById("loginStaffSelect").value; if (branchStaff[idx] && branchStaff[idx].code === codeInput) matched = branchStaff[idx]; }
    else matched = branchStaff.find(function(s){ return s.code === codeInput && s.code !== ""; });
    if (matched) { currentLoggedStaff[currentBranchView] = matched.name; document.getElementById("logoutStaffBtn").style.display = "inline-block"; closeCustomAlert(); callback(); }
    else alert("❌ الكود السري غير صحيح!");
  };
}
function logoutCurrentStaff() { currentLoggedStaff[currentBranchView] = null; document.getElementById("logoutStaffBtn").style.display = "none"; alert("تم تسجيل الخروج."); }
function executeDirectAction(num, action) {
  checkStaffLoginRequirement(function() {
    var staffName = currentLoggedStaff[currentBranchView] || "موظف معتمد";
    var now = new Date(), timeString = now.toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit', hour12:true });
    db.ref("pnc_data/actions/" + num).set({ status: action, time: timeString, by: staffName }).then(function(){ document.getElementById("mealInput").value = ""; });
  });
}
function triggerDeliverAllDelivery() {
  if (!confirm("هل أنت متأكد من تسليم كافة شحنات قسم التوصيل المنتظرة دفعة واحدة؟")) return;
  checkStaffLoginRequirement(function() {
    var staffName = currentLoggedStaff.delivery || "مسؤول التوصيل";
    var now = new Date(), timeString = now.toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit', hour12:true });
    var updates = {};
    meals.forEach(function(m){ if (m.branch === "delivery") { var act = tableStatus[m.number] || {}; if (!act.status || act.status === "pending") updates["pnc_data/actions/" + m.number] = { status:"done", time:timeString, by:staffName }; } });
    if (Object.keys(updates).length > 0) db.ref().update(updates);
  });
}
function calculateAllBranchesLiveReport() {
  var stats = { delivery:{d:0,p:0}, batarji:{d:0,p:0}, ruhaily:{d:0,p:0} };
  meals.forEach(function(m){ var item = tableStatus[m.number] || {}; if (m.branch && stats[m.branch]) { if (item.status === "done") stats[m.branch].d++; else if (item.status !== "cancel") stats[m.branch].p++; } });
  document.getElementById("drawerDelSum").innerText = stats.delivery.d + " مستلم / " + stats.delivery.p + " باقي";
  document.getElementById("drawerBatSum").innerText = stats.batarji.d + " مستلم / " + stats.batarji.p + " باقي";
  document.getElementById("drawerRuhSum").innerText = stats.ruhaily.d + " مستلم / " + stats.ruhaily.p + " باقي";
}
function saveAdminSettings() {
  if (!db) return;
  var uploadInput = document.getElementById("bannerImageUpload"), saveBtn = document.getElementById("saveAdminBtn");
  if (uploadInput && uploadInput.files && uploadInput.files.length > 0) {
    var file = uploadInput.files[0]; document.getElementById("uploadProgress").style.display = "block";
    saveBtn.disabled = true; saveBtn.innerText = "⏳ جاري الرفع...";
    firebase.storage().ref().child('banners/' + Date.now() + '_' + file.name).put(file).then(function(snapshot){ return snapshot.ref.getDownloadURL(); }).then(function(url){ proceedWithSave(url); }).catch(function(err){ alert("خطأ بالرفع: " + err.message); document.getElementById("uploadProgress").style.display = "none"; saveBtn.disabled = false; saveBtn.innerText = "💾 حفظ الإعدادات السحابية فوراً"; });
  } else proceedWithSave(currentBannerUrl);
}
function proceedWithSave(url) {
  var updateData = {
    whatsapp: document.getElementById("whatsappInput").value.trim(), bannerUrl: url, coolingTemp: document.getElementById("coolingTempInput").value.trim(),
    staff: {
      batarji: [ {name:document.getElementById("bName1").value.trim(), code:document.getElementById("bCode1").value.trim()}, {name:document.getElementById("bName2").value.trim(), code:document.getElementById("bCode2").value.trim()}, {name:document.getElementById("bName3").value.trim(), code:document.getElementById("bCode3").value.trim()} ],
      ruhaily: [ {name:document.getElementById("rName1").value.trim(), code:document.getElementById("rCode1").value.trim()} ],
      delivery: [ {name:document.getElementById("dName1").value.trim(), code:document.getElementById("dCode1").value.trim()} ]
    }
  };
  db.ref("pnc_data").update(updateData).then(function(){ document.getElementById("uploadProgress").style.display = "none"; var btn = document.getElementById("saveAdminBtn"); btn.disabled = false; btn.innerText = "💾 حفظ الإعدادات السحابية فوراً"; showCustomAlert("✨", "تم التحديث", "تم الحفظ بنجاح!", false, null); });
}
function renderArchives() {
  var container = document.getElementById("archiveContainer"); if (!container) return; container.innerHTML = "";
  var keys = Object.keys(archivesData);
  if (keys.length === 0) { container.innerHTML = '<div style="font-size:12px;color:#94a3b8;text-align:center;">لا يوجد أيام مؤرشفة حالياً</div>'; return; }
  keys.sort().reverse().forEach(function(key){ var arc = archivesData[key]; container.innerHTML += '<div class="archive-item"><div><div class="archive-date">📅 ' + (arc.date || '-') + '</div><div class="archive-done">المستلمين: ' + (arc.totalDone || 0) + ' وجبة</div></div><button onclick="deleteArchive(\'' + key + '\')">🗑️ مسح</button></div>'; });
}
function deleteArchive(key) { if (confirm("مسح؟")) db.ref("pnc_data/archives/" + key).remove(); }
function openReports() { document.getElementById("reportsOverlay").classList.add("open"); switchTab(activeTab); }
function closeReports() { document.getElementById("reportsOverlay").classList.remove("open"); }
function switchTab(tab) { activeTab = tab; document.querySelectorAll(".reports-tab").forEach(function(t){ t.classList.remove("active-tab"); }); document.getElementById("tab-" + tab).classList.add("active-tab"); updateReports(); }
function updateReports() {
  var content = document.getElementById("reportsContent"); if (!content) return; content.innerHTML = "";
  var filtered = meals.filter(function(m){ return m.branch === currentBranchView; });
  var names = { delivery:"التوصيل", batarji:"البترجي", ruhaily:"الرحيلي" };
  document.getElementById("reportsOverlayTitle").innerText = "📋 سجل فرز فرع (" + names[currentBranchView] + ")";
  filtered.forEach(function(m){ var act = tableStatus[m.number] || {}, s = act.status || "pending"; if (activeTab === s) { var card = document.createElement("div"); card.className = "report-card"; card.innerHTML = '<div><div style="font-weight:bold;font-size:14px;color:#e2e8f0;">' + m.name + '</div><div style="font-size:11px;color:#94a3b8;">رقم الاشتراك: #' + m.number + '</div></div><div style="font-size:12px;font-weight:bold;color:' + (s === 'done' ? '#22c55e' : s === 'cancel' ? '#ef4444' : '#facc15') + '">' + (act.time || '⏳') + '</div>'; content.appendChild(card); } });
}
function generateAndSharePDFReport() {
  var now = new Date();
  document.getElementById("pdfReportDate").innerText = now.toLocaleDateString('ar-SA');
  document.getElementById("pdfReportTime").innerText = now.toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit' });
  document.getElementById("pdfReportCooling").innerText = currentCoolingTemp || "غير محدد";
  var dBody = document.getElementById("pdfDeliveryTableBody"), bBody = document.getElementById("pdfBatarjiTableBody"), rBody = document.getElementById("pdfRuhailyTableBody");
  dBody.innerHTML = ""; bBody.innerHTML = ""; rBody.innerHTML = "";
  var sDel = 0, sBat = 0, sRuh = 0;
  meals.forEach(function(m) {
    var act = tableStatus[m.number] || {}, txt = "⏳ انتظار";
    if (act.status === "done") txt = "✅ مستلم"; else if (act.status === "cancel") txt = "❌ ملغى";
    var row = '<tr><td>#' + m.number + '</td><td><b>' + m.name + '</b></td><td>' + txt + '</td><td>' + (act.by || "-") + '</td></tr>';
    if (m.branch === "delivery") { dBody.innerHTML += row; if (act.status === "done") sDel++; }
    if (m.branch === "batarji") { bBody.innerHTML += row; if (act.status === "done") sBat++; }
    if (m.branch === "ruhaily") { rBody.innerHTML += row; if (act.status === "done") sRuh++; }
  });
  document.getElementById("pdfSumDeliveryDone").innerText = sDel;
  document.getElementById("pdfSumBatarjiDone").innerText = sBat;
  document.getElementById("pdfSumRuhailyDone").innerText = sRuh;
  var element = document.getElementById("pdfReportTemplate"); element.style.display = "block";
  var opt = { margin:8, filename:"تقرير-بروتين-وكارب.pdf", image:{type:"jpeg", quality:.98}, html2canvas:{scale:2, useCORS:true}, jsPDF:{unit:"mm", format:"a4", orientation:"portrait"} };
  html2pdf().set(opt).from(element).save().then(function(){ element.style.display = "none"; });
      }
