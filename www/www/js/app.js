// ==================== دوال عامة ====================
function openPage(page) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(page).style.display = 'block';
    document.querySelectorAll('.main-nav button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.dropdown-menu button').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.main-nav button[data-page="${page}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    const activeDropBtn = document.querySelector(`.dropdown-menu button[data-page="${page}"]`);
    if (activeDropBtn) activeDropBtn.classList.add('active');
    document.getElementById('dropdownMenu').classList.remove('show');
    if (page === 'sales') {
        updateMaterialSelect();
        updateRetailTable();
        const saleDate = document.getElementById('saleDate');
        if (saleDate && !saleDate.value) {
            saleDate.value = new Date().toISOString().slice(0, 10);
        }
        const invoiceNo = document.getElementById('invoiceNo');
        if (invoiceNo && !invoiceNo.value) {
            invoiceNo.value = generateInvoiceNumber();
        }
    }
    if (page === 'materials') updateMaterialsTable();
    if (page === 'expenses') updateExpensesTable();
    if (page === 'debts') updateDebtsTable();
    if (page === 'statistics') updateStatistics();
    if (page === 'settings') loadSettings();
    if (page === 'support') openSupportPage();
    if (page === 'admin') { loadAdminUsers(); loadSupportConversations(); }
}

function goHome() {
    openPage('materials');
}

function toggleMenu() {
    document.getElementById('dropdownMenu').classList.toggle('show');
}

function updateAllTables() {
    updateMaterialsTable();
    updateSalesTable();
    updateExpensesTable();
    updateDebtsTable();
    updateStatistics();
}

// ==================== المواد ====================
async function addMaterial() {
    const name = document.getElementById('matName').value;
    const type = document.getElementById('matType').value;
    const unit = document.getElementById('matUnit').value;
    const stock = parseFloat(document.getElementById('matStock').value) || 0;
    const minStock = parseFloat(document.getElementById('matMinStock').value) || 0;
    const costSYP = parseFloat(document.getElementById('matCostSYP').value) || 0;
    const costUSD = parseFloat(document.getElementById('matCostUSD').value) || 0;
    const saleSYP = parseFloat(document.getElementById('matSaleSYP').value) || 0;
    const saleUSD = parseFloat(document.getElementById('matSaleUSD').value) || 0;

    if (!name) { alert('الرجاء إدخال اسم المادة'); return; }

    if (editingMaterialId) {
        requirePassword(async () => {
            const mat = materials.find(m => m.id === editingMaterialId);
            if (mat) {
                mat.name = name; mat.type = type; mat.unit = unit;
                mat.stock = stock; mat.minStock = minStock;
                mat.costSYP = costSYP; mat.costUSD = costUSD;
                mat.saleSYP = saleSYP; mat.saleUSD = saleUSD;
            }
            editingMaterialId = null;
            document.getElementById('matName').value = '';
            document.getElementById('matType').value = '';
            document.getElementById('matStock').value = '';
            document.getElementById('matMinStock').value = '';
            document.getElementById('matCostSYP').value = '';
            document.getElementById('matCostUSD').value = '';
            document.getElementById('matSaleSYP').value = '';
            document.getElementById('matSaleUSD').value = '';
            updateMaterialsTable();
            await saveAllData();
            alert('تم تحديث المادة بنجاح');
        });
    } else {
        materials.push({
            id: materialId++,
            name, type, unit,
            stock, minStock,
            costSYP, costUSD,
            saleSYP, saleUSD
        });
        document.getElementById('matName').value = '';
        document.getElementById('matType').value = '';
        document.getElementById('matStock').value = '';
        document.getElementById('matMinStock').value = '';
        document.getElementById('matCostSYP').value = '';
        document.getElementById('matCostUSD').value = '';
        document.getElementById('matSaleSYP').value = '';
        document.getElementById('matSaleUSD').value = '';
        updateMaterialsTable();
        await saveAllData();
        alert('تم حفظ المادة محلياً' + (navigator.onLine ? '' : ' (سيعمل Offline)'));

    }
}

function editMaterial(id) {
    const mat = materials.find(m => m.id === id);
    if (mat) {
        document.getElementById('matName').value = mat.name;
        document.getElementById('matType').value = mat.type;
        document.getElementById('matUnit').value = mat.unit;
        document.getElementById('matStock').value = mat.stock;
        document.getElementById('matMinStock').value = mat.minStock;
        document.getElementById('matCostSYP').value = mat.costSYP || 0;
        document.getElementById('matCostUSD').value = mat.costUSD || 0;
        document.getElementById('matSaleSYP').value = mat.saleSYP || 0;
        document.getElementById('matSaleUSD').value = mat.saleUSD || 0;
        editingMaterialId = id;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function deleteMaterial(id) {
    requirePassword(async () => {
        if (confirm('هل تريد حذف هذه المادة؟')) {
            const index = materials.findIndex(m => m.id == id);
            if (index !== -1) {
                materials.splice(index, 1);
                updateMaterialsTable();
                await saveAllData();
                alert('تم حذف المادة بنجاح');
            } else {
                alert('المادة غير موجودة');
            }
        }
    });
}

function searchMaterials() {
    const query = document.getElementById('searchMaterial').value.toLowerCase();
    const filtered = materials.filter(m => m.name.toLowerCase().includes(query));
    renderMaterialsTable(filtered);
}

function updateMaterialsTable() { renderMaterialsTable(materials); }

function renderMaterialsTable(list) {
    const table = document.getElementById('materialsTable');
    let html = '<tr><th>المعرف</th><th>الاسم</th><th>النوع</th><th>الوحدة</th><th>الكمية</th><th>التكلفة</th><th>البيع</th><th>الربح</th><th>تعديل</th><th>حذف</th></tr>';
    list.forEach((m, index) => {
        const lowStock = m.stock < m.minStock ? 'class="low-stock"' : '';
        let cost, sale;
        if (settings.displayCurrency === 'USD') {
            cost = m.costUSD || 0;
            sale = m.saleUSD || 0;
        } else {
            cost = m.costSYP || 0;
            sale = m.saleSYP || 0;
        }
        const profit = sale - cost;
        html += `<tr>
            <td>${m.id}</td>
            <td>${m.name}</td>
            <td>${m.type || '-'}</td>
            <td>${m.unit}</td>
            <td ${lowStock}>${m.stock}${m.stock < m.minStock ? ' ⚠️' : ''}</td>
            <td>${formatCurrency(cost, settings.displayCurrency)}</td>
            <td>${formatCurrency(sale, settings.displayCurrency)}</td>
            <td class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(profit, settings.displayCurrency)}</td>
            <td><button class="btn-edit" onclick="editMaterial(${m.id})">تعديل</button></td>
            <td><button class="btn-delete" onclick="deleteMaterial(${m.id})">حذف</button></td>
        </tr>`;
    });
    table.innerHTML = html;
    checkLowStock();
}

function checkLowStock() {
    const lowItems = materials.filter(m => m.stock < m.minStock);
    const alertBar = document.getElementById('lowStockAlert');
    if (lowItems.length > 0) {
        alertBar.style.display = 'block';
        alertBar.innerHTML = '⚠️ تنبيه: المواد التالية أقل من الحد الأدنى: ' + lowItems.map(m => `${m.name} (${m.stock} ${m.unit})`).join('، ');
    } else {
        alertBar.style.display = 'none';
    }
}

// ==================== المبيعات ====================
function generateInvoiceNumber() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const count = sales.length + 1;
    return `INV-${yyyy}${mm}${dd}-${String(count).padStart(3, '0')}`;
}

function updateMaterialSelect() {
    const select = document.getElementById('saleMaterial');
    let html = '<option value="">اختر المادة</option>';
    materials.forEach(m => {
        const typeText = m.type ? ' - ' + m.type : '';
        html += `<option value="${m.id}" data-sale-syp="${m.saleSYP || 0}" data-sale-usd="${m.saleUSD || 0}" data-stock="${m.stock}" data-name="${m.name}" data-type="${m.type || ''}">${m.name}${typeText}</option>`;
    });
    select.innerHTML = html;
}

function calcTotal() {
    const qty = parseFloat(document.getElementById('saleQty').value) || 0;
    const select = document.getElementById('saleMaterial');
    const selected = select.options[select.selectedIndex];
    const currency = document.getElementById('saleCurrency').value;
    const salePrice = selected ? (currency === 'USD' ? parseFloat(selected.dataset.saleUsd) : parseFloat(selected.dataset.saleSyp)) || 0 : 0;
    document.getElementById('saleUnitPrice').value = salePrice;
    document.getElementById('saleTotal').value = qty * salePrice;
    calcRemaining();
}

function calcRemaining() {
    // لا يوجد حقل saleRemaining بعد الآن، لا نفعل شيئاً
    return;
}

async function addSale() {
    const invoice = document.getElementById('invoiceNo').value;
    const date = document.getElementById('saleDate').value;
    const customer = document.getElementById('customerName').value;
    const currency = document.getElementById('saleCurrency').value;

    if (!invoice || !date || invoiceItems.length === 0) {
        alert('الرجاء تعبئة رقم الفاتورة والتاريخ وإضافة مادة واحدة على الأقل');
        return;
    }

    pendingInvoiceData = { invoice, date, customer, currency };
    console.log('pendingInvoiceData:', pendingInvoiceData);
    showPaymentModal();
}

function editSale(index) {
    const s = sales[index];
    if (s) {
        document.getElementById('invoiceNo').value = s.invoice;
        document.getElementById('saleDate').value = s.date;
        document.getElementById('customerName').value = s.customer;
        document.getElementById('saleCurrency').value = s.currency || 'SYP';
        document.getElementById('salePaid').value = s.paid || 0;
        document.getElementById('saleTotal').value = s.total || 0;
        // saleRemaining محذوف

        invoiceItems = (s.items || []).map(item => ({...item}));
        renderInvoiceItems();

        editingSaleIndex = index;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function deleteSale(index) {
    requirePassword(async () => {
        if (confirm('هل تريد حذف هذه الفاتورة؟')) {
            const sale = sales[index];
            // إعادة الكمية إلى المخزون
            const material = materials.find(m => m.id === sale.materialId);
            if (material) {
                material.stock += sale.qty;
                updateMaterialsTable();
            }
            // حذف الدين المرتبط (إن وجد)
            if (sale.remaining > 0) {
                const debtIndex = debts.findIndex(d => 
                    d.name === sale.customer && 
                    d.date === sale.date && 
                    Math.abs(d.amount - sale.remaining) < 0.001
                );
                if (debtIndex !== -1) {
                    debts.splice(debtIndex, 1);
                }
            }
            // حذف الفاتورة
            sales.splice(index, 1);
            // تحديث الجداول والإحصائيات
            updateSalesTable();
            updateDebtsTable();
            updateStatistics();
            // حفظ البيانات
            await saveAllData();
            alert('تم حذف الفاتورة بنجاح');
        }
    });
}

function updateSalesTable() {
    const table = document.getElementById('salesTable');
    const searchInput = document.getElementById('searchSales');
    const regularSales = sales.filter(s => !s.isRetail);
    let salesToShow = [];

    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.trim().toLowerCase();
        salesToShow = regularSales.filter(s => 
            (s.invoice && s.invoice.toLowerCase().includes(query)) ||
            (s.customer && s.customer.toLowerCase().includes(query))
        );
    } else {
        salesToShow = regularSales.slice(-5);
    }

    const symbol = (s) => s.currency === 'USD' ? '$' : 'ل.س';

    if (window.innerWidth <= 768) {
        let cardsHtml = '';
        salesToShow.forEach((s) => {
            const cur = symbol(s);
            const itemsSummary = s.items ? s.items.map(i => `${i.materialName} (${i.qty} ${i.unit || ''})`).join('، ') : s.materialName;
            const originalIndex = sales.indexOf(s);
            cardsHtml += `
            <div class="sale-card">
                <div><span>الفاتورة:</span> ${s.invoice}</div>
                <div><span>التاريخ:</span> ${s.date}</div>
                <div><span>العميل:</span> ${s.customer}</div>
                <div><span>المواد:</span> ${itemsSummary}</div>
                <div><span>العملة:</span> ${s.currency || 'SYP'}</div>
                <div><span>الإجمالي:</span> ${s.total} ${cur}</div>
                <div><span>المدفوع:</span> ${s.paid} ${cur}</div>
                <div><span>الباقي:</span> ${s.remaining} ${cur}</div>
                <div class="sale-card-actions">
                    <button class="btn-edit" onclick="printSavedInvoice(${originalIndex})">طباعة</button>
                    <button class="btn-edit" style="background:#8e44ad;" onclick="exportSavedInvoiceAsPNG(${originalIndex})">PNG</button>
                    <button class="btn-edit" onclick="editSale(${originalIndex})">تعديل</button>
                    <button class="btn-delete" onclick="deleteSale(${originalIndex})">حذف</button>
                </div>
            </div>`;
        });
        table.innerHTML = cardsHtml;
        table.classList.add('cards-mode');
    } else {
        let rows = '';
        salesToShow.forEach((s) => {
            const cur = symbol(s);
            const itemsSummary = s.items ? s.items.map(i => `${i.materialName} (${i.qty} ${i.unit || ''})`).join('، ') : s.materialName;
            const originalIndex = sales.indexOf(s);
            rows += `<tr>
                <td>${s.invoice}</td>
                <td>${s.date}</td>
                <td>${s.customer}</td>
                <td>${itemsSummary}</td>
                <td>${s.currency || 'SYP'}</td>
                <td>${s.total} ${cur}</td>
                <td>${s.paid} ${cur}</td>
                <td>${s.remaining} ${cur}</td>
                <td><button class="btn-edit" onclick="printSavedInvoice(${originalIndex})">طباعة</button></td>
                <td><button class="btn-edit" style="background:#8e44ad;" onclick="exportSavedInvoiceAsPNG(${originalIndex})">PNG</button></td>
                <td><button class="btn-edit" onclick="editSale(${originalIndex})">تعديل</button></td>
                <td><button class="btn-delete" onclick="deleteSale(${originalIndex})">حذف</button></td>
            </tr>`;
        });

        table.innerHTML = '<tr><th>الفاتورة</th><th>التاريخ</th><th>العميل</th><th>المواد</th><th>العملة</th><th>الإجمالي</th><th>المدفوع</th><th>الباقي</th><th>طباعة</th><th>PNG</th><th>تعديل</th><th>حذف</th></tr>' + rows;
        table.classList.remove('cards-mode');
    }
}

// ==================== الطباعة والتصدير للفواتير ====================
function printInvoice() {
    let data = getInvoiceDataFromForm();
    if (data.items.length === 0 && sales.length > 0) {
        const last = sales[sales.length - 1];
        data = {
            invoice: last.invoice,
            date: last.date,
            customer: last.customer,
            currency: last.currency,
            paid: last.paid,
            total: last.total,
            remaining: last.remaining,
            items: last.items || []
        };
    }
    if (!data.invoice || !data.date || data.items.length === 0) {
        alert('لا توجد فاتورة للطباعة');
        return;
    }
    printInvoiceData(data);
}

function exportInvoiceAsPNG() {
    let data = getInvoiceDataFromForm();
    if (data.items.length === 0 && sales.length > 0) {
        const last = sales[sales.length - 1];
        data = {
            invoice: last.invoice,
            date: last.date,
            customer: last.customer,
            currency: last.currency,
            paid: last.paid,
            total: last.total,
            remaining: last.remaining,
            items: last.items || []
        };
    }
    if (!data.invoice || !data.date || data.items.length === 0) {
        alert('لا توجد فاتورة للتصدير');
        return;
    }
    exportInvoiceData(data);
}

function printSavedInvoice(index) {
    const s = sales[index];
    if (!s) return;
    printInvoiceData({
        invoice: s.invoice,
        date: s.date,
        customer: s.customer,
        currency: s.currency,
        paid: s.paid,
        total: s.total,
        remaining: s.remaining,
        items: s.items || []
    });
}

function exportSavedInvoiceAsPNG(index) {
    const s = sales[index];
    if (!s) return;
    exportInvoiceData({
        invoice: s.invoice,
        date: s.date,
        customer: s.customer,
        currency: s.currency,
        paid: s.paid,
        total: s.total,
        remaining: s.remaining,
        items: s.items || []
    });
}
// ==================== المصروفات ====================
async function addExpense() {
    const date = document.getElementById('expDate').value;
    const amountValue = parseFloat(document.getElementById('expAmount').value) || 0;
    const amountCurrency = document.getElementById('expAmountCurrency').value;
    const desc = document.getElementById('expDesc').value;
    const category = document.getElementById('expCategory').value;

    if (!date || amountValue <= 0 || !desc) { alert('الرجاء تعبئة جميع الحقول'); return; }

    const amountBase = convertToBase(amountValue, amountCurrency);

    if (editingExpenseIndex !== null) {
        requirePassword(async () => {
            expenses[editingExpenseIndex] = { date, amount: amountBase, desc, category };
            editingExpenseIndex = null;
            document.getElementById('expAmount').value = '';
            document.getElementById('expDesc').value = '';
            updateExpensesTable();
            await saveAllData();
            alert('تم تحديث المصروف بنجاح');
        });
    } else {
        expenses.push({ date, amount: amountBase, desc, category });
        document.getElementById('expAmount').value = '';
        document.getElementById('expDesc').value = '';
        updateExpensesTable();
        await saveAllData();
        alert('تم حفظ المصروف بنجاح');
    }
}

function editExpense(index) {
    const e = expenses[index];
    if (e) {
        document.getElementById('expDate').value = e.date;
        document.getElementById('expAmount').value = e.amount;
        document.getElementById('expDesc').value = e.desc;
        document.getElementById('expCategory').value = e.category;
        editingExpenseIndex = index;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function deleteExpense(index) {
    requirePassword(async () => {
        if (confirm('هل تريد حذف هذا المصروف؟')) {
            expenses.splice(index, 1);
            updateExpensesTable();
            await saveAllData();
        }
    });
}

function updateExpensesTable() {
    const table = document.getElementById('expensesTable');
    if (window.innerWidth <= 768) {
        let html = '';
        expenses.forEach((e, index) => {
            html += `
            <div class="expense-card">
                <div><span>التاريخ:</span> ${e.date}</div>
                <div><span>المبلغ:</span> ${formatCurrency(e.amount)}</div>
                <div><span>البيان:</span> ${e.desc}</div>
                <div><span>التصنيف:</span> ${e.category}</div>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editExpense(${index})">تعديل</button>
                    <button class="btn-delete" onclick="deleteExpense(${index})">حذف</button>
                </div>
            </div>`;
        });
        table.innerHTML = html;
        table.classList.add('cards-mode');
    } else {
        let html = '<tr><th>التاريخ</th><th>المبلغ</th><th>البيان</th><th>التصنيف</th><th>تعديل</th><th>حذف</th></tr>';
        expenses.forEach((e, index) => {
            html += `<tr>
                <td>${e.date}</td>
                <td>${formatCurrency(e.amount)}</td>
                <td>${e.desc}</td>
                <td>${e.category}</td>
                <td><button class="btn-edit" onclick="editExpense(${index})">تعديل</button></td>
                <td><button class="btn-delete" onclick="deleteExpense(${index})">حذف</button></td>
            </tr>`;
        });
        table.innerHTML = html;
        table.classList.remove('cards-mode');
    }
}

// ==================== الديون ====================
async function addDebt() {
    const name = document.getElementById('debtName').value;
    const date = document.getElementById('debtDate').value;
    const amountValue = parseFloat(document.getElementById('debtAmount').value) || 0;
    const amountCurrency = document.getElementById('debtAmountCurrency').value;

    if (!name || !date || amountValue <= 0) { alert('الرجاء تعبئة جميع الحقول'); return; }

    const amountBase = convertToBase(amountValue, amountCurrency);

    if (editingDebtIndex !== null) {
        requirePassword(async () => {
            debts[editingDebtIndex] = { name, date, amount: amountBase, paid: debts[editingDebtIndex].paid || 0 };
            editingDebtIndex = null;
            document.getElementById('debtName').value = '';
            document.getElementById('debtAmount').value = '';
            updateDebtsTable();
            await saveAllData();
            alert('تم تحديث الدين بنجاح');
        });
    } else {
        debts.push({ name, date, amount: amountBase, paid: 0 });
        document.getElementById('debtName').value = '';
        document.getElementById('debtAmount').value = '';
        updateDebtsTable();
        await saveAllData();
        alert('تم حفظ الدين بنجاح');
    }
}

function editDebt(index) {
    const d = debts[index];
    if (d) {
        document.getElementById('debtName').value = d.name;
        document.getElementById('debtDate').value = d.date;
        document.getElementById('debtAmount').value = d.amount;
        editingDebtIndex = index;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function deleteDebt(index) {
    requirePassword(async () => {
        if (confirm('هل تريد حذف هذا الدين؟')) {
            debts.splice(index, 1);
            updateDebtsTable();
            await saveAllData();
        }
    });
}

function printDebt(index) {
    const d = debts[index];
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;text-align:center;} .debt-receipt{border:2px solid #333;padding:20px;max-width:400px;margin:auto;} h2{color:#1a237e;}</style>');
    printWindow.document.write(`<div class="debt-receipt">
        <h2>المدير AI</h2>
        <p>سند دين / سداد</p>
        <hr>
        <p><strong>الاسم:</strong> ${d.name}</p>
        <p><strong>التاريخ:</strong> ${d.date}</p>
        <p><strong>القيمة الأصلية:</strong> ${formatCurrency(d.amount)}</p>
        <p><strong>المسدد:</strong> ${formatCurrency(d.paid)}</p>
        <p><strong>المتبقي:</strong> ${formatCurrency(d.amount - d.paid)}</p>
        <hr>
        <p>توقيع: ....................</p>
    </div>`);
    printWindow.document.close();
        setTimeout(() => {
            generateInvoiceQR('${invoice}', '${total}', '${currency}');
        }, 500);
    printWindow.print();
}

function exportDebtAsPNG(index) {
    const d = debts[index];
    const receiptElement = document.createElement('div');
    receiptElement.style.cssText = 'position: fixed; top: 0; left: 0; width: 400px; background: white; padding: 20px; text-align: center; font-family: Arial; z-index: -9999;';
    receiptElement.innerHTML = `
        <div style="border:2px solid #333; padding:20px;">
            <h2 style="color:#1a237e;">المدير AI</h2>
            <p>سند دين / سداد</p>
            <hr>
            <p><strong>الاسم:</strong> ${d.name}</p>
            <p><strong>التاريخ:</strong> ${d.date}</p>
            <p><strong>القيمة الأصلية:</strong> ${formatCurrency(d.amount)}</p>
            <p><strong>المسدد:</strong> ${formatCurrency(d.paid)}</p>
            <p><strong>المتبقي:</strong> ${formatCurrency(d.amount - d.paid)}</p>
            <hr>
            <p>توقيع: ....................</p>
        </div>
    `;
    document.body.appendChild(receiptElement);
    html2canvas(receiptElement).then(canvas => {
        const link = document.createElement('a');
        link.download = `debt_${d.name}_${d.date}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        document.body.removeChild(receiptElement);
    });
}

function updateDebtsTable() {
    const table = document.getElementById('debtsTable');
    if (window.innerWidth <= 768) {
        let html = '';
        let total = 0;
        debts.forEach((d, index) => {
            const remaining = d.amount - d.paid;
            if (remaining > 0) total += remaining;
            html += `
            <div class="debt-card">
                <div><span>الاسم:</span> ${d.name}</div>
                <div><span>التاريخ:</span> ${d.date}</div>
                <div><span>القيمة:</span> ${formatCurrency(d.amount)}</div>
                <div><span>المسدد:</span> ${formatCurrency(d.paid)}</div>
                <div><span>المتبقي:</span> ${formatCurrency(remaining)}</div>
                ${remaining > 0 
                    ? `<input type="number" id="partial-${index}" placeholder="مبلغ" style="width:100%; margin-bottom:5px;"> 
                       <button class="btn-settle" onclick="partialSettle(${index})">سداد جزئي</button>
                       <button class="btn-settle" onclick="fullSettle(${index})">تسديد كامل</button>`
                    : '<div>✅ مسدد</div>'}
                <div class="card-actions">
                    <button class="btn-edit" onclick="printDebt(${index})">طباعة</button>
                    <button class="btn-edit" style="background:#8e44ad;" onclick="exportDebtAsPNG(${index})">PNG</button>
                    <button class="btn-edit" onclick="editDebt(${index})">تعديل</button>
                    <button class="btn-delete" onclick="deleteDebt(${index})">حذف</button>
                </div>
            </div>`;
        });
        table.innerHTML = html;
        table.classList.add('cards-mode');
        document.getElementById('totalDebts').textContent = formatCurrency(total);
    } else {
        let html = '<tr><th>الاسم</th><th>التاريخ</th><th>القيمة</th><th>المسدد</th><th>المتبقي</th><th>سداد جزئي</th><th>تسديد كامل</th><th>طباعة</th><th>PNG</th><th>تعديل</th><th>حذف</th></tr>';
        let total = 0;
        debts.forEach((d, index) => {
            const remaining = d.amount - d.paid;
            if (remaining > 0) total += remaining;
            html += `<tr>
                <td>${d.name}</td>
                <td>${d.date}</td>
                <td>${formatCurrency(d.amount)}</td>
                <td>${formatCurrency(d.paid)}</td>
                <td>${formatCurrency(remaining)}</td>
                ${remaining > 0 
                    ? `<td><input type="number" id="partial-${index}" placeholder="مبلغ" style="width:60px;"> <button class="btn-settle" onclick="partialSettle(${index})">سداد</button></td>
                       <td><button class="btn-settle" onclick="fullSettle(${index})">تسديد كامل</button></td>`
                    : '<td>-</td><td>✅ مسدد</td>'}
                <td><button class="btn-edit" onclick="printDebt(${index})">طباعة</button></td>
                <td><button class="btn-edit" style="background:#8e44ad;" onclick="exportDebtAsPNG(${index})">PNG</button></td>
                <td><button class="btn-edit" onclick="editDebt(${index})">تعديل</button></td>
                <td><button class="btn-delete" onclick="deleteDebt(${index})">حذف</button></td>
            </tr>`;
        });
        table.innerHTML = html;
        table.classList.remove('cards-mode');
        document.getElementById('totalDebts').textContent = formatCurrency(total);
    }
}

function partialSettle(index) {
    const amount = parseFloat(document.getElementById(`partial-${index}`).value) || 0;
    const debt = debts[index];
    const remaining = debt.amount - debt.paid;
    if (amount <= 0) { alert('الرجاء إدخال مبلغ صحيح'); return; }
    if (amount > remaining) { alert(`المبلغ أكبر من المتبقي! المتبقي: ${remaining}`); return; }
    requirePassword(async () => {
        debt.paid += amount;
        updateDebtsTable();
        await saveAllData();
        alert('تم السداد بنجاح');
    });
}

function fullSettle(index) {
    requirePassword(async () => {
        if (confirm('هل تم تسديد الدين بالكامل؟')) {
            debts[index].paid = debts[index].amount;
            updateDebtsTable();
            await saveAllData();
        }
    });
}

// ==================== التقارير ====================
function generateReport() {
    const from = document.getElementById('reportFrom').value;
    const to = document.getElementById('reportTo').value;
    let totalSales = 0, totalExpenses = 0;
    const salesByMaterial = {};
    const expensesByCategory = {};

    sales.forEach(s => {
        if ((!from || s.date >= from) && (!to || s.date <= to)) {
            totalSales += s.total;
            // معالجة الفواتير متعددة المواد
            if (s.items && s.items.length > 0) {
                s.items.forEach(item => {
                    if (!salesByMaterial[item.materialName]) {
                        salesByMaterial[item.materialName] = { qty: 0, revenue: 0 };
                    }
                    salesByMaterial[item.materialName].qty += item.qty;
                    salesByMaterial[item.materialName].revenue += item.total;
                });
            } else {
                // فواتير قديمة بدون items
                if (!salesByMaterial[s.materialName]) {
                    salesByMaterial[s.materialName] = { qty: 0, revenue: 0 };
                }
                salesByMaterial[s.materialName].qty += s.qty;
                salesByMaterial[s.materialName].revenue += s.total;
            }
        }
    });

    expenses.forEach(e => {
        if ((!from || e.date >= from) && (!to || e.date <= to)) {
            totalExpenses += e.amount;
            if (!expensesByCategory[e.category]) expensesByCategory[e.category] = 0;
            expensesByCategory[e.category] += e.amount;
        }
    });

    document.getElementById('totalSales').textContent = formatCurrency(totalSales);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('netProfit').textContent = formatCurrency(totalSales - totalExpenses);

    const materialTable = document.getElementById('salesByMaterial');
    let materialHtml = '<tr><th>المادة</th><th>الكمية</th><th>الإيرادات</th></tr>';
    for (const material in salesByMaterial) {
        materialHtml += `<tr><td>${material}</td><td>${salesByMaterial[material].qty}</td><td>${formatCurrency(salesByMaterial[material].revenue)}</td></tr>`;
    }
    materialTable.innerHTML = materialHtml;

    const categoryTable = document.getElementById('expensesByCategory');
    let categoryHtml = '<tr><th>التصنيف</th><th>المبلغ</th></tr>';
    for (const category in expensesByCategory) {
        categoryHtml += `<tr><td>${category}</td><td>${formatCurrency(expensesByCategory[category])}</td></tr>`;
    }
    categoryTable.innerHTML = categoryHtml;
}

// ==================== الإحصائيات العامة ====================
function updateStatistics() {
    let totalSalesBase = 0;
    let totalCollectedBase = 0;
    let totalExpensesBase = 0;
    let totalOutstandingDebtsBase = 0;

    sales.forEach(s => {
        totalSalesBase += s.total;
        totalCollectedBase += s.paid;
    });

    expenses.forEach(e => {
        totalExpensesBase += e.amount;
    });

    debts.forEach(d => {
        const remaining = d.amount - d.paid;
        if (remaining > 0) totalOutstandingDebtsBase += remaining;
        totalCollectedBase += d.paid;
    });

    const cashBase = totalCollectedBase - totalExpensesBase;

    document.getElementById('statCash').textContent = formatCurrency(cashBase);
    document.getElementById('statTotalSales').textContent = formatCurrency(totalSalesBase);
    document.getElementById('statCollected').textContent = formatCurrency(totalCollectedBase);
    document.getElementById('statTotalExpenses').textContent = formatCurrency(totalExpensesBase);
    document.getElementById('statOutstandingDebts').textContent = formatCurrency(totalOutstandingDebtsBase);
    document.getElementById('statInvoiceCount').textContent = sales.length;
    document.getElementById('statLowStock').textContent = materials.filter(m => m.stock < m.minStock).length;
}

// ==================== النسخ الاحتياطي ====================
function exportJSON() {
    document.getElementById('confirmOverlay').style.display = 'flex';
}

function performExport() {
    const data = { materials, sales, expenses, debts, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jasoft_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('confirmOverlay').style.display = 'none';
}

document.getElementById('confirmExportBtn').addEventListener('click', performExport);
document.getElementById('confirmCancelBtn').addEventListener('click', function() {
    document.getElementById('confirmOverlay').style.display = 'none';
});

function importJSON() {
    document.getElementById('importFile').click();
}

document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const data = JSON.parse(event.target.result);
            if (data.materials && data.sales && data.expenses && data.debts && data.settings) {
                materials = data.materials;
                sales = data.sales;
                expenses = data.expenses;
                debts = data.debts;
                settings = data.settings;
                materialId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
                await saveAllData();
                loadSettings();
                updateAllTables();
                alert('تم استيراد البيانات بنجاح');
            } else {
                alert('ملف غير صالح');
            }
        } catch (error) {
            alert('خطأ في قراءة الملف');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// ==================== تغيير كلمة المرور ورمز PIN ====================
async function changePassword() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmNewPassword').value;

    if (settings.password && current !== settings.password) {
        alert('كلمة المرور الحالية غير صحيحة');
        return;
    }
    if (newPass !== confirm) {
        alert('كلمتا المرور غير متطابقتين');
        return;
    }
    if (newPass === '') {
        alert('لا يمكن أن تكون كلمة المرور فارغة');
        return;
    }
    settings.password = newPass;
    await saveAllData();
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    alert('تم تحديث كلمة المرور بنجاح');
}

async function changePin() {
    const current = document.getElementById('currentPin').value;
    const newPin = document.getElementById('newPin').value;

    if (settings.pin && current !== settings.pin) {
        alert('رمز PIN الحالي غير صحيح');
        return;
    }
    if (newPin === '') {
        settings.pin = '';
        await saveAllData();
        document.getElementById('currentPin').value = '';
        document.getElementById('newPin').value = '';
        alert('تم تعطيل رمز PIN');
        return;
    }
    if (!/^\d{4}$/.test(newPin)) {
        alert('يجب أن يكون رمز PIN مكوناً من 4 أرقام');
        return;
    }
    settings.pin = newPin;
    await saveAllData();
    document.getElementById('currentPin').value = '';
    document.getElementById('newPin').value = '';
    alert('تم تحديث رمز PIN بنجاح');
}

// ==================== التهيئة ====================

// ==================== ربط أزرار نافذة الدفع (نسخة واحدة نظيفة) ====================

// ==================== النوافذ المنبثقة (نسخة مبسطة) ====================
let modalCallback = null;

function showModal(title, callback, isPin = false) {
    const overlay = document.getElementById('modalOverlay');
    const titleEl = document.getElementById('modalTitle');
    const inputEl = document.getElementById('modalInput');
    if (!overlay || !titleEl || !inputEl) {
        console.error('عناصر المودال غير موجودة');
        return;
    }
    titleEl.textContent = title;
    inputEl.value = '';
    inputEl.type = 'password';
    inputEl.maxLength = isPin ? 4 : 20;
    overlay.style.display = 'flex';
    inputEl.focus();
    modalCallback = callback;
}

function hideModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.style.display = 'none';
    modalCallback = null;
}

document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('modalConfirm');
    const cancelBtn = document.getElementById('modalCancel');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            const inputEl = document.getElementById('modalInput');
            if (modalCallback && inputEl) {
                modalCallback(inputEl.value);
            }
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            hideModal();
        });
    }
});

function requirePassword(action) {
    if (!settings.password) {
        action();
        return;
    }
    showModal('أدخل كلمة مرور المالك للمتابعة', function(input) {
        if (String(input).trim() === String(settings.password).trim()) {
            hideModal();
            action();
        } else {
            alert('كلمة المرور غير صحيحة');
            hideModal();
        }
    });
}

// دالة تأكيد المودال (تعمل مباشرة بدون addEventListener)
function handleModalConfirm() {
    const inputEl = document.getElementById('modalInput');
    if (modalCallback && inputEl) {
        modalCallback(inputEl.value);
    }
}

// ==================== إدارة المواد في الفاتورة ====================
let invoiceItems = [];

function addItemToInvoice() {
    const materialSelect = document.getElementById('saleMaterial');
    const selectedOption = materialSelect.options[materialSelect.selectedIndex];
    const materialId = materialSelect.value;
    const materialName = selectedOption ? selectedOption.dataset.name : '';
    const qty = parseFloat(document.getElementById('saleQty').value) || 0;
    const currency = document.getElementById('saleCurrency').value;
    const unitPrice = parseFloat(document.getElementById('saleUnitPrice').value) || 0;
    // جلب الوحدة من بيانات المادة
    const material = materials.find(m => m.id === parseInt(materialId));
    const unit = material ? material.unit : '';

    if (!materialId || qty <= 0) {
        alert('الرجاء اختيار مادة وإدخال كمية صحيحة');
        return;
    }

    const existing = invoiceItems.find(item => item.materialId === parseInt(materialId));
    if (existing) {
        existing.qty += qty;
        existing.unit = unit; // تحديث الوحدة إذا تغيرت
        existing.total = existing.qty * existing.unitPrice;
    } else {
        invoiceItems.push({
            materialId: parseInt(materialId),
            materialName,
            materialType: selectedOption ? selectedOption.dataset.type || '' : '',
            qty,
            unit: unit,
            unitPrice,
            currency,
            total: qty * unitPrice
        });
    }

    renderInvoiceItems();
    updateInvoiceTotal();
    const saleQty = document.getElementById('saleQty');
    const saleUnitPrice = document.getElementById('saleUnitPrice');
    const saleTotal = document.getElementById('saleTotal');
    if (saleQty) saleQty.value = '';
    if (saleUnitPrice) saleUnitPrice.value = '';
    if (saleTotal) saleTotal.value = '';
}

function renderInvoiceItems() {
    const table = document.getElementById('invoiceItemsTable');
    if (!table) return;
    let html = '<tr><th>المادة</th><th>الكمية</th><th>السعر الإفرادي</th><th>الإجمالي</th><th>حذف</th></tr>';
    invoiceItems.forEach((item, index) => {
        const symbol = item.currency === 'USD' ? '$' : 'ل.س';
        html += `<tr>
            <td>${item.materialName}${item.materialType ? ' - ' + item.materialType : ''}</td>
            <td>${item.qty} ${item.unit || ''}</td>
            <td>${item.unitPrice} ${symbol}</td>
            <td>${item.total} ${symbol}</td>
            <td><button class="btn-delete" onclick="removeItemFromInvoice(${index})">حذف</button></td>
        </tr>`;
    });
    table.innerHTML = html;
}

function removeItemFromInvoice(index) {
    invoiceItems.splice(index, 1);
    renderInvoiceItems();
    updateInvoiceTotal();
}

function updateInvoiceTotal() {
    const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const totalEl = document.getElementById('saleTotal');
    if (totalEl) totalEl.value = total;
}

// ==================== نافذة الدفع ====================
let pendingInvoiceData = null;

function showPaymentModal() {
    const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    if (invoiceItems.length === 0) {
        alert('الرجاء إضافة مواد أولاً');
        return;
    }
    const totalDisplay = document.getElementById('paymentTotalDisplay');
    if (totalDisplay) totalDisplay.textContent = total + ' ' + (document.getElementById('saleCurrency').value === 'USD' ? '$' : 'ل.س');
    document.getElementById('paymentModalInput').value = '';
    document.getElementById('paymentModalOverlay').classList.add('show');
}

function hidePaymentModal() {
    document.getElementById('paymentModalOverlay').classList.remove('show');
    pendingInvoiceData = null;
}

async function finalizeSale(data) {
    const { invoice, date, customer, currency } = data;
    const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const paid = data.paid;
    const remaining = total - paid;

    // إذا كنا في وضع التعديل، نطلب كلمة مرور المالك
    if (editingSaleIndex !== null && settings.password) {
        const proceed = await new Promise((resolve) => {
            showModal('أدخل كلمة مرور المالك للمتابعة', (input) => {
                if (input === settings.password) {
                    hideModal();
                    resolve(true);
                } else {
                    alert('كلمة المرور غير صحيحة');
                    hideModal();
                    resolve(false);
                }
            });
        });
        if (!proceed) return;
    }

    // التحقق من توفر الكميات
    for (const item of invoiceItems) {
        const material = materials.find(m => m.id === item.materialId);
        if (material) {
            let existingQty = 0;
            if (editingSaleIndex !== null) {
                const oldSale = sales[editingSaleIndex];
                const oldItem = oldSale.items ? oldSale.items.find(i => i.materialId === item.materialId) : null;
                if (oldItem) existingQty = oldItem.qty;
            }
            if (item.qty > material.stock + existingQty) {
                alert(`الكمية غير متوفرة للمادة ${item.materialName}، الرصيد الحالي: ${material.stock}`);
                return;
            }
        }
    }

    // خصم الكميات من المخزون
    for (const item of invoiceItems) {
        const material = materials.find(m => m.id === item.materialId);
        if (material) {
            if (editingSaleIndex !== null) {
                const oldSale = sales[editingSaleIndex];
                const oldItem = oldSale.items ? oldSale.items.find(i => i.materialId === item.materialId) : null;
                if (oldItem) material.stock += oldItem.qty;
            }
            material.stock -= item.qty;
        }
    }
    updateMaterialsTable();

    if (editingSaleIndex !== null) {
        const oldSale = sales[editingSaleIndex];
        if (oldSale.remaining > 0) {
            const oldDebtIndex = debts.findIndex(d => 
                d.name === oldSale.customer && 
                d.date === oldSale.date && 
                Math.abs(d.amount - oldSale.remaining) < 0.001
            );
            if (oldDebtIndex !== -1) debts.splice(oldDebtIndex, 1);
        }

        sales[editingSaleIndex] = {
            invoice,
            date,
            customer: customer || 'بدون اسم',
            items: [...invoiceItems],
            currency,
            total,
            paid,
            remaining
        };

        if (remaining > 0) {
            debts.push({ name: customer || 'فاتورة: ' + invoice, date, amount: remaining, paid: 0, currency });
        }

        editingSaleIndex = null;
    } else {
        sales.push({
            invoice,
            date,
            customer: customer || 'بدون اسم',
            items: [...invoiceItems],
            currency,
            total,
            paid,
            remaining
        });

        if (remaining > 0) {
            debts.push({ name: customer || 'فاتورة: ' + invoice, date, amount: remaining, paid: 0, currency });
        }
    }

    invoiceItems = [];
    const invoiceNo = document.getElementById('invoiceNo');
    const customerName = document.getElementById('customerName');
    const saleTotal = document.getElementById('saleTotal');
    const invoiceItemsTable = document.getElementById('invoiceItemsTable');
    if (invoiceNo) invoiceNo.value = '';
    if (customerName) customerName.value = '';
    if (saleTotal) saleTotal.value = '';
    if (invoiceItemsTable) invoiceItemsTable.innerHTML = '<tr><th>المادة</th><th>الكمية</th><th>السعر الإفرادي</th><th>الإجمالي</th><th>حذف</th></tr>';

    updateSalesTable();
    updateDebtsTable();
    updateStatistics();
    alert('تم حفظ الفاتورة بنجاح');
    await saveAllData();
}

// ربط أزرار نافذة الدفع مباشرة


// نسخة واحدة فقط لربط زر تأكيد الدفع
let isSaving = false;
document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('paymentConfirmBtn');
    const cancelBtn = document.getElementById('paymentCancelBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async function() {
            if (isSaving) return;
            isSaving = true;
            const paidInput = document.getElementById('paymentModalInput');
            if (!paidInput) { isSaving = false; return; }
            const paid = parseFloat(paidInput.value) || 0;
            if (!pendingInvoiceData) {
                alert('لا توجد فاتورة معلقة');
                isSaving = false;
                return;
            }
            pendingInvoiceData.paid = paid;
            try {
                await finalizeSale(pendingInvoiceData);
            } finally {
                isSaving = false;
                hidePaymentModal();
            }
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            hidePaymentModal();
        });
    }
});


function getInvoiceDataFromForm() {
    return {
        invoice: document.getElementById('invoiceNo').value,
        date: document.getElementById('saleDate').value,
        customer: document.getElementById('customerName').value,
        currency: document.getElementById('saleCurrency').value,
        paid: document.getElementById('salePaid').value,
        total: document.getElementById('saleTotal').value,
        remaining: '0',
        items: invoiceItems
    };
}

function printInvoiceData(data) {
    const { invoice, date, customer, currency, paid, total, remaining, items } = data;
    const businessName = settings.businessName || 'اسم المحل';
    const businessDescription = settings.businessDescription || '';
    const signature = settings.ownerSignature || 'توقيع المالك';
    const currencyText = currency === 'USD' ? 'دولار أمريكي' : 'ليرة سورية';
    const symbol = currency === 'USD' ? '$' : 'ل.س';

    let itemsRows = '';
    items.forEach(item => {
        itemsRows += `<tr>
            <td>${item.materialName}${item.materialType ? ' - ' + item.materialType : ''}</td>
            <td>${item.qty} ${item.unit || ''}</td>
            <td>${item.unitPrice} ${symbol}</td>
            <td>${item.total} ${symbol}</td>
        </tr>`;
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;text-align:right;background:#f9f9f9;} .invoice{position:relative;border:2px solid #333;padding:25px;max-width:450px;margin:auto;background:white;} .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(0,0,0,0.06);font-weight:bold;z-index:0;} .content{position:relative;z-index:1;} .business-name{font-size:24px;font-weight:bold;text-align:center;margin-bottom:5px;} .invoice-title{font-size:20px;font-weight:bold;text-align:right;margin:10px 0;} .info-row{display:flex;justify-content:space-between;margin:5px 0;font-size:14px;} table{width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;} th,td{border:1px solid #333;padding:8px;text-align:center;} th{background:#667eea;color:white;} .totals{margin-top:10px;font-size:15px;text-align:right;} .totals p{margin:3px 0;} .signature{margin-top:40px;text-align:left;border-top:1px dashed #333;padding-top:10px;}</style>');
    printWindow.document.write(`<div class="invoice">
        <div class="watermark">المدير AI</div>
        <div class="content">
            <div class="business-name">${businessName}</div>
            ${businessDescription ? `<div class="business-desc">${businessDescription}</div>` : ''}
            <div class="invoice-title">فاتورة مبيعات</div>
            <div class="info-row"><span>رقم الفاتورة: ${invoice}</span><span>التاريخ: ${date}</span></div>
            <div class="info-row"><span>العميل: ${customer || 'بدون اسم'}</span></div>
            <table>
                <tr><th>المادة</th><th>الكمية</th><th>السعر الإفرادي</th><th>الإجمالي</th></tr>
                ${itemsRows}
            </table>
            <div class="totals">
                <p><strong>الإجمالي الكلي:</strong> ${total} ${currencyText}</p>
                <p><strong>المبلغ كتابةً:</strong> ${tafqitAmount(total, currency)}</p>
                <p><strong>المدفوع:</strong> ${paid} ${currencyText}</p>
                <p><strong>الباقي:</strong> ${remaining} ${currencyText}</p>
            </div>
            <div style="text-align:center; margin-top:10px;">

            </div>
            <div style="text-align:center; margin-top:10px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('المدير AI|' + invoice + '|' + total + '|' + currency)}" alt="QR Code" style="width:100px;height:100px;" />
            </div>
            <div class="signature">للاستفسار: ${signature}</div>
        </div>
    </div>`);
    printWindow.document.close();
    printWindow.print();
}

async function exportInvoiceData(data) {
    const { invoice, date, customer, currency, paid, total, remaining, items } = data;
    const businessName = settings.businessName || 'اسم المحل';
    const businessDescription = settings.businessDescription || '';
    const signature = settings.ownerSignature || 'توقيع المالك';
    const currencyText = currency === 'USD' ? 'دولار أمريكي' : 'ليرة سورية';
    const symbol = currency === 'USD' ? '$' : 'ل.س';

    let itemsRows = '';
    items.forEach(item => {
        itemsRows += `<tr>
            <td>${item.materialName}${item.materialType ? ' - ' + item.materialType : ''}</td>
            <td>${item.qty} ${item.unit || ''}</td>
            <td>${item.unitPrice} ${symbol}</td>
            <td>${item.total} ${symbol}</td>
        </tr>`;
    });

    const invoiceElement = document.createElement('div');
    invoiceElement.style.cssText = 'position: fixed; top: 0; left: 0; width: 450px; background: white; padding: 25px; text-align: right; font-family: Arial; z-index: -9999;';
    invoiceElement.innerHTML = `
        <div style="position:relative;border:2px solid #333;padding:25px;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(0,0,0,0.06);font-weight:bold;z-index:0;">المدير AI</div>
            <div style="position:relative;z-index:1;">
                <div style="font-size:24px;font-weight:bold;text-align:center;margin-bottom:5px;">${businessName}</div>
                ${businessDescription ? `<div style="text-align:center;margin-bottom:5px;color:#555;">${businessDescription}</div>` : ''}
                <div style="font-size:20px;font-weight:bold;text-align:right;margin:10px 0;">فاتورة مبيعات</div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>رقم الفاتورة: ${invoice}</span><span>التاريخ: ${date}</span></div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>العميل: ${customer || 'بدون اسم'}</span></div>
                <table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;">
                    <tr><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">المادة</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الكمية</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">السعر الإفرادي</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الإجمالي</th></tr>
                    ${itemsRows}
                </table>
                <div style="margin-top:10px;font-size:15px;text-align:right;">
                    <p style="margin:3px 0;"><strong>الإجمالي الكلي:</strong> ${total} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>المبلغ كتابةً:</strong> ${tafqitAmount(total, currency)}</p>
                    <p style="margin:3px 0;"><strong>المدفوع:</strong> ${paid} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>الباقي:</strong> ${remaining} ${currencyText}</p>
                </div>
                <div style="text-align:center; margin-top:10px;">

                </div>
                <div style="margin-top:40px;text-align:left;border-top:1px dashed #333;padding-top:10px;">للاستفسار: ${signature}</div>
            </div>
        </div>
    `;
    document.body.appendChild(invoiceElement);
    setTimeout(() => {
        generateInvoiceQR('${invoice}', '${total}', '${currency}');
    }, 500);
    html2canvas(invoiceElement).then(canvas => {
        const link = document.createElement('a');
        link.download = `invoice_${invoice}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        document.body.removeChild(invoiceElement);
    });
}

// بحث في الفواتير
function searchSales() {
    updateSalesTable();
}

// ==================== QR Code للفاتورة ====================
function generateInvoiceQR(invoiceId, total, currency) {
    const qrContainer = document.getElementById('invoice-qr');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    const invoiceData = `المدير AI|${invoiceId}|${total}|${currency}`;
    new QRCode(qrContainer, {
        text: invoiceData,
        width: 100,
        height: 100,
        colorDark: "#000000",
        colorLight: "#ffffff"
    });
}

// تعديل دوال الطباعة والتصدير لتتضمن QR
function enhanceInvoiceWithQR(invoiceId, total, currency) {
    setTimeout(() => generateInvoiceQR(invoiceId, total, currency), 200);
}

// مشاركة الفاتورة عبر واتساب


// ==================== قارئ QR Code ====================
let html5QrCode = null;

function startQRScanner() {
    const qrReader = document.getElementById('qr-reader');
    if (!qrReader) return;
    qrReader.style.display = 'block';
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode('qr-reader');
    }
    html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            // تم قراءة الكود
            handleQRData(decodedText);
        },
        (errorMessage) => {
            // أخطاء القراءة (يمكن تجاهلها)
        }
    ).catch(err => {
        alert('تعذر فتح الكاميرا. يرجى إغلاق أي فقاعات محادثات (مثل ماسنجر) أو تطبيقات تظهر فوق الشاشة، ثم المحاولة مرة أخرى.');
        console.error('QR Scanner Error:', err);
    });
}

function stopQRScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('qr-reader').style.display = 'none';
        }).catch(err => console.error(err));
    }
}

function handleQRData(data) {
    const parts = data.split('|');
    if (parts.length >= 4 && parts[0] === 'المدير AI') {
        const invoiceId = parts[1];
        const total = parts[2];
        const currency = parts[3];
        document.getElementById('qr-result').textContent = `رقم الفاتورة: ${invoiceId} - الإجمالي: ${total} ${currency}`;
        stopQRScanner();
    } else {
        document.getElementById('qr-result').textContent = 'رمز غير صالح';
    }
}

// مشاركة الفاتورة عبر واتساب


// دالة مساعدة لبناء HTML الفاتورة
function buildInvoiceHTML(data) {
    const businessName = settings.businessName || 'اسم المحل';
    const businessDescription = settings.businessDescription || '';
    const signature = settings.ownerSignature || 'للاستفسار';
    const symbol = data.currency === 'USD' ? '$' : 'ل.س';
    const currencyText = data.currency === 'USD' ? 'دولار أمريكي' : 'ليرة سورية';

    let itemsRows = '';
    data.items.forEach(item => {
        itemsRows += `<tr>
            <td>${item.materialName}${item.materialType ? ' - ' + item.materialType : ''}</td>
            <td>${item.qty} ${item.unit || ''}</td>
            <td>${item.unitPrice} ${symbol}</td>
            <td>${item.total} ${symbol}</td>
        </tr>`;
    });

    return `
        <div style="position:relative;border:2px solid #333;padding:20px;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(0,0,0,0.06);font-weight:bold;z-index:0;">المدير AI</div>
            <div style="position:relative;z-index:1;">
                <div style="font-size:24px;font-weight:bold;text-align:center;margin-bottom:5px;">${businessName}</div>
                ${businessDescription ? `<div style="text-align:center;margin-bottom:5px;color:#555;">${businessDescription}</div>` : ''}
                <div style="font-size:20px;font-weight:bold;text-align:right;margin:10px 0;">فاتورة مبيعات</div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>رقم الفاتورة: ${data.invoice}</span><span>التاريخ: ${data.date}</span></div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>العميل: ${data.customer || 'بدون اسم'}</span></div>
                <table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;">
                    <tr><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">المادة</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الكمية</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">السعر الإفرادي</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الإجمالي</th></tr>
                    ${itemsRows}
                </table>
                <div style="margin-top:10px;font-size:15px;text-align:right;">
                    <p style="margin:3px 0;"><strong>الإجمالي الكلي:</strong> ${data.total} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>المدفوع:</strong> ${data.paid} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>الباقي:</strong> ${data.remaining} ${currencyText}</p>
                </div>
                <div style="margin-top:30px;text-align:left;border-top:1px dashed #333;padding-top:10px;">${signature}</div>
            </div>
        </div>
    `;
}

async function shareInvoiceAsWhatsApp() {
    let data;
    // استخدام بيانات الفاتورة الحالية إذا كانت موجودة
    if (invoiceItems.length > 0) {
        const invoice = document.getElementById('invoiceNo').value;
        const date = document.getElementById('saleDate').value;
        const customer = document.getElementById('customerName').value;
        const currency = document.getElementById('saleCurrency').value;
        const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);
        const paid = parseFloat(document.getElementById('salePaid').value) || 0;
        const remaining = total - paid;
        data = { invoice, date, customer, currency, total, paid, remaining };
    } else if (sales.length > 0) {
        // استخدام آخر فاتورة محفوظة
        const last = sales[sales.length - 1];
        data = {
            invoice: last.invoice,
            date: last.date,
            customer: last.customer,
            currency: last.currency || 'SYP',
            total: last.total,
            paid: last.paid,
            remaining: last.remaining
        };
    } else {
        alert('لا توجد فاتورة للمشاركة');
        return;
    }

    const symbol = data.currency === 'USD' ? '$' : 'ل.س';
    const message = `فاتورة رقم ${data.invoice}\nالتاريخ: ${data.date}\nالعميل: ${data.customer || 'بدون اسم'}\nالإجمالي: ${data.total} ${symbol}\nالمدفوع: ${data.paid} ${symbol}\nالباقي: ${data.remaining} ${symbol}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

// ==================== التفقيط ====================
function tafqitAmount(amount, currency) {
    if (currency === 'USD') return tafqitUSD(amount);
    else return tafqitSYP(amount);
}

function tafqitSYP(number) {
    if (isNaN(number) || number <= 0) return '';
    const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

    const convertBelow1000 = (num) => {
        let result = '';
        const h = Math.floor(num / 100);
        const r = num % 100;
        if (h > 0) {
            result += hundreds[h];
            if (r > 0) result += ' و';
        }
        if (r >= 10 && r < 20) {
            result += teens[r - 10];
        } else {
            const t = Math.floor(r / 10);
            const u = r % 10;
            if (t > 0) result += tens[t];
            if (u > 0) {
                if (t > 0) result += ' و';
                result += units[u];
            }
        }
        return result;
    };

    let result = '';
    if (number >= 1000000) {
        const m = Math.floor(number / 1000000);
        result += (m === 1 ? 'مليون' : (m === 2 ? 'مليونان' : convertBelow1000(m) + ' ملايين'));
        number %= 1000000;
        if (number > 0) result += ' و';
    }
    if (number >= 1000) {
        const k = Math.floor(number / 1000);
        result += (k === 1 ? 'ألف' : (k === 2 ? 'ألفان' : convertBelow1000(k) + ' آلاف'));
        number %= 1000;
        if (number > 0) result += ' و';
    }
    if (number > 0) {
        result += convertBelow1000(number);
    }
    return 'فقط ' + result.trim() + ' ليرة سورية لا غير';
}

function tafqitUSD(number) {
    if (isNaN(number) || number <= 0) return '';
    const rounded = Math.round(number);
    return `فقط ${rounded} دولار أمريكي لا غير`;
}

// ==================== البيع المفرق ====================
async function quickSale() {
    const materialSelect = document.getElementById('saleMaterial');
    const selectedOption = materialSelect.options[materialSelect.selectedIndex];
    const materialId = materialSelect.value;
    const materialName = selectedOption ? selectedOption.dataset.name : '';
    const qty = parseFloat(document.getElementById('saleQty').value) || 0;
    const currency = document.getElementById('saleCurrency').value;
    const defaultPrice = selectedOption ? (currency === 'USD' ? parseFloat(selectedOption.dataset.saleUsd) : parseFloat(selectedOption.dataset.saleSyp)) || 0 : 0;
    const retailPriceInput = document.getElementById('retailPrice');
    const unitPrice = (retailPriceInput && retailPriceInput.value) ? parseFloat(retailPriceInput.value) : defaultPrice;

    if (!materialId || qty <= 0) {
        alert('الرجاء اختيار مادة وإدخال كمية صحيحة');
        return;
    }

    const material = materials.find(m => m.id === parseInt(materialId));
    if (!material) {
        alert('المادة غير موجودة');
        return;
    }

    if (qty > material.stock) {
        alert(`الكمية غير متوفرة! الرصيد الحالي: ${material.stock}`);
        return;
    }

    // خصم الكمية من المخزون
    material.stock -= qty;
    updateMaterialsTable();

    // إنشاء رقم فاتورة مفرقة تلقائي
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const count = sales.filter(s => s.invoice && s.invoice.startsWith('MFR-')).length + 1;
    const invoice = `MFR-${yyyy}${mm}${dd}-${String(count).padStart(3, '0')}`;
    const today = date.toISOString().slice(0, 10);

    const total = qty * unitPrice;
    const paid = total;
    const remaining = 0;

    const newSale = {
        invoice,
        date: today,
        customer: 'بيع مفرق',
        items: [{
            materialId: parseInt(materialId),
            materialName: material.name,
            materialType: material.type || '',
            qty: qty,
            unit: material.unit || '',
            unitPrice,
            currency,
            total
        }],
        currency,
        total,
        paid,
        remaining,
        isRetail: true
    };

    sales.push(newSale);

    // تنظيف الحقول
    document.getElementById('saleQty').value = '';
    document.getElementById('saleUnitPrice').value = '';
    if (retailPriceInput) retailPriceInput.value = '';

    updateSalesTable();
    updateRetailTable();
    updateDebtsTable();
    updateStatistics();
    alert(`تم البيع المفرق بنجاح\nرقم العملية: ${invoice}\nالإجمالي: ${total} ${currency === 'USD' ? '$' : 'ل.س'}`);
    await saveAllData();
}

// عرض سجل البيع المفرق
function updateRetailTable() {
    const table = document.getElementById('retailSalesTable');
    if (!table) return;
    const searchInput = document.getElementById('searchRetail');
    let retailSales = sales.filter(s => s.isRetail);

    // تطبيق البحث إن وجد
    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.trim().toLowerCase();
        retailSales = retailSales.filter(s => {
            const itemsSummary = s.items ? s.items.map(i => i.materialName).join(' ') : '';
            return (s.invoice && s.invoice.toLowerCase().includes(query)) ||
                   (itemsSummary && itemsSummary.toLowerCase().includes(query));
        });
    } else {
        // عرض آخر 5 عمليات فقط
        retailSales = retailSales.slice(-5);
    }

    const symbol = (s) => s.currency === 'USD' ? '$' : 'ل.س';
    let rows = '';
    retailSales.forEach((s) => {
        const cur = symbol(s);
        const itemsSummary = s.items ? s.items.map(i => `${i.materialName} (${i.qty} ${i.unit || ''})`).join('، ') : s.materialName;
        const originalIndex = sales.indexOf(s);
        rows += `<tr>
            <td>${s.invoice}</td>
            <td>${s.date}</td>
            <td>${itemsSummary}</td>
            <td>${s.items ? s.items.reduce((sum, i) => sum + i.qty, 0) : '-'}</td>
            <td>${s.currency || 'SYP'}</td>
            <td>${s.total} ${cur}</td>
            <td><button class="btn-delete" onclick="deleteSale(${originalIndex})">حذف</button></td>
        </tr>`;
    });

    table.innerHTML = '<tr><th>رقم العملية</th><th>التاريخ</th><th>المادة</th><th>الكمية</th><th>العملة</th><th>الإجمالي</th><th>حذف</th></tr>' + rows;
}

// ==================== لوحة تحكم المشتركين ====================
async function loadAdminUsers() {
    const table = document.getElementById('adminUsersTable');
    const searchInput = document.getElementById('searchAdmin');
    if (!table) return;
    try {
        let query = db.collection('users').orderBy('trialStartDate', 'desc');
        const snapshot = await query.get();
        let users = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            users.push({
                uid: doc.id,
                fullName: data.fullName || 'بدون اسم',
                phone: data.phone || '-',
                email: data.email || '-',
                status: data.subscriptionStatus || 'trial',
                trialStart: data.trialStartDate ? (data.trialStartDate.toDate ? data.trialStartDate.toDate() : new Date(data.trialStartDate.seconds * 1000)) : null,
                endDate: data.subscriptionEndDate ? (data.subscriptionEndDate.toDate ? data.subscriptionEndDate.toDate() : new Date(data.subscriptionEndDate.seconds * 1000)) : null
            });
        });

        // تطبيق البحث إذا كان هناك نص
        if (searchInput && searchInput.value.trim() !== '') {
            const search = searchInput.value.trim().toLowerCase();
            users = users.filter(u => 
                u.fullName.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search)
            );
        } else {
            // عرض آخر 5 مشتركين فقط
            users = users.slice(0, 5);
        }

        let rows = '<tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>الحالة</th><th>البداية</th><th>النهاية</th><th>إجراءات</th></tr>';
        users.forEach((u) => {
            const startDate = u.trialStart ? u.trialStart.toLocaleDateString('ar-SY') : '-';
            const endDate = u.endDate ? u.endDate.toLocaleDateString('ar-SY') : '-';
            const statusText = u.status === 'active' ? '✅ نشط' : (u.status === 'trial' ? '⏳ تجريبي' : '❌ منتهي');
            rows += `<tr>
                <td>${u.fullName}</td>
                <td>${u.phone}</td>
                <td>${u.email}</td>
                <td>${statusText}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>
                    <button class="btn-settle" onclick="activateUser('${u.uid}', 30)">تفعيل 30 يوم</button>
                    <button class="btn-settle" onclick="activateUser('${u.uid}', 365)">تفعيل سنة</button>
                    <button class="btn-edit" onclick="deactivateUser('${u.uid}')">تعطيل</button>
                </td>
            </tr>`;
        });
        table.innerHTML = rows;
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
        alert('تعذر تحميل بيانات المشتركين.\nالسبب: ' + error.message);
    }
}

async function activateUser(uid, days = 30) {
    const periodText = days === 365 ? 'سنة' : '30 يومًا';
    if (!confirm(`هل تريد تفعيل/تمديد الاشتراك ${periodText}؟`)) return;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    try {
        await db.collection('users').doc(uid).update({
            subscriptionStatus: 'active',
            subscriptionEndDate: firebase.firestore.Timestamp.fromDate(endDate)
        });
        alert('تم تفعيل الاشتراك بنجاح');
        loadAdminUsers();
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
}

async function deactivateUser(uid) {
    if (!confirm('هل تريد تعطيل اشتراك هذا المستخدم؟')) return;
    try {
        await db.collection('users').doc(uid).update({
            subscriptionStatus: 'expired',
            subscriptionEndDate: firebase.firestore.Timestamp.fromDate(new Date())
        });
        alert('تم تعطيل الاشتراك');
        loadAdminUsers();
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
}

// استدعاء loadAdminUsers عند فتح صفحة الإدارة
function openAdminPage() {
    loadAdminUsers();
}

// ==================== مراسلة الدعم (المستخدم) ====================
let supportListener = null;

function openSupportPage() {
    listenToUserSupportMessages();
}

function listenToUserSupportMessages() {
    if (!currentUser || !currentUser.uid) return;
    if (supportListener) supportListener();
    supportListener = db.collection('support_conversations').doc(currentUser.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                renderSupportMessages(doc.data().messages || []);
            } else {
                renderSupportMessages([]);
            }
        });
}

function renderSupportMessages(messages) {
    const container = document.getElementById('supportMessages');
    if (!container) return;
    if (messages.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">لا توجد رسائل بعد، ابدأ محادثة مع الدعم.</p>';
        return;
    }
    let html = '';
    messages.forEach((msg) => {
        const isUser = msg.sender === 'user';
        const bubbleStyle = isUser 
            ? 'background:#3498db; color:white; margin-left:auto;' 
            : 'background:#ecf0f1; color:#2c3e50; margin-right:auto;';
        html += `<div style="max-width:80%; padding:8px 12px; border-radius:12px; margin:5px 0; ${bubbleStyle}">
            ${msg.text}
            <div style="font-size:10px; opacity:0.8;">${msg.timestamp ? new Date(msg.timestamp).toLocaleString('ar-SY') : ''}</div>
        </div>`;
    });
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

async function sendUserSupportMessage() {
    const input = document.getElementById('supportInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    const message = {
        sender: 'user',
        text: text,
        timestamp: Date.now()
    };
    try {
        const ref = db.collection('support_conversations').doc(currentUser.uid);
        await ref.set({
            messages: firebase.firestore.FieldValue.arrayUnion(message)
        }, { merge: true });
    } catch (error) {
        alert('خطأ في الإرسال: ' + error.message);
    }
}

// ==================== إدارة محادثات الدعم (للمدير) ====================
let currentConversationUserId = null;

async function loadSupportConversations() {
    const table = document.getElementById('supportConversationsTable');
    if (!table) return;
    try {
        const snapshot = await db.collection('support_conversations').orderBy('messages', 'desc').limit(20).get();
        let rows = '<tr><th>المستخدم</th><th>آخر رسالة</th><th>التاريخ</th><th>فتح</th></tr>';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const messages = data.messages || [];
            const last = messages[messages.length - 1];
            const lastText = last ? last.text.substring(0, 50) : '-';
            const lastTime = last && last.timestamp ? new Date(last.timestamp).toLocaleString('ar-SY') : '-';
            rows += `<tr>
                <td>${doc.id}</td>
                <td>${lastText}</td>
                <td>${lastTime}</td>
                <td><button class="btn-settle" onclick="openConversation('${doc.id}')">فتح</button></td>
            </tr>`;
        });
        table.innerHTML = rows;
    } catch (error) {
        console.error('خطأ في تحميل المحادثات:', error);
    }
}

async function openConversation(userId) {
    currentConversationUserId = userId;
    const view = document.getElementById('conversationView');
    view.style.display = 'block';
    try {
        const doc = await db.collection('support_conversations').doc(userId).get();
        if (doc.exists) {
            const messages = doc.data().messages || [];
            let html = '';
            messages.forEach((msg) => {
                const isAdmin = msg.sender === 'admin';
                const bubbleStyle = isAdmin 
                    ? 'background:#27ae60; color:white; margin-left:auto;' 
                    : 'background:#ecf0f1; color:#2c3e50; margin-right:auto;';
                html += `<div style="max-width:80%; padding:8px 12px; border-radius:12px; margin:5px 0; ${bubbleStyle}">
                    ${msg.text}
                    <div style="font-size:10px; opacity:0.8;">${msg.timestamp ? new Date(msg.timestamp).toLocaleString('ar-SY') : ''}</div>
                </div>`;
            });
            view.innerHTML = html;
        }
    } catch (error) {
        alert('خطأ في فتح المحادثة: ' + error.message);
    }
}

async function replyToUser() {
    const input = document.getElementById('adminReplyInput');
    const text = input.value.trim();
    if (!text || !currentConversationUserId) return;
    input.value = '';
    const message = {
        sender: 'admin',
        text: text,
        timestamp: Date.now()
    };
    try {
        const ref = db.collection('support_conversations').doc(currentConversationUserId);
        await ref.set({
            messages: firebase.firestore.FieldValue.arrayUnion(message)
        }, { merge: true });
        openConversation(currentConversationUserId);
    } catch (error) {
        alert('خطأ في الرد: ' + error.message);
    }
}

// ==================== إشعارات المزامنة ====================
let syncNotificationTimeout = null;

function showSyncNotification(message, type = 'info') {
    const el = document.getElementById('syncNotification');
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    if (type === 'success') {
        el.style.background = '#27ae60';
    } else if (type === 'error') {
        el.style.background = '#e74c3c';
    } else {
        el.style.background = '#2c3e50';
    }
    clearTimeout(syncNotificationTimeout);
    syncNotificationTimeout = setTimeout(() => {
        el.style.display = 'none';
    }, 3000);
}

// ==================== مؤشر حالة الاتصال ====================
window.addEventListener('online', () => {
    const el = document.getElementById('offlineIndicator');
    if (el) el.style.display = 'none';
    if (typeof showSyncNotification === 'function') {
        showSyncNotification('تم استعادة الاتصال، جاري المزامنة...', 'info');
    }
});

window.addEventListener('offline', () => {
    const el = document.getElementById('offlineIndicator');
    if (el) el.style.display = 'block';
});
