/* Firebase */

const firebaseConfig = {
    apiKey: "AIzaSyBY_5FtbLuUgLiOebfmzAMKqnDsvsbeDXc",
    authDomain: "protencarp.firebaseapp.com",
    projectId: "protencarp",
    storageBucket: "protencarp.appspot.com",
    messagingSenderId: "37899247050",
    appId: "1:37899247050:web:e8464a6386510174e2c333",
    databaseURL: "https://protencarp-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const storage = firebase.storage();

/* بيانات */

let meals = [];
let tableStatus = {};
let archivesData = {};

let currentBranchView = "delivery";
let activeMainFilter = "all";
let activeTab = "done";

let currentBannerUrl = "";
let currentCoolingTemp = "";

let currentLoggedStaff = {
    delivery:null,
    batarji:null,
    ruhaily:null
};

let staffData = {
    batarji:[
        {name:"",code:""},
        {name:"",code:""},
        {name:"",code:""}
    ],
    ruhaily:[
        {name:"",code:""}
    ],
    delivery:[
        {name:"",code:""}
    ]
};

let systemPasswords = {
    main:"7113",
    admin:"0000"
};

let waNum = "966506546313";

/* تشغيل */

window.onload = () => {

    connectFirebase();

};

/* اتصال فايربيس */

function connectFirebase(){

    db.ref("pnc_data").on("value",(snap)=>{

        if(!snap.exists()) return;

        const data = snap.val();

        meals = data.mealsList || [];
        tableStatus = data.actions || {};
        archivesData = data.archives || {};

        currentBannerUrl = data.bannerUrl || "";
        currentCoolingTemp = data.coolingTemp || "";

        waNum = data.whatsapp || "966506546313";

        systemPasswords = data.passwords || {
            main:"7113",
            admin:"0000"
        };

        if(data.staff){
            staffData = data.staff;
        }

        applyDataToUI();

    });

}

/* تطبيق البيانات */

function applyDataToUI(){

    document.getElementById("status").innerHTML =
    "🟢 متصل بالسحابة";

    document.getElementById("waLink").href =
    "https://wa.me/" + waNum;

    document.getElementById("whatsappInput").value = waNum;

    document.getElementById("coolingTempInput").value =
    currentCoolingTemp;

    document.getElementById("mainCodeInput").value =
    systemPasswords.main;

    document.getElementById("adminCodeInput").value =
    systemPasswords.admin;

    if(currentBannerUrl){

        document.getElementById("topBanner").style.backgroundImage =
        `linear-gradient(rgba(15,23,42,.3),rgba(15,23,42,.9)),url('${currentBannerUrl}')`;

    }

    fillStaffInputs();

    renderCards();

    recalculateStats();

    calculateAllBranchesLiveReport();

    renderArchives();

    updateReports();

    updateDeliverAllBtnVisibility();

}

/* تعبئة الموظفين */

function fillStaffInputs(){

    const map = [
        ["bName1",staffData.batarji[0]?.name],
        ["bCode1",staffData.batarji[0]?.code],

        ["bName2",staffData.batarji[1]?.name],
        ["bCode2",staffData.batarji[1]?.code],

        ["bName3",staffData.batarji[2]?.name],
        ["bCode3",staffData.batarji[2]?.code],

        ["rName1",staffData.ruhaily[0]?.name],
        ["rCode1",staffData.ruhaily[0]?.code],

        ["dName1",staffData.delivery[0]?.name],
        ["dCode1",staffData.delivery[0]?.code]
    ];

    map.forEach(item=>{

        if(document.getElementById(item[0])){

            document.getElementById(item[0]).value =
            item[1] || "";

        }

    });

}

/* تسجيل الدخول الرئيسي */

function loginMainSystem(){

    const code =
    document.getElementById("mainLoginCode").value.trim();

    if(code !== systemPasswords.main){

        customAlert(
            "❌",
            "رمز خاطئ",
            "رمز الصفحة الرئيسية غير صحيح"
        );

        return;

    }

    document.getElementById("mainLoginScreen").style.display =
    "none";

    document.getElementById("app").style.display =
    "block";

}

/* فتح الإشراف */

function openAdminLogin(){

    document.getElementById("adminLoginModal").style.display =
    "flex";

}

/* إغلاق */

function closeAdminLogin(){

    document.getElementById("adminLoginModal").style.display =
    "none";

}

/* دخول الإشراف */

function loginAdminPanel(){

    const code =
    document.getElementById("adminLoginCode").value.trim();

    if(code !== systemPasswords.admin){

        customAlert(
            "❌",
            "رمز خاطئ",
            "رمز لوحة الإشراف غير صحيح"
        );

        return;

    }

    closeAdminLogin();

    document.getElementById("adminPanel").style.display =
    "block";

}

/* إغلاق الإشراف */

function closeAdminPanel(){

    document.getElementById("adminPanel").style.display =
    "none";

}

/* حفظ كلمات المرور */

function savePasswords(){

    const main =
    document.getElementById("mainCodeInput").value.trim();

    const admin =
    document.getElementById("adminCodeInput").value.trim();

    db.ref("pnc_data/passwords").set({
        main,
        admin
    });

    customAlert(
        "✅",
        "تم الحفظ",
        "تم تحديث كلمات المرور بنجاح"
    );

}

/* حفظ الإعدادات */

function saveAdminSettings(){

    const updateData = {

        whatsapp:
        document.getElementById("whatsappInput").value.trim(),

        coolingTemp:
        document.getElementById("coolingTempInput").value.trim(),

        staff:{

            batarji:[
                {
                    name:document.getElementById("bName1").value.trim(),
                    code:document.getElementById("bCode1").value.trim()
                },
                {
                    name:document.getElementById("bName2").value.trim(),
                    code:document.getElementById("bCode2").value.trim()
                },
                {
                    name:document.getElementById("bName3").value.trim(),
                    code:document.getElementById("bCode3").value.trim()
                }
            ],

            ruhaily:[
                {
                    name:document.getElementById("rName1").value.trim(),
                    code:document.getElementById("rCode1").value.trim()
                }
            ],

            delivery:[
                {
                    name:document.getElementById("dName1").value.trim(),
                    code:document.getElementById("dCode1").value.trim()
                }
            ]

        }

    };

    db.ref("pnc_data").update(updateData);

    customAlert(
        "✅",
        "تم الحفظ",
        "تم حفظ إعدادات الإشراف بنجاح"
    );

}

/* رفع صورة البانر */

async function uploadBannerImage(){

    const fileInput =
    document.getElementById("bannerImageUpload");

    if(!fileInput.files.length){

        customAlert(
            "⚠️",
            "لم يتم اختيار صورة",
            "اختر صورة أولاً"
        );

        return;

    }

    const file = fileInput.files[0];

    const progress =
    document.getElementById("uploadProgress");

    progress.innerHTML =
    "⏳ جاري رفع الصورة...";

    try{

        const storageRef =
        storage.ref("banners/" + Date.now());

        await storageRef.put(file);

        const url =
        await storageRef.getDownloadURL();

        await db.ref("pnc_data/bannerUrl").set(url);

        progress.innerHTML =
        "✅ تم رفع الصورة بنجاح";

    }catch(err){

        progress.innerHTML =
        "❌ فشل رفع الصورة";

    }

}

/* القائمة الجانبية */

function toggleSidebarDrawer(open){

    document.getElementById("sidebarDrawer").className =
    open ?
    "sidebar-drawer open" :
    "sidebar-drawer";

    document.getElementById("drawerOverlay").className =
    open ?
    "drawer-overlay open" :
    "drawer-overlay";

}

/* تغيير الفرع */

function switchBranchView(view){

    currentBranchView = view;

    activeMainFilter = "all";

    document.querySelectorAll(".branch-filter-btn")
    .forEach(btn=>{

        btn.classList.remove("active-branch-selected");

    });

    document
    .getElementById("btn-view-" + view)
    .classList.add("active-branch-selected");

    const names = {
        delivery:"التوصيل",
        batarji:"البترجي",
        ruhaily:"الرحيلي"
    };

    document.getElementById("listTitle").innerHTML =
    "قائمة فرز " + names[view];

    renderCards();

    recalculateStats();

    updateReports();

    updateDeliverAllBtnVisibility();

}

/* زر تسليم الكل */

function updateDeliverAllBtnVisibility(){

    document.getElementById("deliverAllBtn").style.display =
    currentBranchView === "delivery"
    ? "block"
    : "none";

}

/* إعادة الإحصائيات */

function recalculateStats(){

    let pending = 0;
    let done = 0;
    let cancel = 0;

    meals.forEach(meal=>{

        if(meal.branch !== currentBranchView) return;

        const action =
        tableStatus[meal.number] || {};

        if(action.status === "done"){

            done++;

        }else if(action.status === "cancel"){

            cancel++;

        }else{

            pending++;

        }

    });

    document.getElementById("pendingMeals").innerHTML =
    pending;

    document.getElementById("doneMeals").innerHTML =
    done;

    document.getElementById("cancelMeals").innerHTML =
    cancel;

}

/* فلترة */

function toggleMainListFilter(status){

    if(activeMainFilter === status){

        activeMainFilter = "all";

        document.querySelectorAll(".stat")
        .forEach(el=>{

            el.classList.remove("inactive-filter");

        });

    }else{

        activeMainFilter = status;

        document.querySelectorAll(".stat")
        .forEach(el=>{

            el.classList.add("inactive-filter");

        });

        document.getElementById("stat-" + status)
        .classList.remove("inactive-filter");

    }

    renderCards();

}

/* رسم المشتركين */

function renderCards(){

    const container =
    document.getElementById("mealCardsContainer");

    container.innerHTML = "";

    const query =
    document.getElementById("mealInput")
    .value
    .trim()
    .toLowerCase();

    let filtered =
    meals.filter(m=>m.branch === currentBranchView);

    if(activeMainFilter !== "all"){

        filtered =
        filtered.filter(m=>{

            const s =
            (tableStatus[m.number] || {}).status || "pending";

            return s === activeMainFilter;

        });

    }

    if(query){

        filtered =
        filtered.filter(m=>{

            return (
                String(m.number).includes(query) ||
                m.name.toLowerCase().includes(query)
            );

        });

    }

    if(filtered.length === 0){

        container.innerHTML =
        `<div class="status-line">
            لا توجد نتائج
        </div>`;

        return;

    }

    filtered.forEach(meal=>{

        const act =
        tableStatus[meal.number] || {};

        let badge =
        `<span style="color:#facc15;">⏳ انتظار</span>`;

        if(act.status === "done"){

            badge =
            `<span style="color:#22c55e;">
                ✅ مستلم (${act.time})
            </span>`;

        }

        if(act.status === "cancel"){

            badge =
            `<span style="color:#ef4444;">
                ❌ ملغى (${act.time})
            </span>`;

        }

        const div =
        document.createElement("div");

        div.className =
        "meal-row-card";

        div.onclick = ()=>{

            checkMeal(meal);

        };

        div.innerHTML = `
            <div class="meal-card-main-info">

                <span class="meal-card-num">
                    #${meal.number}
                </span>

                ${badge}

            </div>

            <div class="meal-card-name">
                ${meal.name}
            </div>
        `;

        container.appendChild(div);

    });

}

/* تنبيه */

function customAlert(icon,title,message){

    document.getElementById("alertIcon").innerHTML =
    icon;

    document.getElementById("alertTitle").innerHTML =
    title;

    document.getElementById("alertMessage").innerHTML =
    message;

    document.getElementById("modalActionButtons").style.display =
    "none";

    document.getElementById("customAlertModal").style.display =
    "flex";

}

/* إغلاق */

function closeCustomAlert(){

    document.getElementById("customAlertModal").style.display =
    "none";

           }
/* البحث من الإدخال */

function checkMealFromInput(){

    const value =
    document.getElementById("mealInput").value.trim().toLowerCase();

    if(!value){

        customAlert(
            "⚠️",
            "تنبيه",
            "اكتب رقم أو اسم المشترك أولاً"
        );

        return;

    }

    const meal =
    meals.find(m => String(m.number) === value) ||
    meals.find(m => String(m.name).toLowerCase().includes(value));

    if(!meal){

        customAlert(
            "🔍",
            "غير موجود",
            "لم يتم العثور على المشترك"
        );

        return;

    }

    checkMeal(meal);

}

/* فحص المشترك */

function checkMeal(meal){

    const branchLabels = {
        delivery:"🚚 قسم التوصيل",
        batarji:"🏪 فرع البترجي",
        ruhaily:"🏪 فرع الرحيلي"
    };

    if(meal.branch !== currentBranchView){

        customAlert(
            "⚠️",
            "موقع خاطئ",
            "هذا المشترك مخصص إلى:<br><b>" +
            branchLabels[meal.branch] +
            "</b>"
        );

        return;

    }

    const action =
    tableStatus[meal.number] || {};

    if(action.status === "done"){

        customAlert(
            "✅",
            "مستلم مسبقاً",
            "👤 الاسم: <b>" + meal.name + "</b><br>" +
            "📌 الاشتراك: #" + meal.number + "<br>" +
            "👨‍🍳 المسؤول: " + (action.by || "-") + "<br>" +
            "⏰ الوقت: " + (action.time || "-")
        );

        return;

    }

    showMealActionModal(meal);

}

/* مودال إجراء المشترك */

function showMealActionModal(meal){

    document.getElementById("alertIcon").innerHTML =
    "👤";

    document.getElementById("alertTitle").innerHTML =
    "تفاصيل المشترك";

    document.getElementById("alertMessage").innerHTML =
    "👤 الاسم: <b>" + meal.name + "</b><br>" +
    "📌 الاشتراك: #" + meal.number + "<br>" +
    "⏳ الحالة: قيد الانتظار";

    document.getElementById("modalDynamicFields").style.display =
    "none";

    document.getElementById("modalActionButtons").style.display =
    "flex";

    document.getElementById("modalConfirmBtn").onclick = function(){

        closeCustomAlert();

        executeDirectAction(meal.number,"done");

    };

    document.getElementById("modalCancelBtn").onclick = function(){

        closeCustomAlert();

        executeDirectAction(meal.number,"cancel");

    };

    document.getElementById("customAlertModal").style.display =
    "flex";

}

/* تنفيذ إجراء */

function executeDirectAction(num,action){

    checkStaffLoginRequirement(function(){

        const staffName =
        currentLoggedStaff[currentBranchView] ||
        "موظف معتمد";

        const now = new Date();

        const time =
        now.toLocaleTimeString("ar-SA",{
            hour:"2-digit",
            minute:"2-digit",
            hour12:true
        });

        db.ref("pnc_data/actions/" + num).set({
            status:action,
            time:time,
            by:staffName
        });

    });

}

/* تسجيل دخول الموظف */

function checkStaffLoginRequirement(callback){

    if(currentLoggedStaff[currentBranchView]){

        callback();

        return;

    }

    document.getElementById("alertIcon").innerHTML =
    "🔐";

    document.getElementById("alertTitle").innerHTML =
    "تسجيل دخول الموظف";

    document.getElementById("alertMessage").innerHTML =
    "أدخل كود الموظف لتنفيذ العملية";

    document.getElementById("modalActionButtons").style.display =
    "none";

    const box =
    document.getElementById("modalDynamicFields");

    box.innerHTML = "";

    box.style.display = "block";

    const branchStaff =
    staffData[currentBranchView] || [];

    if(currentBranchView === "batarji"){

        let html =
        `<select id="loginStaffSelect">`;

        branchStaff.forEach((s,i)=>{

            if(s.name){

                html +=
                `<option value="${i}">
                    ${s.name}
                </option>`;

            }

        });

        html += `</select>`;

        box.innerHTML += html;

    }

    box.innerHTML +=
    `<input id="loginStaffCode"
        type="password"
        placeholder="كود الموظف">`;

    box.innerHTML +=
    `<button class="green-btn"
        onclick="submitStaffLogin()">
        دخول الموظف
    </button>`;

    window.afterStaffLoginCallback =
    callback;

    document.getElementById("customAlertModal").style.display =
    "flex";

}

/* تأكيد دخول الموظف */

function submitStaffLogin(){

    const code =
    document.getElementById("loginStaffCode").value.trim();

    const branchStaff =
    staffData[currentBranchView] || [];

    let matched = null;

    if(currentBranchView === "batarji"){

        const select =
        document.getElementById("loginStaffSelect");

        const index =
        select ? select.value : 0;

        if(
            branchStaff[index] &&
            branchStaff[index].code === code
        ){

            matched =
            branchStaff[index];

        }

    }else{

        matched =
        branchStaff.find(s => s.code === code && s.code);

    }

    if(!matched){

        customAlert(
            "❌",
            "كود خاطئ",
            "كود الموظف غير صحيح"
        );

        return;

    }

    currentLoggedStaff[currentBranchView] =
    matched.name || "موظف معتمد";

    document.getElementById("logoutStaffBtn").style.display =
    "inline-block";

    closeCustomAlert();

    if(typeof window.afterStaffLoginCallback === "function"){

        window.afterStaffLoginCallback();

    }

}

/* خروج الموظف */

function logoutCurrentStaff(){

    currentLoggedStaff[currentBranchView] =
    null;

    document.getElementById("logoutStaffBtn").style.display =
    "none";

    customAlert(
        "✅",
        "تم الخروج",
        "تم تسجيل خروج الموظف بنجاح"
    );

}

/* تسليم الكل */

function triggerDeliverAllDelivery(){

    confirmModal(
        "⚡ تسليم الكل",
        "هل تريد تسليم كل شحنات التوصيل قيد الانتظار؟",
        function(){

            checkStaffLoginRequirement(function(){

                const staffName =
                currentLoggedStaff.delivery ||
                "مسؤول التوصيل";

                const now = new Date();

                const time =
                now.toLocaleTimeString("ar-SA",{
                    hour:"2-digit",
                    minute:"2-digit",
                    hour12:true
                });

                const updates = {};

                meals.forEach(meal=>{

                    const action =
                    tableStatus[meal.number] || {};

                    const status =
                    action.status || "pending";

                    if(
                        meal.branch === "delivery" &&
                        status === "pending"
                    ){

                        updates["pnc_data/actions/" + meal.number] = {
                            status:"done",
                            time:time,
                            by:staffName
                        };

                    }

                });

                if(Object.keys(updates).length === 0){

                    customAlert(
                        "ℹ️",
                        "لا يوجد",
                        "لا توجد شحنات قيد الانتظار"
                    );

                    return;

                }

                db.ref().update(updates).then(()=>{

                    customAlert(
                        "✅",
                        "تم التسليم",
                        "تم تسليم جميع شحنات التوصيل قيد الانتظار"
                    );

                });

            });

        }
    );

}

/* مودال تأكيد بدل confirm */

function confirmModal(title,message,onConfirm){

    document.getElementById("alertIcon").innerHTML =
    "⚠️";

    document.getElementById("alertTitle").innerHTML =
    title;

    document.getElementById("alertMessage").innerHTML =
    message;

    document.getElementById("modalDynamicFields").style.display =
    "none";

    document.getElementById("modalActionButtons").style.display =
    "flex";

    document.getElementById("modalConfirmBtn").innerHTML =
    "✅ تأكيد";

    document.getElementById("modalCancelBtn").innerHTML =
    "❌ إلغاء";

    document.getElementById("modalConfirmBtn").onclick = function(){

        closeCustomAlert();

        if(typeof onConfirm === "function"){

            onConfirm();

        }

    };

    document.getElementById("modalCancelBtn").onclick = function(){

        closeCustomAlert();

    };

    document.getElementById("customAlertModal").style.display =
    "flex";

}

/* قراءة PDF */

async function processPDFFile(){

    const fileInput =
    document.getElementById("pdfFileInput");

    const status =
    document.getElementById("pdfStatus");

    if(!fileInput.files.length){

        customAlert(
            "⚠️",
            "ملف غير موجود",
            "اختر ملف PDF أولاً"
        );

        return;

    }

    confirmModal(
        "تحديث القائمة",
        "هل تريد أرشفة اليوم الحالي ورفع قائمة PDF الجديدة؟",
        async function(){

            try{

                status.innerHTML =
                "⏳ جاري قراءة PDF...";

                pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

                const file =
                fileInput.files[0];

                const buffer =
                await file.arrayBuffer();

                const pdf =
                await pdfjsLib.getDocument({
                    data:buffer
                }).promise;

                const newMeals = [];

                const seen = {};

                const failedPages = [];

                for(let pageNum = 1; pageNum <= pdf.numPages; pageNum++){

                    status.innerHTML =
                    "⏳ قراءة الصفحة " +
                    pageNum +
                    " من " +
                    pdf.numPages;

                    const page =
                    await pdf.getPage(pageNum);

                    const textContent =
                    await page.getTextContent();

                    const meal =
                    extractMealFromPdfItems(textContent.items);

                    if(meal){

                        if(!seen[meal.number]){

                            seen[meal.number] = true;

                            newMeals.push(meal);

                        }

                    }else{

                        if(pageNum !== 1){

                            failedPages.push(pageNum);

                        }

                    }

                }

                if(newMeals.length === 0){

                    status.innerHTML =
                    "❌ لم يتم استخراج أي مشترك";

                    customAlert(
                        "❌",
                        "فشل القراءة",
                        "لم يتم استخراج أي مشترك من الملف"
                    );

                    return;

                }

                const now =
                new Date();

                const archiveKey =
                "Arch_" + now.getTime();

                let totalDone = 0;

                Object.keys(tableStatus).forEach(k=>{

                    if(tableStatus[k].status === "done"){

                        totalDone++;

                    }

                });

                await db.ref("pnc_data/archives/" + archiveKey).set({
                    date:now.toLocaleDateString("ar-SA"),
                    totalDone:totalDone,
                    actions:tableStatus,
                    meals:meals
                });

                await db.ref("pnc_data/actions").remove();

                await db.ref("pnc_data/mealsList").set(newMeals);

                fileInput.value = "";

                let msg =
                "تم استخراج ورفع " +
                newMeals.length +
                " مشترك بنجاح";

                if(failedPages.length > 0){

                    msg +=
                    "<br><br>⚠️ صفحات لم تُقرأ: " +
                    failedPages.join(", ");

                }

                status.innerHTML =
                "✅ " + msg;

                customAlert(
                    "✅",
                    "تم التحديث",
                    msg
                );

            }catch(error){

                status.innerHTML =
                "❌ خطأ قراءة PDF";

                customAlert(
                    "❌",
                    "خطأ",
                    error.message
                );

            }

        }
    );

}

/* استخراج المشترك من PDF */

function extractMealFromPdfItems(items){

    if(!items || !items.length){

        return null;

    }

    const rawParts =
    items
    .map(item => String(item.str || "").trim())
    .filter(Boolean);

    const fullText =
    rawParts.join(" ").replace(/\s+/g," ").trim();

    let number = null;

    let name = "";

    for(let i = 0; i < rawParts.length; i++){

        const part =
        rawParts[i];

        const match =
        part.match(/\[(\d{4,8})\]/);

        if(match){

            number =
            parseInt(match[1],10);

            const sameLineName =
            part.replace(/\[(\d{4,8})\]/,"").trim();

            if(
                sameLineName &&
                !isPdfStopText(sameLineName)
            ){

                name =
                sameLineName;

            }else{

                const collected = [];

                for(let j = i + 1; j < rawParts.length; j++){

                    const next =
                    rawParts[j].trim();

                    if(!next) continue;

                    if(isPdfStopText(next)) break;

                    if(next.match(/\[(\d{4,8})\]/)) break;

                    collected.push(next);

                    if(collected.join(" ").length > 90) break;

                    if(collected.length >= 6) break;

                }

                name =
                collected.join(" ");

            }

            break;

        }

    }

    if(!number){

        const fallback =
        fullText.match(/\[(\d{4,8})\]\s+(.+?)(?=\s+(Plan|Items|Captain|Delivery|Pickup|Total|Calories|Protein|Carbs|Fat)\b|$)/i);

        if(fallback){

            number =
            parseInt(fallback[1],10);

            name =
            fallback[2] || "";

        }

    }

    name =
    cleanName(name);

    if(!number || name.length < 2){

        return null;

    }

    return {
        number:number,
        name:name,
        branch:detectBranch(fullText)
    };

}

/* كلمات توقف PDF */

function isPdfStopText(text){

    const t =
    String(text || "").toLowerCase();

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

/* تنظيف الاسم */

function cleanName(name){

    return String(name || "")
    .replace(/\bPlan\b.*$/i,"")
    .replace(/\bItems\b.*$/i,"")
    .replace(/\bCaptain\b.*$/i,"")
    .replace(/\bDelivery\b.*$/i,"")
    .replace(/\bPickup\b.*$/i,"")
    .replace(/\bTotal\b.*$/i,"")
    .replace(/\bCalories\b.*$/i,"")
    .replace(/\bProtein\b.*$/i,"")
    .replace(/\bCarbs\b.*$/i,"")
    .replace(/\bFat\b.*$/i,"")
    .replace(/\s+/g," ")
    .trim();

}

/* تحديد الفرع */

function detectBranch(text){

    const lower =
    String(text || "").toLowerCase();

    if(
        lower.includes("pickup branch") &&
        (
            lower.includes("albatarji") ||
            lower.includes("batarji") ||
            lower.includes("al batarji") ||
            lower.includes("بترجي") ||
            lower.includes("البترجي")
        )
    ){

        return "batarji";

    }

    if(
        lower.includes("pickup branch") &&
        (
            lower.includes("ruhaily") ||
            lower.includes("alruhaily") ||
            lower.includes("al ruhaily") ||
            lower.includes("رحيلي") ||
            lower.includes("الرحيلي")
        )
    ){

        return "ruhaily";

    }

    return "delivery";

}

/* إحصائيات الجانبية */

function calculateAllBranchesLiveReport(){

    const stats = {
        delivery:{done:0,pending:0},
        batarji:{done:0,pending:0},
        ruhaily:{done:0,pending:0}
    };

    meals.forEach(meal=>{

        const act =
        tableStatus[meal.number] || {};

        const status =
        act.status || "pending";

        if(status === "done"){

            stats[meal.branch].done++;

        }else if(status !== "cancel"){

            stats[meal.branch].pending++;

        }

    });

    document.getElementById("drawerDelSum").innerHTML =
    stats.delivery.done +
    " مستلم / " +
    stats.delivery.pending +
    " باقي";

    document.getElementById("drawerBatSum").innerHTML =
    stats.batarji.done +
    " مستلم / " +
    stats.batarji.pending +
    " باقي";

    document.getElementById("drawerRuhSum").innerHTML =
    stats.ruhaily.done +
    " مستلم / " +
    stats.ruhaily.pending +
    " باقي";

}

/* الأرشيف */

function renderArchives(){

    const container =
    document.getElementById("archiveContainer");

    container.innerHTML = "";

    const keys =
    Object.keys(archivesData || {});

    if(keys.length === 0){

        container.innerHTML =
        `<div class="status-line">
            لا يوجد أرشيف
        </div>`;

        return;

    }

    keys.sort().reverse().forEach(key=>{

        const arc =
        archivesData[key];

        const div =
        document.createElement("div");

        div.className =
        "archive-item";

        div.innerHTML =
        `<div>
            <b>📅 ${arc.date || "-"}</b>
            <br>
            <span>المستلمين: ${arc.totalDone || 0}</span>
        </div>`;

        container.appendChild(div);

    });

}

/* السجل */

function openReports(){

    document.getElementById("reportsOverlay")
    .classList.add("open");

    switchTab(activeTab);

}

function closeReports(){

    document.getElementById("reportsOverlay")
    .classList.remove("open");

}

function switchTab(tab){

    activeTab = tab;

    document.querySelectorAll(".reports-tab")
    .forEach(btn=>{

        btn.classList.remove("active-tab");

    });

    document.getElementById("tab-" + tab)
    .classList.add("active-tab");

    updateReports();

}

function updateReports(){

    const content =
    document.getElementById("reportsContent");

    content.innerHTML = "";

    const names = {
        delivery:"التوصيل",
        batarji:"البترجي",
        ruhaily:"الرحيلي"
    };

    document.getElementById("reportsOverlayTitle").innerHTML =
    "📋 سجل فرز " + names[currentBranchView];

    meals
    .filter(m => m.branch === currentBranchView)
    .forEach(meal=>{

        const act =
        tableStatus[meal.number] || {};

        const status =
        act.status || "pending";

        if(status !== activeTab) return;

        const div =
        document.createElement("div");

        div.className =
        "meal-row-card";

        div.innerHTML =
        `<div class="meal-card-main-info">

            <span class="meal-card-num">
                #${meal.number}
            </span>

            <span>
                ${act.time || "⏳"}
            </span>

        </div>

        <div class="meal-card-name">
            ${meal.name}
        </div>

        <div style="font-size:11px;color:#94a3b8;">
            المسؤول: ${act.by || "-"}
        </div>`;

        content.appendChild(div);

    });

    if(!content.innerHTML){

        content.innerHTML =
        `<div class="status-line">
            لا توجد بيانات
        </div>`;

    }

}

/* تقرير PDF */

function generatePDFReport(){

    const now =
    new Date();

    document.getElementById("pdfReportDate").innerHTML =
    now.toLocaleDateString("ar-SA");

    document.getElementById("pdfReportTime").innerHTML =
    now.toLocaleTimeString("ar-SA",{
        hour:"2-digit",
        minute:"2-digit"
    });

    document.getElementById("pdfReportCooling").innerHTML =
    currentCoolingTemp || "غير محدد";

    const bodies = {
        delivery:document.getElementById("pdfDeliveryTableBody"),
        batarji:document.getElementById("pdfBatarjiTableBody"),
        ruhaily:document.getElementById("pdfRuhailyTableBody")
    };

    bodies.delivery.innerHTML = "";
    bodies.batarji.innerHTML = "";
    bodies.ruhaily.innerHTML = "";

    let sums = {
        delivery:0,
        batarji:0,
        ruhaily:0
    };

    meals.forEach(meal=>{

        const act =
        tableStatus[meal.number] || {};

        let statusText =
        "⏳ انتظار";

        if(act.status === "done"){

            statusText =
            "✅ مستلم";

            sums[meal.branch]++;

        }

        if(act.status === "cancel"){

            statusText =
            "❌ ملغى";

        }

        const row =
        `<tr>
            <td>#${meal.number}</td>
            <td><b>${meal.name}</b></td>
            <td>${statusText}</td>
            <td>${act.by || "-"}</td>
        </tr>`;

        bodies[meal.branch].innerHTML += row;

    });

    document.getElementById("pdfSumDeliveryDone").innerHTML =
    sums.delivery;

    document.getElementById("pdfSumBatarjiDone").innerHTML =
    sums.batarji;

    document.getElementById("pdfSumRuhailyDone").innerHTML =
    sums.ruhaily;

    const element =
    document.getElementById("pdfReportTemplate");

    element.style.display =
    "block";

    html2pdf()
    .set({
        margin:[6,6,6,6],
        filename:"تقرير-بروتين-وكارب.pdf",
        image:{
            type:"jpeg",
            quality:.98
        },
        html2canvas:{
            scale:2,
            useCORS:true,
            scrollX:0,
            scrollY:0
        },
        jsPDF:{
            unit:"mm",
            format:"a4",
            orientation:"portrait"
        },
        pagebreak:{
            mode:["avoid-all","css","legacy"]
        }
    })
    .from(element)
    .save()
    .then(()=>{

        element.style.display =
        "none";

    });

                        }
