// Global state
let categories = [];

// DOM Elements
const dropdownButton = document.getElementById('dropdownButton');
const dropdownMenu = document.getElementById('dropdownMenu');
const addModal = document.getElementById('addModal');
const editModal = document.getElementById('editModal');
const addNewBtn = document.getElementById('addNewBtn');
const editCategoriesBtn = document.getElementById('editCategoriesBtn');
const addCategoryForm = document.getElementById('addCategoryForm');
const categoriesList = document.getElementById('categoriesList');
const categoryFilter = document.getElementById('categoryFilter');
const addCategoryList = document.getElementById('Add-category-list');



// Initial load of categories
async function loadCategories() {
  try {
    categories = await window.electronAPI.getCategories();
    renderCategories();
    updateAddCategoryList();
    updateCategoryFilter();
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// update the add category dropdown

function updateAddCategoryList() {
  if (addCategoryList) {
    addCategoryList.innerHTML = `
      ${categories.map(category => `
        <option value="${category.name}">${category.name}</option>
      `).join('')}
    `;
  }
}

// Update the category filter dropdown
function updateCategoryFilter() {
  if (categoryFilter) {
    categoryFilter.innerHTML = `
      <option value="">All Categories</option>
      ${categories.map(category => `
        <option value="${category.name}">${category.name}</option>
      `).join('')}
    `;
  }
}

// Toggle dropdown
dropdownButton.addEventListener('click', () => {
  dropdownMenu.classList.toggle('hidden');
  dropdownButton.querySelector('svg').classList.toggle('rotate-180');
});

// Show Add Modal
addNewBtn.addEventListener('click', () => {
  addModal.classList.remove('hidden');
  dropdownMenu.classList.add('hidden');
});

// Show Edit Modal
editCategoriesBtn.addEventListener('click', async () => {
  await loadCategories(); // Refresh categories before showing modal
  editModal.classList.remove('hidden');
  dropdownMenu.classList.add('hidden');
});

// Close modals
document.querySelectorAll('.close-modal').forEach(button => {
  button.addEventListener('click', () => {
    addModal.classList.add('hidden');
    editModal.classList.add('hidden');
  });
});

// Add new category
addCategoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('newCategoryName');
  const name = nameInput.value.trim();

  if (name) {
    try {
      await window.electronAPI.addCategory( name );
      nameInput.value = '';
      addModal.classList.add('hidden');
      await loadCategories(); // This will update both the edit list and filter dropdown
    } catch (error) {
      console.error('Error adding category:', error);
    }
  }
});

// Render categories in edit modal
function renderCategories() {
  if (categoriesList) {
    categoriesList.innerHTML = categories.map(category => `
      <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
        <input
          type="text"
          value="${category.name}"
          class="px-2 py-1 border rounded-lg flex-grow mr-2"
          onchange="updateCategory('${category.id}', this.value)"
        >
        <button
          onclick="deleteCategory('${category.id}')"
          class="text-red-500 hover:text-red-700"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `).join('');
  }
}

// Update category
async function updateCategory(id, newName) {
  try {
    await window.electronAPI.updateCategory(id,newName );
    await refreshAllData();
  
    await loadCategories(); // This will update both the edit list and filter dropdown
  } catch (error) {
    console.error('Error updating category:', error);
  }
}

// Delete category
async function deleteCategory(id) {
  try {
    await window.electronAPI.deleteCategory(id);
    await refreshAllData();

    await loadCategories(); // This will update both the edit list and filter dropdown
  } catch (error) {
    console.error('Error deleting category:', error);
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.add('hidden');
  }
});

// Load categories when the page loads
document.addEventListener('DOMContentLoaded', loadCategories);