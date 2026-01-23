// Expense Tracker App
// Local Storage Manager with 12-month data retention

class ExpenseTracker {
    constructor() {
        this.storageKey = 'expenseTrackerData';
        this.init();
    }

    init() {
        this.cleanupOldData();
        this.loadData();
    }

    // Clean up data older than 12 months
    cleanupOldData() {
        const data = this.getStoredData();
        if (!data || !data.expenses) return;

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        data.expenses = data.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= twelveMonthsAgo;
        });

        this.saveData(data);
    }

    // Get data from local storage
    getStoredData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : { expenses: [], categories: [], income: {}, limits: {} };
        } catch (error) {
            console.error('Error reading from local storage:', error);
            return { expenses: [], categories: [], income: {}, limits: {} };
        }
    }

    // Save data to local storage
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    }

    // Load data
    loadData() {
        return this.getStoredData();
    }

    // Add expense
    addExpense(expense) {
        const data = this.getStoredData();
        expense.id = Date.now().toString();
        expense.date = expense.date || new Date().toISOString();
        data.expenses.push(expense);
        this.saveData(data);
        return expense;
    }

    // Get expenses
    getExpenses() {
        const data = this.getStoredData();
        return data.expenses || [];
    }

    // Delete expense
    deleteExpense(id) {
        const data = this.getStoredData();
        data.expenses = data.expenses.filter(expense => expense.id !== id);
        this.saveData(data);
    }

    // Update expense
    updateExpense(id, updatedExpense) {
        const data = this.getStoredData();
        const index = data.expenses.findIndex(expense => expense.id === id);
        if (index !== -1) {
            data.expenses[index] = { ...data.expenses[index], ...updatedExpense };
            this.saveData(data);
            return data.expenses[index];
        }
        return null;
    }

    // Get month key (YYYY-MM format)
    getMonthKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    // Get month name
    getMonthName(date = new Date()) {
        return date.toLocaleString('default', { month: 'long' });
    }

    // Get previous month
    getPreviousMonth(date = new Date()) {
        const prevMonth = new Date(date);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        return prevMonth;
    }

    // Set income for a month
    setIncome(amount, monthKey = null) {
        const data = this.getStoredData();
        if (!data.income) {
            data.income = {};
        }
        const key = monthKey || this.getMonthKey();
        const incomeValue = parseFloat(amount);
        data.income[key] = incomeValue;
        this.saveData(data);
        return data.income[key];
    }

    // Get income for a month
    getIncome(monthKey = null) {
        const data = this.getStoredData();
        if (!data.income) {
            return 0;
        }
        const key = monthKey || this.getMonthKey();
        return data.income[key] || 0;
    }

    // Get previous month income
    getPreviousMonthIncome() {
        const prevMonth = this.getPreviousMonth();
        const prevMonthKey = this.getMonthKey(prevMonth);
        return this.getIncome(prevMonthKey);
    }

    // -------- LIMITS (per month, per category) --------

    // Get all limits for a given month (object: { [category]: limit })
    getLimitsForMonth(monthKey = null) {
        const data = this.getStoredData();
        const key = monthKey || this.getMonthKey();
        if (!data.limits) return {};
        return data.limits[key] || {};
    }

    // Set limits for a given month (limitsObj: { [category]: limit })
    setLimitsForMonth(limitsObj, monthKey = null) {
        const data = this.getStoredData();
        if (!data.limits) {
            data.limits = {};
        }
        const key = monthKey || this.getMonthKey();
        data.limits[key] = limitsObj;
        this.saveData(data);
        return data.limits[key];
    }

    // Get total expenses for a category in a given month
    getTotalExpensesForCategoryInMonth(category, monthKey = null) {
        const key = monthKey || this.getMonthKey();
        const expenses = this.getExpenses();
        return expenses.reduce((sum, exp) => {
            if (!exp.category || !exp.date) return sum;
            const expMonthKey = this.getMonthKey(new Date(exp.date));
            if (expMonthKey === key && exp.category === category) {
                const amt = parseFloat(exp.amount);
                return sum + (isNaN(amt) ? 0 : amt);
            }
            return sum;
        }, 0);
    }

    // Get total expenses for a month (all categories)
    getTotalExpensesForMonth(monthKey = null) {
        const key = monthKey || this.getMonthKey();
        const expenses = this.getExpenses();
        return expenses.reduce((sum, exp) => {
            if (!exp.date) return sum;
            const expMonthKey = this.getMonthKey(new Date(exp.date));
            if (expMonthKey === key) {
                const amt = parseFloat(exp.amount);
                return sum + (isNaN(amt) ? 0 : amt);
            }
            return sum;
        }, 0);
    }

    // Get total income for a year
    getTotalIncomeForYear(year = null) {
        const targetYear = year || new Date().getFullYear();
        const data = this.getStoredData();
        if (!data.income) return 0;
        
        let total = 0;
        for (const [monthKey, income] of Object.entries(data.income)) {
            const [yearStr] = monthKey.split('-');
            if (parseInt(yearStr) === targetYear) {
                total += parseFloat(income) || 0;
            }
        }
        return total;
    }

    // Get total expenses for a year
    getTotalExpensesForYear(year = null) {
        const targetYear = year || new Date().getFullYear();
        const expenses = this.getExpenses();
        return expenses.reduce((sum, exp) => {
            if (!exp.date) return sum;
            const expDate = new Date(exp.date);
            if (expDate.getFullYear() === targetYear) {
                const amt = parseFloat(exp.amount);
                return sum + (isNaN(amt) ? 0 : amt);
            }
            return sum;
        }, 0);
    }

    // Get expenses for a specific month
    getExpensesForMonth(monthKey = null) {
        const key = monthKey || this.getMonthKey();
        const expenses = this.getExpenses();
        return expenses.filter(exp => {
            if (!exp.date) return false;
            const expMonthKey = this.getMonthKey(new Date(exp.date));
            return expMonthKey === key;
        });
    }

    // Get all categories
    getCategories() {
        const data = this.getStoredData();
        return data.categories || [];
    }

    // Add a category
    addCategory(categoryName) {
        const data = this.getStoredData();
        if (!data.categories) {
            data.categories = [];
        }
        
        // Check if category already exists (case-insensitive)
        const categoryLower = categoryName.trim().toLowerCase();
        const exists = data.categories.some(cat => cat.toLowerCase() === categoryLower);
        
        if (exists) {
            return null; // Category already exists
        }
        
        // Add category
        data.categories.push(categoryName.trim());
        this.saveData(data);
        return categoryName.trim();
    }

    // Update a category
    updateCategory(oldName, newName) {
        const data = this.getStoredData();
        if (!data.categories) {
            return false;
        }
        
        const index = data.categories.findIndex(cat => cat === oldName);
        if (index !== -1) {
            data.categories[index] = newName.trim();
            this.saveData(data);
            return true;
        }
        return false;
    }

    // Delete a category
    deleteCategory(categoryName) {
        const data = this.getStoredData();
        if (!data.categories) {
            return false;
        }
        
        data.categories = data.categories.filter(cat => cat !== categoryName);
        this.saveData(data);
        return true;
    }
}

// Initialize the app
const expenseTracker = new ExpenseTracker();

// Track active timeouts to prevent interference
let activeTimeouts = [];

// Navigation handling (Logical Flow instead of History)
let isNavigatingBack = false;

// Store current editing/viewing month data
let currentEditingMonthKey = null;
let currentEditingExpenses = [];
let currentEditingYear = null;
let currentEditingMonthIndex = null;
let currentViewYear = null;
let currentViewMonthIndex = null;
let currentViewCategory = null;

// Track parameters for data-driven screens to allow refreshing on navigation
let lastSummaryParams = null;
let lastCategoryDetailParams = null;
let lastSavingsDetailParams = null;

// Deletion context
let expenseIdToDelete = null;
let deletionSourceScreen = null;
let deletionContext = null;

// Helper function to format numbers with comma separators
function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Screen navigation with state management
function showScreen(screenId, pushToHistory = true) {
    // Clear any pending timeouts that might interfere
    activeTimeouts.forEach(timeout => clearTimeout(timeout));
    activeTimeouts = [];
    
    // Get current screen
    const currentScreen = document.querySelector('.screen.active');
    const currentScreenId = currentScreen ? currentScreen.id : null;
    
    // Push to history only if it's a new screen and requested
    if (pushToHistory && currentScreenId !== screenId) {
        history.pushState({ screen: screenId }, '', '');
    }
    
    // Hide all screens first
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    // Show the target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        targetScreen.style.display = 'block';
    } else {
        console.error('Screen not found:', screenId);
    }
}

// Navigate back based on LOGICAL FLOW instead of browsing history
function navigateBack() {
    const currentScreen = document.querySelector('.screen.active');
    const currentId = currentScreen ? currentScreen.id : null;
    
    if (!currentId || currentId === 'main-menu-screen' || currentId === 'welcome-screen') {
        showExitConfirmation();
        return;
    }

    // Mapping of screens to their logical "parent" menu
    const logicalParent = {
        'income-view-screen': () => showScreen('main-menu-screen', false),
        'income-edit-screen': () => showIncomeViewScreen(false),
        'income-confirmation-screen': () => showScreen('main-menu-screen', false),
        'categories-main-screen': () => showScreen('main-menu-screen', false),
        'add-category-screen': () => showCategoriesMainScreen(false),
        'category-confirmation-screen': () => showCategoriesMainScreen(false),
        'edit-category-select-screen': () => showCategoriesMainScreen(false),
        'edit-category-form-screen': () => showEditCategorySelectScreen(false),
        'delete-category-select-screen': () => showCategoriesMainScreen(false),
        'delete-category-confirmation-screen': () => showDeleteCategorySelectScreen(false),
        'limits-screen': () => showScreen('main-menu-screen', false),
        'add-expense-screen': () => showScreen('main-menu-screen', false),
        'expense-added-screen': () => showAddExpenseScreen(false),
        'view-edit-expenses-screen': () => showScreen('main-menu-screen', false),
        'view-expenses-month-select-screen': () => showViewEditExpensesScreen(false),
        'view-expenses-month-summary-screen': () => showViewExpensesMonthSelectScreen(false),
        'category-expenses-detail-screen': () => {
            if (lastSummaryParams) showMonthSummaryScreen(lastSummaryParams.year, lastSummaryParams.monthIndex, false);
            else showViewExpensesMonthSelectScreen(false);
        },
        'edit-expenses-month-select-screen': () => showViewEditExpensesScreen(false),
        'edit-expenses-list-screen': () => showEditExpensesMonthSelectScreen(false),
        'expense-modified-screen': () => showEditExpensesMonthSelectScreen(false),
        'download-expenses-screen': () => showViewEditExpensesScreen(false),
        'download-confirmation-screen': () => showViewEditExpensesScreen(false),
        'view-savings-screen': () => showScreen('main-menu-screen', false),
        'monthly-savings-detail-screen': () => showViewSavingsScreen(false),
        'exit-confirmation-screen': () => showScreen('main-menu-screen', false),
        'delete-expense-confirmation-screen': () => {
            if (deletionSourceScreen === 'category-expenses-detail-screen' && deletionContext) {
                showCategoryExpensesDetailScreen(deletionContext.year, deletionContext.monthIndex, deletionContext.category, false);
            } else if (deletionSourceScreen === 'edit-expenses-list-screen') {
                showEditExpensesListScreen(currentEditingYear, currentEditingMonthIndex, false);
            } else {
                showScreen('main-menu-screen', false);
            }
        }
    };

    if (logicalParent[currentId]) {
        logicalParent[currentId]();
    } else {
        showScreen('main-menu-screen', false);
    }
}

// Show exit confirmation screen
function showExitConfirmation() {
    showScreen('exit-confirmation-screen');
}

// Handle app exit
function handleAppExit() {
    // For mobile browsers, we can't close the tab, but we can show a message
    alert('Thank you for using Munshiji!');
    window.location.href = 'about:blank';
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Handle browser back button (mobile back button)
    window.addEventListener('popstate', (e) => {
        navigateBack();
    });
    
    // Push initial state to history
    history.pushState({ screen: 'welcome-screen' }, '', '');
    
    // Show welcome screen initially
    showScreen('welcome-screen', false);
    
    // Auto-transition from welcome screen to main menu after 3 seconds
    setTimeout(() => {
        showScreen('main-menu-screen');
    }, 3000);
    
    // Handle menu button clicks
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const action = e.currentTarget.getAttribute('data-action');
            if (action) handleMenuAction(action);
        });
    });

    // Handle income screen buttons
    document.getElementById('continue-income-btn').addEventListener('click', handleContinueIncome);
    document.getElementById('edit-income-btn').addEventListener('click', showIncomeEditScreen);
    document.getElementById('set-income-btn').addEventListener('click', handleSetIncome);
    
    // Handle category screen buttons
    document.getElementById('add-category-btn').addEventListener('click', showAddCategoryScreen);
    document.getElementById('edit-category-btn').addEventListener('click', showEditCategorySelectScreen);
    document.getElementById('delete-category-btn').addEventListener('click', showDeleteCategorySelectScreen);
    document.getElementById('categories-back-menu-btn').addEventListener('click', () => showScreen('main-menu-screen'));
    document.getElementById('update-category-btn').addEventListener('click', handleUpdateCategory);
    document.getElementById('cancel-edit-category-btn').addEventListener('click', showCategoriesMainScreen);
    document.getElementById('delete-category-back-btn').addEventListener('click', showCategoriesMainScreen);
    document.getElementById('confirm-delete-category-btn').addEventListener('click', () => {
        if (window.currentDeletingCategory) handleDeleteCategory(window.currentDeletingCategory);
    });
    document.getElementById('cancel-delete-category-btn').addEventListener('click', showDeleteCategorySelectScreen);
    document.getElementById('set-category-btn').addEventListener('click', handleAddCategory);
    document.getElementById('back-to-menu-btn').addEventListener('click', () => showScreen('main-menu-screen'));

    // Handle limits screen buttons
    document.getElementById('set-limits-btn').addEventListener('click', handleSetLimits);
    document.getElementById('back-limits-menu-btn').addEventListener('click', () => showScreen('main-menu-screen'));

    // Handle add expense buttons
    document.getElementById('expense-add-btn').addEventListener('click', handleAddExpenseSubmit);
    document.getElementById('expense-category').addEventListener('change', (e) => updateExpenseLimitMessage(e.currentTarget.value));
    document.getElementById('expense-back-btn').addEventListener('click', () => showScreen('main-menu-screen'));
    document.getElementById('expense-add-another-btn').addEventListener('click', showAddExpenseScreen);
    document.getElementById('expense-no-more-btn').addEventListener('click', () => showScreen('main-menu-screen'));

    // Handle View/Edit Expenses buttons
    document.getElementById('view-monthwise-expenses-btn').addEventListener('click', showViewExpensesMonthSelectScreen);
    document.getElementById('edit-expense-btn').addEventListener('click', showEditExpensesMonthSelectScreen);
    document.getElementById('edit-month-select-back-btn').addEventListener('click', showViewEditExpensesScreen);
    document.getElementById('save-expenses-btn').addEventListener('click', handleSaveExpenses);
    document.getElementById('edit-expenses-list-back-btn').addEventListener('click', showEditExpensesMonthSelectScreen);
    document.getElementById('edit-more-expenses-btn').addEventListener('click', showEditExpensesMonthSelectScreen);
    document.getElementById('no-more-edit-expenses-btn').addEventListener('click', showViewEditExpensesScreen);
    document.getElementById('download-expenses-btn').addEventListener('click', showDownloadExpensesScreen);
    document.getElementById('download-data-btn').addEventListener('click', handleDownloadExpenses);
    document.getElementById('download-back-btn').addEventListener('click', showViewEditExpensesScreen);
    document.getElementById('back-view-expenses-menu-btn').addEventListener('click', () => showScreen('main-menu-screen'));
    
    // Handle savings screen buttons
    document.getElementById('savings-back-btn').addEventListener('click', () => showScreen('main-menu-screen'));
    document.getElementById('monthly-savings-back-btn').addEventListener('click', showViewSavingsScreen);
    
    // Handle exit confirmation buttons
    document.getElementById('exit-yes-btn').addEventListener('click', handleAppExit);
    document.getElementById('exit-no-btn').addEventListener('click', () => showScreen('main-menu-screen'));

    // Handle month summary back buttons
    document.getElementById('month-summary-back-btn').addEventListener('click', showViewExpensesMonthSelectScreen);
    document.getElementById('month-select-back-btn').addEventListener('click', showViewEditExpensesScreen);
    
    // Handle category expenses detail back button
    document.getElementById('category-expenses-back-btn').addEventListener('click', () => {
        if (currentViewYear !== null && currentViewMonthIndex !== null) {
            showMonthSummaryScreen(currentViewYear, currentViewMonthIndex, false);
        } else {
            showScreen('view-expenses-month-summary-screen');
        }
    });

    // Handle expense deletion confirmation
    document.getElementById('confirm-delete-expense-btn').addEventListener('click', handleDeleteExpense);
    document.getElementById('cancel-delete-expense-btn').addEventListener('click', () => {
        if (deletionSourceScreen === 'category-expenses-detail-screen' && deletionContext) {
            const { year, monthIndex, category } = deletionContext;
            showCategoryExpensesDetailScreen(year, monthIndex, category, false);
        } else if (deletionSourceScreen === 'edit-expenses-list-screen') {
            showEditExpensesListScreen(currentEditingYear, currentEditingMonthIndex, false);
        } else {
            showScreen('main-menu-screen');
        }
    });

    // Event Delegation for month summary clicks (to show category details)
    document.getElementById('month-summary-list').addEventListener('click', (e) => {
        const row = e.target.closest('.month-summary-row');
        if (!row) return;
        const category = row.getAttribute('data-category');
        const year = parseInt(row.getAttribute('data-year'), 10);
        const monthIndex = parseInt(row.getAttribute('data-month-index'), 10);
        if (category && !isNaN(year) && !isNaN(monthIndex)) {
            showCategoryExpensesDetailScreen(year, monthIndex, category);
        }
    });
});

// -------- INCOME FLOW --------
function showIncomeViewScreen(addToHistory = true) {
    const currentDate = new Date();
    const currentMonth = expenseTracker.getMonthName(currentDate);
    const currentMonthKey = expenseTracker.getMonthKey();
    const currentIncome = expenseTracker.getIncome(currentMonthKey);
    let incomeToShow = currentIncome || expenseTracker.getPreviousMonthIncome();

    document.getElementById('income-header-text').textContent = `Set Income for ${currentMonth}`;
    document.getElementById('previous-income-text').textContent = `Your Income considered is ${incomeToShow}`;
    showScreen('income-view-screen', addToHistory);
}

function handleContinueIncome() {
    const currentMonthKey = expenseTracker.getMonthKey();
    const currentIncome = expenseTracker.getIncome(currentMonthKey);
    if (currentIncome > 0) {
        showIncomeConfirmation(currentIncome);
        return;
    }
    const previousIncome = expenseTracker.getPreviousMonthIncome();
    if (previousIncome === 0) {
        alert('Please enter an income using the Edit button.');
        return;
    }
    expenseTracker.setIncome(previousIncome, currentMonthKey);
    showIncomeConfirmation(previousIncome);
}

function showIncomeConfirmation(income) {
    document.getElementById('income-confirmation-text').textContent = `Income has been set to ${income}`;
    showScreen('income-confirmation-screen');
    const timeout = setTimeout(() => showScreen('main-menu-screen'), 3000);
    activeTimeouts.push(timeout);
}

function showIncomeEditScreen() {
    const currentMonth = expenseTracker.getMonthName(new Date());
    const currentIncome = expenseTracker.getIncome(expenseTracker.getMonthKey());
    document.getElementById('income-edit-header-text').textContent = `Please set your income for ${currentMonth}`;
    document.getElementById('income-input').value = currentIncome > 0 ? currentIncome : '';
    document.getElementById('income-success-message').textContent = '';
    showScreen('income-edit-screen');
}

function handleSetIncome() {
    const incomeValue = parseFloat(document.getElementById('income-input').value);
    if (isNaN(incomeValue) || incomeValue < 0) {
        alert('Please enter a valid income amount.');
        return;
    }
    expenseTracker.setIncome(incomeValue);
    document.getElementById('income-success-message').textContent = `Your income has been set to ${incomeValue}`;
    const timeout = setTimeout(() => showScreen('main-menu-screen'), 2000);
    activeTimeouts.push(timeout);
}

// -------- CATEGORY FLOW --------
function showCategoriesMainScreen(addToHistory = true) {
    showScreen('categories-main-screen', addToHistory);
    renderCategoriesList('categories-list');
}

function renderCategoriesList(containerId) {
    const categories = expenseTracker.getCategories();
    const container = document.getElementById(containerId);
    if (categories.length === 0) {
        container.innerHTML = '<p class="no-categories">No categories added yet.</p>';
        return;
    }
    container.innerHTML = categories.map(cat => `<div class="category-box">${cat}</div>`).join('');
}

function showAddCategoryScreen() {
    document.getElementById('category-input').value = '';
    showScreen('add-category-screen');
}

function handleAddCategory() {
    const categoryName = document.getElementById('category-input').value.trim();
    if (!categoryName) return alert('Please enter a category name.');
    const added = expenseTracker.addCategory(categoryName);
    if (!added) return alert('This category already exists.');
    
    document.getElementById('category-confirmation-text').textContent = `Your new category "${added}" has been set!`;
    renderCategoriesList('confirmation-categories-list');
    showScreen('category-confirmation-screen');
}

function showEditCategorySelectScreen(addToHistory = true) {
    const categories = expenseTracker.getCategories();
    if (categories.length === 0) return alert('No categories available to edit.');
    const container = document.getElementById('edit-category-list');
    container.innerHTML = categories.map(cat => `<button class="category-box category-select-btn" data-category="${cat}">${cat}</button>`).join('');
    container.querySelectorAll('.category-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showEditCategoryFormScreen(e.currentTarget.getAttribute('data-category')));
    });
    showScreen('edit-category-select-screen', addToHistory);
}

function showEditCategoryFormScreen(categoryName) {
    window.currentEditingCategory = categoryName;
    document.getElementById('edit-category-header-text').textContent = `Edit ${categoryName} to`;
    document.getElementById('edit-category-input').value = categoryName;
    document.getElementById('edit-category-error').textContent = '';
    showScreen('edit-category-form-screen');
}

function handleUpdateCategory() {
    const newName = document.getElementById('edit-category-input').value.trim();
    if (!newName) return (document.getElementById('edit-category-error').textContent = 'Please enter a name.');
    const categories = expenseTracker.getCategories();
    if (categories.some(cat => cat.toLowerCase() === newName.toLowerCase() && cat !== window.currentEditingCategory)) {
        return (document.getElementById('edit-category-error').textContent = 'Category already exists.');
    }
    if (expenseTracker.updateCategory(window.currentEditingCategory, newName)) showCategoriesMainScreen();
}

function showDeleteCategorySelectScreen(addToHistory = true) {
    const categories = expenseTracker.getCategories();
    if (categories.length === 0) return alert('No categories available to delete.');
    const container = document.getElementById('delete-category-list');
    container.innerHTML = categories.map(cat => `<button class="category-box category-select-btn" data-category="${cat}">${cat}</button>`).join('');
    container.querySelectorAll('.category-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showDeleteCategoryConfirmationScreen(e.currentTarget.getAttribute('data-category')));
    });
    showScreen('delete-category-select-screen', addToHistory);
}

function showDeleteCategoryConfirmationScreen(categoryName) {
    window.currentDeletingCategory = categoryName;
    document.getElementById('delete-category-confirmation-text').textContent = `Are you sure you want to delete ${categoryName}?`;
    showScreen('delete-category-confirmation-screen');
}

function handleDeleteCategory(categoryName) {
    if (expenseTracker.deleteCategory(categoryName)) showCategoriesMainScreen();
}

// -------- LIMITS FLOW --------
function showLimitsScreen(addToHistory = true) {
    const categories = expenseTracker.getCategories();
    const container = document.getElementById('limits-list');
    const currentMonthKey = expenseTracker.getMonthKey();
    const limits = expenseTracker.getLimitsForMonth(currentMonthKey);

    if (categories.length === 0) {
        container.innerHTML = '<p class="no-categories">No categories added yet.</p>';
    } else {
        container.innerHTML = categories.map(cat => `
            <div class="limit-row">
                <div class="limit-category-name">${cat}</div>
                <div class="limit-input-wrapper">
                    <input type="number" class="limit-input" data-category="${cat}" value="${limits[cat] || 0}" min="0" step="0.01">
                    <div class="limit-error-text" data-error="${cat}"></div>
                </div>
            </div>
        `).join('');
    }
    document.getElementById('limits-message').textContent = '';
    showScreen('limits-screen', addToHistory);
}

function handleSetLimits() {
    const currentIncome = expenseTracker.getIncome();
    const categories = expenseTracker.getCategories();
    const newLimits = {};
    let hasError = false;

    categories.forEach(cat => {
        const input = document.querySelector(`.limit-input[data-category="${cat}"]`);
        const errorEl = document.querySelector(`.limit-error-text[data-error="${cat}"]`);
        const value = parseFloat(input.value);
        input.classList.remove('input-error');
        errorEl.textContent = '';

        if (isNaN(value) || value === 0) {
            errorEl.textContent = 'Limit cannot be 0';
            input.classList.add('input-error');
            hasError = true;
        } else if (value > currentIncome) {
            errorEl.textContent = 'Higher than income';
            input.classList.add('input-error');
            hasError = true;
        } else {
            newLimits[cat] = value;
        }
    });

    if (!hasError) {
        expenseTracker.setLimitsForMonth(newLimits);
        const msg = document.getElementById('limits-message');
        msg.textContent = 'Limits have been set';
        msg.className = 'limits-message success';
    }
}

// -------- EXPENSE FLOW --------
function showAddExpenseScreen(addToHistory = true) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
    const categories = expenseTracker.getCategories();
    const select = document.getElementById('expense-category');
    select.innerHTML = categories.length ? '<option value="" disabled selected>Select a category</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('') : '<option value="">No categories</option>';
    select.disabled = !categories.length;
    document.getElementById('expense-value').value = '';
    document.getElementById('expense-comment').value = '';
    document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
    document.querySelectorAll('.expense-input').forEach(i => i.classList.remove('input-error'));
    document.getElementById('expense-limit-message').textContent = '';
    showScreen('add-expense-screen', addToHistory);
}

function updateExpenseLimitMessage(category) {
    const msgEl = document.getElementById('expense-limit-message');
    msgEl.textContent = '';
    if (!category) return;
    const limit = expenseTracker.getLimitsForMonth()[category];
    if (!limit) return;
    const spent = expenseTracker.getTotalExpensesForCategoryInMonth(category);
    const percent = Math.round((spent / limit) * 100);
    if (percent >= 80) {
        msgEl.textContent = `Expense is at ${percent}% limit for ${expenseTracker.getMonthName()}`;
        msgEl.className = 'expense-limit-message ' + (percent >= 100 ? 'expense-limit-critical' : 'expense-limit-warning');
    }
}

function handleAddExpenseSubmit() {
    const date = document.getElementById('expense-date').value;
    const cat = document.getElementById('expense-category').value;
    const val = parseFloat(document.getElementById('expense-value').value);
    const comment = document.getElementById('expense-comment').value.trim();
    let hasError = false;

    if (!date) hasError = !!(document.getElementById('expense-date-error').textContent = 'Cannot be blank');
    if (!cat) hasError = !!(document.getElementById('expense-category-error').textContent = 'Cannot be blank');
    if (isNaN(val) || val <= 0) hasError = !!(document.getElementById('expense-value-error').textContent = 'Cannot be blank');
    if (!comment) hasError = !!(document.getElementById('expense-comment-error').textContent = 'Cannot be blank');

    if (!hasError) {
        expenseTracker.addExpense({ date: new Date(date).toISOString(), category: cat, amount: val, comment });
        showScreen('expense-added-screen');
    }
}

// -------- VIEW/EDIT FLOW --------
function showViewEditExpensesScreen(addToHistory = true) { showScreen('view-edit-expenses-screen', addToHistory); }

function showViewExpensesMonthSelectScreen(addToHistory = true) {
    const container = document.getElementById('month-buttons-container');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const year = new Date().getFullYear();
    container.innerHTML = monthNames.map((name, i) => `<button class="btn btn-secondary month-btn" data-month="${i}">${name}</button>`).join('');
    container.querySelectorAll('.month-btn').forEach(btn => btn.addEventListener('click', (e) => showMonthSummaryScreen(year, parseInt(e.currentTarget.getAttribute('data-month')))));
    showScreen('view-expenses-month-select-screen', addToHistory);
}

function showMonthSummaryScreen(year, monthIndex, addToHistory = true) {
    lastSummaryParams = { year, monthIndex };
    currentViewYear = year;
    currentViewMonthIndex = monthIndex;
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const totals = expenseTracker.getTotalExpensesForMonth(monthKey);
    const limitsObj = expenseTracker.getLimitsForMonth(monthKey);
    const totalLimit = Object.values(limitsObj).reduce((s, v) => s + v, 0);

    document.getElementById('month-summary-title').textContent = `${expenseTracker.getMonthName(new Date(year, monthIndex))} ${year} - Summary`;
    document.getElementById('month-summary-totals').textContent = `Total expenses: ${formatCurrency(totals)} | Total limits: ${formatCurrency(totalLimit)}`;
    document.getElementById('month-summary-percentage').textContent = totalLimit > 0 ? `Overall usage: ${((totals/totalLimit)*100).toFixed(1)}%` : 'No limits set';

    const categories = expenseTracker.getCategories();
    const listEl = document.getElementById('month-summary-list');
    const rows = categories.map(cat => {
        const lim = limitsObj[cat] || 0;
        const tot = expenseTracker.getTotalExpensesForCategoryInMonth(cat, monthKey);
        if (tot === 0 && lim === 0) return '';
        const pct = lim > 0 ? (tot / lim) * 100 : 0;
        const cls = lim > 0 ? (pct > 100 ? ' critical' : (pct >= 80 ? ' warning' : '')) : '';
        return `<div class="month-summary-row${cls}" data-category="${cat}" data-year="${year}" data-month-index="${monthIndex}">
            <span>${cat}</span><span>${formatCurrency(tot)}</span><span>${formatCurrency(lim)}</span><span>${lim > 0 ? pct.toFixed(1)+'%' : '-'}</span>
        </div>`;
    }).filter(r => r !== '').join('');
    
    listEl.innerHTML = rows || '<div class="month-summary-row"><span>No data</span></div>';
    showScreen('view-expenses-month-summary-screen', addToHistory);
}

function showCategoryExpensesDetailScreen(year, monthIndex, category, addToHistory = true) {
    lastCategoryDetailParams = { year, monthIndex, category };
    currentViewYear = year;
    currentViewMonthIndex = monthIndex;
    currentViewCategory = category;
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const expenses = expenseTracker.getExpensesForMonth(monthKey).filter(e => e.category === category).sort((a,b) => new Date(a.date) - new Date(b.date));

    document.getElementById('category-expenses-title').textContent = `${category} - ${expenseTracker.getMonthName(new Date(year, monthIndex))} ${year}`;
    const listEl = document.getElementById('category-expenses-list');
    listEl.innerHTML = expenses.length ? expenses.map(e => {
        const d = new Date(e.date);
        const dStr = `${String(d.getDate()).padStart(2,'0')}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
        return `<div class="category-expense-row">
            <button class="btn-delete-expense" data-id="${e.id}">-</button>
            <span>${dStr}</span><span>${formatCurrency(e.amount)}</span><span>${e.comment || ''}</span>
        </div>`;
    }).join('') : '<div class="category-expense-row"><span>No expenses</span></div>';

    listEl.querySelectorAll('.btn-delete-expense').forEach(btn => {
        btn.addEventListener('click', (e) => showDeleteExpenseConfirmation(e.currentTarget.getAttribute('data-id'), 'category-expenses-detail-screen', { year, monthIndex, category }));
    });

    showScreen('category-expenses-detail-screen', addToHistory);
}

function showEditExpensesMonthSelectScreen(addToHistory = true) {
    const container = document.getElementById('edit-month-buttons-container');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const year = new Date().getFullYear();
    container.innerHTML = monthNames.map((name, i) => `<button class="btn btn-secondary month-btn" data-month="${i}">${name}</button>`).join('');
    container.querySelectorAll('.month-btn').forEach(btn => btn.addEventListener('click', (e) => showEditExpensesListScreen(year, parseInt(e.currentTarget.getAttribute('data-month')))));
    showScreen('edit-expenses-month-select-screen', addToHistory);
}

function showEditExpensesListScreen(year, monthIndex, addToHistory = true) {
    currentEditingYear = year;
    currentEditingMonthIndex = monthIndex;
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const expenses = expenseTracker.getExpenses().filter(e => e.date && expenseTracker.getMonthKey(new Date(e.date)) === monthKey).sort((a,b) => new Date(b.date) - new Date(a.date));
    
    document.getElementById('edit-expenses-month-title').textContent = `Edit Expenses - ${expenseTracker.getMonthName(new Date(year, monthIndex))} ${year}`;
    const listEl = document.getElementById('edit-expenses-list');
    if (!expenses.length) {
        listEl.innerHTML = '<div class="edit-expense-row-empty"><p>No expenses found</p></div>';
    } else {
        const cats = expenseTracker.getCategories();
        listEl.innerHTML = expenses.map(e => {
            const dateStr = new Date(e.date).toISOString().split('T')[0];
            const catOptions = cats.map(c => `<option value="${c}" ${e.category === c ? 'selected' : ''}>${c}</option>`).join('');
            return `<div class="edit-expense-row" data-id="${e.id}">
                <button class="btn-delete-expense" data-id="${e.id}">-</button>
                <input type="date" class="edit-expense-date" value="${dateStr}">
                <select class="edit-expense-category">${catOptions}</select>
                <input type="number" class="edit-expense-value" value="${e.amount || 0}" step="0.01">
                <input type="text" class="edit-expense-comment" value="${(e.comment || '').replace(/"/g, '&quot;')}">
            </div>`;
        }).join('');
        listEl.querySelectorAll('.btn-delete-expense').forEach(btn => {
            btn.addEventListener('click', (e) => showDeleteExpenseConfirmation(e.currentTarget.getAttribute('data-id'), 'edit-expenses-list-screen'));
        });
    }
    showScreen('edit-expenses-list-screen', addToHistory);
}

function handleSaveExpenses() {
    const rows = document.querySelectorAll('.edit-expense-row');
    let hasError = false;
    rows.forEach(row => {
        const id = row.getAttribute('data-id');
        const date = row.querySelector('.edit-expense-date').value;
        const cat = row.querySelector('.edit-expense-category').value;
        const amt = parseFloat(row.querySelector('.edit-expense-value').value);
        const comm = row.querySelector('.edit-expense-comment').value.trim();
        
        if (!date || !cat || isNaN(amt) || amt <= 0 || !comm) {
            row.querySelectorAll('input, select').forEach(i => i.classList.add('input-error'));
            hasError = true;
        } else {
            expenseTracker.updateExpense(id, { date: new Date(date).toISOString(), category: cat, amount: amt, comment: comm });
        }
    });
    if (!hasError) showScreen('expense-modified-screen');
    else alert('Please fix highlighted fields.');
}

// -------- DOWNLOAD FLOW --------
function showDownloadExpensesScreen(addToHistory = true) {
    const container = document.getElementById('download-month-buttons-container');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const year = new Date().getFullYear();
    container.innerHTML = monthNames.map((name, i) => `<button class="btn btn-secondary month-btn" data-month="${i}">${name}</button>`).join('');
    
    window.selectedDownloadMonth = null;
    window.selectedDownloadYear = null;
    const fromDate = document.getElementById('download-from-date');
    const toDate = document.getElementById('download-to-date');
    fromDate.value = ''; toDate.value = '';

    container.querySelectorAll('.month-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            container.querySelectorAll('.month-btn').forEach(b => b.className = 'btn btn-secondary month-btn');
            e.currentTarget.className = 'btn btn-primary month-btn';
            window.selectedDownloadMonth = parseInt(e.currentTarget.getAttribute('data-month'));
            window.selectedDownloadYear = year;
            fromDate.value = ''; toDate.value = '';
        });
    });
    showScreen('download-expenses-screen', addToHistory);
}

function handleDownloadExpenses() {
    const from = document.getElementById('download-from-date').value;
    const to = document.getElementById('download-to-date').value;
    let expenses = [];
    
    if (from && to) {
        if (new Date(from) > new Date(to)) return alert('Invalid date range');
        expenses = expenseTracker.getExpenses().filter(e => {
            const d = new Date(e.date);
            return d >= new Date(from) && d <= new Date(to);
        });
    } else if (window.selectedDownloadMonth !== null) {
        const key = `${window.selectedDownloadYear}-${String(window.selectedDownloadMonth + 1).padStart(2, '0')}`;
        expenses = expenseTracker.getExpenses().filter(e => e.date && expenseTracker.getMonthKey(new Date(e.date)) === key);
    } else {
        return alert('Please select a month or range');
    }

    if (!expenses.length) return alert('No expenses found');
    expenses.sort((a,b) => new Date(a.date) - new Date(b.date));
    
    const csv = ['Date,Category,Expense Value,Item/Comment', ...expenses.map(e => {
        const d = new Date(e.date);
        return `"${d.toLocaleDateString()}","${e.category.replace(/"/g,'""')}","${e.amount.toFixed(2)}","${(e.comment||'').replace(/"/g,'""')}"`;
    })].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'expenses.csv';
    link.click();
    
    showScreen('download-confirmation-screen');
    setTimeout(() => showViewEditExpensesScreen(), 2000);
}

// -------- SAVINGS FLOW --------
function showViewSavingsScreen(addToHistory = true) {
    const container = document.getElementById('savings-month-buttons-container');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const year = new Date().getFullYear();
    const yearlySavings = expenseTracker.getTotalIncomeForYear(year) - expenseTracker.getTotalExpensesForYear(year);
    document.getElementById('yearly-savings-total').textContent = formatCurrency(yearlySavings);

    container.innerHTML = monthNames.map((name, i) => `<button class="btn btn-secondary month-btn" data-month="${i}">${name}</button>`).join('');
    container.querySelectorAll('.month-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showMonthlySavingsDetailScreen(year, parseInt(e.currentTarget.getAttribute('data-month'))));
    });
    showScreen('view-savings-screen', addToHistory);
}

function showMonthlySavingsDetailScreen(year, monthIndex, addToHistory = true) {
    lastSavingsDetailParams = { year, monthIndex };
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const income = expenseTracker.getIncome(monthKey);
    const expenses = expenseTracker.getTotalExpensesForMonth(monthKey);
    
    document.getElementById('monthly-savings-title').textContent = `${expenseTracker.getMonthName(new Date(year, monthIndex))} ${year} - Savings`;
    document.getElementById('monthly-savings-total').textContent = formatCurrency(income - expenses);
    
    const cats = expenseTracker.getCategories();
    const limits = expenseTracker.getLimitsForMonth(monthKey);
    const listEl = document.getElementById('category-savings-list');
    const rows = cats.map(cat => {
        const lim = parseFloat(limits[cat]) || 0;
        if (lim <= 0) return '';
        const exp = expenseTracker.getTotalExpensesForCategoryInMonth(cat, monthKey);
        return `<div class="month-summary-row">
            <span>${cat}</span><span>${formatCurrency(lim)}</span><span>${formatCurrency(exp)}</span><span>${formatCurrency(lim - exp)}</span>
        </div>`;
    }).filter(r => r !== '').join('');
    
    listEl.innerHTML = rows || '<div class="month-summary-row"><span>No limits set</span></div>';
    showScreen('monthly-savings-detail-screen', addToHistory);
}

// -------- DELETION FLOW --------
function showDeleteExpenseConfirmation(id, sourceScreen, context = null) {
    expenseIdToDelete = id;
    deletionSourceScreen = sourceScreen;
    deletionContext = context;
    showScreen('delete-expense-confirmation-screen');
}

function handleDeleteExpense() {
    if (expenseIdToDelete) {
        expenseTracker.deleteExpense(expenseIdToDelete);
        if (deletionSourceScreen === 'category-expenses-detail-screen' && deletionContext) {
            showCategoryExpensesDetailScreen(deletionContext.year, deletionContext.monthIndex, deletionContext.category, false);
        } else if (deletionSourceScreen === 'edit-expenses-list-screen') {
            showEditExpensesListScreen(currentEditingYear, currentEditingMonthIndex, false);
        }
        expenseIdToDelete = null; deletionSourceScreen = null; deletionContext = null;
    }
}

// -------- MENU ACTION HANDLER --------
function handleMenuAction(action) {
    activeTimeouts.forEach(t => clearTimeout(t));
    activeTimeouts = [];
    switch(action) {
        case 'income': showIncomeViewScreen(); break;
        case 'categories': showCategoriesMainScreen(); break;
        case 'limits': showLimitsScreen(); break;
        case 'add-expense': showAddExpenseScreen(); break;
        case 'view-expense': showViewEditExpensesScreen(); break;
        case 'savings': showViewSavingsScreen(); break;
        case 'exit': showExitConfirmation(); break;
    }
}
