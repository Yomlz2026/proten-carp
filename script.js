

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
let activeTab = "done";

let waNum = "966506546313";
let currentBannerUrl = "";
let currentCoolingTemp = "";

let systemPasswords = {
    main: "1234",
    admin: "0000"
};

let emergencyPassword = "7113";

let currentLoggedStaff = {
    delivery: null,
    batarji: null,
    ruhaily: null
};

let staffData = {
    batarji: [
        { name: "", code: "" },
        { name: "", code: "" },
        { name: "", code: "" }
    ],
    ruhaily: [
        { name: "", code: "" }
    ],
    delivery: [
        { name: "", code: "" }
    ]
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

            meals = Array.isArray(data.mealsList) ? data.mealsList : [];
            tableStatus = data.actions || {};
            archivesData = data.archives || {};
            waNum = data.whatsapp || "966506546313";
            currentBannerUrl = data.bannerUrl || "";
            currentCoolingTemp = data.coolingTemp || "";

            if (data.passwords) {
                systemPasswords = data.passwords;
            }

            if (data.staff) {
                staffData = fixStaffData(data.staff);
            }

            applyDataToUI();
            setStatus("🟢 متصل بالسحابة");
        }, function (error) {
            setStatus("❌ خطأ الاتصال بالسحابة: " + error.message);
        });

    } catch (error) {
        setStatus("❌ فشل تشغيل Firebase");
        customAlert("❌", "خطأ Firebase", error.message);
    }
}

function fixStaffData(data) {
    return {
        batarji: [
            data.batarji && data.batarji[0] ? data.batarji[0] : { name: "", code: "" },
            data.batarji && data.batarji[1] ? data.batarji[1] : { name: "", code: "" },
            data.batarji && data.batarji[2] ? data.batarji[2] : { name: "", code: "" }
        ],
        ruhaily: [
            data.ruhaily && data.ruhaily[0] ? data.ruhaily[0] : { name: "", code: "" }
        ],
        delivery: [
            data.delivery && data.delivery[0] ? data.delivery[0] : { name: "", code: "" }
        ]
    };
}

function applyDataToUI() {
    const waLink = document.getElementById("waLink");
    if (waLink) waLink.href = "https://wa.me/" + waNum;

    setValue("whatsappInput", waNum);
    setValue("coolingTempInput", currentCoolingTemp);
    setValue("mainCodeInput", systemPasswords.main);
    setValue("adminCodeInput", systemPasswords.admin);

    if (currentBannerUrl && document.getElementById("topBanner")) {
        document.getElementById("topBanner").style.backgroundImage =
            "linear-gradient(rgba(15,23,42,.3),rgba(15,23,42,.9)),url('" + currentBannerUrl + "')";
    }

    fillStaffInputs();
    renderCards();
    recalculateStats();
    calculateAllBranchesLiveReport();
    renderArchives();
    updateReports();
    updateDeliverAllBtnVisibility();
}

function setStatus(text) {
    const el = document.getElementById("status");
    if (el) el.innerHTML = text;
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
}

function loginMainSystem() {
    const code = document.getElementById("mainLoginCode").value.trim();

    if (
        code !== systemPasswords.main &&
        code !== "1234" &&
        code !== emergencyPassword
    ) {
        customAlert("❌", "رمز خاطئ", "رمز الصفحة الرئيسية غير صحيح");
        return;
    }

    document.getElementById("mainLoginScreen").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.body.classList.add("system-open");

    connectFirebase();
}

function openAdminLogin() {
    document.getElementById("adminLoginModal").style.display = "flex";

    setTimeout(function () {
        const input = document.getElementById("adminLoginCode");
        if (input) input.focus();
    }, 100);
}

function closeAdminLogin() {
    document.getElementById("adminLoginModal").style.display = "none";
    setValue("adminLoginCode", "");
}

function loginAdminPanel() {
    const code = document.getElementById("adminLoginCode").value.trim();

    if (
        code !== systemPasswords.admin &&
        code !== "0000" &&
        code !== emergencyPassword
    ) {
        customAlert("❌", "رمز خاطئ", "رمز لوحة الإشراف غير صحيح");
        return;
    }

    closeAdminLogin();
    document.getElementById("adminPanel").style.display = "block";
    document.getElementById("adminPanel").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function closeAdminPanel() {
    document.getElementById("adminPanel").style.display = "none";
}

function fillStaffInputs() {
    setValue("bName1", staffData.batarji[0]?.name);
    setValue("bCode1", staffData.batarji[0]?.code);
    setValue("bName2", staffData.batarji[1]?.name);
    setValue("bCode2", staffData.batarji[1]?.code);
    setValue("bName3", staffData.batarji[2]?.name);
    setValue("bCode3", staffData.batarji[2]?.code);

    setValue("rName1", staffData.ruhaily[0]?.name);
    setValue("rCode1", staffData.ruhaily[0]?.code);

    setValue("dName1", staffData.delivery[0]?.name);
    setValue("dCode1", staffData.delivery[0]?.code);
}

function savePasswords() {
    if (!db) {
        customAlert("❌", "لا يوجد اتصال", "انتظر الاتصال بالسحابة ثم حاول مرة أخرى");
        return;
    }

    const main = document.getElementById("mainCodeInput").value.trim();
    const admin = document.getElementById("adminCodeInput").value.trim();

    if (!main || !admin) {
        customAlert("⚠️", "بيانات ناقصة", "أدخل رمز الصفحة الرئيسية ورمز الإشراف");
        return;
    }

    db.ref("pnc_data/passwords").set({
        main: main,
        admin: admin
    }).then(function () {
        customAlert("✅", "تم الحفظ", "تم تحديث كلمات المرور بنجاح");
    }).catch(function (error) {
        customAlert("❌", "خطأ", error.message);
    });
}

function saveAdminSettings() {
    if (!db) {
        customAlert("❌", "لا يوجد اتصال", "انتظر الاتصال بالسحابة ثم حاول مرة أخرى");
        return;
    }

    const updateData = {
        whatsapp: document.getElementById("whatsappInput").value.trim(),
        coolingTemp: document.getElementById("coolingTempInput").value.trim(),
        staff: {
            batarji: [
                {
                    name: document.getElementById("bName1").value.trim(),
                    code: document.getElementById("bCode1").value.trim()
                },
                {
                    name: document.getElementById("bName2").value.trim(),
                    code: document.getElementById("bCode2").value.trim()
                },
                {
                    name: document.getElementById("bName3").value.trim(),
                    code: document.getElementById("bCode3").value.trim()
                }
            ],
            ruhaily: [
                {
                    name: document.getElementById("rName1").value.trim(),
                    code: document.getElementById("rCode1").value.trim()
                }
            ],
            delivery: [
                {
                    name: document.getElementById("dName1").value.trim(),
                    code: document.getElementById("dCode1").value.trim()
                }
            ]
        }
    };

    db.ref("pnc_data").update(updateData).then(function () {
        customAlert("✅", "تم الحفظ", "تم حفظ إعدادات الإشراف بنجاح");
    }).catch(function (error) {
        customAlert("❌", "خطأ", error.message);
    });
}

async function uploadBannerImage() {
    if (!storage || !db) {
        customAlert("❌", "التخزين غير متاح", "Firebase Storage غير مفعل أو غير متصل");
        return;
    }

    const fileInput = document.getElementById("bannerImageUpload");
    const progress = document.getElementById("uploadProgress");

    if (!fileInput.files.length) {
        customAlert("⚠️", "لم يتم اختيار صورة", "اختر صورة أولاً");
        return;
    }

    const file = fileInput.files[0];

    if (!file.type.startsWith("image/")) {
        customAlert("⚠️", "ملف غير صحيح", "اختر صورة فقط");
        return;
    }

    if (file.size > 3 * 1024 * 1024) {
        customAlert("⚠️", "الصورة كبيرة", "اختر صورة أقل من 3MB");
        return;
    }

    progress.innerHTML = "⏳ جاري رفع الصورة...";

    try {
        const safeName = file.name.replace(/[^\w.\-]/g, "_");
        const ref = storage.ref("banners/banner_" + Date.now() + "_" + safeName);

        await ref.put(file);
        const url = await ref.getDownloadURL();

        await db.ref("pnc_data/bannerUrl").set(url);

        progress.innerHTML = "✅ تم رفع الصورة بنجاح";
        fileInput.value = "";

    } catch (error) {
        progress.innerHTML = "❌ فشل رفع الصورة";
        customAlert("❌", "فشل رفع الصورة", error.message || "تحقق من صلاحيات Storage");
    }
}

function toggleSidebarDrawer(open) {
    document.getElementById("sidebarDrawer").className =
        open ? "sidebar-drawer open" : "sidebar-drawer";

    document.getElementById("drawerOverlay").className =
        open ? "drawer-overlay open" : "drawer-overlay";
}

function switchBranchView(view) {
    currentBranchView = view;
    activeMainFilter = "all";

    document.querySelectorAll(".branch-filter-btn").forEach(function (btn) {
        btn.classList.remove("active-branch-selected");
    });

    document.getElementById("btn-view-" + view).classList.add("active-branch-selected");

    document.querySelectorAll(".stat").forEach(function (el) {
        el.classList.remove("inactive-filter");
    });

    const names = {
        delivery: "التوصيل",
        batarji: "البترجي",
        ruhaily: "الرحيلي"
    };

    document.getElementById("listTitle").innerHTML = "قائمة فرز " + names[view];

    renderCards();
    recalculateStats();
    updateReports();
    updateDeliverAllBtnVisibility();
}

function updateDeliverAllBtnVisibility() {
    const btn = document.getElementById("deliverAllBtn");
    if (btn) {
        btn.style.display = currentBranchView === "delivery" ? "block" : "none";
    }
}

function recalculateStats() {
    let pending = 0;
    let done = 0;
    let cancel = 0;

    meals.forEach(function (meal) {
        if (meal.branch !== currentBranchView) return;

        const action = tableStatus[meal.number] || {};

        if (action.status === "done") done++;
        else if (action.status === "cancel") cancel++;
        else pending++;
    });

    document.getElementById("pendingMeals").innerHTML = pending;
    document.getElementById("doneMeals").innerHTML = done;
    document.getElementById("cancelMeals").innerHTML = cancel;
}

function toggleMainListFilter(status) {
    if (activeMainFilter === status) {
        activeMainFilter = "all";

        document.querySelectorAll(".stat").forEach(function (el) {
            el.classList.remove("inactive-filter");
        });

    } else {
        activeMainFilter = status;

        document.querySelectorAll(".stat").forEach(function (el) {
            el.classList.add("inactive-filter");
        });

        document.getElementById("stat-" + status).classList.remove("inactive-filter");
    }

    renderCards();
}

function renderCards() {
    const container = document.getElementById("mealCardsContainer");
    if (!container) return;

    container.innerHTML = "";

    const query = document.getElementById("mealInput").value.trim().toLowerCase();

    let filtered = meals.filter(function (m) {
        return m.branch === currentBranchView;
    });

    if (activeMainFilter !== "all") {
        filtered = filtered.filter(function (m) {
            const s = (tableStatus[m.number] || {}).status || "pending";
            return s === activeMainFilter;
        });
    }

    if (query) {
        filtered = filtered.filter(function (m) {
            return String(m.number).includes(query) ||
                String(m.name || "").toLowerCase().includes(query);
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = "<div class='status-line'>لا توجد نتائج</div>";
        return;
    }

    filtered.forEach(function (meal) {
        const act = tableStatus[meal.number] || {};

        let badge = "<span style='color:#facc15;'>⏳ انتظار</span>";

        if (act.status === "done") {
            badge = "<span style='color:#22c55e;'>✅ مستلم</span>";
        }

        if (act.status === "cancel") {
            badge = "<span style='color:#ef4444;'>❌ ملغى</span>";
        }

        const div = document.createElement("div");
        div.className = "meal-row-card";
        div.onclick = function () {
            checkMeal(meal);
        };

        div.innerHTML =
            "<div class='meal-card-main-info'>" +
            "<span class='meal-card-num'>#" + escapeHtml(meal.number) + "</span>" +
            badge +
            "</div>" +
            "<div class='meal-card-name'>" + escapeHtml(meal.name) + "</div>";

        container.appendChild(div);
    });
}

function customAlert(icon, title, message) {
    document.getElementById("alertIcon").innerHTML = icon;
    document.getElementById("alertTitle").innerHTML = title;
    document.getElementById("alertMessage").innerHTML = message;

    document.getElementById("modalDynamicFields").style.display = "none";
    document.getElementById("modalActionButtons").style.display = "none";
    document.getElementById("customAlertModal").style.display = "flex";
}

function closeCustomAlert() {
    document.getElementById("customAlertModal").style.display = "none";
}

function checkMealFromInput() {
    const value = document.getElementById("mealInput").value.trim().toLowerCase();

    if (!value) {
        customAlert("⚠️", "تنبيه", "اكتب رقم أو اسم المشترك أولاً");
        return;
    }

    const meal =
        meals.find(function (m) { return String(m.number) === value; }) ||
        meals.find(function (m) { return String(m.name).toLowerCase().includes(value); });

    if (!meal) {
        customAlert("🔍", "غير موجود", "لم يتم العثور على المشترك");
        return;
    }

    checkMeal(meal);
}

function checkMeal(meal) {
    const branchLabels = {
        delivery: "🚚 قسم التوصيل",
        batarji: "🏪 فرع البترجي",
        ruhaily: "🏪 فرع الرحيلي"
    };

    if (meal.branch !== currentBranchView) {
        customAlert(
            "⚠️",
            "موقع خاطئ",
            "هذا المشترك مخصص إلى:<br><b>" + branchLabels[meal.branch] + "</b>"
        );
        return;
    }

    const action = tableStatus[meal.number] || {};

    if (action.status === "done") {
        customAlert(
            "✅",
            "مستلم مسبقاً",
            "👤 الاسم: <b>" + escapeHtml(meal.name) + "</b><br>" +
            "📌 الاشتراك: #" + escapeHtml(meal.number) + "<br>" +
            "👨‍🍳 المسؤول: " + escapeHtml(action.by || "-") + "<br>" +
            "⏰ الوقت: " + escapeHtml(action.time || "-")
        );
        return;
    }

    showMealActionModal(meal);
}

function showMealActionModal(meal) {
    document.getElementById("alertIcon").innerHTML = "👤";
    document.getElementById("alertTitle").innerHTML = "تفاصيل المشترك";
    document.getElementById("alertMessage").innerHTML =
        "👤 الاسم: <b>" + escapeHtml(meal.name) + "</b><br>" +
        "📌 الاشتراك: #" + escapeHtml(meal.number) + "<br>" +
        "⏳ الحالة: قيد الانتظار";

    document.getElementById("modalDynamicFields").style.display = "none";
    document.getElementById("modalActionButtons").style.display = "flex";

    document.getElementById("modalConfirmBtn").innerHTML = "✅ تأكيد التسليم";
    document.getElementById("modalCancelBtn").innerHTML = "❌ إلغاء اليوم";

    document.getElementById("modalConfirmBtn").onclick = function () {
        closeCustomAlert();
        executeDirectAction(meal.number, "done");
    };

    document.getElementById("modalCancelBtn").onclick = function () {
        closeCustomAlert();
        executeDirectAction(meal.number, "cancel");
    };

    document.getElementById("customAlertModal").style.display = "flex";
}

function executeDirectAction(num, action) {
    checkStaffLoginRequirement(function () {
        const staffName = currentLoggedStaff[currentBranchView] || "موظف معتمد";

        const now = new Date();
        const time = now.toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });

        db.ref("pnc_data/actions/" + num).set({
            status: action,
            time: time,
            by: staffName
        }).catch(function (error) {
            customAlert("❌", "خطأ", error.message);
        });
    });
}

function checkStaffLoginRequirement(callback) {
    if (currentLoggedStaff[currentBranchView]) {
        callback();
        return;
    }

    document.getElementById("alertIcon").innerHTML = "🔐";
    document.getElementById("alertTitle").innerHTML = "تسجيل دخول الموظف";
    document.getElementById("alertMessage").innerHTML = "أدخل كود الموظف لتنفيذ العملية";
    document.getElementById("modalActionButtons").style.display = "none";

    const box = document.getElementById("modalDynamicFields");
    box.innerHTML = "";
    box.style.display = "block";

    const branchStaff = staffData[currentBranchView] || [];

    if (currentBranchView === "batarji") {
        let html = "<select id='loginStaffSelect'>";

        branchStaff.forEach(function (s, i) {
            if (s.name) {
                html += "<option value='" + i + "'>" + escapeHtml(s.name) + "</option>";
            }
        });

        html += "</select>";
        box.innerHTML += html;
    }

    box.innerHTML += "<input id='loginStaffCode' type='password' placeholder='كود الموظف'>";
    box.innerHTML += "<button class='green-btn' onclick='submitStaffLogin()'>دخول الموظف</button>";

    window.afterStaffLoginCallback = callback;
    document.getElementById("customAlertModal").style.display = "flex";
}

function submitStaffLogin() {
    const code = document.getElementById("loginStaffCode").value.trim();
    const branchStaff = staffData[currentBranchView] || [];

    let matched = null;

    if (currentBranchView === "batarji") {
        const select = document.getElementById("loginStaffSelect");
        const index = select ? select.value : 0;

        if (branchStaff[index] && branchStaff[index].code === code) {
            matched = branchStaff[index];
        }
    } else {
        matched = branchStaff.find(function (s) {
            return s.code === code && s.code;
        });
    }

    if (!matched) {
        customAlert("❌", "كود خاطئ", "كود الموظف غير صحيح");
        return;
    }

    currentLoggedStaff[currentBranchView] = matched.name || "موظف معتمد";

    const logoutBtn = document.getElementById("logoutStaffBtn");
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    closeCustomAlert();

    if (typeof window.afterStaffLoginCallback === "function") {
        window.afterStaffLoginCallback();
    }
}

function logoutCurrentStaff() {
    currentLoggedStaff[currentBranchView] = null;

    document.getElementById("logoutStaffBtn").style.display = "none";

    customAlert("✅", "تم الخروج", "تم تسجيل خروج الموظف بنجاح");
}

function triggerDeliverAllDelivery() {
    confirmModal(
        "⚡ تسليم الكل",
        "هل تريد تسليم كل شحنات التوصيل قيد الانتظار؟",
        function () {
            checkStaffLoginRequirement(function () {
                const staffName = currentLoggedStaff.delivery || "مسؤول التوصيل";

                const now = new Date();
                const time = now.toLocaleTimeString("ar-SA", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                });

                const updates = {};

                meals.forEach(function (meal) {
                    const action = tableStatus[meal.number] || {};
                    const status = action.status || "pending";

                    if (meal.branch === "delivery" && status === "pending") {
                        updates["pnc_data/actions/" + meal.number] = {
                            status: "done",
                            time: time,
                            by: staffName
                        };
                    }
                });

                if (Object.keys(updates).length === 0) {
                    customAlert("ℹ️", "لا يوجد", "لا توجد شحنات قيد الانتظار");
                    return;
                }

                db.ref().update(updates).then(function () {
                    customAlert("✅", "تم التسليم", "تم تسليم جميع شحنات التوصيل قيد الانتظار");
                }).catch(function (error) {
                    customAlert("❌", "خطأ", error.message);
                });
            });
        }
    );
}

function confirmModal(title, message, onConfirm) {
    document.getElementById("alertIcon").innerHTML = "⚠️";
    document.getElementById("alertTitle").innerHTML = title;
    document.getElementById("alertMessage").innerHTML = message;
    document.getElementById("modalDynamicFields").style.display = "none";
    document.getElementById("modalActionButtons").style.display = "flex";

    document.getElementById("modalConfirmBtn").innerHTML = "✅ تأكيد";
    document.getElementById("modalCancelBtn").innerHTML = "❌ إلغاء";

    document.getElementById("modalConfirmBtn").onclick = function () {
        closeCustomAlert();
        if (typeof onConfirm === "function") onConfirm();
    };

    document.getElementById("modalCancelBtn").onclick = function () {
        closeCustomAlert();
    };

    document.getElementById("customAlertModal").style.display = "flex";
}

async function processPDFFile() {
    const fileInput = document.getElementById("pdfFileInput");
    const status = document.getElementById("pdfStatus");

    if (!fileInput.files.length) {
        customAlert("⚠️", "ملف غير موجود", "اختر ملف PDF أولاً");
        return;
    }

    if (!db) {
        customAlert("❌", "لا يوجد اتصال", "انتظر الاتصال بالسحابة ثم حاول مرة أخرى");
        return;
    }

    confirmModal(
        "تحديث القائمة",
        "هل تريد أرشفة اليوم الحالي ورفع قائمة PDF الجديدة؟",
        async function () {
            try {
                status.innerHTML = "⏳ جاري قراءة PDF...";

                pdfjsLib.GlobalWorkerOptions.workerSrc =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

                const file = fileInput.files[0];
                const buffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

                const newMeals = [];
                const seen = {};
                const failedPages = [];

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    status.innerHTML = "⏳ قراءة الصفحة " + pageNum + " من " + pdf.numPages;

                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();

                    const meal = extractMealFromPdfItems(textContent.items);

                    if (meal) {
                        if (!seen[meal.number]) {
                            seen[meal.number] = true;
                            newMeals.push(meal);
                        }
                    } else {
                        if (pageNum !== 1) {
                            failedPages.push(pageNum);
                        }
                    }
                }

                if (newMeals.length === 0) {
                    status.innerHTML = "❌ لم يتم استخراج أي مشترك";
                    customAlert("❌", "فشل القراءة", "لم يتم استخراج أي مشترك من الملف");
                    return;
                }

                const now = new Date();
                const archiveKey = "Arch_" + now.getTime();

                let totalDone = 0;

                Object.keys(tableStatus).forEach(function (k) {
                    if (tableStatus[k].status === "done") totalDone++;
                });

                await db.ref("pnc_data/archives/" + archiveKey).set({
                    date: now.toLocaleDateString("ar-SA"),
                    totalDone: totalDone,
                    actions: tableStatus,
                    meals: meals
                });

                await db.ref("pnc_data/actions").remove();
                await db.ref("pnc_data/mealsList").set(newMeals);

                fileInput.value = "";

                let msg = "تم استخراج ورفع " + newMeals.length + " مشترك بنجاح";

                if (failedPages.length > 0) {
                    msg += "<br><br>⚠️ صفحات لم تُقرأ: " + failedPages.join(", ");
                }

                status.innerHTML = "✅ " + msg;
                customAlert("✅", "تم التحديث", msg);

            } catch (error) {
                status.innerHTML = "❌ خطأ قراءة PDF";
                customAlert("❌", "خطأ", error.message);
            }
        }
    );
}

function extractMealFromPdfItems(items) {
    if (!items || !items.length) return null;

    const rawParts = items
        .map(function (item) { return String(item.str || "").trim(); })
        .filter(Boolean);

    const fullText = rawParts.join(" ").replace(/\s+/g, " ").trim();

    let number = null;
    let name = "";

    for (let i = 0; i < rawParts.length; i++) {
        const part = rawParts[i];
        const match = part.match(/\[(\d{4,8})\]/);

        if (match) {
            number = parseInt(match[1], 10);

            const sameLineName = part.replace(/\[(\d{4,8})\]/, "").trim();

            if (sameLineName && !isPdfStopText(sameLineName)) {
                name = sameLineName;
            } else {
                const collected = [];

                for (let j = i + 1; j < rawParts.length; j++) {
                    const next = rawParts[j].trim();

                    if (!next) continue;
                    if (isPdfStopText(next)) break;
                    if (next.match(/\[(\d{4,8})\]/)) break;

                    collected.push(next);

                    if (collected.join(" ").length > 90) break;
                    if (collected.length >= 6) break;
                }

                name = collected.join(" ");
            }

            break;
        }
    }

    if (!number) {
        const fallback = fullText.match(/\[(\d{4,8})\]\s+(.+?)(?=\s+(Plan|Items|Captain|Delivery|Pickup|Total|Calories|Protein|Carbs|Fat)\b|$)/i);

        if (fallback) {
            number = parseInt(fallback[1], 10);
            name = fallback[2] || "";
        }
    }

    name = cleanName(name);

    if (!number || name.length < 2) return null;

    return {
        number: number,
        name: name,
        branch: detectBranch(fullText)
    };
}

function isPdfStopText(text) {
    const t = String(text || "").toLowerCase();

    return (
        t.includes("plan") ||
        t.includes("items") ||
        t.includes("captain") ||
        t.includes("delivery") ||
        t.includes("pickup") ||
        t.includes("branch") ||
        t.includes("total") ||
        t.includes("calories") ||
        t.includes("protein") ||
        t.includes("carbs") ||
        t.includes("fat") ||
        t.includes("address") ||
        t.includes("phone")
    );
}

function cleanName(name) {
    return String(name || "")
        .replace(/\bPlan\b.*$/i, "")
        .replace(/\bItems\b.*$/i, "")
        .replace(/\bCaptain\b.*$/i, "")
        .replace(/\bDelivery\b.*$/i, "")
        .replace(/\bPickup\b.*$/i, "")
        .replace(/\bTotal\b.*$/i, "")
        .replace(/\bCalories\b.*$/i, "")
        .replace(/\bProtein\b.*$/i, "")
        .replace(/\bCarbs\b.*$/i, "")
        .replace(/\bFat\b.*$/i, "")
        .replace(/\s+/g, " ")
        .trim();
}

function detectBranch(text) {
    const lower = String(text || "").toLowerCase();

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

function calculateAllBranchesLiveReport() {
    const stats = {
        delivery: { done: 0, pending: 0 },
        batarji: { done: 0, pending: 0 },
        ruhaily: { done: 0, pending: 0 }
    };

    meals.forEach(function (meal) {
        if (!stats[meal.branch]) return;

        const act = tableStatus[meal.number] || {};
        const status = act.status || "pending";

        if (status === "done") {
            stats[meal.branch].done++;
        } else if (status !== "cancel") {
            stats[meal.branch].pending++;
        }
    });

    document.getElementById("drawerDelSum").innerHTML =
        stats.delivery.done + " مستلم / " + stats.delivery.pending + " باقي";

    document.getElementById("drawerBatSum").innerHTML =
        stats.batarji.done + " مستلم / " + stats.batarji.pending + " باقي";

    document.getElementById("drawerRuhSum").innerHTML =
        stats.ruhaily.done + " مستلم / " + stats.ruhaily.pending + " باقي";
}

function renderArchives() {
    const container = document.getElementById("archiveContainer");
    if (!container) return;

    container.innerHTML = "";

    const keys = Object.keys(archivesData || {});

    if (keys.length === 0) {
        container.innerHTML = "<div class='status-line'>لا يوجد أرشيف</div>";
        return;
    }

    keys.sort().reverse().forEach(function (key) {
        const arc = archivesData[key];

        const div = document.createElement("div");
        div.className = "archive-item";

        div.innerHTML =
            "<div>" +
            "<b>📅 " + escapeHtml(arc.date || "-") + "</b><br>" +
            "<span>المستلمين: " + escapeHtml(arc.totalDone || 0) + "</span>" +
            "</div>";

        container.appendChild(div);
    });
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

    document.querySelectorAll(".reports-tab").forEach(function (btn) {
        btn.classList.remove("active-tab");
    });

    document.getElementById("tab-" + tab).classList.add("active-tab");

    updateReports();
}

function updateReports() {
    const content = document.getElementById("reportsContent");
    if (!content) return;

    content.innerHTML = "";

    const names = {
        delivery: "التوصيل",
        batarji: "البترجي",
        ruhaily: "الرحيلي"
    };

    document.getElementById("reportsOverlayTitle").innerHTML =
        "📋 سجل فرز " + names[currentBranchView];

    meals
        .filter(function (m) { return m.branch === currentBranchView; })
        .forEach(function (meal) {
            const act = tableStatus[meal.number] || {};
            const status = act.status || "pending";

            if (status !== activeTab) return;

            const div = document.createElement("div");
            div.className = "meal-row-card";

            div.innerHTML =
                "<div class='meal-card-main-info'>" +
                "<span class='meal-card-num'>#" + escapeHtml(meal.number) + "</span>" +
                "<span>" + escapeHtml(act.time || "⏳") + "</span>" +
                "</div>" +
                "<div class='meal-card-name'>" + escapeHtml(meal.name) + "</div>" +
                "<div style='font-size:11px;color:#94a3b8;'>المسؤول: " + escapeHtml(act.by || "-") + "</div>";

            content.appendChild(div);
        });

    if (!content.innerHTML) {
        content.innerHTML = "<div class='status-line'>لا توجد بيانات</div>";
    }
}

function generatePDFReport() {
    const now = new Date();

    document.getElementById("pdfReportDate").innerHTML = now.toLocaleDateString("ar-SA");

    document.getElementById("pdfReportTime").innerHTML = now.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit"
    });

    document.getElementById("pdfReportCooling").innerHTML = currentCoolingTemp || "غير محدد";

    const bodies = {
        delivery: document.getElementById("pdfDeliveryTableBody"),
        batarji: document.getElementById("pdfBatarjiTableBody"),
        ruhaily: document.getElementById("pdfRuhailyTableBody")
    };

    bodies.delivery.innerHTML = "";
    bodies.batarji.innerHTML = "";
    bodies.ruhaily.innerHTML = "";

    let sums = {
        delivery: 0,
        batarji: 0,
        ruhaily: 0
    };

    meals.forEach(function (meal) {
        const act = tableStatus[meal.number] || {};

        let statusText = "⏳ انتظار";

        if (act.status === "done") {
            statusText = "✅ مستلم";
            sums[meal.branch]++;
        }

        if (act.status === "cancel") {
            statusText = "❌ ملغى";
        }

        const row =
            "<tr>" +
            "<td>#" + escapeHtml(meal.number) + "</td>" +
            "<td><b>" + escapeHtml(meal.name) + "</b></td>" +
            "<td>" + statusText + "</td>" +
            "<td>" + escapeHtml(act.by || "-") + "</td>" +
            "</tr>";

        if (bodies[meal.branch]) {
            bodies[meal.branch].innerHTML += row;
        }
    });

    document.getElementById("pdfSumDeliveryDone").innerHTML = sums.delivery;
    document.getElementById("pdfSumBatarjiDone").innerHTML = sums.batarji;
    document.getElementById("pdfSumRuhailyDone").innerHTML = sums.ruhaily;

    const element = document.getElementById("pdfReportTemplate");
    element.style.display = "block";

    html2pdf()
        .set({
            margin: [8, 8, 8, 8],
            filename: "تقرير-بروتين-وكارب.pdf",
            image: {
                type: "jpeg",
                quality: .98
            },
            html2canvas: {
                scale: 2,
                useCORS: true,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: {
                unit: "mm",
                format: "a4",
                orientation: "portrait"
            },
            pagebreak: {
                mode: ["css", "legacy"]
            }
        })
        .from(element)
        .save()
        .then(function () {
            element.style.display = "none";
        });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
