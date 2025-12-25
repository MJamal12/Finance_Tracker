const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const { dbGet, dbAll, dbRun } = require('./database');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database tables on startup
const initDB = () => {
  const db = new sqlite3.Database('finance_tracker.db');
  
  db.serialize(() => {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create categories table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      color TEXT DEFAULT '#3b82f6',
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Create transactions table
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    )`);

    // Create goals table
    db.run(`CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Create demo user if it doesn't exist
    db.get('SELECT * FROM users WHERE username = ?', ['demo'], (err, user) => {
      if (!user) {
        const passwordHash = bcrypt.hashSync('demo123', 10);
        db.run('INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
          ['demo', passwordHash, 'demo@example.com'], function(err) {
            if (!err) {
              const demoUserId = this.lastID;
              // Add default categories for demo user
              const defaultCategories = [
                { name: 'Salary', type: 'income', color: '#10b981' },
                { name: 'Groceries', type: 'expense', color: '#ef4444' },
                { name: 'Transportation', type: 'expense', color: '#f59e0b' },
                { name: 'Entertainment', type: 'expense', color: '#8b5cf6' }
              ];
              
              defaultCategories.forEach(cat => {
                db.run('INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)',
                  [demoUserId, cat.name, cat.type, cat.color]);
              });
              console.log('Demo user created successfully');
            }
          });
      }
    });
  });
  
  db.close();
};

// Initialize database
initDB();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'finance-tracker-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ============ AUTH ROUTES ============

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    req.session.username = user.username;
    
    res.json({ 
      success: true, 
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await dbRun('INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
      [username, passwordHash, email]);
    
    req.session.userId = result.lastID;
    req.session.username = username;
    
    // Create default categories for new user
    const defaultCategories = [
      { name: 'Salary', type: 'income', color: '#10b981' },
      { name: 'Groceries', type: 'expense', color: '#ef4444' },
      { name: 'Transportation', type: 'expense', color: '#f59e0b' },
      { name: 'Entertainment', type: 'expense', color: '#8b5cf6' }
    ];
    
    for (const cat of defaultCategories) {
      await dbRun('INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)',
        [result.lastID, cat.name, cat.type, cat.color]);
    }
    
    res.json({ success: true, user: { id: result.lastID, username, email } });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
  if (req.session.userId) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

// ============ CATEGORY ROUTES ============

app.get('/api/categories', requireAuth, async (req, res) => {
  try {
    const categories = await dbAll('SELECT * FROM categories WHERE user_id = ? ORDER BY name', [req.session.userId]);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/categories', requireAuth, async (req, res) => {
  const { name, type, color } = req.body;
  
  try {
    const result = await dbRun('INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)',
      [req.session.userId, name, type, color || '#3b82f6']);
    
    res.json({ success: true, id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    await dbRun('DELETE FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ TRANSACTION ROUTES ============

app.get('/api/transactions', requireAuth, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    let query = `
      SELECT t.*, c.name as category_name, c.type as category_type, c.color as category_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [req.session.userId];
    
    if (startDate) {
      query += ' AND t.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY t.date DESC, t.created_at DESC';
    
    const transactions = await dbAll(query, params);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/transactions', requireAuth, async (req, res) => {
  const { category_id, amount, description, date } = req.body;
  
  try {
    const result = await dbRun('INSERT INTO transactions (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)',
      [req.session.userId, category_id, amount, description, date]);
    
    res.json({ success: true, id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/transactions/:id', requireAuth, async (req, res) => {
  try {
    await dbRun('DELETE FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/summary', requireAuth, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    let query = `
      SELECT 
        c.type,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [req.session.userId];
    
    if (startDate) {
      query += ' AND t.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.date <= ?';
      params.push(endDate);
    }
    
    query += ' GROUP BY c.type';
    
    const results = await dbAll(query, params);
    
    const summary = {
      income: 0,
      expense: 0,
      balance: 0
    };
    
    results.forEach(row => {
      if (row.type === 'income') {
        summary.income = row.total;
      } else {
        summary.expense = row.total;
      }
    });
    
    summary.balance = summary.income - summary.expense;
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/spending-by-category', requireAuth, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    let query = `
      SELECT 
        c.name,
        c.color,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND c.type = 'expense'
    `;
    const params = [req.session.userId];
    
    if (startDate) {
      query += ' AND t.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.date <= ?';
      params.push(endDate);
    }
    
    query += ' GROUP BY c.id, c.name, c.color ORDER BY total DESC';
    
    const results = await dbAll(query, params);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ SAVINGS GOALS ROUTES ============

app.get('/api/savings-goals', requireAuth, async (req, res) => {
  try {
    const goals = await dbAll('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId]);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/savings-goals', requireAuth, async (req, res) => {
  const { name, target_amount, current_amount, deadline } = req.body;
  
  try {
    const result = await dbRun('INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)',
      [req.session.userId, name, target_amount, current_amount || 0, deadline]);
    
    res.json({ success: true, id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/savings-goals/:id', requireAuth, async (req, res) => {
  const { current_amount } = req.body;
  
  try {
    await dbRun('UPDATE savings_goals SET current_amount = ? WHERE id = ? AND user_id = ?',
      [current_amount, req.params.id, req.session.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/savings-goals/:id', requireAuth, async (req, res) => {
  try {
    await dbRun('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Finance Tracker running on port ${PORT}`);
  console.log('Demo account - username: demo, password: demo123');
});
