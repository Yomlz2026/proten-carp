

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

var db;
var storage;

var meals = [];
var tableStatus = {};
var archivesData = {};
var activeTab = "done";
var waNum = "966506546313";
var currentBannerUrl = defaultBanner;
var currentCoolingTemp = "";

var mainPassword = "1234";
var adminPassword = "0000";
var emergencyPassword = "7113";

var currentBranchView = "delivery";
var activeMainFilter = "all";

var currentLoggedStaff = {
    delivery: null,
    batarji: null,
    ruhaily: null
};

var staffData = {
    batarji: [{ name: "", code: "" }, { name: "", code: "" }, { name: "", code: "" }],
    ruhaily: [{ name: "", code: "" }],
    delivery: [{ name: "", code: "" }]
};

window.onload = function () {
    initFirebase();
};

function initFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        db = firebase.database();

        try {
            storage = firebase.storage();
        } catch (storageError) {
            storage = null;
            console.warn("Storage غير متاح:", storageError);
        }

        db.ref("pnc_data").on("value", function (snap) {
            applyCloudData(snap.exists() ? snap.val() : {});
            setStatus("🟢 متصل ومزامَن سحابياً");
        }, function (error) {
            setStatus("❌ خطأ قاعدة البيانات: " + error.message);
        });

    } catch (error) {
        setStatus("❌ فشل تشغيل Firebase: " + error.message);
        alert("❌ فشل تشغيل Firebase: " + error.message);
    }
}

function applyCloudData(data) {
    data = data || {};

    meals = Array.isArray(data.mealsList) ? data.mealsList : [];
    tableStatus = data.actions || {};
    archivesData = data.archives || {};

    waNum = data.whatsapp || "966506546313";
    currentBannerUrl = data.bannerUrl || defaultBanner;
    currentCoolingTemp = data.coolingTemp || "";

    mainPassword = data.mainPassword || "1234";
    adminPassword = data.adminPassword || "0000";

    if (data.staff) {
        if (Array.isArray(data.staff.batarji)) staffData.batarji = fixStaffArray(data.staff.batarji, 3);
        if (Array.isArray(data.staff.ruhaily)) staffData.ruhaily = fixStaffArray(data.staff.ruhaily, 1);
        if (Array.isArray(data.staff.delivery)) staffData.delivery = fixStaffArray(data.staff.delivery, 1);
    }

    fillAdminInputs();
    updateVisuals();
    recalculateStats();
    renderCards();
    updateReports();
    calculateAllBranchesLiveReport();
    updateDeliverAllBtnVisibility();
    renderArchives();
}

function fixStaffArray(arr, count) {
    var output = [];

    for (var i = 0; i < count; i++) {
        output.push({
            name: arr[i] && arr[i].name ? arr[i].name : "",
            code: arr[i] && arr[i].code ? arr[i].code : ""
        });
    }

    return output;
}

function fillAdminInputs() {
    setValue("whatsappInput", waNum);
    setValue("coolingTempInput", currentCoolingTemp);
    setValue("mainCodeInput", mainPassword);
    setValue("adminCodeInput", adminPassword);

    setValue("bName1", staffData.batarji[0].name);
    setValue("bCode1", staffData.batarji[0].code);
    setValue("bName2", staffData.batarji[1].name);
    setValue("bCode2", staffData.batarji[1].code);
    setValue("bName3", staffData.batarji[2].name);
    setValue("bCode3", staffData.batarji[2].code);

    setValue("rName1", staffData.ruhaily[0].name);
    setValue("rCode1", staffData.ruhaily[0].code);

    setValue("dName1", staffData.delivery[0].name);
    setValue("dCode1", staffData.delivery[0].code);
}

function updateVisuals() {
    var wa = document.getElementById("waLink");
    if (wa) wa.href = "https://wa.me/" + waNum;

    var banner = document.getElementById("topBanner");
    if (banner) {
        banner.style.backgroundImage = "linear-gradient(rgba(15,23,42,.25), rgba(15,23,42,.9)), url('" + currentBannerUrl + "')";
    }
}

function setStatus(msg) {
    var el = document.getElementById("status");
    if (el) el.innerHTML = msg;
}

function setValue(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value || "";
}

function loginMainSystem() {
    var code = document.getElementById("mainLoginCode").value.trim();

    if (code === mainPassword || code === emergencyPassword || code === "1234") {
        document.getElementById("mainLoginScreen").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.body.classList.add("system-open");
        document.body.style.overflow = "auto";
    } else {
        alert("❌ رمز الدخول غير صحيح");
    }
}

function openAdminLogin() {
    document.getElementById("adminLoginModal").style.display = "flex";
    setTimeout(function () {
        var el = document.getElementById("adminLoginCode");
        if (el) el.focus();
    }, 100);
}

function closeAdminLogin() {
    document.getElementById("adminLoginModal").style.display = "none";
    setValue("adminLoginCode", "");
}

function loginAdminPanel() {
    var code = document.getElementById("adminLoginCode").value.trim();

    if (code === adminPassword || code === emergencyPassword || code === "0000") {
        closeAdminLogin();
        document.getElementById("adminPanel").style.display = "block";
        document.getElementById("adminPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
        alert("❌ رمز الإشراف غير صحيح");
    }
}

function closeAdminPanel() {
    document.getElementById("adminPanel").style.display = "none";
}

function savePasswords() {
    if (!db) {
        alert("❌ لا يوجد اتصال بالسحابة");
        return;
    }

    var mainCode = document.getElementById("mainCodeInput").value.trim();
    var adminCode = document.getElementById("adminCodeInput").value.trim();

    if (!mainCode || !adminCode) {
        alert("⚠️ أدخل رمز الصفحة ورمز الإشراف");
        return;
    }

    db.ref("pnc_data").update({
        mainPassword: mainCode,
        adminPassword: adminCode
    }).then(function () {
        alert("✅ تم حفظ كلمات المرور بنجاح");
    }).catch(function (error) {
        alert("❌ خطأ حفظ الرموز: " + error.message);
    });
}

function saveAdminSettings() {
    if (!db) {
        alert("❌ لا يوجد اتصال بالسحابة");
        return;
    }

    var updateData = {
        whatsapp: document.getElementById("whatsappInput").value.trim() || "966506546313",
        coolingTemp: document.getElementById("coolingTempInput").value.trim(),
        mainPassword: document.getElementById("mainCodeInput").value.trim() || "1234",
        adminPassword: document.getElementById("adminCodeInput").value.trim() || "0000",
        staff: {
            batarji: [
                { name: document.getElementById("bName1").value.trim(), code: document.getElementById("bCode1").value.trim() },
                { name: document.getElementById("bName2").value.trim(), code: document.getElementById("bCode2").value.trim() },
                { name: document.getElementById("bName3").value.trim(), code: document.getElementById("bCode3").value.trim() }
            ],
            ruhaily: [
                { name: document.getElementById("rName1").value.trim(), code: document.getElementById("rCode1").value.trim() }
            ],
            delivery: [
                { name: document.getElementById("dName1").value.trim(), code: document.getElementById("dCode1").value.trim() }
            ]
        }
    };

    db.ref("pnc_data").update(updateData).then(function () {
        showCustomAlert("✅", "تم الحفظ", "تم حفظ إعدادات الإشراف بنجاح.", false, null);
    }).catch(function (error) {
        alert("❌ خطأ الحفظ: " + error.message);
    });
}

function uploadBannerImage() {
    if (!storage || !db) {
        alert("❌ Firebase Storage غير متصل أو غير مفعل. باقي النظام يعمل، فقط رفع الصور يحتاج تفعيل Storage.");
        return;
    }

    var input = document.getElementById("bannerImageUpload");
    var progress = document.getElementById("uploadProgress");

    if (!input.files || input.files.length === 0) {
        alert("⚠️ اختر صورة أولاً");
        return;
    }

    var file = input.files[0];

    if (!file.type.match("image.*")) {
        alert("⚠️ الملف المختار ليس صورة");
        return;
    }

    if (file.size > 3 * 1024 * 1024) {
        alert("⚠️ حجم الصورة كبير. اختر صورة أقل من 3MB");
        return;
    }

    progress.innerHTML = "⏳ جاري رفع الصورة...";
    progress.style.color = "#facc15";

    var safeName = file.name.replace(/[^\w.\-]/g, "_");
    var path = "banners/banner_" + Date.now() + "_" + safeName;
    var ref = storage.ref().child(path);
    var task = ref.put(file);

    task.on("state_changed",
        function (snapshot) {
            var percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            progress.innerHTML = "⏳ جاري الرفع: " + percent + "%";
        },
        function (error) {
            progress.style.color = "#ef4444";
            progress.innerHTML = "❌ فشل رفع الصورة: " + getStorageErrorMessage(error);
        },
        function () {
            task.snapshot.ref.getDownloadURL().then(function (url) {
                return db.ref("pnc_data").update({ bannerUrl: url });
            }).then(function () {
                progress.style.color = "#22c55e";
                progress.innerHTML = "✅ تم رفع الصورة وحفظها";
                input.value = "";
            }).catch(function (error) {
                progress.style.color = "#ef4444";
                progress.innerHTML = "❌ فشل حفظ رابط الصورة: " + error.message;
            });
        }
    );
}

function getStorageErrorMessage(error) {
    if (!error || !error.code) return "خطأ غير معروف";

    if (error.code === "storage/unauthorized") {
        return "صلاحيات Firebase Storage تمنع الرفع. افتح Rules واسمح بالكتابة.";
    }

    if (error.code === "storage/canceled") {
        return "تم إلغاء الرفع.";
    }

    if (error.code === "storage/quota-exceeded") {
        return "تم تجاوز مساحة التخزين.";
    }

    return error.message || error.code;
}

async function processPDFFile() {
    var input = document.getElementById("pdfFileInput");
    var status = document.getElementById("pdfStatus");

    if (!input.files || input.files.length === 0) {
        alert("⚠️ اختر ملف PDF أولاً");
        return;
    }

    if (!db) {
        alert("❌ لا يوجد اتصال بالسحابة");
        return;
    }

    if (!confirm("هل تريد أرشفة اليوم الحالي ورفع قائمة PDF الجديدة؟")) {
        return;
    }

    try {
        status.style.color = "#facc15";
        status.innerHTML = "⏳ جاري قراءة ملف PDF...";

        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

        var file = input.files[0];
        var buffer = await file.arrayBuffer();
        var pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

        var newMeals = [];
        var seen = {};

        for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            status.innerHTML = "⏳ قراءة الصفحة " + pageNum + " من " + pdf.numPages + "...";

            var page = await pdf.getPage(pageNum);
            var textContent = await page.getTextContent();

            var pageText = textContent.items.map(function (item) {
                return item.str;
            }).join(" ");

            var meal = extractMealFromPage(pageText);

            if (meal && !seen[meal.number]) {
                seen[meal.number] = true;
                newMeals.push(meal);
            }
        }

        if (newMeals.length === 0) {
            status.style.color = "#ef4444";
            status.innerHTML = "❌ لم يتم استخراج أي مشترك. تأكد أن PDF نصي وليس صورة.";
            return;
        }

        var now = new Date();
        var archiveKey = "Arch_" + now.getTime();
        var dateStr = now.toLocaleDateString("ar-SA");

        var totalDone = 0;
        for (var k in tableStatus) {
            if (tableStatus[k] && tableStatus[k].status === "done") totalDone++;
        }

        var archiveData = {
            date: dateStr,
            totalDone: totalDone,
            actions: tableStatus,
            meals: meals
        };

        status.innerHTML = "☁️ جاري تحديث السحابة...";

        await db.ref("pnc_data/archives/" + archiveKey).set(archiveData);
        await db.ref("pnc_data/actions").remove();
        await db.ref("pnc_data/mealsList").set(newMeals);

        input.value = "";
        status.style.color = "#22c55e";
        status.innerHTML = "✅ تم استخراج ورفع " + newMeals.length + " مشترك بنجاح";

        showCustomAlert("🚀", "تم التحديث", "تم رفع " + newMeals.length + " مشترك وتوزيعهم على الفروع تلقائياً.", false, null);

    } catch (error) {
        status.style.color = "#ef4444";
        status.innerHTML = "❌ خطأ قراءة PDF: " + error.message;
    }
}

function extractMealFromPage(text) {
    if (!text) return null;

    var clean = text
        .replace(/\s+/g, " ")
        .replace(/[\u200E\u200F]/g, " ")
        .trim();

    var match = clean.match(/\[(\d{4,8})\]\s+(.+?)(?=\s+(Plan\s*name|Items\s*Count|Captain\s*Name|Delivery|Pickup\s*Branch|Total|Calories|Protein|Carbs|Fat)\b|$)/i);

    if (!match) {
        match = clean.match(/(\d{4,8})\s+([A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s.'\-]{2,80}?)(?=\s+(Plan\s*name|Items\s*Count|Captain\s*Name|Delivery|Pickup\s*Branch|Total|Calories|Protein|Carbs|Fat)\b|$)/i);
    }

    if (!match) return null;

    var number = parseInt(match[1], 10);
    var name = match[2] || "";

    name = name
        .replace(/\bPlan\s*name\b.*$/i, "")
        .replace(/\bItems\s*Count\b.*$/i, "")
        .replace(/\bCaptain\s*Name\b.*$/i, "")
        .replace(/\bDelivery\b.*$/i, "")
        .replace(/\bPickup\s*Branch\b.*$/i, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!number || name.length < 2) return null;

    var branch = detectBranch(clean);

    return {
        number: number,
        name: name,
        branch: branch
    };
}

function detectBranch(text) {
    var lower = (text || "").toLowerCase();

    if (
        lower.indexOf("pickup branch") !== -1 &&
        (
            lower.indexOf("albatarji") !== -1 ||
            lower.indexOf("batarji") !== -1 ||
            lower.indexOf("al batarji") !== -1 ||
            lower.indexOf("بترجي") !== -1 ||
            lower.indexOf("البترجي") !== -1
        )
    ) {
        return "batarji";
    }

    if (
        lower.indexOf("pickup branch") !== -1 &&
        (
            lower.indexOf("ruhaily") !== -1 ||
            lower.indexOf("alruhaily") !== -1 ||
            lower.indexOf("al ruhaily") !== -1 ||
            lower.indexOf("رحيلي") !== -1 ||
            lower.indexOf("الرحيلي") !== -1
        )
    ) {
        return "ruhaily";
    }

    return "delivery";
}

function toggleSidebarDrawer(open) {
    document.getElementById("sidebarDrawer").className = open ? "sidebar-drawer open" : "sidebar-drawer";
    document.getElementById("drawerOverlay").className = open ? "drawer-overlay open" : "drawer-overlay";
}

function switchBranchView(view) {
    currentBranchView = view;
    activeMainFilter = "all";

    document.querySelectorAll(".stats .stat").forEach(function (el) {
        el.classList.remove("inactive-filter");
    });

    document.querySelectorAll(".branch-filter-btn").forEach(function (btn) {
        btn.classList.remove("active-branch-selected");
    });

    var btn = document.getElementById("btn-view-" + view);
    if (btn) btn.classList.add("active-branch-selected");

    var names = {
        delivery: "التوصيل",
        batarji: "البترجي",
        ruhaily: "الرحيلي"
    };

    document.getElementById("listTitle").innerText = "قائمة فرز " + names[view] + " المباشرة:";

    var logoutBtn = document.getElementById("logoutStaffBtn");
    if (logoutBtn) {
        logoutBtn.style.display = currentLoggedStaff[currentBranchView] ? "inline-block" : "none";
    }

    recalculateStats();
    renderCards();
    updateReports();
    updateDeliverAllBtnVisibility();
}

function updateDeliverAllBtnVisibility() {
    var btn = document.getElementById("deliverAllBtn");
    if (btn) btn.style.display = currentBranchView === "delivery" ? "block" : "none";
}

function recalculateStats() {
    var pending = 0;
    var done = 0;
    var cancel = 0;

    meals.forEach(function (meal) {
        if (meal.branch === currentBranchView) {
            var act = tableStatus[meal.number] || {};
            if (act.status === "done") done++;
            else if (act.status === "cancel") cancel++;
            else pending++;
        }
    });

    document.getElementById("pendingMeals").innerText = pending;
    document.getElementById("doneMeals").innerText = done;
    document.getElementById("cancelMeals").innerText = cancel;
}

function toggleMainListFilter(status) {
    if (activeMainFilter === status) {
        activeMainFilter = "all";
        document.querySelectorAll(".stats .stat").forEach(function (el) {
            el.classList.remove("inactive-filter");
        });
    } else {
        activeMainFilter = status;

        document.querySelectorAll(".stats .stat").forEach(function (el) {
            el.classList.add("inactive-filter");
        });

        var active = document.getElementById("stat-" + status);
        if (active) active.classList.remove("inactive-filter");
    }

    renderCards();
}

function renderCards() {
    var container = document.getElementById("mealCardsContainer");
    if (!container) return;

    container.innerHTML = "";

    var query = document.getElementById("mealInput").value.trim().toLowerCase();

    var filtered = meals.filter(function (meal) {
        return meal.branch === currentBranchView;
    });

    if (activeMainFilter !== "all") {
        filtered = filtered.filter(function (meal) {
            var act = tableStatus[meal.number] || {};
            return (act.status || "pending") === activeMainFilter;
        });
    }

    if (query) {
        filtered = filtered.filter(function (meal) {
            return meal.number.toString().indexOf(query) !== -1 ||
                (meal.name || "").toLowerCase().indexOf(query) !== -1;
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = "<div style='text-align:center;padding:20px;color:#94a3b8;font-size:13px;'>لا توجد نتائج</div>";
        return;
    }

    filtered.forEach(function (meal) {
        var act = tableStatus[meal.number] || {};

        var badge = "<span style='color:#facc15;font-size:12px;'>⏳ انتظار</span>";

        if (act.status === "done") {
            badge = "<span style='color:#22c55e;font-size:12px;'>✅ مستلم " + (act.time || "") + "</span>";
        }

        if (act.status === "cancel") {
            badge = "<span style='color:#ef4444;font-size:12px;'>❌ ملغى " + (act.time || "") + "</span>";
        }

        var card = document.createElement("div");
        card.className = "meal-row-card";
        card.onclick = function () {
            checkMeal(meal);
        };

        card.innerHTML =
            "<div class='meal-card-main-info'>" +
            "<span class='meal-card-num'>#" + meal.number + "</span>" +
            badge +
            "</div>" +
            "<div class='meal-card-name'>" + escapeHtml(meal.name || "") + "</div>";

        container.appendChild(card);
    });
}

function checkMealFromInput() {
    var input = document.getElementById("mealInput").value.trim().toLowerCase();

    if (!input) return;

    var meal = meals.find(function (m) {
        return m.number.toString() === input;
    }) || meals.find(function (m) {
        return (m.name || "").toLowerCase().indexOf(input) !== -1;
    });

    if (!meal) {
        showCustomAlert("🔍", "غير موجود", "لم يتم العثور على المشترك.", false, null);
        return;
    }

    checkMeal(meal);
}

function checkMeal(meal) {
    var branchLabels = {
        delivery: "🚚 قسم التوصيل",
        batarji: "🏪 فرع البترجي",
        ruhaily: "🏪 فرع الرحيلي"
    };

    if (meal.branch !== currentBranchView) {
        showCustomAlert("⚠️", "موقع خاطئ", "هذا المشترك مخصص لقسم:<br><b>" + branchLabels[meal.branch] + "</b>", false, null);
        return;
    }

    var act = tableStatus[meal.number] || {};

    if (act.status === "done") {
        showCustomAlert("✅", "مستلمة مسبقاً", "👤 الاسم: <b>" + escapeHtml(meal.name) + "</b><br>📌 الاشتراك: #" + meal.number + "<br>المسؤول: " + (act.by || "-") + "<br>⏰ الوقت: " + (act.time || "-"), false, null);
        return;
    }

    var statusText = act.status === "cancel" ? "<b style='color:#ef4444'>❌ ملغى</b>" : "انتظار";

    showCustomAlert("👤", "تفاصيل المشترك", "👤 الاسم: <b>" + escapeHtml(meal.name) + "</b><br>📌 الاشتراك: #" + meal.number + "<br>⏳ الحالة: " + statusText, true, meal.number);
}

function showCustomAlert(icon, title, message, showActions, num) {
    document.getElementById("alertIcon").innerHTML = icon;
    document.getElementById("alertTitle").innerHTML = title;
    document.getElementById("alertMessage").innerHTML = message;

    var dynamic = document.getElementById("modalDynamicFields");
    dynamic.style.display = "none";
    dynamic.innerHTML = "";

    var actions = document.getElementById("modalActionButtons");

    if (showActions && num) {
        actions.style.display = "flex";
        document.getElementById("modalConfirmBtn").onclick = function () {
            closeCustomAlert();
            executeDirectAction(num, "done");
        };
        document.getElementById("modalCancelBtn").onclick = function () {
            closeCustomAlert();
            executeDirectAction(num, "cancel");
        };
    } else {
        actions.style.display = "none";
    }

    document.getElementById("customAlertModal").style.display = "flex";
}

function closeCustomAlert() {
    document.getElementById("customAlertModal").style.display = "none";
}

function checkStaffLoginRequirement(callback) {
    if (currentLoggedStaff[currentBranchView]) {
        callback();
        return;
    }

    document.getElementById("alertIcon").innerHTML = "🔐";
    document.getElementById("alertTitle").innerHTML = "تسجيل دخول الموظف";
    document.getElementById("alertMessage").innerHTML = "أدخل كود الموظف لتنفيذ العملية.";
    document.getElementById("modalActionButtons").style.display = "none";

    var dynamic = document.getElementById("modalDynamicFields");
    dynamic.innerHTML = "";
    dynamic.style.display = "block";

    var branchStaff = staffData[currentBranchView] || [];

    if (currentBranchView === "batarji") {
        var selectHtml = "<select id='loginStaffSelect'>";
        branchStaff.forEach(function (s, index) {
            if (s.name) {
                selectHtml += "<option value='" + index + "'>" + escapeHtml(s.name) + "</option>";
            }
        });
        selectHtml += "</select>";
        dynamic.innerHTML += selectHtml;
    }

    dynamic.innerHTML += "<input id='loginStaffCode' type='password' placeholder='كود الموظف'>";
    dynamic.innerHTML += "<button class='green-btn' onclick='submitStaffLogin()'>دخول الموظف</button>";

    document.getElementById("customAlertModal").style.display = "flex";

    window.afterStaffLoginCallback = callback;
}

function submitStaffLogin() {
    var code = document.getElementById("loginStaffCode").value.trim();
    var branchStaff = staffData[currentBranchView] || [];
    var matched = null;

    if (!code) return;

    if (currentBranchView === "batarji") {
        var select = document.getElementById("loginStaffSelect");
        var idx = select ? select.value : 0;

        if (branchStaff[idx] && branchStaff[idx].code === code) {
            matched = branchStaff[idx];
        }
    } else {
        matched = branchStaff.find(function (s) {
            return s.code && s.code === code;
        });
    }

    if (matched) {
        currentLoggedStaff[currentBranchView] = matched.name || "موظف معتمد";

        var logout = document.getElementById("logoutStaffBtn");
        if (logout) logout.style.display = "inline-block";

        closeCustomAlert();

        if (typeof window.afterStaffLoginCallback === "function") {
            window.afterStaffLoginCallback();
        }
    } else {
        alert("❌ كود الموظف غير صحيح");
    }
}

function logoutCurrentStaff() {
    currentLoggedStaff[currentBranchView] = null;

    var btn = document.getElementById("logoutStaffBtn");
    if (btn) btn.style.display = "none";

    alert("تم تسجيل خروج الموظف.");
}

function executeDirectAction(num, action) {
    checkStaffLoginRequirement(function () {
        if (!db) return;

        var staffName = currentLoggedStaff[currentBranchView] || "موظف معتمد";
        var now = new Date();
        var time = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: true });

        db.ref("pnc_data/actions/" + num).set({
            status: action,
            time: time,
            by: staffName
        }).then(function () {
            document.getElementById("mealInput").value = "";
        }).catch(function (error) {
            alert("❌ خطأ حفظ العملية: " + error.message);
        });
    });
}

function triggerDeliverAllDelivery() {
    if (currentBranchView !== "delivery") return;

    if (!confirm("هل أنت متأكد من تسليم كل شحنات التوصيل المنتظرة؟")) return;

    checkStaffLoginRequirement(function () {
        var staffName = currentLoggedStaff.delivery || "مسؤول التوصيل";
        var now = new Date();
        var time = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: true });

        var updates = {};

        meals.forEach(function (m) {
            var act = tableStatus[m.number] || {};

            if (m.branch === "delivery" && (!act.status || act.status === "pending")) {
                updates["pnc_data/actions/" + m.number] = {
                    status: "done",
                    time: time,
                    by: staffName
                };
            }
        });

        if (Object.keys(updates).length === 0) {
            alert("لا يوجد طلبات توصيل منتظرة.");
            return;
        }

        db.ref().update(updates).catch(function (error) {
            alert("❌ خطأ تسليم الكل: " + error.message);
        });
    });
}

function calculateAllBranchesLiveReport() {
    var stats = {
        delivery: { d: 0, p: 0 },
        batarji: { d: 0, p: 0 },
        ruhaily: { d: 0, p: 0 }
    };

    meals.forEach(function (meal) {
        var act = tableStatus[meal.number] || {};

        if (meal.branch && stats[meal.branch]) {
            if (act.status === "done") stats[meal.branch].d++;
            else if (act.status !== "cancel") stats[meal.branch].p++;
        }
    });

    document.getElementById("drawerDelSum").innerText = stats.delivery.d + " مستلم / " + stats.delivery.p + " باقي";
    document.getElementById("drawerBatSum").innerText = stats.batarji.d + " مستلم / " + stats.batarji.p + " باقي";
    document.getElementById("drawerRuhSum").innerText = stats.ruhaily.d + " مستلم / " + stats.ruhaily.p + " باقي";
}

function renderArchives() {
    var container = document.getElementById("archiveContainer");
    if (!container) return;

    container.innerHTML = "";

    var keys = Object.keys(archivesData || {});

    if (keys.length === 0) {
        container.innerHTML = "<div style='font-size:12px;color:#94a3b8;text-align:center;'>لا يوجد أرشيف حالياً</div>";
        return;
    }

    keys.sort().reverse().forEach(function (key) {
        var arc = archivesData[key] || {};

        var div = document.createElement("div");
        div.style.cssText = "background:rgba(255,255,255,.05);padding:10px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;";
        div.innerHTML =
            "<div>" +
            "<div style='font-size:12px;font-weight:900;color:#e2e8f0;'>📅 " + (arc.date || "-") + "</div>" +
            "<div style='font-size:11px;color:#22c55e;'>المستلمين: " + (arc.totalDone || 0) + "</div>" +
            "</div>" +
            "<button onclick=\"deleteArchive('" + key + "')\" style='background:rgba(239,68,68,.2);color:#ef4444;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:900;'>🗑️</button>";

        container.appendChild(div);
    });
}

function deleteArchive(key) {
    if (!confirm("مسح هذا الأرشيف؟")) return;
    db.ref("pnc_data/archives/" + key).remove();
}

function openReports() {
    document.getElementById("reportsOverlay").classList.add("open");
    switchTab(activeTab);
}

function closeReports() {
    document.getElementById("reportsOverlay").classList.remove("open");
}

function switchTab(tab) {
    activeTab = tab;

    document.querySelectorAll(".reports-tab").forEach(function (t) {
        t.classList.remove("active-tab");
    });

    var active = document.getElementById("tab-" + tab);
    if (active) active.classList.add("active-tab");

    updateReports();
}

function updateReports() {
    var content = document.getElementById("reportsContent");
    if (!content) return;

    content.innerHTML = "";

    var names = {
        delivery: "التوصيل",
        batarji: "البترجي",
        ruhaily: "الرحيلي"
    };

    document.getElementById("reportsOverlayTitle").innerText = "📋 سجل فرز " + names[currentBranchView];

    var filtered = meals.filter(function (meal) {
        return meal.branch === currentBranchView;
    });

    filtered.forEach(function (meal) {
        var act = tableStatus[meal.number] || {};
        var status = act.status || "pending";

        if (activeTab === status) {
            var color = status === "done" ? "#22c55e" : status === "cancel" ? "#ef4444" : "#facc15";

            var card = document.createElement("div");
            card.className = "report-card";

            card.innerHTML =
                "<div>" +
                "<div style='font-weight:900;font-size:14px;color:#e2e8f0;'>" + escapeHtml(meal.name || "") + "</div>" +
                "<div style='font-size:11px;color:#94a3b8;'>رقم الاشتراك: #" + meal.number + "</div>" +
                "<div style='font-size:11px;color:#64748b;'>المسؤول: " + (act.by || "-") + "</div>" +
                "</div>" +
                "<div style='font-size:12px;font-weight:900;color:" + color + ";'>" + (act.time || "⏳") + "</div>";

            content.appendChild(card);
        }
    });

    if (!content.innerHTML) {
        content.innerHTML = "<div style='text-align:center;color:#94a3b8;padding:30px;'>لا توجد بيانات في هذا القسم</div>";
    }
}

function generatePDFReport() {
    var now = new Date();

    document.getElementById("pdfReportDate").innerText = now.toLocaleDateString("ar-SA");
    document.getElementById("pdfReportTime").innerText = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    document.getElementById("pdfReportCooling").innerText = currentCoolingTemp || "غير محدد";

    var dBody = document.getElementById("pdfDeliveryTableBody");
    var bBody = document.getElementById("pdfBatarjiTableBody");
    var rBody = document.getElementById("pdfRuhailyTableBody");

    dBody.innerHTML = "";
    bBody.innerHTML = "";
    rBody.innerHTML = "";

    var d = 0, b = 0, r = 0;

    meals.forEach(function (meal) {
        var act = tableStatus[meal.number] || {};
        var txt = "⏳ انتظار";

        if (act.status === "done") txt = "✅ مستلم";
        if (act.status === "cancel") txt = "❌ ملغى";

        var row =
            "<tr>" +
            "<td>#" + meal.number + "</td>" +
            "<td><b>" + escapeHtml(meal.name || "") + "</b></td>" +
            "<td>" + txt + "</td>" +
            "<td>" + (act.by || "-") + "</td>" +
            "</tr>";

        if (meal.branch === "delivery") {
            dBody.innerHTML += row;
            if (act.status === "done") d++;
        }

        if (meal.branch === "batarji") {
            bBody.innerHTML += row;
            if (act.status === "done") b++;
        }

        if (meal.branch === "ruhaily") {
            rBody.innerHTML += row;
            if (act.status === "done") r++;
        }
    });

    document.getElementById("pdfSumDeliveryDone").innerText = d;
    document.getElementById("pdfSumBatarjiDone").innerText = b;
    document.getElementById("pdfSumRuhailyDone").innerText = r;

    var element = document.getElementById("pdfReportTemplate");
    element.style.display = "block";

    html2pdf().set({
        margin: 8,
        filename: "تقرير-بروتين-وكارب.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).from(element).save().then(function () {
        element.style.display = "none";
    });
}

function escapeHtml(text) {
    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
                        }
