# Personal Finance Application

A comprehensive personal finance management application built with Node.js, TypeScript, Express, TypeORM, and React. Features double-entry bookkeeping, automated bank data imports via Puppeteer, and powerful reporting capabilities.

![Personal Finance App Homepage](https://github.com/user-attachments/assets/04f88f92-f859-45e1-9a5c-f679d5872123)

## Features

### ✅ Core Functionality
- **Double-entry bookkeeping system** with proper debit/credit accounting
- **Account management** for banks, credit cards, assets, liabilities, income, and expenses
- **Transaction management** with bulk operations and categorization
- **Category system** for organizing income and expenses
- **Secure credential storage** with encryption for sensitive bank information

### 💾 Data Import & Export
- **Manual file import** supporting QIF and CSV formats
- **Field mapping interface** for CSV files with preview functionality
- **Automated bank data fetching** using Puppeteer for supported institutions
- **Bulk transaction processing** with error handling and validation

### 📊 Reports & Analytics
- **Balance Sheet** showing assets, liabilities, and net worth
- **Income Statement** with categorized income and expenses
- **Category Analysis** with spending breakdowns and visualizations
- **Monthly Trends** tracking income/expense patterns over time
- **Budget Suggestions** based on historical data analysis

### 🤖 Automation Features
- **Puppeteer integration** for automated bank data retrieval
- **CSS selector configuration** for different banking websites
- **Encrypted credential storage** for bank login information
- **Automated transaction categorization** and account mapping

## Tech Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** web framework
- **TypeORM** for database operations
- **PostgreSQL** database
- **Crypto** for secure encryption
- **Multer** for file uploads

### Frontend
- **React 18** with JavaScript (JSX)
- **React Router** for navigation
- **Bootstrap 5** for styling
- **Fetch API** for backend communication

## Getting Started

### Demo Mode (No Database Required)
For demonstration purposes, run with mock data:
```bash
npm install
npm run build
cd frontend && npm install && npm run build && cd ..
npm run demo
```

The application will be available at `http://localhost:3001`

## API Endpoints

- `GET /api/health` - Health check and status
- `GET /api/accounts` - List all accounts  
- `GET /api/transactions` - List transactions
- `GET /api/categories` - List categories
- `GET /api/reports/balance-sheet` - Generate balance sheet
- `GET /api/import/sample-qif` - Download sample QIF file
- `GET /api/import/sample-csv` - Download sample CSV file

View full API documentation at: `http://localhost:3001/api`

---

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

