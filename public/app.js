// State
let categories = [];
let transactions = [];
let savingsGoals = [];
let charts = { category: null, balance: null };

// Check authentication status on load
window.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    
    if (data.authenticated) {
        showApp(data.username);
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
    }
    
    // Set default date to today
    document.getElementById('transaction-date').valueAsDate = new Date();
});

// Authentication Functions
async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showApp(data.user.username);
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Login failed');
    }
}

async function register() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showApp(data.user.username);
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Registration failed');
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    hideError();
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    hideError();
}

function showError(message) {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function hideError() {
    document.getElementById('auth-error').classList.remove('show');
}

async function showApp(username) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    document.getElementById('welcome-user').textContent = `Welcome, ${username}!`;
    
    await loadCategories();
    await loadTransactions();
    await loadSavingsGoals();
    updateSummary();
    updateCharts();
    updateWeeklySummary();
}

// Tab Functions
function showTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Category Functions
async function loadCategories() {
    const response = await fetch('/api/categories');
    categories = await response.json();
    
    renderCategoriesDropdown();
    renderCategoriesList();
}

function renderCategoriesDropdown() {
    const select = document.getElementById('transaction-category');
    select.innerHTML = '<option value="">Select Category</option>';
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.name} (${cat.type})`;
        option.dataset.type = cat.type;
        select.appendChild(option);
    });
}

function renderCategoriesList() {
    const list = document.getElementById('categories-list');
    list.innerHTML = '';
    
    if (categories.length === 0) {
        list.innerHTML = '<p class="text-center">No categories yet. Add your first category!</p>';
        return;
    }
    
    categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `
            <div class="category-info">
                <span class="category-badge" style="background-color: ${cat.color}20; color: ${cat.color}">
                    ${cat.name}
                </span>
                <span style="color: ${cat.type === 'income' ? 'var(--success-color)' : 'var(--danger-color)'}">
                    ${cat.type.toUpperCase()}
                </span>
            </div>
            <button class="btn-danger" onclick="deleteCategory(${cat.id})">Delete</button>
        `;
        list.appendChild(item);
    });
}

async function addCategory(event) {
    event.preventDefault();
    
    const name = document.getElementById('category-name').value;
    const type = document.getElementById('category-type').value;
    const color = document.getElementById('category-color').value;
    
    await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, color })
    });
    
    event.target.reset();
    document.getElementById('category-color').value = '#3b82f6';
    await loadCategories();
}

async function deleteCategory(id) {
    if (!confirm('Delete this category? All related transactions will be deleted too.')) return;
    
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    await loadCategories();
    await loadTransactions();
}

// Transaction Functions
async function loadTransactions() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    let url = '/api/transactions';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params}`;
    
    const response = await fetch(url);
    transactions = await response.json();
    
    renderTransactions();
    updateSummary();
    updateCharts();
    updateWeeklySummary();
}

function renderTransactions() {
    const list = document.getElementById('transactions-list');
    list.innerHTML = '';
    
    if (transactions.length === 0) {
        list.innerHTML = '<p class="text-center">No transactions yet. Add your first transaction!</p>';
        return;
    }
    
    transactions.forEach(trans => {
        const item = document.createElement('div');
        item.className = `transaction-item ${trans.category_type}`;
        
        const date = new Date(trans.date).toLocaleDateString();
        const amount = trans.category_type === 'income' ? `+$${trans.amount.toFixed(2)}` : `-$${trans.amount.toFixed(2)}`;
        
        item.innerHTML = `
            <div class="transaction-info">
                <div style="font-weight: 600; margin-bottom: 4px;">${trans.category_name}</div>
                <div style="font-size: 14px; color: #6b7280;">${trans.description || 'No description'}</div>
                <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">${date}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span class="transaction-amount ${trans.category_type}">${amount}</span>
                <button class="btn-danger" onclick="deleteTransaction(${trans.id})">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

async function addTransaction(event) {
    event.preventDefault();
    
    const category_id = document.getElementById('transaction-category').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value;
    const date = document.getElementById('transaction-date').value;
    
    await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id, amount, description, date })
    });
    
    event.target.reset();
    document.getElementById('transaction-date').valueAsDate = new Date();
    await loadTransactions();
}

async function deleteTransaction(id) {
    if (!confirm('Delete this transaction?')) return;
    
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    await loadTransactions();
}

async function applyFilters() {
    await loadTransactions();
}

function clearFilters() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    loadTransactions();
}

// Summary Functions
async function updateSummary() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    let url = '/api/summary';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params}`;
    
    const response = await fetch(url);
    const summary = await response.json();
    
    document.getElementById('total-income').textContent = `$${summary.income.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${summary.expense.toFixed(2)}`;
    document.getElementById('balance').textContent = `$${summary.balance.toFixed(2)}`;
}

// Chart Functions
async function updateCharts() {
    await updateCategoryChart();
    await updateBalanceChart();
}

async function updateCategoryChart() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    let url = '/api/spending-by-category';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    if (charts.category) {
        charts.category.destroy();
    }
    
    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                data: data.map(d => d.total),
                backgroundColor: data.map(d => d.color),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

async function updateBalanceChart() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    let url = '/api/summary';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params}`;
    
    const response = await fetch(url);
    const summary = await response.json();
    
    const ctx = document.getElementById('balance-chart').getContext('2d');
    
    if (charts.balance) {
        charts.balance.destroy();
    }
    
    charts.balance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses', 'Balance'],
            datasets: [{
                label: 'Amount ($)',
                data: [summary.income, summary.expense, summary.balance],
                backgroundColor: ['#10b981', '#ef4444', '#3b82f6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Savings Goals Functions
async function loadSavingsGoals() {
    const response = await fetch('/api/savings-goals');
    savingsGoals = await response.json();
    renderSavingsGoals();
}

function renderSavingsGoals() {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    
    if (savingsGoals.length === 0) {
        list.innerHTML = '<p class="text-center">No savings goals yet. Set your first goal!</p>';
        return;
    }
    
    savingsGoals.forEach(goal => {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        const deadline = goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline';
        
        const item = document.createElement('div');
        item.className = 'goal-item';
        item.innerHTML = `
            <div class="goal-info">
                <div style="font-weight: 600; margin-bottom: 8px;">${goal.name}</div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <div class="progress-text">
                        $${goal.current_amount.toFixed(2)} / $${goal.target_amount.toFixed(2)} (${progress.toFixed(1)}%)
                    </div>
                    <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">Deadline: ${deadline}</div>
                </div>
                <div style="margin-top: 10px;">
                    <input type="number" id="goal-update-${goal.id}" placeholder="Add amount" step="0.01" style="width: 150px; padding: 6px; border: 1px solid #e5e7eb; border-radius: 4px; margin-right: 8px;">
                    <button class="btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="updateGoalAmount(${goal.id}, ${goal.current_amount})">Update</button>
                </div>
            </div>
            <button class="btn-danger" onclick="deleteGoal(${goal.id})">Delete</button>
        `;
        list.appendChild(item);
    });
}

async function addGoal(event) {
    event.preventDefault();
    
    const name = document.getElementById('goal-name').value;
    const target_amount = parseFloat(document.getElementById('goal-target').value);
    const current_amount = parseFloat(document.getElementById('goal-current').value) || 0;
    const deadline = document.getElementById('goal-deadline').value;
    
    await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, target_amount, current_amount, deadline })
    });
    
    event.target.reset();
    await loadSavingsGoals();
}

async function updateGoalAmount(goalId, currentAmount) {
    const input = document.getElementById(`goal-update-${goalId}`);
    const addAmount = parseFloat(input.value);
    
    if (!addAmount || addAmount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const newAmount = currentAmount + addAmount;
    
    await fetch(`/api/savings-goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_amount: newAmount })
    });
    
    await loadSavingsGoals();
}

async function deleteGoal(id) {
    if (!confirm('Delete this savings goal?')) return;
    
    await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' });
    await loadSavingsGoals();
}

// Weekly Summary
function updateWeeklySummary() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate >= oneWeekAgo && transDate <= now;
    });
    
    const weekIncome = weekTransactions
        .filter(t => t.category_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const weekExpense = weekTransactions
        .filter(t => t.category_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const weekBalance = weekIncome - weekExpense;
    
    const summaryDiv = document.getElementById('weekly-summary');
    summaryDiv.innerHTML = `
        <div class="summary-item">
            <h4>This Week's Income</h4>
            <div class="value" style="color: var(--success-color)">$${weekIncome.toFixed(2)}</div>
        </div>
        <div class="summary-item">
            <h4>This Week's Expenses</h4>
            <div class="value" style="color: var(--danger-color)">$${weekExpense.toFixed(2)}</div>
        </div>
        <div class="summary-item">
            <h4>This Week's Balance</h4>
            <div class="value">$${weekBalance.toFixed(2)}</div>
        </div>
        <div class="summary-item">
            <h4>Transactions Count</h4>
            <div class="value">${weekTransactions.length}</div>
        </div>
    `;
}

// CSV Export
function exportCSV() {
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }
    
    const headers = ['Date', 'Category', 'Type', 'Amount', 'Description'];
    const rows = transactions.map(t => [
        t.date,
        t.category_name,
        t.category_type,
        t.amount,
        t.description || ''
    ]);
    
    let csvContent = headers.join(',') + '\\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}
