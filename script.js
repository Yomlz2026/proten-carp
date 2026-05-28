script.js

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
var meals = [];
var siteCode = "1234";
var adminCode = "0000";

window.onload = function () {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    db = firebase.database();

    db.ref("pnc_settings").on("value", function (snap) {
        var data = snap.val() || {};
        siteCode = data.siteCode || "1234";
        adminCode = data.adminCode || "0000";

        var siteInput = document.getElementById("newSiteCode");
        var adminInput = document.getElementById("newAdminCode");

        if (siteInput) siteInput.value = siteCode;
        if (adminInput) adminInput.value = adminCode;
    });

    db.ref("pnc_data/mealsList").on("value", function (snap) {
        meals = snap.val() || [];
        renderMeals();
    });
};

function loginSite() {
    var pass = document.getElementById("sitePassword").value.trim();

    if (pass === siteCode) {
        document.getElementById("mainLogin").style.display = "none";
    } else {
        alert("❌ كلمة مرور النظام غير صحيحة");
    }
}

function openAdminLogin() {
    document.getElementById("adminModal").style.display = "flex";
}

function closeAdminLogin() {
    document.getElementById("adminModal").style.display = "none";
}

function checkAdminPassword() {
    var pass = document.getElementById("adminPassword").value.trim();

    if (pass === adminCode) {
        document.getElementById("adminModal").style.display = "none";
        document.getElementById("adminPanel").style.display = "block";
        document.getElementById("adminPassword").value = "";
    } else {
        alert("❌ كلمة مرور الإشراف غير صحيحة");
    }
}

function closeAdminPanel() {
    document.getElementById("adminPanel").style.display = "none";
}

function saveCodes() {
    var newSite = document.getElementById("newSiteCode").value.trim();
    var newAdmin = document.getElementById("newAdminCode").value.trim();

    if (!newSite || !newAdmin) {
        alert("⚠️ أدخل الرمزين أولاً");
        return;
    }

    db.ref("pnc_settings").set({
        siteCode: newSite,
        adminCode: newAdmin
    }).then(function () {
        alert("✅ تم حفظ الرموز بنجاح");
    }).catch(function (error) {
        alert("❌ خطأ في الحفظ: " + error.message);
    });
}

async function processPDF() {
    var fileInput = document.getElementById("pdfFile");

    if (!fileInput.files.length) {
        alert("⚠️ اختر ملف PDF أولاً");
        return;
    }

    if (!confirm("هل تريد تحليل ملف PDF ورفع المشتركين للسحابة؟")) {
        return;
    }

    var file = fileInput.files[0];
    var arrayBuffer = await file.arrayBuffer();

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var newMeals = [];

    for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        var page = await pdf.getPage(pageNum);
        var textContent = await page.getTextContent();

        var text = textContent.items.map(function (item) {
            return item.str;
        }).join(" ");

        var meal = extractMealFromPage(text);

        if (meal) {
            newMeals.push(meal);
        }
    }

    if (newMeals.length === 0) {
        alert("❌ لم يتم استخراج أي مشترك من الملف");
        return;
    }

    db.ref("pnc_data/mealsList").set(newMeals).then(function () {
        alert("✅ تم استخراج ورفع " + newMeals.length + " مشترك بنجاح");
        fileInput.value = "";
    }).catch(function (error) {
        alert("❌ خطأ في الرفع: " + error.message);
    });
}

function extractMealFromPage(text) {
    var match = text.match(/\[(\d{4,8})\]\s+(.+?)(?=\s+Plan name|\s+Items Count|\s+Captain Name|\s+Delivery|\s+Pickup Branch|$)/i);

    if (!match) {
        return null;
    }

    var number = parseInt(match[1]);
    var name = match[2].trim();

    name = name
        .replace(/\s+/g, " ")
        .replace(/Plan name.*/i, "")
        .replace(/Items Count.*/i, "")
        .replace(/Captain Name.*/i, "")
        .trim();

    var branch = "delivery";
    var lower = text.toLowerCase();

    if (
        lower.includes("pickup branch") &&
        (lower.includes("albatarji") || lower.includes("batarji") || lower.includes("بترجي") || lower.includes("البترجي"))
    ) {
        branch = "batarji";
    } else if (
        lower.includes("pickup branch") &&
        (lower.includes("ruhaily") || lower.includes("رحيلي") || lower.includes("الرحيلي"))
    ) {
        branch = "ruhaily";
    }

    return {
        number: number,
        name: name,
        branch: branch
    };
}

function renderMeals() {
    var container = document.getElementById("mealCardsContainer");

    if (!container) return;

    container.innerHTML = "";

    if (!meals.length) {
        container.innerHTML = "<div style='color:#94a3b8;text-align:center;padding:15px;'>لا توجد بيانات حالياً</div>";
        return;
    }

    meals.forEach(function (meal) {
        var branchName = "🚚 التوصيل";

        if (meal.branch === "batarji") branchName = "🏪 البترجي";
        if (meal.branch === "ruhaily") branchName = "🏪 الرحيلي";

        var card = document.createElement("div");
        card.className = "mealCard";

        card.innerHTML =
            "<div class='mealNum'>#" + meal.number + "</div>" +
            "<div>" + meal.name + "</div>" +
            "<div class='mealBranch'>" + branchName + "</div>";

        container.appendChild(card);
    });
}
