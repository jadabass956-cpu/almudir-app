// ==================== البيانات ====================
let materials = [];
let sales = [];
let expenses = [];
let debts = [];
let settings = {
    displayCurrency: 'SYP',
    password: 'admin',
    pin: '',
    businessName: '',
    businessDescription: '',
    ownerSignature: ''
};

let materialId = 1;
let editingMaterialId = null;
let editingSaleIndex = null;
let editingExpenseIndex = null;
let editingDebtIndex = null;

// ==================== دوال التخزين ====================
async function saveAllData() {
    if (!currentUser) return;
    const uid = currentUser.uid;
    await db.collection('users').doc(uid).collection('data').doc('main').set({
        materials,
        sales,
        expenses,
        debts,
        settings
    }, { merge: true });
}

async function loadAllDataFromFirestore() {
    if (!currentUser) {
        console.warn('loadAllDataFromFirestore: لا يوجد currentUser');
        return;
    }
    const uid = currentUser.uid;
    try {
        const doc = await db.collection('users').doc(uid).collection('data').doc('main').get();
        if (doc.exists) {
            const data = doc.data();
            materials = data.materials || [];
            sales = data.sales || [];
            expenses = data.expenses || [];
            debts = data.debts || [];
            settings = data.settings || settings;
            materialId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
            // حفظ نسخة محلية من البيانات
            await saveLocalData(uid, { materials, sales, expenses, debts, settings });
            if (typeof updateAllTables === 'function') updateAllTables();
        } else {
            // لا توجد بيانات في Firestore، نجرب IndexedDB
            const localData = await loadLocalData(uid);
            if (localData) {
                materials = localData.materials || [];
                sales = localData.sales || [];
                expenses = localData.expenses || [];
                debts = localData.debts || [];
                settings = localData.settings || settings;
                materialId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
                if (typeof updateAllTables === 'function') updateAllTables();
            } else {
                materials = [];
                sales = [];
                expenses = [];
                debts = [];
                await saveAllData();
            }
        }
    } catch (error) {
        console.warn('تعذر الوصول إلى Firestore، جاري القراءة من IndexedDB...', error);
        const localData = await loadLocalData(uid);
        if (localData) {
            materials = localData.materials || [];
            sales = localData.sales || [];
            expenses = localData.expenses || [];
            debts = localData.debts || [];
            settings = localData.settings || settings;
            materialId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
            if (typeof updateAllTables === 'function') updateAllTables();
        }
    }
}

// ==================== دوال العملات ====================
function saveSettings() {
    settings.displayCurrency = document.getElementById('displayCurrency').value;
    saveAllData();
    updateAllTables();
}

function loadSettings() {
    document.getElementById('displayCurrency').value = settings.displayCurrency || 'SYP';
    loadBusinessInfo();
}

function loadBusinessInfo() {
    document.getElementById('businessName').value = settings.businessName || '';
    document.getElementById('businessDescription').value = settings.businessDescription || '';
    document.getElementById('ownerSignature').value = settings.ownerSignature || '';
}

function saveBusinessInfo() {
    settings.businessName = document.getElementById('businessName').value.trim();
    settings.businessDescription = document.getElementById('businessDescription').value.trim();
    settings.ownerSignature = document.getElementById('ownerSignature').value.trim();
    saveAllData();
}

function convertToBase(amount, fromCurrency) {
    return amount;
}

function convertFromBase(amount, toCurrency) {
    return amount;
}

function formatCurrency(amount, currency) {
    currency = currency || settings.displayCurrency;
    if (currency === 'USD') return `$${Number(amount).toFixed(2)}`;
    else return `${Number(amount).toFixed(0)} ل.س`;
}

// ==================== مزامنة فورية ====================
let unsubscribeUserData = null;

function listenToUserData() {
    if (!currentUser || !currentUser.uid) return;
    const uid = currentUser.uid;
    const docRef = db.collection('users').doc(uid).collection('data').doc('main');

    unsubscribeUserData = docRef.onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            materials = data.materials || [];
            sales = data.sales || [];
            expenses = data.expenses || [];
            debts = data.debts || [];
            settings = data.settings || settings;
            materialId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
            updateAllTables();
        }
    }, (error) => {
        console.error('خطأ في المزامنة الفورية:', error);
    });
}

function stopListeningToUserData() {
    if (unsubscribeUserData) {
        unsubscribeUserData();
        unsubscribeUserData = null;
    }
}

// ==================== المزامنة عند عودة الاتصال ====================
window.addEventListener('online', async () => {
    console.log('تم استعادة الاتصال، جاري المزامنة...');
    if (currentUser && currentUser.uid) {
        await syncLocalData();
    }
});
