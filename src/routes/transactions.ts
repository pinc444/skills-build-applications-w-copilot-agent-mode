import { Router, Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { TransactionStatus } from '../entities/Transaction';

const router = Router();
const transactionService = new TransactionService();

// GET /api/transactions - List transactions with filters
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            accountId,
            categoryId,
            dateFrom,
            dateTo,
            status,
            page = 1,
            limit = 50
        } = req.query;

        const filters: any = {};
        
        if (accountId) filters.accountId = parseInt(accountId as string);
        if (categoryId) filters.categoryId = parseInt(categoryId as string);
        if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
        if (dateTo) filters.dateTo = new Date(dateTo as string);
        if (status && Object.values(TransactionStatus).includes(status as TransactionStatus)) {
            filters.status = status as TransactionStatus;
        }

        const transactions = await transactionService.getTransactions(filters);
        
        // Simple pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        
        const paginatedTransactions = transactions.slice(startIndex, endIndex);

        res.json({
            transactions: paginatedTransactions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: transactions.length,
                hasMore: endIndex < transactions.length
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
    }
});

// POST /api/transactions - Create new transaction
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            date,
            amount,
            description,
            debitAccountId,
            creditAccountId,
            categoryId,
            reference,
            notes
        } = req.body;

        if (!date || !amount || !description || !debitAccountId || !creditAccountId) {
            return res.status(400).json({
                error: 'Date, amount, description, debit account, and credit account are required'
            });
        }

        if (debitAccountId === creditAccountId) {
            return res.status(400).json({
                error: 'Debit and credit accounts must be different'
            });
        }

        const transaction = await transactionService.createTransaction({
            date: new Date(date),
            amount: parseFloat(amount),
            description,
            debitAccountId: parseInt(debitAccountId),
            creditAccountId: parseInt(creditAccountId),
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            reference,
            notes
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create transaction', details: error.message });
    }
});

// GET /api/transactions/:id - Get transaction by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const transactionId = parseInt(req.params.id);
        const transactions = await transactionService.getTransactions();
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transaction', details: error.message });
    }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const transactionId = parseInt(req.params.id);
        const updates = req.body;

        // Validate that debit and credit accounts are different if both provided
        if (updates.debitAccountId && updates.creditAccountId && 
            updates.debitAccountId === updates.creditAccountId) {
            return res.status(400).json({
                error: 'Debit and credit accounts must be different'
            });
        }

        // Parse numeric fields
        if (updates.amount) updates.amount = parseFloat(updates.amount);
        if (updates.debitAccountId) updates.debitAccountId = parseInt(updates.debitAccountId);
        if (updates.creditAccountId) updates.creditAccountId = parseInt(updates.creditAccountId);
        if (updates.categoryId) updates.categoryId = parseInt(updates.categoryId);
        if (updates.date) updates.date = new Date(updates.date);

        const transaction = await transactionService.updateTransaction(transactionId, updates);
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update transaction', details: error.message });
    }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const transactionId = parseInt(req.params.id);
        await transactionService.deleteTransaction(transactionId);
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete transaction', details: error.message });
    }
});

// POST /api/transactions/bulk-update - Bulk update transactions
router.post('/bulk-update', async (req: Request, res: Response) => {
    try {
        const { transactionIds, updates } = req.body;

        if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
            return res.status(400).json({ error: 'Transaction IDs array is required' });
        }

        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ error: 'Updates object is required' });
        }

        // Parse numeric fields
        if (updates.categoryId) updates.categoryId = parseInt(updates.categoryId);
        if (updates.status && !Object.values(TransactionStatus).includes(updates.status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        await transactionService.bulkUpdateTransactions(transactionIds, updates);
        res.json({ message: `${transactionIds.length} transactions updated successfully` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to bulk update transactions', details: error.message });
    }
});

// DELETE /api/transactions/bulk-delete - Bulk delete transactions
router.delete('/bulk-delete', async (req: Request, res: Response) => {
    try {
        const { transactionIds } = req.body;

        if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
            return res.status(400).json({ error: 'Transaction IDs array is required' });
        }

        await transactionService.bulkDeleteTransactions(transactionIds);
        res.json({ message: `${transactionIds.length} transactions deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to bulk delete transactions', details: error.message });
    }
});

// GET /api/transactions/account/:accountId/balance - Get account balance
router.get('/account/:accountId/balance', async (req: Request, res: Response) => {
    try {
        const accountId = parseInt(req.params.accountId);
        const balance = await transactionService.getAccountBalance(accountId);
        res.json({ accountId, balance });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get account balance', details: error.message });
    }
});

export default router;