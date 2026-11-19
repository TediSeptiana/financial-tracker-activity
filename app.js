// ============================================
// Storage Layer
// ============================================

function loadState(key, fallback = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        console.error(`Error loading state for ${key}:`, e);
        return fallback;
    }
}

function saveState(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving state for ${key}:`, e);
        alert('Penyimpanan penuh! Hapus beberapa data.');
    }
}

// ============================================
// Domain Logic
// ============================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function calcFinanceSummary(transactions) {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;
    
    return { totalIncome, totalExpense, balance };
}

function filterTransactions(transactions, monthFilter) {
    if (monthFilter === 'ALL') return transactions;
    return transactions.filter(t => t.date.startsWith(monthFilter));
}

function filterActivities(activities, statusFilter) {
    if (statusFilter === 'ALL') return activities;
    if (statusFilter === 'OPEN') return activities.filter(a => !a.isCompleted);
    if (statusFilter === 'DONE') return activities.filter(a => a.isCompleted);
    return activities;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateStr) {
    return dayjs(dateStr).format('DD MMM YYYY');
}

// ============================================
// State Management
// ============================================

let transactions = loadState('pwa_transactions_v1', []);
let activities = loadState('pwa_activities_v1', []);
let preferences = loadState('pwa_preferences_v1', {
    activeTab: 'finance',
    monthFilter: 'ALL',
    statusFilter: 'ALL',
    transactionType: 'income'
});

let financeChart = null;

// ============================================
// Render Layer
// ============================================

function renderSummary() {
    const filtered = filterTransactions(transactions, preferences.monthFilter);
    const summary = calcFinanceSummary(filtered);
    
    document.getElementById('total-income').textContent = formatCurrency(summary.totalIncome);
    document.getElementById('total-expense').textContent = formatCurrency(summary.totalExpense);
    document.getElementById('balance').textContent = formatCurrency(summary.balance);
}

function updateChart(transactions) {
    const ctx = document.getElementById('finance-chart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (financeChart) {
        financeChart.destroy();
    }
    
    // Group by category
    const categoryData = {};
    transactions.forEach(t => {
        if (!categoryData[t.category]) {
            categoryData[t.category] = 0;
        }
        categoryData[t.category] += t.amount;
    });
    
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = [
        '#10B981', '#EF4444', '#F59E0B', '#3B82F6', 
        '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
        '#6366F1', '#84CC16'
    ];
    
    financeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                title: {
                    display: true,
                    text: '📊 Distribusi Kategori',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: 20
                }
            }
        }
    });
}

function renderTransactionList() {
    const listContainer = document.getElementById('transaction-list');
    const filtered = filterTransactions(transactions, preferences.monthFilter);
    
    if (filtered.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">💭 Belum ada transaksi</div>';
        return;
    }
    
    // Sort by date descending
    const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    listContainer.innerHTML = sorted.map(t => `
        <div class="item-card ${t.type}-item animate-fade-in">
            <div class="item-info">
                <div class="item-title">${getCategoryEmoji(t.category)} ${t.category}</div>
                <div class="item-details">
                    📅 ${formatDate(t.date)} • ${t.note || 'Tidak ada catatan'}
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 800; font-size: 1.1rem; color: ${t.type === 'income' ? 'var(--success-color)' : 'var(--danger-color)'}">
                    ${t.type === 'income' ? '⬆️ +' : '⬇️ -'} ${formatCurrency(t.amount)}
                </div>
                <div class="item-actions">
                    <button class="btn-icon btn-delete" onclick="deleteTransaction('${t.id}')" title="Hapus">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

function getCategoryEmoji(category) {
    const emojiMap = {
        'Gaji': '💼',
        'Bonus': '🎁',
        'Investasi': '📈',
        'Freelance': '💻',
        'Hadiah': '🎉',
        'Makanan': '🍔',
        'Transportasi': '🚗',
        'Belanja': '🛍️',
        'Hiburan': '🎬',
        'Tagihan': '📱',
        'Kesehatan': '🏥',
        'Pendidikan': '📚',
        'Kerja': '💼',
        'Personal': '👤',
        'Olahraga': '🏃',
        'Belajar': '📚',
        'Sosial': '👥',
        'Lainnya': '✨'
    };
    return emojiMap[category] || '📌';
}

function renderActivityList() {
    const listContainer = document.getElementById('activity-list');
    const filtered = filterActivities(activities, preferences.statusFilter);
    
    if (filtered.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">💭 Belum ada kegiatan</div>';
        return;
    }
    
    // Sort by scheduledDate ascending
    const sorted = filtered.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    
    listContainer.innerHTML = sorted.map(a => `
        <div class="item-card animate-fade-in" style="${a.isCompleted ? 'opacity: 0.6;' : ''}">
            <div class="item-info">
                <div class="item-title">${a.isCompleted ? '✅' : '⭕'} ${a.title}</div>
                <div class="item-details">
                    📅 ${formatDate(a.scheduledDate)} • ${a.category ? getCategoryEmoji(a.category) + ' ' + a.category : 'Tanpa kategori'} • ${a.note || 'Tidak ada catatan'}
                </div>
            </div>
            <div class="item-actions">
                ${!a.isCompleted ? `<button class="btn-icon btn-complete" onclick="completeActivity('${a.id}')" title="Selesai">✓</button>` : ''}
                <button class="btn-icon btn-delete" onclick="deleteActivity('${a.id}')" title="Hapus">🗑️</button>
            </div>
        </div>
    `).join('');
}

function populateMonthFilter() {
    const select = document.getElementById('month-filter');
    const months = new Set();
    
    transactions.forEach(t => {
        const month = t.date.substring(0, 7); // YYYY-MM
        months.add(month);
    });
    
    // Clear existing options except "ALL"
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add sorted months
    Array.from(months).sort().reverse().forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = dayjs(month).format('MMMM YYYY');
        select.appendChild(option);
    });
}

// ============================================
// CRUD Operations
// ============================================

function addTransaction(transaction) {
    transactions.push(transaction);
    saveState('pwa_transactions_v1', transactions);
}

function deleteTransaction(id) {
    if (!confirm('Hapus transaksi ini?')) return;
    transactions = transactions.filter(t => t.id !== id);
    saveState('pwa_transactions_v1', transactions);
    renderAll();
}

function addActivity(activity) {
    activities.push(activity);
    saveState('pwa_activities_v1', activities);
}

function completeActivity(id) {
    const activity = activities.find(a => a.id === id);
    if (activity) {
        activity.isCompleted = true;
        saveState('pwa_activities_v1', activities);
        renderAll();
    }
}

function deleteActivity(id) {
    if (!confirm('Hapus kegiatan ini?')) return;
    activities = activities.filter(a => a.id !== id);
    saveState('pwa_activities_v1', activities);
    renderAll();
}

// ============================================
// Export Functions
// ============================================

function exportToCSV(data, filename) {
    if (data.length === 0) {
        alert('Tidak ada data untuk diekspor');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
            const value = row[h];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function exportTransactions() {
    exportToCSV(transactions, 'transactions.csv');
}

function exportActivities() {
    exportToCSV(activities, 'activities.csv');
}

// ============================================
// Transaction Type Switcher
// ============================================

function switchTransactionType(type) {
    preferences.transactionType = type;
    saveState('pwa_preferences_v1', preferences);
    
    // Update switch buttons
    document.querySelectorAll('.switch-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`switch-${type}`).classList.add('active');
    
    // Show/hide form cards
    const incomeForm = document.getElementById('income-form-card');
    const expenseForm = document.getElementById('expense-form-card');
    
    if (type === 'income') {
        incomeForm.style.display = 'block';
        expenseForm.style.display = 'none';
        incomeForm.classList.add('animate-bounce-in');
    } else {
        incomeForm.style.display = 'none';
        expenseForm.style.display = 'block';
        expenseForm.classList.add('animate-bounce-in');
    }
}

// ============================================
// Event Handlers
// ============================================

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            preferences.activeTab = tab;
            saveState('pwa_preferences_v1', preferences);
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tab}-section`).classList.add('active');
        });
    });
    
    // Transaction type switcher
    document.getElementById('switch-income').addEventListener('click', () => {
        switchTransactionType('income');
    });
    
    document.getElementById('switch-expense').addEventListener('click', () => {
        switchTransactionType('expense');
    });
    
    // Income form
    document.getElementById('income-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const transaction = {
            id: generateId(),
            type: 'income',
            amount: parseFloat(document.getElementById('income-amount').value),
            category: document.getElementById('income-category').value,
            date: document.getElementById('income-date').value,
            note: document.getElementById('income-note').value.trim() || null,
            createdAt: new Date().toISOString()
        };
        
        if (!transaction.category) {
            alert('Kategori harus dipilih');
            return;
        }
        
        addTransaction(transaction);
        e.target.reset();
        document.getElementById('income-date').value = dayjs().format('YYYY-MM-DD');
        renderAll();
        
        // Show success animation
        alert('✅ Pemasukan berhasil ditambahkan!');
    });
    
    // Expense form
    document.getElementById('expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const transaction = {
            id: generateId(),
            type: 'expense',
            amount: parseFloat(document.getElementById('expense-amount').value),
            category: document.getElementById('expense-category').value,
            date: document.getElementById('expense-date').value,
            note: document.getElementById('expense-note').value.trim() || null,
            createdAt: new Date().toISOString()
        };
        
        if (!transaction.category) {
            alert('Kategori harus dipilih');
            return;
        }
        
        addTransaction(transaction);
        e.target.reset();
        document.getElementById('expense-date').value = dayjs().format('YYYY-MM-DD');
        renderAll();
        
        // Show success animation
        alert('✅ Pengeluaran berhasil ditambahkan!');
    });
    
    // Activity form
    document.getElementById('activity-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const activity = {
            id: generateId(),
            title: document.getElementById('act-title').value.trim(),
            category: document.getElementById('act-category').value || null,
            scheduledDate: document.getElementById('act-date').value,
            isCompleted: false,
            note: document.getElementById('act-note').value.trim() || null,
            createdAt: new Date().toISOString()
        };
        
        if (!activity.title) {
            alert('Judul harus diisi');
            return;
        }
        
        addActivity(activity);
        e.target.reset();
        document.getElementById('act-date').value = dayjs().format('YYYY-MM-DD');
        renderAll();
        
        // Show success animation
        alert('✅ Kegiatan berhasil ditambahkan!');
    });
    
    // Filters
    document.getElementById('month-filter').addEventListener('change', (e) => {
        preferences.monthFilter = e.target.value;
        saveState('pwa_preferences_v1', preferences);
        renderAll();
    });
    
    document.getElementById('status-filter').addEventListener('change', (e) => {
        preferences.statusFilter = e.target.value;
        saveState('pwa_preferences_v1', preferences);
        renderAll();
    });
    
    // Export buttons
    document.getElementById('export-transactions').addEventListener('click', exportTransactions);
    document.getElementById('export-activities').addEventListener('click', exportActivities);
}

// ============================================
// Initialization
// ============================================

function renderAll() {
    renderSummary();
    populateMonthFilter();
    renderTransactionList();
    renderActivityList();
    
    const filtered = filterTransactions(transactions, preferences.monthFilter);
    updateChart(filtered);
}

function initApp() {
    // Set default dates
    document.getElementById('income-date').value = dayjs().format('YYYY-MM-DD');
    document.getElementById('expense-date').value = dayjs().format('YYYY-MM-DD');
    document.getElementById('act-date').value = dayjs().format('YYYY-MM-DD');
    
    // Restore preferences
    document.getElementById('month-filter').value = preferences.monthFilter;
    document.getElementById('status-filter').value = preferences.statusFilter;
    
    // Initialize transaction type switcher
    switchTransactionType(preferences.transactionType || 'income');
    
    // Activate correct tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === preferences.activeTab) {
            btn.click();
        }
    });
    
    setupEventListeners();
    renderAll();
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}