const path = require("path");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { ipcMain , dialog } = require("electron");
const {
  deleteExpense, addExpense, listExpenses , getTotalExpensesOfThisMonth , getDailyAverageInLastThirtyDays,
  getBiggestCategory,  getPourcentageOfMostUsedCategory, addCategory, deleteCategory, listCategories, updateCategory,
  getExpensesByMonth , getExpense, editExpense


} = require("./db");

require("electron-reload")(path.join(__dirname, "../src"), {
  electron: path.join(__dirname, "../node_modules/.bin/electron"),
});

const { app, BrowserWindow } = require("electron");

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("add-expense", (event, expense) => {
  addExpense(expense.name, expense.price, expense.category, expense.date);
});

ipcMain.handle("list-expenses", () => {
  return listExpenses();
});

ipcMain.handle("delete-expense", (event, id) => {
  deleteExpense(id);
});

ipcMain.handle("get-total-expenses-of-this-month", () => {
  return getTotalExpensesOfThisMonth();
});

ipcMain.handle("get-daily-average-expenses-in-last-month", () => {
  return getDailyAverageInLastThirtyDays();
});




ipcMain.handle("get-pourcentage-of-most-used-category", () => {
  return getPourcentageOfMostUsedCategory();
});

ipcMain.handle("get-biggest-category", () => {
  return getBiggestCategory();
});


ipcMain.handle("get-categories", () => {
  return listCategories();
});

ipcMain.handle("delete-category", (event, id) => {
  deleteCategory(id);
});

ipcMain.handle("add-category", (event, category) => {
  addCategory(category);
});

ipcMain.handle("update-category", (event, id,name) => {
  updateCategory(id, name);
});

ipcMain.handle("get-expense", (event, id) => {
  return getExpense(id);
});

ipcMain.handle("edit-expense", (event, id, name, price, categoryName, date) => {
  editExpense(id, name, price, categoryName, date);
});


ipcMain.handle("export-monthly-expenses", async (event, month, year) => {
  const expenses = getExpensesByMonth(month, year);
  
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save PDF Report',
    defaultPath: `expenses-${year}-${month}.pdf`,
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
  });

  if (!filePath) return;

  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Add header
  doc.fontSize(20).text(`Expenses Report - ${getMonthName(month)} ${year}`, {align: 'center'});
  doc.moveDown();

  // Add summary
  const total = expenses.reduce((sum, exp) => sum + exp.price, 0);
  doc.fontSize(12).text(`Total Expenses: $${total.toFixed(2)}`);
  doc.moveDown();

  // Add table headers
  const headers = ['Date', 'Description', 'Category', 'Amount'];
  let yPosition = doc.y;
  let xPosition = 50;
  
  headers.forEach(header => {
    doc.text(header, xPosition, yPosition);
    xPosition += 130;
  });

  doc.moveDown();

  // Add expenses
  expenses.forEach(expense => {
    xPosition = 50;
    yPosition = doc.y;
    
    doc.text(expense.date, xPosition, yPosition);
    doc.text(expense.name, xPosition + 130, yPosition);
    doc.text(expense.category, xPosition + 260, yPosition);
    doc.text(`$${expense.price.toFixed(2)}`, xPosition + 390, yPosition);
    
    doc.moveDown();
  });

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
});

function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(month) - 1];
}