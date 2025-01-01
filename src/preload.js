const { contextBridge, ipcRenderer } = require("electron");





contextBridge.exposeInMainWorld("electronAPI", {
  addExpense: (expense) => ipcRenderer.invoke("add-expense", expense),
  listExpenses: () => ipcRenderer.invoke("list-expenses"),
  deleteExpense: (id) => ipcRenderer.invoke("delete-expense", id),
  getTotalExpensesOfThisMonth: () =>
    ipcRenderer.invoke("get-total-expenses-of-this-month"),
  getDailyAverageInLastThirtyDays: () =>
    ipcRenderer.invoke("get-daily-average-expenses-in-last-month"),

  getBiggestCategory: () => ipcRenderer.invoke("get-biggest-category"),

  getPourcentageOfMostUsedCategory: () =>
    ipcRenderer.invoke("get-pourcentage-of-most-used-category"),

  exportMonthlyExpenses: (month, year) => ipcRenderer.invoke("export-monthly-expenses", month, year)
,
exportMonthlyExpenses: (month, year) => ipcRenderer.invoke('export-monthly-expenses', month, year),  getCategories: () => ipcRenderer.invoke("get-categories"),
  deleteCategory: (id) => ipcRenderer.invoke("delete-category", id),
  addCategory: (category) => ipcRenderer.invoke("add-category", category),
  updateCategory: (id, Newname) => ipcRenderer.invoke("update-category", id,Newname),
  getExpense: (id) => ipcRenderer.invoke("get-expense", id),
  editExpense: (id, name, price, categoryName, date
  ) => ipcRenderer.invoke("edit-expense", id, name, price, categoryName, date),

});
