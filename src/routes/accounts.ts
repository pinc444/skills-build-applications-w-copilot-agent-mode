import { Router, Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Account, AccountType } from '../entities/Account';
import { PuppeteerService } from '../services/PuppeteerService';

const router = Router();
const puppeteerService = new PuppeteerService();

// GET /api/accounts - List all accounts
router.get('/', async (req: Request, res: Response) => {
    try {
        const accountRepository = AppDataSource.getRepository(Account);
        const accounts = await accountRepository.find({
            where: { active: true },
            order: { name: 'ASC' }
        });

        // Don't return encrypted credentials
        const safeAccounts = accounts.map(account => ({
            ...account,
            encryptedUsername: undefined,
            encryptedPassword: undefined
        }));

        res.json(safeAccounts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch accounts', details: (error as Error).message });
    }
});

// POST /api/accounts - Create new account
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, type, description, balance = 0 } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        if (!Object.values(AccountType).includes(type)) {
            return res.status(400).json({ error: 'Invalid account type' });
        }

        const accountRepository = AppDataSource.getRepository(Account);
        
        const account = accountRepository.create({
            name,
            type,
            description,
            balance: parseFloat(balance) || 0
        });

        const savedAccount = await accountRepository.save(account);
        
        res.status(201).json(savedAccount);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create account', details: (error as Error).message });
    }
});

// GET /api/accounts/:id - Get account by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const accountId = parseInt(req.params.id);
        const accountRepository = AppDataSource.getRepository(Account);
        
        const account = await accountRepository.findOneBy({ id: accountId });
        
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Don't return encrypted credentials
        const safeAccount = {
            ...account,
            encryptedUsername: undefined,
            encryptedPassword: undefined
        };

        res.json(safeAccount);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch account', details: (error as Error).message });
    }
});

// PUT /api/accounts/:id - Update account
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const accountId = parseInt(req.params.id);
        const { name, type, description, balance, active } = req.body;

        const accountRepository = AppDataSource.getRepository(Account);
        const account = await accountRepository.findOneBy({ id: accountId });
        
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        if (name !== undefined) account.name = name;
        if (type !== undefined) {
            if (!Object.values(AccountType).includes(type)) {
                return res.status(400).json({ error: 'Invalid account type' });
            }
            account.type = type;
        }
        if (description !== undefined) account.description = description;
        if (balance !== undefined) account.balance = parseFloat(balance) || 0;
        if (active !== undefined) account.active = active;

        const savedAccount = await accountRepository.save(account);
        
        // Don't return encrypted credentials
        const safeAccount = {
            ...savedAccount,
            encryptedUsername: undefined,
            encryptedPassword: undefined
        };

        res.json(safeAccount);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update account', details: (error as Error).message });
    }
});

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const accountId = parseInt(req.params.id);
        const accountRepository = AppDataSource.getRepository(Account);
        
        const account = await accountRepository.findOneBy({ id: accountId });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Soft delete by marking inactive
        account.active = false;
        await accountRepository.save(account);
        
        res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete account', details: (error as Error).message });
    }
});

// POST /api/accounts/:id/puppeteer-config - Save Puppeteer configuration
router.post('/:id/puppeteer-config', async (req: Request, res: Response) => {
    try {
        const accountId = parseInt(req.params.id);
        const config = req.body;

        const validation = puppeteerService.validateConfig(config);
        if (!validation.valid) {
            return res.status(400).json({ 
                error: 'Invalid configuration', 
                details: validation.errors 
            });
        }

        await puppeteerService.saveAccountConfig(accountId, config);
        
        res.json({ message: 'Configuration saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save configuration', details: (error as Error).message });
    }
});

// GET /api/accounts/:id/puppeteer-config - Get Puppeteer configuration (without credentials)
router.get('/:id/puppeteer-config', async (req: Request, res: Response) => {
    try {
        const accountId = parseInt(req.params.id);
        const config = await puppeteerService.getAccountConfig(accountId);
        
        if (!config) {
            return res.status(404).json({ error: 'Configuration not found' });
        }

        // Return config without credentials for security
        const safeConfig = {
            loginUrl: config.loginUrl,
            loginSelector: config.loginSelector,
            passwordSelector: config.passwordSelector,
            submitSelector: config.submitSelector,
            exportSelector: config.exportSelector,
            hasCredentials: true
        };

        res.json(safeConfig);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch configuration', details: (error as Error).message });
    }
});

// POST /api/accounts/:id/test-selectors - Test Puppeteer selectors
router.post('/:id/test-selectors', async (req: Request, res: Response) => {
    try {
        const accountId = parseInt(req.params.id);
        const config = req.body;

        const result = await puppeteerService.testSelectors(config);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to test selectors', details: (error as Error).message });
    }
});

// POST /api/accounts/:id/fetch-data - Trigger data fetch
router.post('/:id/fetch-data', async (req: Request, res: Response) => {
    try {
        const accountId = parseInt(req.params.id);
        
        // This could be made async with job queuing
        const result = await puppeteerService.triggerDataFetch(accountId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data', details: (error as Error).message });
    }
});

export default router;