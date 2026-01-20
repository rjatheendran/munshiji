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

// Navigation history stack for back button handling
let navigationHistory = [];
let isNavigatingBack = false;

// Screen navigation with history tracking
function showScreen(screenId, addToHistory = true) {
    // Clear any pending timeouts that might interfere
    activeTimeouts.forEach(timeout => clearTimeout(timeout));
    activeTimeouts = [];
    
    // Get current screen
    const currentScreen = document.querySelector('.screen.active');
    const currentScreenId = currentScreen ? currentScreen.id : null;
    
    // Add to history if not navigating back and not the same screen
    if (addToHistory && !isNavigatingBack && currentScreenId && currentScreenId !== screenId) {
        navigationHistory.push(currentScreenId);
        // Push state to browser history for back button support
        history.pushState({ screen: screenId }, '', '');
        // Limit history to prevent memory issues
        if (navigationHistory.length > 50) {
            navigationHistory.shift();
        }
    }
    
    isNavigatingBack = false;
    
    // Hide all screens first - force hide with inline style
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

// Navigate back to previous screen
function navigateBack() {
    const currentScreen = document.querySelector('.screen.active');
    const currentScreenId = currentScreen ? currentScreen.id : null;
    
    // If on main menu, show exit confirmation
    if (currentScreenId === 'main-menu-screen') {
        showExitConfirmation();
        return;
    }
    
    // If there's history, go back
    if (navigationHistory.length > 0) {
        isNavigatingBack = true;
        const previousScreen = navigationHistory.pop();
        showScreen(previousScreen, false);
    } else {
        // No history, go to main menu
        isNavigatingBack = true;
        showScreen('main-menu-screen', false);
    }
}

// Show exit confirmation screen
function showExitConfirmation() {
    const exitScreen = document.getElementById('exit-confirmation-screen');
    if (exitScreen) {
        showScreen('exit-confirmation-screen');
    } else {
        // Fallback to browser confirm if screen doesn't exist
        if (confirm('Are you sure you want to exit?')) {
            handleAppExit();
        }
    }
}

// Handle app exit
function handleAppExit() {
    // Try to close the window (works if opened by script)
    if (window.opener) {
        window.close();
    } else {
        // For mobile browsers, we can't close the tab, but we can show a message
        alert('Thank you for using Munshiji!');
        // Try to navigate away (may not work in all browsers)
        window.location.href = 'about:blank';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Expense Tracker App initialized');
    
    // Initialize navigation history
    navigationHistory = [];
    
    // Handle browser back button (mobile back button)
    window.addEventListener('popstate', (e) => {
        navigateBack();
    });
    
    // Push initial state to history
    history.pushState({ screen: 'welcome-screen' }, '', '');
    
    // Show welcome screen initially (don't add to history)
    showScreen('welcome-screen', false);
    
    // Auto-transition from welcome screen to main menu after 3 seconds
    setTimeout(() => {
        showScreen('main-menu-screen');
    }, 3000);
    
    // Handle menu button clicks
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Use currentTarget to get the button, not the clicked child element
            const action = e.currentTarget.getAttribute('data-action');
            if (action) {
                handleMenuAction(action);
            }
        });
    });

    // Handle income screen buttons
    document.getElementById('continue-income-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleContinueIncome();
    });
    document.getElementById('edit-income-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showIncomeEditScreen();
    });
    document.getElementById('set-income-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSetIncome();
    });
    
    // Handle Enter key in income input
    document.getElementById('income-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSetIncome();
        }
    });

    // Handle category screen buttons
    document.getElementById('add-category-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showAddCategoryScreen();
    });
    document.getElementById('edit-category-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showEditCategorySelectScreen();
    });
    document.getElementById('categories-back-menu-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreen('main-menu-screen');
    });
    
    // Handle edit category buttons
    document.getElementById('update-category-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleUpdateCategory();
    });
    
    document.getElementById('cancel-edit-category-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showCategoriesMainScreen();
    });
    
    // Handle Enter key in edit category input
    document.getElementById('edit-category-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUpdateCategory();
        }
    });

    // Handle limits screen buttons
    document.getElementById('set-limits-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSetLimits();
    });
    document.getElementById('back-limits-menu-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreen('main-menu-screen');
    });

    // Handle add expense buttons
    document.getElementById('expense-add-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAddExpenseSubmit();
    });
    document.getElementById('expense-category').addEventListener('change', (e) => {
        updateExpenseLimitMessage(e.currentTarget.value);
    });
    document.getElementById('expense-back-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreen('main-menu-screen');
    });
    document.getElementById('expense-add-another-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showAddExpenseScreen();
    });
    document.getElementById('expense-no-more-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreen('main-menu-screen');
    });

    // Handle View/Edit Expenses buttons
    document.getElementById('view-monthwise-expenses-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showViewExpensesMonthSelectScreen();
    });
    document.getElementById('edit-expense-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showEditExpensesMonthSelectScreen();
    });
    
    // Handle edit expenses buttons
    document.getElementById('edit-month-select-back-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showViewEditExpensesScreen();
    });
    document.getElementById('save-expenses-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSaveExpenses();
    });
    document.getElementById('edit-expenses-list-back-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showEditExpensesMonthSelectScreen();
    });
    document.getElementById('edit-more-expenses-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showEditExpensesMonthSelectScreen();
    });
    document.getElementById('no-more-edit-expenses-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showViewEditExpensesScreen();
    });
    document.getElementById('download-expenses-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showDownloadExpensesScreen();
    });
    document.getElementById('download-data-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDownloadExpenses();
    });
    document.getElementById('download-back-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showViewEditExpensesScreen();
    });
    document.getElementById('back-view-expenses-menu-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreen('main-menu-screen');
    });
    
    // Handle savings screen buttons
    document.getElementById('savings-back-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreen('main-menu-screen');
    });
    document.getElementById('monthly-savings-back-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showViewSavingsScreen();
    });
    
    // Handle exit confirmation buttons
    document.getElementById('exit-yes-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAppExit();
    });
    document.getElementById('exit-no-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreen('main-menu-screen');
    });

    // Handle month summary back button
    document.getElementById('month-summary-back-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showViewExpensesMonthSelectScreen();
    });
    document.getElementById('month-select-back-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showViewEditExpensesScreen();
    });
    document.getElementById('set-category-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAddCategory();
    });
    document.getElementById('back-to-menu-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Explicitly clear any income-related screens
        const incomeConfirmation = document.getElementById('income-confirmation-screen');
        if (incomeConfirmation) {
            incomeConfirmation.classList.remove('active');
            incomeConfirmation.style.display = 'none';
        }
        showScreen('main-menu-screen');
    });

    // Handle category expenses detail back button
    const categoryExpensesBackBtn = document.getElementById('category-expenses-back-btn');
    if (categoryExpensesBackBtn) {
        categoryExpensesBackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Go back to the month summary screen
            showScreen('view-expenses-month-summary-screen');
        });
    }

    // Make month summary rows clickable to show category-wise expenses
    const monthSummaryListEl = document.getElementById('month-summary-list');
    if (monthSummaryListEl) {
        monthSummaryListEl.addEventListener('click', (e) => {
            const row = e.target.closest('.month-summary-row');
            if (!row) return;

            const category = row.getAttribute('data-category');
            const yearAttr = row.getAttribute('data-year');
            const monthIndexAttr = row.getAttribute('data-month-index');

            if (!category || yearAttr === null || monthIndexAttr === null) return;

            const year = parseInt(yearAttr, 10);
            const monthIndex = parseInt(monthIndexAttr, 10);

            if (isNaN(year) || isNaN(monthIndex)) return;

            showCategoryExpensesDetailScreen(year, monthIndex, category);
        });
    }
    
    // Handle Enter key in category input
    document.getElementById('category-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddCategory();
        }
    });
});

// Show income view screen
function showIncomeViewScreen() {
    const currentDate = new Date();
    const currentMonth = expenseTracker.getMonthName(currentDate);
    
    // Check if current month has income set
    const currentMonthKey = expenseTracker.getMonthKey();
    const currentIncome = expenseTracker.getIncome(currentMonthKey);
    
    // If current month has income, show that, otherwise show previous month's income
    let incomeToShow = currentIncome;
    if (incomeToShow === 0) {
        incomeToShow = expenseTracker.getPreviousMonthIncome();
    }

    // Update header
    document.getElementById('income-header-text').textContent = `Set Income for ${currentMonth}`;
    
    // Update income text - show current if exists, otherwise show previous as suggestion
    if (currentIncome > 0) {
        document.getElementById('previous-income-text').textContent = `Your Income considered is ${currentIncome}`;
    } else {
        document.getElementById('previous-income-text').textContent = `Your Income considered is ${incomeToShow}`;
    }

    showScreen('income-view-screen');
}

// Handle continue income
function handleContinueIncome() {
    const currentMonthKey = expenseTracker.getMonthKey();
    const currentIncome = expenseTracker.getIncome(currentMonthKey);
    
    // If current month already has income, use that
    if (currentIncome > 0) {
        showIncomeConfirmation(currentIncome);
        return;
    }
    
    // Otherwise, check previous month's income
    const previousIncome = expenseTracker.getPreviousMonthIncome();
    
    if (previousIncome === 0) {
        // If income is 0, prompt to use edit button
        alert('Please enter an income using the Edit button.');
        return;
    }

    // Set current month income to previous month income
    expenseTracker.setIncome(previousIncome, currentMonthKey);

    // Show confirmation
    showIncomeConfirmation(previousIncome);
}

// Show income confirmation
function showIncomeConfirmation(income) {
    document.getElementById('income-confirmation-text').textContent = `Income has been set to ${income}`;
    showScreen('income-confirmation-screen');

    // Return to main menu after 3 seconds
    const timeout = setTimeout(() => {
        showScreen('main-menu-screen');
    }, 3000);
    activeTimeouts.push(timeout);
}

// Show income edit screen
function showIncomeEditScreen() {
    const currentDate = new Date();
    const currentMonth = expenseTracker.getMonthName(currentDate);
    
    // Pre-fill with current income if it exists
    const currentMonthKey = expenseTracker.getMonthKey();
    const currentIncome = expenseTracker.getIncome(currentMonthKey);
    
    document.getElementById('income-edit-header-text').textContent = `Please set your income for ${currentMonth}`;
    document.getElementById('income-input').value = currentIncome > 0 ? currentIncome : '';
    document.getElementById('income-success-message').textContent = '';
    
    showScreen('income-edit-screen');
}

// Handle set income
function handleSetIncome() {
    const incomeInput = document.getElementById('income-input');
    const incomeValue = parseFloat(incomeInput.value);

    if (isNaN(incomeValue) || incomeValue < 0) {
        alert('Please enter a valid income amount.');
        return;
    }

    // Set income for current month
    const currentMonthKey = expenseTracker.getMonthKey();
    expenseTracker.setIncome(incomeValue, currentMonthKey);

    // Show success message
    document.getElementById('income-success-message').textContent = `Your income has been set to ${incomeValue}`;
    
    // Clear input after a moment and return to main menu
    const timeout = setTimeout(() => {
        showScreen('main-menu-screen');
    }, 2000);
    activeTimeouts.push(timeout);
}

// Render categories list
function renderCategoriesList(containerId) {
    const categories = expenseTracker.getCategories();
    const container = document.getElementById(containerId);
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="no-categories">No categories added yet.</p>';
        return;
    }
    
    container.innerHTML = categories.map(category => 
        `<div class="category-box">${category}</div>`
    ).join('');
}

// Render limits form rows for all categories
function renderLimitsForm() {
    const categories = expenseTracker.getCategories();
    const container = document.getElementById('limits-list');
    const currentMonthKey = expenseTracker.getMonthKey();
    const limitsForMonth = expenseTracker.getLimitsForMonth(currentMonthKey);

    if (categories.length === 0) {
        container.innerHTML = '<p class="no-categories">No categories added yet. Please add categories first.</p>';
        return;
    }

    container.innerHTML = categories.map(category => {
        const existingLimit = limitsForMonth[category] || 0;
        return `
            <div class="limit-row" data-category="${category}">
                <div class="limit-category-name">${category}</div>
                <div class="limit-input-wrapper">
                    <input 
                        type="number" 
                        class="limit-input" 
                        data-category-input="${category}" 
                        value="${existingLimit}" 
                        min="0" 
                        step="0.01"
                    />
                    <div class="limit-error-text" data-category-error="${category}"></div>
                </div>
            </div>
        `;
    }).join('');

    // Clear global limits message
    const msg = document.getElementById('limits-message');
    msg.textContent = '';
    msg.classList.remove('success', 'error');
}

// Show limits screen
function showLimitsScreen() {
    renderLimitsForm();
    showScreen('limits-screen');
}

// Handle setting limits with validation
function handleSetLimits() {
    const currentIncome = expenseTracker.getIncome();
    const currentMonthKey = expenseTracker.getMonthKey();
    const categories = expenseTracker.getCategories();
    const limitsMessage = document.getElementById('limits-message');

    // Reset message
    limitsMessage.textContent = '';
    limitsMessage.classList.remove('success', 'error');

    if (categories.length === 0) {
        limitsMessage.textContent = 'No categories available. Please add categories first.';
        limitsMessage.classList.add('error');
        return;
    }

    const newLimits = {};
    let hasError = false;

    categories.forEach(category => {
        const input = document.querySelector(`.limit-input[data-category-input="${category}"]`);
        const errorEl = document.querySelector(`.limit-error-text[data-category-error="${category}"]`);

        if (!input || !errorEl) return;

        // Reset previous state
        input.classList.remove('input-error');
        errorEl.textContent = '';

        const value = parseFloat(input.value);

        // Validation: not NaN, > 0
        if (isNaN(value) || value === 0) {
            errorEl.textContent = 'Limit cannot be 0';
            input.classList.add('input-error');
            hasError = true;
            return;
        }

        // Validation: not higher than current income
        if (value > currentIncome) {
            errorEl.textContent = 'Limit higher than income for the month';
            input.classList.add('input-error');
            hasError = true;
            return;
        }

        newLimits[category] = value;
    });

    if (hasError) {
        limitsMessage.textContent = 'Please fix the highlighted limits.';
        limitsMessage.classList.add('error');
        return;
    }

    // Save limits
    expenseTracker.setLimitsForMonth(newLimits, currentMonthKey);
    limitsMessage.textContent = 'Limits have been set';
    limitsMessage.classList.add('success');
}

// -------- ADD EXPENSE FLOW --------

// Show Add Expense screen (populate defaults)
function showAddExpenseScreen() {
    // Populate date with today's date in yyyy-mm-dd format
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('expense-date').value = `${yyyy}-${mm}-${dd}`;

    // Populate categories dropdown
    const categories = expenseTracker.getCategories();
    const select = document.getElementById('expense-category');
    select.innerHTML = '';
    if (categories.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No categories available';
        select.appendChild(opt);
        select.disabled = true;
        updateExpenseLimitMessage(null);
    } else {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a category';
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);

        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });
        select.disabled = false;
        updateExpenseLimitMessage(null);
    }

    // Clear inputs and errors
    document.getElementById('expense-value').value = '';
    document.getElementById('expense-comment').value = '';
    clearExpenseErrors();

    showScreen('add-expense-screen');
}

// Update limit warning message for selected category
function updateExpenseLimitMessage(category) {
    const msgEl = document.getElementById('expense-limit-message');
    msgEl.textContent = '';
    msgEl.classList.remove('expense-limit-warning', 'expense-limit-critical');
    if (!category) return;

    const currentMonthKey = expenseTracker.getMonthKey();
    const limitsForMonth = expenseTracker.getLimitsForMonth(currentMonthKey);
    const limit = limitsForMonth[category];

    if (!limit || limit <= 0) return;

    const totalSpent = expenseTracker.getTotalExpensesForCategoryInMonth(category, currentMonthKey);
    const percent = (totalSpent / limit) * 100;

    if (percent >= 80) {
        const monthName = expenseTracker.getMonthName(new Date());
        const displayPercent = Math.round(percent);
        msgEl.textContent = `Expense is currently at ${displayPercent}% limit for ${monthName}`;
        if (percent >= 100) {
            msgEl.classList.add('expense-limit-critical');
        } else {
            msgEl.classList.add('expense-limit-warning');
        }
    }
}

function clearExpenseErrors() {
    const fields = ['date', 'category', 'value', 'comment'];
    fields.forEach(field => {
        const input =
            field === 'category'
                ? document.getElementById('expense-category')
                : document.getElementById(`expense-${field}`);
        const error = document.getElementById(`expense-${field}-error`);
        if (input) input.classList.remove('input-error');
        if (error) error.textContent = '';
    });
}

// Handle Add Expense submit with validation and save
function handleAddExpenseSubmit() {
    clearExpenseErrors();

    const dateInput = document.getElementById('expense-date');
    const categorySelect = document.getElementById('expense-category');
    const valueInput = document.getElementById('expense-value');
    const commentInput = document.getElementById('expense-comment');

    const dateError = document.getElementById('expense-date-error');
    const categoryError = document.getElementById('expense-category-error');
    const valueError = document.getElementById('expense-value-error');
    const commentError = document.getElementById('expense-comment-error');

    let hasError = false;

    // Date validation
    if (!dateInput.value) {
        dateError.textContent = 'Entry cannot be blank';
        dateInput.classList.add('input-error');
        hasError = true;
    }

    // Category validation
    if (!categorySelect.value) {
        categoryError.textContent = 'Entry cannot be blank';
        categorySelect.classList.add('input-error');
        hasError = true;
    }

    // Value validation
    const value = parseFloat(valueInput.value);
    if (isNaN(value) || value <= 0) {
        valueError.textContent = 'Entry cannot be blank';
        valueInput.classList.add('input-error');
        hasError = true;
    }

    // Comment validation
    if (!commentInput.value.trim()) {
        commentError.textContent = 'Entry cannot be blank';
        commentInput.classList.add('input-error');
        hasError = true;
    }

    if (hasError) {
        return;
    }

    // Save expense
    const expense = {
        date: new Date(dateInput.value).toISOString(),
        category: categorySelect.value,
        amount: value,
        comment: commentInput.value.trim(),
    };

    expenseTracker.addExpense(expense);

    // Go to confirmation screen
    showScreen('expense-added-screen');
}

// -------- VIEW / EDIT EXPENSES (MONTH-WISE) --------

// Show main View/Edit Expenses screen
function showViewEditExpensesScreen() {
    showScreen('view-edit-expenses-screen');
}

// Show month selection screen with buttons for all months
function showViewExpensesMonthSelectScreen() {
    const container = document.getElementById('month-buttons-container');
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    container.innerHTML = monthNames.map((name, index) => {
        const isCurrent = index === currentMonthIndex;
        return `
            <button 
                class="btn btn-secondary month-btn${isCurrent ? ' btn-primary' : ''}" 
                data-month-index="${index}"
                data-year="${currentYear}"
            >
                ${name}
            </button>
        `;
    }).join('');

    container.querySelectorAll('.month-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const monthIndex = parseInt(e.currentTarget.getAttribute('data-month-index'), 10);
            const year = parseInt(e.currentTarget.getAttribute('data-year'), 10);
            showMonthSummaryScreen(year, monthIndex);
        });
    });

    showScreen('view-expenses-month-select-screen');
}

// Show summary for a particular month (year + monthIndex 0-11)
function showMonthSummaryScreen(year, monthIndex) {
    const date = new Date(year, monthIndex, 1);
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthName = expenseTracker.getMonthName(date);

    const titleEl = document.getElementById('month-summary-title');
    const totalsEl = document.getElementById('month-summary-totals');
    const percentEl = document.getElementById('month-summary-percentage');
    const listEl = document.getElementById('month-summary-list');

    // Overall totals
    const totalExpenses = expenseTracker.getTotalExpensesForMonth(monthKey);
    const limitsForMonth = expenseTracker.getLimitsForMonth(monthKey);
    const totalLimit = Object.values(limitsForMonth).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

    titleEl.textContent = `${monthName} ${year} - Summary`;

    totalsEl.textContent = `Total expenses so far: ${totalExpenses.toFixed(2)} | Total limits: ${totalLimit.toFixed(2)}`;

    if (totalLimit > 0) {
        const overallPercent = (totalExpenses / totalLimit) * 100;
        percentEl.textContent = `Overall usage: ${overallPercent.toFixed(1)}% of total limits`;
    } else {
        percentEl.textContent = 'No limits set for this month.';
    }

    // Per-category breakdown
    const categories = expenseTracker.getCategories();
    const rows = [];

    categories.forEach(category => {
        const catLimit = parseFloat(limitsForMonth[category]) || 0;
        const catTotal = expenseTracker.getTotalExpensesForCategoryInMonth(category, monthKey);

        if (catTotal === 0 && catLimit === 0) {
            return; // skip categories with no data and no limit
        }

        const percent = catLimit > 0 ? (catTotal / catLimit) * 100 : 0;
        
        // Determine row class based on percentage
        let rowClass = 'month-summary-row';
        if (catLimit > 0) {
            if (percent > 100) {
                rowClass += ' critical';
            } else if (percent >= 80) {
                rowClass += ' warning';
            }
        }
        
        rows.push(`
            <div class="${rowClass}" 
                 data-category="${category}" 
                 data-year="${year}" 
                 data-month-index="${monthIndex}">
                <span>${category}</span>
                <span>${catTotal.toFixed(2)}</span>
                <span>${catLimit.toFixed(2)}</span>
                <span>${catLimit > 0 ? `${percent.toFixed(1)}%` : '-'}</span>
            </div>
        `);
    });

    if (rows.length === 0) {
        listEl.innerHTML = '<div class="month-summary-row"><span>No expense data for this month.</span><span></span><span></span><span></span></div>';
    } else {
        listEl.innerHTML = rows.join('');
    }

    showScreen('view-expenses-month-summary-screen');
}

// Show detailed list of expenses for a specific category in a given month
function showCategoryExpensesDetailScreen(year, monthIndex, category) {
    const date = new Date(year, monthIndex, 1);
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthName = expenseTracker.getMonthName(date);

    const titleEl = document.getElementById('category-expenses-title');
    const listEl = document.getElementById('category-expenses-list');

    if (!titleEl || !listEl) {
        console.error('Category expenses elements not found');
        return;
    }

    titleEl.textContent = `${category} - ${monthName} ${year} expenses`;

    // Get all expenses for this month and filter by category
    const monthExpenses = expenseTracker.getExpensesForMonth(monthKey) || [];
    const categoryExpenses = monthExpenses.filter(exp => exp.category === category);

    if (categoryExpenses.length === 0) {
        listEl.innerHTML = '<div class="edit-expense-row edit-expense-row-empty"><p>No expenses for this category in this month.</p></div>';
        showScreen('category-expenses-detail-screen');
        return;
    }

    // Sort by date ascending
    categoryExpenses.sort((a, b) => {
        const da = a.date ? new Date(a.date) : new Date(0);
        const db = b.date ? new Date(b.date) : new Date(0);
        return da - db;
    });

    const rows = categoryExpenses.map(exp => {
        const dateStr = exp.date ? new Date(exp.date).toLocaleDateString() : '';
        const amountStr = (parseFloat(exp.amount) || 0).toFixed(2);
        const commentStr = exp.comment || exp.item || '';

        return `
            <div class="edit-expense-row">
                <span>${dateStr}</span>
                <span>${amountStr}</span>
                <span>${commentStr}</span>
            </div>
        `;
    });

    listEl.innerHTML = rows.join('');
    showScreen('category-expenses-detail-screen');
}

// -------- EDIT EXPENSES --------

// Show month selection screen for editing expenses
function showEditExpensesMonthSelectScreen() {
    const container = document.getElementById('edit-month-buttons-container');
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    container.innerHTML = monthNames.map((name, index) => {
        const isCurrent = index === currentMonthIndex;
        return `
            <button 
                class="btn btn-secondary month-btn${isCurrent ? ' btn-primary' : ''}" 
                data-month-index="${index}"
                data-year="${currentYear}"
            >
                ${name}
            </button>
        `;
    }).join('');

    container.querySelectorAll('.month-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const monthIndex = parseInt(e.currentTarget.getAttribute('data-month-index'), 10);
            const year = parseInt(e.currentTarget.getAttribute('data-year'), 10);
            showEditExpensesListScreen(year, monthIndex);
        });
    });

    showScreen('edit-expenses-month-select-screen');
}

// Store current editing month data
let currentEditingMonthKey = null;
let currentEditingExpenses = [];

// Show editable expenses list for a particular month
function showEditExpensesListScreen(year, monthIndex) {
    const date = new Date(year, monthIndex, 1);
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthName = expenseTracker.getMonthName(date);
    
    currentEditingMonthKey = monthKey;
    
    const titleEl = document.getElementById('edit-expenses-month-title');
    const listEl = document.getElementById('edit-expenses-list');
    
    titleEl.textContent = `Edit Expenses - ${monthName} ${year}`;
    
    // Get all expenses for this month
    const allExpenses = expenseTracker.getExpenses();
    const monthExpenses = allExpenses.filter(exp => {
        if (!exp.date) return false;
        const expDate = new Date(exp.date);
        const expMonthKey = expenseTracker.getMonthKey(expDate);
        return expMonthKey === monthKey;
    });
    
    // Sort by date (newest first)
    monthExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    currentEditingExpenses = monthExpenses;
    
    if (monthExpenses.length === 0) {
        listEl.innerHTML = '<div class="edit-expense-row-empty"><p>No expenses found for this month.</p></div>';
    } else {
        const categories = expenseTracker.getCategories();
        
        listEl.innerHTML = monthExpenses.map((expense, index) => {
            // Format date for input (YYYY-MM-DD)
            const expenseDate = new Date(expense.date);
            const dateStr = expenseDate.toISOString().split('T')[0];
            
            // Build category options
            const categoryOptions = categories.map(cat => 
                `<option value="${cat}" ${expense.category === cat ? 'selected' : ''}>${cat}</option>`
            ).join('');
            
            return `
                <div class="edit-expense-row" data-expense-id="${expense.id}" data-index="${index}">
                    <input type="date" class="edit-expense-date" value="${dateStr}" data-field="date">
                    <select class="edit-expense-category" data-field="category">
                        ${categoryOptions}
                    </select>
                    <input type="number" class="edit-expense-value" value="${expense.amount || 0}" min="0" step="0.01" data-field="amount">
                    <input type="text" class="edit-expense-comment" value="${(expense.comment || '').replace(/"/g, '&quot;')}" data-field="comment">
                </div>
            `;
        }).join('');
    }
    
    showScreen('edit-expenses-list-screen');
}

// Handle saving edited expenses
function handleSaveExpenses() {
    if (!currentEditingMonthKey || currentEditingExpenses.length === 0) {
        alert('No expenses to save.');
        return;
    }
    
    // Get all edited rows
    const rows = document.querySelectorAll('.edit-expense-row');
    let hasError = false;
    
    rows.forEach((row, index) => {
        const expenseId = row.getAttribute('data-expense-id');
        const dateInput = row.querySelector('.edit-expense-date');
        const categorySelect = row.querySelector('.edit-expense-category');
        const valueInput = row.querySelector('.edit-expense-value');
        const commentInput = row.querySelector('.edit-expense-comment');
        
        // Validate fields
        if (!dateInput.value) {
            dateInput.classList.add('input-error');
            hasError = true;
        } else {
            dateInput.classList.remove('input-error');
        }
        
        if (!categorySelect.value) {
            categorySelect.classList.add('input-error');
            hasError = true;
        } else {
            categorySelect.classList.remove('input-error');
        }
        
        const value = parseFloat(valueInput.value);
        if (isNaN(value) || value <= 0) {
            valueInput.classList.add('input-error');
            hasError = true;
        } else {
            valueInput.classList.remove('input-error');
        }
        
        if (!commentInput.value.trim()) {
            commentInput.classList.add('input-error');
            hasError = true;
        } else {
            commentInput.classList.remove('input-error');
        }
        
        if (!hasError) {
            // Update expense
            const updatedExpense = {
                date: new Date(dateInput.value).toISOString(),
                category: categorySelect.value,
                amount: value,
                comment: commentInput.value.trim()
            };
            
            expenseTracker.updateExpense(expenseId, updatedExpense);
        }
    });
    
    if (hasError) {
        alert('Please fill in all fields correctly. Invalid fields are highlighted in red.');
        return;
    }
    
    // Show confirmation screen
    showScreen('expense-modified-screen');
}

// -------- DOWNLOAD EXPENSES --------

// Show download expenses screen
function showDownloadExpensesScreen() {
    const container = document.getElementById('download-month-buttons-container');
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    container.innerHTML = monthNames.map((name, index) => {
        const isCurrent = index === currentMonthIndex;
        return `
            <button 
                class="btn btn-secondary month-btn${isCurrent ? ' btn-primary' : ''}" 
                data-month-index="${index}"
                data-year="${currentYear}"
            >
                ${name}
            </button>
        `;
    }).join('');

    // Clear date range inputs
    const fromDateInput = document.getElementById('download-from-date');
    const toDateInput = document.getElementById('download-to-date');
    fromDateInput.value = '';
    toDateInput.value = '';

    // Store selected month (null initially)
    window.selectedDownloadMonth = null;
    window.selectedDownloadYear = null;

    // Clear month selection when date range is entered
    fromDateInput.addEventListener('change', () => {
        if (fromDateInput.value || toDateInput.value) {
            container.querySelectorAll('.month-btn').forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-secondary');
            });
            window.selectedDownloadMonth = null;
            window.selectedDownloadYear = null;
        }
    });
    
    toDateInput.addEventListener('change', () => {
        if (fromDateInput.value || toDateInput.value) {
            container.querySelectorAll('.month-btn').forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-secondary');
            });
            window.selectedDownloadMonth = null;
            window.selectedDownloadYear = null;
        }
    });

    // Add click handlers to month buttons
    container.querySelectorAll('.month-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Remove previous selection
            container.querySelectorAll('.month-btn').forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-secondary');
            });
            // Highlight selected
            e.currentTarget.classList.remove('btn-secondary');
            e.currentTarget.classList.add('btn-primary');
            
            const monthIndex = parseInt(e.currentTarget.getAttribute('data-month-index'), 10);
            const year = parseInt(e.currentTarget.getAttribute('data-year'), 10);
            window.selectedDownloadMonth = monthIndex;
            window.selectedDownloadYear = year;
            
            // Clear date range when month is selected
            document.getElementById('download-from-date').value = '';
            document.getElementById('download-to-date').value = '';
        });
    });

    showScreen('download-expenses-screen');
}

// Handle download expenses
function handleDownloadExpenses() {
    const fromDateInput = document.getElementById('download-from-date');
    const toDateInput = document.getElementById('download-to-date');
    const fromDate = fromDateInput.value;
    const toDate = toDateInput.value;
    
    let expensesToDownload = [];
    
    // Check if date range is selected
    if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        
        if (from > to) {
            alert('From date cannot be after To date.');
            return;
        }
        
        // Get expenses in date range
        const allExpenses = expenseTracker.getExpenses();
        expensesToDownload = allExpenses.filter(exp => {
            if (!exp.date) return false;
            const expDate = new Date(exp.date);
            return expDate >= from && expDate <= to;
        });
        
        if (expensesToDownload.length === 0) {
            alert('No expenses found in the selected date range.');
            return;
        }
    } 
    // Check if month is selected
    else if (window.selectedDownloadMonth !== null && window.selectedDownloadYear !== null) {
        const monthKey = `${window.selectedDownloadYear}-${String(window.selectedDownloadMonth + 1).padStart(2, '0')}`;
        const allExpenses = expenseTracker.getExpenses();
        expensesToDownload = allExpenses.filter(exp => {
            if (!exp.date) return false;
            const expDate = new Date(exp.date);
            const expMonthKey = expenseTracker.getMonthKey(expDate);
            return expMonthKey === monthKey;
        });
        
        if (expensesToDownload.length === 0) {
            alert('No expenses found for the selected month.');
            return;
        }
    } else {
        alert('Please select a month or enter a date range.');
        return;
    }
    
    // Sort by date (oldest first)
    expensesToDownload.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Create CSV content
    const headers = ['Date', 'Category', 'Expense Value', 'Item/Comment'];
    const csvRows = [headers.join(',')];
    
    expensesToDownload.forEach(expense => {
        const date = new Date(expense.date);
        const dateStr = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });
        const category = (expense.category || '').replace(/"/g, '""');
        const amount = (expense.amount || 0).toFixed(2);
        const comment = (expense.comment || '').replace(/"/g, '""');
        
        // Escape commas and quotes in CSV
        csvRows.push(`"${dateStr}","${category}","${amount}","${comment}"`);
    });
    
    const csvContent = csvRows.join('\n');
    
    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename
    let filename = 'expenses';
    if (fromDate && toDate) {
        filename = `expenses_${fromDate}_to_${toDate}`;
    } else if (window.selectedDownloadMonth !== null) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        filename = `expenses_${monthNames[window.selectedDownloadMonth]}_${window.selectedDownloadYear}`;
    }
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show confirmation and return to View/Edit Expenses after 2 seconds
    showScreen('download-confirmation-screen');
    setTimeout(() => {
        showViewEditExpensesScreen();
    }, 2000);
}

// -------- VIEW SAVINGS --------

// Show view savings main screen
function showViewSavingsScreen() {
    const container = document.getElementById('savings-month-buttons-container');
    const yearlyTotalEl = document.getElementById('yearly-savings-total');
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    // Calculate yearly savings
    const totalIncome = expenseTracker.getTotalIncomeForYear(currentYear);
    const totalExpenses = expenseTracker.getTotalExpensesForYear(currentYear);
    const yearlySavings = totalIncome - totalExpenses;
    
    yearlyTotalEl.textContent = yearlySavings.toFixed(2);

    container.innerHTML = monthNames.map((name, index) => {
        const isCurrent = index === currentMonthIndex;
        return `
            <button 
                class="btn btn-secondary month-btn${isCurrent ? ' btn-primary' : ''}" 
                data-month-index="${index}"
                data-year="${currentYear}"
            >
                ${name}
            </button>
        `;
    }).join('');

    // Use event delegation on the container
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.month-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            const monthIndex = parseInt(btn.getAttribute('data-month-index'), 10);
            const year = parseInt(btn.getAttribute('data-year'), 10);
            showMonthlySavingsDetailScreen(year, monthIndex);
        }
    });

    showScreen('view-savings-screen');
}

// Show monthly savings detail screen
function showMonthlySavingsDetailScreen(year, monthIndex) {
    const date = new Date(year, monthIndex, 1);
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthName = expenseTracker.getMonthName(date);
    
    const titleEl = document.getElementById('monthly-savings-title');
    const totalEl = document.getElementById('monthly-savings-total');
    const listEl = document.getElementById('category-savings-list');
    
    if (!titleEl || !totalEl || !listEl) {
        console.error('Monthly savings detail screen elements not found');
        return;
    }
    
    titleEl.textContent = `${monthName} ${year} - Savings`;
    
    // Calculate monthly savings (Income - Expenses)
    const monthlyIncome = expenseTracker.getIncome(monthKey);
    const monthlyExpenses = expenseTracker.getTotalExpensesForMonth(monthKey);
    const monthlySavings = monthlyIncome - monthlyExpenses;
    
    totalEl.textContent = monthlySavings.toFixed(2);
    
    // Calculate category-wise savings
    const categories = expenseTracker.getCategories();
    const limitsForMonth = expenseTracker.getLimitsForMonth(monthKey);
    const rows = [];
    
    categories.forEach(category => {
        const categoryLimit = parseFloat(limitsForMonth[category]) || 0;
        const categoryExpenses = expenseTracker.getTotalExpensesForCategoryInMonth(category, monthKey);
        const categorySavings = categoryLimit - categoryExpenses;
        
        // Only show categories that have a limit set
        if (categoryLimit > 0) {
            rows.push(`
                <div class="month-summary-row">
                    <span>${category}</span>
                    <span>${categoryLimit.toFixed(2)}</span>
                    <span>${categoryExpenses.toFixed(2)}</span>
                    <span>${categorySavings.toFixed(2)}</span>
                </div>
            `);
        }
    });
    
    if (rows.length === 0) {
        listEl.innerHTML = '<div class="month-summary-row"><span>No category limits set for this month.</span><span></span><span></span><span></span></div>';
    } else {
        listEl.innerHTML = rows.join('');
    }
    
    showScreen('monthly-savings-detail-screen');
}

// Show categories main screen
function showCategoriesMainScreen() {
    // Explicitly clear any income-related screens
    const incomeConfirmation = document.getElementById('income-confirmation-screen');
    if (incomeConfirmation) {
        incomeConfirmation.classList.remove('active');
        incomeConfirmation.style.display = 'none';
    }
    
    showScreen('categories-main-screen');
    renderCategoriesList('categories-list');
}

// Show add category screen
function showAddCategoryScreen() {
    document.getElementById('category-input').value = '';
    showScreen('add-category-screen');
}

// Handle add category
function handleAddCategory() {
    const categoryInput = document.getElementById('category-input');
    const categoryName = categoryInput.value.trim();

    if (!categoryName) {
        alert('Please enter a category name.');
        return;
    }

    // Add category
    const addedCategory = expenseTracker.addCategory(categoryName);
    
    if (addedCategory === null) {
        alert('This category already exists.');
        return;
    }

    // Show confirmation screen
    document.getElementById('category-confirmation-text').textContent = 
        `Your new category "${addedCategory}" has been set!`;
    
    // Render updated categories list
    renderCategoriesList('confirmation-categories-list');
    
    showScreen('category-confirmation-screen');
}

// Show edit category select screen
function showEditCategorySelectScreen() {
    const categories = expenseTracker.getCategories();
    
    if (categories.length === 0) {
        alert('No categories available to edit. Please add a category first.');
        showCategoriesMainScreen();
        return;
    }
    
    // Render categories as clickable buttons
    const container = document.getElementById('edit-category-list');
    container.innerHTML = categories.map(category => 
        `<button class="category-box category-select-btn" data-category="${category}">${category}</button>`
    ).join('');
    
    // Add click handlers to category buttons
    container.querySelectorAll('.category-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const categoryName = e.currentTarget.getAttribute('data-category');
            showEditCategoryFormScreen(categoryName);
        });
    });
    
    showScreen('edit-category-select-screen');
}

// Show edit category form screen
let currentEditingCategory = null;

function showEditCategoryFormScreen(categoryName) {
    currentEditingCategory = categoryName;
    document.getElementById('edit-category-header-text').textContent = `Edit ${categoryName} to`;
    document.getElementById('edit-category-input').value = categoryName;
    document.getElementById('edit-category-error').textContent = '';
    showScreen('edit-category-form-screen');
}

// Handle update category
function handleUpdateCategory() {
    const categoryInput = document.getElementById('edit-category-input');
    const newCategoryName = categoryInput.value.trim();
    const errorElement = document.getElementById('edit-category-error');

    if (!newCategoryName) {
        errorElement.textContent = 'Please enter a category name.';
        return;
    }

    // Check if the new name already exists (excluding the current category)
    const categories = expenseTracker.getCategories();
    const newNameLower = newCategoryName.toLowerCase();
    const exists = categories.some(cat => 
        cat.toLowerCase() === newNameLower && cat !== currentEditingCategory
    );

    if (exists) {
        errorElement.textContent = 'Category already exists';
        return;
    }

    // Update the category
    const success = expenseTracker.updateCategory(currentEditingCategory, newCategoryName);
    
    if (success) {
        // Return to categories main screen
        showCategoriesMainScreen();
    } else {
        errorElement.textContent = 'Failed to update category. Please try again.';
    }
}

// Handle menu button actions
function handleMenuAction(action) {
    // Clear any pending operations first
    activeTimeouts.forEach(timeout => clearTimeout(timeout));
    activeTimeouts = [];
    
    switch(action) {
        case 'income':
            showIncomeViewScreen();
            break;
        case 'categories':
            showCategoriesMainScreen();
            break;
        case 'limits':
            showLimitsScreen();
            break;
        case 'add-expense':
            showAddExpenseScreen();
            break;
        case 'view-expense':
            showViewEditExpensesScreen();
            break;
        case 'savings':
            showViewSavingsScreen();
            break;
        case 'exit':
            showExitConfirmation();
            break;
        default:
            console.log('Unknown action:', action);
    }
}
