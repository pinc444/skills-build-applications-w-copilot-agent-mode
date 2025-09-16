import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';

// Import routes
import accountsRouter from './routes/accounts';
import transactionsRouter from './routes/transactions';
import categoriesRouter from './routes/categories';
import importRouter from './routes/import';
import reportsRouter from './routes/reports';

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

// Routes
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/import', importRouter);
app.use('/api/reports', reportsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Personal Finance API',
        version: '1.0.0',
        endpoints: {
            accounts: {
                'GET /api/accounts': 'List all accounts',
                'POST /api/accounts': 'Create new account',
                'GET /api/accounts/:id': 'Get account by ID',
                'PUT /api/accounts/:id': 'Update account',
                'DELETE /api/accounts/:id': 'Delete account',
                'POST /api/accounts/:id/puppeteer-config': 'Save Puppeteer configuration',
                'GET /api/accounts/:id/puppeteer-config': 'Get Puppeteer configuration',
                'POST /api/accounts/:id/test-selectors': 'Test Puppeteer selectors',
                'POST /api/accounts/:id/fetch-data': 'Trigger data fetch'
            },
            transactions: {
                'GET /api/transactions': 'List transactions with filters',
                'POST /api/transactions': 'Create new transaction',
                'GET /api/transactions/:id': 'Get transaction by ID',
                'PUT /api/transactions/:id': 'Update transaction',
                'DELETE /api/transactions/:id': 'Delete transaction',
                'POST /api/transactions/bulk-update': 'Bulk update transactions',
                'DELETE /api/transactions/bulk-delete': 'Bulk delete transactions',
                'GET /api/transactions/account/:accountId/balance': 'Get account balance'
            },
            categories: {
                'GET /api/categories': 'List all categories',
                'POST /api/categories': 'Create new category',
                'GET /api/categories/:id': 'Get category by ID',
                'PUT /api/categories/:id': 'Update category',
                'DELETE /api/categories/:id': 'Delete category'
            },
            import: {
                'POST /api/import/preview-qif': 'Preview QIF file import',
                'POST /api/import/preview-csv': 'Preview CSV file import',
                'POST /api/import/execute': 'Execute import from preview',
                'GET /api/import/sample-qif': 'Get sample QIF format',
                'GET /api/import/sample-csv': 'Get sample CSV format',
                'GET /api/import/field-suggestions': 'Get field mapping suggestions'
            },
            reports: {
                'GET /api/reports/balance-sheet': 'Generate balance sheet',
                'GET /api/reports/income-statement': 'Generate income statement',
                'GET /api/reports/category-analysis': 'Category spending analysis',
                'GET /api/reports/monthly-trend': 'Monthly income/expense trend',
                'GET /api/reports/budget-suggestions': 'Budget suggestions'
            }
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        availableEndpoints: '/api'
    });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', error);
    
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: error.message
        });
    }
    
    if (error.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({
            error: 'Conflict',
            details: 'A record with this data already exists'
        });
    }
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Database initialization and server startup
async function startServer() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        console.log('Database connected successfully');

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API documentation available at: http://localhost:${PORT}/api`);
            console.log(`Health check available at: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await AppDataSource.destroy();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await AppDataSource.destroy();
    process.exit(0);
});

startServer();