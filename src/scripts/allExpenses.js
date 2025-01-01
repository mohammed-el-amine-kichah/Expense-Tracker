async function loadExpenses() {
    const expenses = await window.electronAPI.listExpenses();
    const tbody = document.getElementById('expensesList');
    toggleEmptyState(expenses);
    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td class="px-6 py-4 text-sm text-gray-900">${expense.date}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${expense.name}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${expense.category}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">$${expense.price}</td>
            <td class="px-6 py-4 text-sm flex justify-end gap-2">
                <button onclick="editExpense(${expense.id})" class="flex items-center gap-2 px-3 py-2 rounded bg-gray-500 text-white hover:bg-gray-600">
                    <svg  class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.829 8.829-3.535-3.535 8.829-8.829z" />
                        <path d="M12 18h.01" />
                    </svg>
                    Edit
                </button>
                <button onclick="deleteExpense(${expense.id})" class="flex items-center gap-2 px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700">
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}
async function editExpense(id) {
    // Get categories first
    const categories = await window.electronAPI.getCategories();
    const expense = await window.electronAPI.getExpense(id);
    
    const dialog = document.createElement('dialog');
    dialog.innerHTML = `
        <form method="dialog" class="p-4 bg-white rounded-xl shadow-md w-[400px]">
            <h2 class="text-lg font-bold mb-4">Edit Expense</h2>
            <div class="grid gap-4">
                <div>
                    <label class="block mb-2">Date:</label>
                    <input type="date" id="editDate" value="${expense.date}" class="border p-2 rounded w-full">
                </div>
                <div>
                    <label class="block mb-2">Name:</label>
                    <input type="text" id="editName" value="${expense.name}" class="border p-2 rounded w-full">
                </div>
                <div>
                    <label class="block mb-2">Category:</label>
                    <select id="editCategory" class="border p-2 rounded w-full">
                        ${categories.map(cat => `
                            <option value="${cat.name}" ${cat.name === expense.category ? 'selected' : ''}>
                                ${cat.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label class="block mb-2">Price ($):</label>
                    <input  required type="number" id="editPrice" value="${expense.price}" step="0.01" class="border p-2 rounded w-full [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none">
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <button type="button" value="cancel" class="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
                <button type="submit" value="default" class="px-4 py-2 bg-purple-500 text-white rounded">Save</button>
            </div>
        </form>
    `;

    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.addEventListener('close', async () => {
        if (dialog.returnValue === 'default') {
            try {
                const updatedExpense = {
                    id: id,
                    date: document.getElementById('editDate').value,
                    name: document.getElementById('editName').value,
                    category: document.getElementById('editCategory').value,
                    price: parseFloat(document.getElementById('editPrice').value)
                };

                if (!updatedExpense.date || !updatedExpense.name || !updatedExpense.category || isNaN(updatedExpense.price)) {
                    throw new Error('All fields are required');
                }

                await window.electronAPI.editExpense(
                    updatedExpense.id, 
                    updatedExpense.name, 
                    updatedExpense.price, 
                    updatedExpense.category, 
                    updatedExpense.date
                );
                await refreshAllData();
            } catch (error) {
                console.error('Error updating expense:', error);
                alert('Failed to update expense: ' + error.message);
            }
        }
        dialog.remove();
    });

    // Add cancel button handler
    dialog.querySelector('button[value="cancel"]').addEventListener('click', () => {
        dialog.close('cancel');
    });
}
async function refreshAllData() {
    await loadExpenses();
    await getTotalExpensesOfThisMonth();
    await getBiggestCategory();
    await getPourcentageOfMostUsedCategory();
    await getDailyAverageInLastThirtyDays();
    await getExpensesTrendVsLastMonth();
}

// Update these functions to call refreshAllData
async function deleteExpense(id) {
    const dialog = document.createElement('dialog');
    dialog.innerHTML = `
        <form method="dialog" class="p-4 bg-white rounded-xl shadow-md">
            <h2 class="text-lg font-bold mb-4">Delete Expense</h2>
            <p class="mb-4">Are you sure you want to delete this expense?</p>
            <div class="flex justify-end gap-2">
                <button type="button" value="cancel" class="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
                <button type="submit" value="default" class="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            </div>
        </form>
    `;

    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.addEventListener('close', async () => {
        if (dialog.returnValue === 'default') {
            try {
                await window.electronAPI.deleteExpense(id);
                await refreshAllData();
            } catch (error) {
                console.error('Error deleting expense:', error);
                alert('Failed to delete expense');
            }
        }
        dialog.remove();
    });

    dialog.querySelector('button[value="cancel"]').addEventListener('click', () => {
        dialog.close('cancel');
    });
}

async function getTotalExpensesOfThisMonth() {
    const total = await window.electronAPI.getTotalExpensesOfThisMonth();
    document.getElementById('totalExpenses').textContent = `$${total.toFixed(2)}`;
}
    

async function getDailyAverageInLastThirtyDays() {
    const total = await window.electronAPI.getDailyAverageInLastThirtyDays();

    document.getElementById('dailyAverageExpenses').textContent = `$${total.toFixed(2)}`;    
}

async function getBiggestCategory() {
    const category = await window.electronAPI.getBiggestCategory();

    document.getElementById('biggestCategory').textContent = category ? category : 'No expenses yet';
}



async function getPourcentageOfMostUsedCategory() {
    const pourcentage = await window.electronAPI.getPourcentageOfMostUsedCategory();
    document.getElementById('pourcentage').textContent = pourcentage > 0 ? `${pourcentage.toFixed(2)} % of total expenses` : '';
}



// Add these variables to track current filter states
let currentFilters = {
    date: '',
    category: '',
    month: ''
};

// Create a function to apply all filters
async function applyFilters() {
    let expenses = await window.electronAPI.listExpenses();

    
    // Apply date filter
    if (currentFilters.date) {
       
        expenses = expenses.filter(expense => expense.date === currentFilters.date);
    }
    
    // Apply category filter
    if (currentFilters.category) {

        expenses = expenses.filter(expense => expense.category === currentFilters.category);
    }
    
    // Apply month filter
    if (currentFilters.month) {
        expenses = expenses.filter(expense => {
            const expenseMonth = expense.date.split('-')[1];
            return expenseMonth === currentFilters.month;
        });
    }


    // Update the table with filtered expenses
    const tbody = document.getElementById('expensesList');
    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td class="px-6 py-4 text-sm text-gray-900">${expense.date}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${expense.name}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${expense.category}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">$${expense.price}</td>
            <td class="px-6 py-4 text-sm flex justify-end gap-2">
                <button onclick="editExpense(${expense.id})" class="flex items-center gap-2 px-3 py-2 rounded bg-gray-500 text-white hover:bg-gray-600">
                    <svg  class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.829 8.829-3.535-3.535 8.829-8.829z" />
                        <path d="M12 18h.01" />
                    </svg>
                    Edit
                </button>
                <button onclick="deleteExpense(${expense.id})" class="flex items-center gap-2 px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700">
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Update the event listeners
document.getElementById('dateFilter').addEventListener('change', (e) => {
    currentFilters.date = e.target.value;
    applyFilters();
});

document.getElementById('categoryFilter').addEventListener('change', (e) => {
    currentFilters.category = e.target.value;
    applyFilters();
});

document.getElementById('monthFilter').addEventListener('change', (e) => {
    currentFilters.month = e.target.value ? e.target.value.padStart(2, '0') : '';
    applyFilters();
});

getBiggestCategory();
getPourcentageOfMostUsedCategory();
getDailyAverageInLastThirtyDays();

getTotalExpensesOfThisMonth();
loadExpenses();



async function getExpensesTrendVsLastMonth() {
    const expenses = await window.electronAPI.listExpenses();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get expenses for current and previous month
    const currentMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear;
    });

    const previousMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === (currentMonth - 1) && 
               expenseDate.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear);
    });

    // Calculate totals
    const currentTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.price, 0);
    const previousTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.price, 0);

    // Calculate trend percentage
    const trend = previousTotal === 0 ? 100 : ((currentTotal - previousTotal) / previousTotal) * 100;

    const trendElement = document.querySelector('#totalExpenses').nextElementSibling.querySelector('span');
    const arrow = trend >= 0 ? '↑' : '↓';
    const color = trend >= 0 ? 'text-red-600' : 'text-green-600';
    
    trendElement.className = `text-sm font-medium ${color}`;
    trendElement.textContent = `${arrow} ${Math.abs(trend).toFixed(2)}% vs last month`;
}

// Add this to your existing function calls
getExpensesTrendVsLastMonth();

// Add this with your other event listeners
document.getElementById('exportButton').addEventListener('click', async () => {
// Create a dialog element dynamically
const dialog = document.createElement('dialog');
dialog.innerHTML = `
    <form method="dialog" class="p-4">
        <h2 class="text-lg font-bold mb-4">Export Monthly Expenses</h2>
        <div class="mb-4">
            <label class="block mb-2">Month:</label>
            <input type="month" id="monthYearPicker" 
                   value="${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}"
                   class="border p-2 rounded">
        </div>
        <div class="flex justify-end gap-2">
            <button value="cancel" class="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
            <button value="default" class="px-4 py-2 bg-purple-500 text-white rounded">Export</button>
        </div>
    </form>
`;

// Add dialog to document body
document.body.appendChild(dialog);
dialog.showModal();

// Handle dialog close
dialog.addEventListener('close', async () => {
    if (dialog.returnValue === 'default') {
        const dateValue = document.getElementById('monthYearPicker').value;
        const [year, month] = dateValue.split('-');
        
        if (month && year) {
            try {
                await window.electronAPI.exportMonthlyExpenses(month, year);
                alert('PDF exported successfully!');
            } catch (error) {
                console.error('Error exporting PDF:', error);
                alert('Failed to export PDF. Please try again.');
            }
        }
    }
    dialog.remove();
});
  
  
});



// Add this at the start of your code where you load expenses

const expensesList = document.getElementById('expensesList');

const emptyState = document.getElementById('emptyState');



// Function to toggle empty state visibility

function toggleEmptyState(expenses) {

    if (!expenses || expenses.length === 0) {

        emptyState.classList.remove('hidden');

        expensesList.classList.add('hidden');

    } else {

        emptyState.classList.add('hidden');

        expensesList.classList.remove('hidden');

}

}
