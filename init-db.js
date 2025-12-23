const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

console.log('Initializing database...');

const db = new sqlite3.Database('finance_tracker.db');

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
db.serialize(() => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      color TEXT DEFAULT '#3b82f6',
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    )
  `);

  // Create savings goals table
  db.run(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create demo user
  const demoPassword = bcrypt.hashSync('demo123', 10);
  
  db.run('INSERT OR IGNORE INTO users (username, password_hash, email) VALUES (?, ?, ?)', 
    ['demo', demoPassword, 'demo@example.com'], 
    function(err) {
      if (err) {
        console.log('Demo user already exists or error:', err.message);
        db.close();
        console.log('Database initialized successfully!');
        return;
      }
      
      const demoUserId = this.lastID;
      console.log('Demo user created (username: demo, password: demo123)');
      
      // Add default categories for demo user
      const categories = [
        { name: 'Salary', type: 'income', color: '#10b981' },
        { name: 'Groceries', type: 'expense', color: '#ef4444' },
        { name: 'Transportation', type: 'expense', color: '#f59e0b' },
        { name: 'Entertainment', type: 'expense', color: '#8b5cf6' },
        { name: 'Utilities', type: 'expense', color: '#06b6d4' },
        { name: 'Healthcare', type: 'expense', color: '#ec4899' }
      ];
      
      const catStmt = db.prepare('INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)');
      categories.forEach(cat => {
        catStmt.run(demoUserId, cat.name, cat.type, cat.color);
      });
      catStmt.finalize();
      
      console.log('Default categories created');
      
      // Add sample transactions
      const today = new Date().toISOString().split('T')[0];
      const transStmt = db.prepare('INSERT INTO transactions (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)');
      transStmt.run(demoUserId, 1, 3000, 'Monthly Salary', today);
      transStmt.run(demoUserId, 2, 150, 'Weekly groceries', today);
      transStmt.run(demoUserId, 3, 50, 'Gas', today);
      transStmt.finalize();
      
      console.log('Sample transactions created');
      
      // Add sample savings goal
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      db.run('INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)',
        [demoUserId, 'Emergency Fund', 10000, 2500, nextYear.toISOString().split('T')[0]]);
      
      console.log('Sample savings goal created');
      
      db.close();
      console.log('Database initialized successfully!');
    }
  );
});


// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create categories table
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

// Create transactions table
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
  )
`);

// Create savings goals table
db.exec(`
  CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    deadline DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

// Create demo user
const demoPassword = bcrypt.hashSync('demo123', 10);
try {
  const stmt = db.prepare('INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)');
  const result = stmt.run('demo', demoPassword, 'demo@example.com');
  const demoUserId = result.lastInsertRowid;
  
  console.log('Demo user created (username: demo, password: demo123)');
  
  // Add default categories for demo user
  const categories = [
    { name: 'Salary', type: 'income', color: '#10b981' },
    { name: 'Groceries', type: 'expense', color: '#ef4444' },
    { name: 'Transportation', type: 'expense', color: '#f59e0b' },
    { name: 'Entertainment', type: 'expense', color: '#8b5cf6' },
    { name: 'Utilities', type: 'expense', color: '#06b6d4' },
    { name: 'Healthcare', type: 'expense', color: '#ec4899' }
  ];
  
  const catStmt = db.prepare('INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)');
  categories.forEach(cat => {
    catStmt.run(demoUserId, cat.name, cat.type, cat.color);
  });
  
  console.log('Default categories created');
  
  // Add sample transactions
  const transStmt = db.prepare('INSERT INTO transactions (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)');
  const today = new Date().toISOString().split('T')[0];
  transStmt.run(demoUserId, 1, 3000, 'Monthly Salary', today);
  transStmt.run(demoUserId, 2, 150, 'Weekly groceries', today);
  transStmt.run(demoUserId, 3, 50, 'Gas', today);
  
  console.log('Sample transactions created');
  
  // Add sample savings goal
  const goalStmt = db.prepare('INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)');
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  goalStmt.run(demoUserId, 'Emergency Fund', 10000, 2500, nextYear.toISOString().split('T')[0]);
  
  console.log('Sample savings goal created');
} catch (err) {
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    console.log('Demo user already exists');
  } else {
    console.error('Error creating demo data:', err.message);
  }
}

db.close();
console.log('Database initialized successfully!');
