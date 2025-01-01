
const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use app.getPath('userData') to get a safe directory for the database
const dbDir = path.join(app.getPath('userData'), 'data'); // Change to app's userData path
const dbPath = path.join(dbDir, 'expenses.db');

function initDatabase() {
  try {
    // Check if the database directory exists, create it if it doesn't
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize the database. Use `fileMustExist: false` to allow creating a new DB
    const db = new Database(dbPath, { fileMustExist: false });
    
    // Enable Write-Ahead Logging (WAL) for better performance
    db.pragma('journal_mode = WAL');
    
    return db;
  } catch (error) {
    throw new Error(`Failed to initialize database: ${error.message}`);
  }
}

// Initialize the database
const db = initDatabase();


db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category_id INTEGER,
    date TEXT NOT NULL,
    FOREIGN KEY(category_id) 
      REFERENCES categories(id) 
      ON DELETE SET NULL 
  )
`);

// Add initial categories
const isNewDatabase = !fs.existsSync(dbPath);

if (isNewDatabase) {
  db.exec(`
    INSERT INTO categories (name) VALUES 
    ('Food'),
    ('Transport'),
    ('Entertainment'),
    ('Other')
  `);
}


function addExpense(name, price, categoryName, date) {
  const categoryStmt = db.prepare('SELECT id FROM categories WHERE name = ?');
  const category = categoryStmt.get(categoryName);

  if (!category) {
    throw new Error(`Category "${categoryName}" not found`);
  }

  const stmt = db.prepare(`
    INSERT INTO expenses (name, price, category_id, date)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(name, price, category.id, date);
}

function listExpenses() {
  const stmt = db.prepare(`
    SELECT e.id, e.name, e.price, c.name as category, e.date
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    ORDER BY e.id DESC
  `);
  return stmt.all();
}
function getExpense(id) {
  const stmt = db.prepare(`
    SELECT e.id, e.name, e.price, c.name as category, e.date
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?
  `);
  return stmt.get(id);
}

function editExpense(id, name, price, categoryName, date) {
  const categoryStmt = db.prepare('SELECT id FROM categories WHERE name = ?');
  const category = categoryStmt.get(categoryName);

  if (!category) {
    throw new Error(`Category "${categoryName}" not found`);
  }

  const stmt = db.prepare(`
    UPDATE expenses 
    SET name = ?, price = ?, category_id = ?, date = ?
    WHERE id = ?
  `);
  stmt.run(name, price, category.id, date, id);
}

function deleteExpense(id) {
  const stmt = db.prepare(`
    DELETE FROM expenses
    WHERE id = ?
  `);
  stmt.run(id);
}

function getTotalExpensesOfThisMonth() {
  const stmt = db.prepare(`
    SELECT SUM(price) as total
    FROM expenses
    WHERE date >= date('now', 'start of month')
  `);
  return stmt.get().total || 0;
}

function getBiggestCategory() {
  const stmt = db.prepare(`
    SELECT c.name as category, SUM(e.price) as total
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    GROUP BY c.name
    ORDER BY total DESC
    LIMIT 1
  `);
  const result = stmt.get();
  return result ? result.category : '';
}

function getExpensesByMonth(month, year) {
  const stmt = db.prepare(`
    SELECT e.date, e.name, e.price, c.name as category
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    ORDER BY e.date DESC
  `);
  return stmt.all(month, year);
}



function getPourcentageOfMostUsedCategory() {
  const stmt = db.prepare(`
    WITH CategoryTotals AS (
      SELECT c.name, SUM(e.price) as total
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      GROUP BY c.name
    )
    SELECT (MAX(total) * 100.0 / (SELECT SUM(total) FROM CategoryTotals)) as pourcentage
    FROM CategoryTotals
  `);
  return stmt.get().pourcentage || 0;
}


function getDailyAverageInLastThirtyDays() {
  const stmt = db.prepare(`
    SELECT SUM(price) / COUNT(DISTINCT date) as average
    FROM expenses
    WHERE date >= date('now', '-30 days')
  `);
  return stmt.get().average || 0;
}





function addCategory(name) {
  const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
  return stmt.run(name);
}

function deleteCategory(id) {
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  return stmt.run(id);
}

function listCategories() {
  const stmt = db.prepare('SELECT * FROM categories');
  return stmt.all();
}
function updateCategory(id,  name ) {
  const stmt = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
  return stmt.run(name, id);
}

module.exports = { deleteExpense, addExpense, listExpenses , getTotalExpensesOfThisMonth , getDailyAverageInLastThirtyDays,
  getBiggestCategory,  getPourcentageOfMostUsedCategory, addCategory, deleteCategory, listCategories, updateCategory,
  getExpensesByMonth, getExpense, editExpense
};