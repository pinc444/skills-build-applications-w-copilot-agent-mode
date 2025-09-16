import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Mock data for demonstration (normally from database)
const mockAccounts = [
    {
        id: 1,
        name: "Chase Checking",
        type: "asset_bank",
        description: "Main checking account",
        balance: 2500.75,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 2,
        name: "Visa Credit Card",
        type: "liability_credit_card",
        description: "Rewards credit card",
        balance: -850.25,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const mockCategories = [
    { id: 1, name: "Food", type: "expense", active: true },
    { id: 2, name: "Transportation", type: "expense", active: true },
    { id: 3, name: "Salary", type: "income", active: true },
    { id: 4, name: "Entertainment", type: "expense", active: true }
];

const mockTransactions = [
    {
        id: 1,
        date: new Date().toISOString().split('T')[0],
        amount: 45.67,
        description: "Grocery Store Purchase",
        debitAccountId: 4,
        creditAccountId: 1,
        categoryId: 1,
        status: "cleared",
        debitAccount: { id: 4, name: "Expenses - Food", type: "expense" },
        creditAccount: { id: 1, name: "Chase Checking", type: "asset_bank" },
        category: { id: 1, name: "Food", type: "expense" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'Mock mode (for demonstration)'
    });
});

app.get('/api', (req, res) => {
    res.json({
        name: 'Personal Finance API',
        version: '1.0.0',
        mode: 'Demo Mode - Using mock data',
        endpoints: {
            accounts: 'GET /api/accounts',
            categories: 'GET /api/categories', 
            transactions: 'GET /api/transactions',
            health: 'GET /api/health'
        }
    });
});

// Mock API endpoints
app.get('/api/accounts', (req, res) => {
    res.json(mockAccounts);
});

app.get('/api/categories', (req, res) => {
    const type = req.query.type;
    const filtered = type ? mockCategories.filter(c => c.type === type) : mockCategories;
    res.json(filtered);
});

app.get('/api/transactions', (req, res) => {
    res.json({
        transactions: mockTransactions,
        pagination: { page: 1, limit: 50, total: mockTransactions.length, hasMore: false }
    });
});

app.get('/api/reports/balance-sheet', (req, res) => {
    res.json({
        assets: {
            bank: [{ id: 1, name: "Chase Checking", balance: 2500.75 }],
            investment: [],
            cash: [],
            total: 2500.75
        },
        liabilities: {
            creditCard: [{ id: 2, name: "Visa Credit Card", balance: 850.25 }],
            loan: [],
            total: 850.25
        },
        equity: {
            total: 1650.50
        }
    });
});

app.get('/api/import/sample-qif', (req, res) => {
    const sampleQif = `!Type:Bank
D12/1/2024
T-50.00
PGrocery Store
LFood
CX
^
D12/2/2024
T2500.00
PPayroll Deposit
LSalary
C*
^`;
    res.type('text/plain').send(sampleQif);
});

app.get('/api/import/sample-csv', (req, res) => {
    const sampleCsv = `Date,Description,Amount,Category,Reference
12/1/2024,"Grocery Store",-50.00,"Food","Check 1001"
12/2/2024,"Payroll Deposit",2500.00,"Salary",""
12/3/2024,"Gas Station",-25.00,"Transportation",""`;
    res.type('text/csv').send(sampleCsv);
});

// Serve static files and React app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.get('/accounts', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.get('/transactions', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.get('/import', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Personal Finance App running on port ${PORT}`);
    console.log(`📊 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
    console.log(`📋 Mode: Demo with mock data`);
});