# Personal Finance Tracker

A full-stack web application for tracking personal expenses, managing budgets, and monitoring savings goals with interactive visualizations.

## Features

- **Expense Tracking**: Record income and expenses with categories
- **Interactive Charts**: Visualize spending patterns with Chart.js
- **Category Management**: Create custom income/expense categories
- **Savings Goals**: Set and track progress toward financial goals
- **Weekly Summaries**: View recent transaction summaries
- **CSV Export**: Download transaction history
- **User Authentication**: Secure login and registration
- **Responsive Design**: Works on desktop and mobile devices
- **SQL Database**: Persistent data storage with SQLite

## Tech Stack

### Frontend
- HTML5/CSS3
- Vanilla JavaScript
- Chart.js for data visualization
- Responsive design with CSS Grid/Flexbox

### Backend
- Node.js
- Express.js
- Better-SQLite3 for database
- bcryptjs for password hashing
- Express-session for authentication

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup

1. **Clone the repository**
   ```bash
   cd Finance_Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run init-db
   ```
   This creates the SQLite database with tables and a demo account.

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Demo Account
- **Username**: demo
- **Password**: demo123

### Development Mode
For auto-restart on file changes:
```bash
npm run dev
```

## Features Guide

### Authentication
- Register a new account or login with existing credentials
- Sessions persist for 24 hours
- Secure password hashing with bcrypt

### Managing Transactions
1. Select the "Transactions" tab
2. Choose a category, enter amount, description, and date
3. Click "Add Transaction"
4. View transaction history below
5. Delete transactions with the Delete button

### Categories
1. Navigate to the "Categories" tab
2. Enter category name, type (income/expense), and color
3. Click "Add Category"
4. Custom categories appear in transaction dropdowns

### Savings Goals
1. Go to the "Savings Goals" tab
2. Set a goal name, target amount, current amount, and deadline
3. Track progress with visual progress bars
4. Update progress by adding amounts incrementally

### Filters & Export
- Filter transactions by date range
- Clear filters to see all transactions
- Export data to CSV for external analysis

### Charts
- **Spending by Category**: Doughnut chart showing expense distribution
- **Income vs Expenses**: Bar chart comparing financial totals

## Project Structure

```
Finance_Tracker/
├── public/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # CSS styling
│   └── app.js          # Frontend JavaScript
├── server.js           # Express server & API routes
├── init-db.js          # Database initialization script
├── package.json        # Dependencies
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Database Schema

### users
- id (PRIMARY KEY)
- username (UNIQUE)
- password_hash
- email
- created_at

### categories
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- name
- type (income/expense)
- color

### transactions
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- category_id (FOREIGN KEY)
- amount
- description
- date
- created_at

### savings_goals
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- name
- target_amount
- current_amount
- deadline
- created_at

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout
- `GET /api/auth/status` - Check authentication status

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `DELETE /api/categories/:id` - Delete category

### Transactions
- `GET /api/transactions` - Get all transactions (supports date filtering)
- `POST /api/transactions` - Create transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/summary` - Get financial summary
- `GET /api/spending-by-category` - Get spending breakdown

### Savings Goals
- `GET /api/savings-goals` - Get all goals
- `POST /api/savings-goals` - Create goal
- `PUT /api/savings-goals/:id` - Update goal progress
- `DELETE /api/savings-goals/:id` - Delete goal

## Security Features

- Password hashing with bcryptjs
- Session-based authentication
- SQL injection prevention with prepared statements
- CSRF protection through session management
- User data isolation (users can only access their own data)

## Development

### Making Changes
1. Edit files in `public/` for frontend changes
2. Edit `server.js` for backend/API changes
3. Restart server to see changes (or use `npm run dev`)

### Database Reset
To reset the database:
```bash
rm finance_tracker.db
npm run init-db
```

## Future Enhancements

Potential features to add:
- Budget limits and alerts
- Recurring transactions
- Multi-currency support
- Mobile app version
- Data import from bank statements
- Advanced reporting and analytics
- Email notifications
- Dark mode theme

## Troubleshooting

**Port already in use**
- Change PORT in `server.js` (default is 3000)

**Database errors**
- Delete `finance_tracker.db` and run `npm run init-db` again

**Charts not displaying**
- Ensure Chart.js CDN is accessible
- Check browser console for errors

## License

Educational project for portfolio purposes. Free to use and modify.

## Author

Created as a full-stack development portfolio project demonstrating:
- RESTful API design
- Database design and SQL
- Frontend development with vanilla JavaScript
- User authentication
- Data visualization
- Git version control

---

**Built with Node.js, Express, SQLite, and vanilla JavaScript**
