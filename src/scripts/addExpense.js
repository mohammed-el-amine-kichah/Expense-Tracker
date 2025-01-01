const addExpenseButton = document.getElementById('addButton');
const expenseDialog = document.getElementById('expense-dialog');
const cancelButton = document.getElementById('cancel-button');
const expenseForm = document.getElementById('expense-form');

document.getElementById('date').max = new Date().toISOString().split('T')[0];
document.getElementById('date').value = new Date().toISOString().split('T')[0];

addExpenseButton.addEventListener('click', () => {
    expenseDialog.classList.remove('hidden');
});

cancelButton.addEventListener('click', () => {
    expenseDialog.classList.add('hidden');
    expenseForm.reset();
});

async function handleExpense(event) {
    event.preventDefault();

    const expenseData = {
        name: document.getElementById('name').value,
        price: parseFloat(document.getElementById('price').value),
        category: document.getElementById('Add-category-list').value,
        date: document.getElementById('date').value
    };

    try {
        await window.electronAPI.addExpense(expenseData);
        await refreshAllData();
        expenseForm.reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];

        expenseDialog.classList.add('hidden');
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Failed to add expense. Please try again.');
    }
}

function validateForm() {

    const name = document.getElementById('name').value;
    const price = document.getElementById('price').value;
    const category = document.getElementById('Add-category-list').value;
    const date = document.getElementById('date').value;

    if (!name.trim()) {
        alert('Please enter an expense name');
        document.getElementById('name').focus();
        return false;
    }

    if (!price || price <= 0) {
        alert('Please enter a valid price > 0');
        document.getElementById('price').focus();
        return false;
    }

    if (!category) {
        alert('Please select a category');
        document.getElementById('category').focus();
        return false;
    }

    if (!date) {
        alert('Please select a date');
        document.getElementById('date').focus();
        return false;
    }

    return true;
}

expenseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (validateForm()) {
        await handleExpense(event);
    }
});
