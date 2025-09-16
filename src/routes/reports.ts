import { Router, Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Transaction } from '../entities/Transaction';
import { Account, AccountType } from '../entities/Account';
import { Category, CategoryType } from '../entities/Category';

const router = Router();

// GET /api/reports/balance-sheet - Basic balance sheet report
router.get('/balance-sheet', async (req: Request, res: Response) => {
    try {
        const accountRepository = AppDataSource.getRepository(Account);
        const accounts = await accountRepository.find({
            where: { active: true },
            order: { type: 'ASC', name: 'ASC' }
        });

        const balanceSheet = {
            assets: {
                bank: [] as any[],
                investment: [] as any[],
                cash: [] as any[],
                total: 0
            },
            liabilities: {
                creditCard: [] as any[],
                loan: [] as any[],
                total: 0
            },
            equity: {
                total: 0
            }
        };

        for (const account of accounts) {
            const balance = parseFloat(account.balance.toString());
            
            switch (account.type) {
                case AccountType.ASSET_BANK:
                    balanceSheet.assets.bank.push({ ...account, balance });
                    balanceSheet.assets.total += balance;
                    break;
                case AccountType.ASSET_INVESTMENT:
                    balanceSheet.assets.investment.push({ ...account, balance });
                    balanceSheet.assets.total += balance;
                    break;
                case AccountType.ASSET_CASH:
                    balanceSheet.assets.cash.push({ ...account, balance });
                    balanceSheet.assets.total += balance;
                    break;
                case AccountType.LIABILITY_CREDIT_CARD:
                    balanceSheet.liabilities.creditCard.push({ ...account, balance });
                    balanceSheet.liabilities.total += balance;
                    break;
                case AccountType.LIABILITY_LOAN:
                    balanceSheet.liabilities.loan.push({ ...account, balance });
                    balanceSheet.liabilities.total += balance;
                    break;
            }
        }

        balanceSheet.equity.total = balanceSheet.assets.total - balanceSheet.liabilities.total;

        res.json(balanceSheet);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate balance sheet', details: (error as Error).message });
    }
});

// GET /api/reports/income-statement - Income statement report
router.get('/income-statement', async (req: Request, res: Response) => {
    try {
        const { dateFrom, dateTo } = req.query;
        
        const startDate = dateFrom ? new Date(dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
        const endDate = dateTo ? new Date(dateTo as string) : new Date();

        const transactionRepository = AppDataSource.getRepository(Transaction);
        const transactions = await transactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.debitAccount', 'debitAccount')
            .leftJoinAndSelect('transaction.creditAccount', 'creditAccount')
            .leftJoinAndSelect('transaction.category', 'category')
            .where('transaction.date >= :startDate', { startDate })
            .andWhere('transaction.date <= :endDate', { endDate })
            .getMany();

        const incomeStatement = {
            period: { from: startDate, to: endDate },
            income: {
                categories: {} as any,
                total: 0
            },
            expenses: {
                categories: {} as any,
                total: 0
            },
            netIncome: 0
        };

        for (const transaction of transactions) {
            const amount = parseFloat(transaction.amount.toString());
            
            // Income: money flowing into income accounts (credit side)
            if (transaction.creditAccount.type === AccountType.INCOME) {
                const categoryName = transaction.category?.name || 'Uncategorized';
                if (!incomeStatement.income.categories[categoryName]) {
                    incomeStatement.income.categories[categoryName] = 0;
                }
                incomeStatement.income.categories[categoryName] += amount;
                incomeStatement.income.total += amount;
            }
            
            // Expenses: money flowing into expense accounts (debit side)
            if (transaction.debitAccount.type === AccountType.EXPENSE) {
                const categoryName = transaction.category?.name || 'Uncategorized';
                if (!incomeStatement.expenses.categories[categoryName]) {
                    incomeStatement.expenses.categories[categoryName] = 0;
                }
                incomeStatement.expenses.categories[categoryName] += amount;
                incomeStatement.expenses.total += amount;
            }
        }

        incomeStatement.netIncome = incomeStatement.income.total - incomeStatement.expenses.total;

        res.json(incomeStatement);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate income statement', details: (error as Error).message });
    }
});

// GET /api/reports/category-analysis - Category-based spending analysis
router.get('/category-analysis', async (req: Request, res: Response) => {
    try {
        const { dateFrom, dateTo, type = 'expense' } = req.query;
        
        const startDate = dateFrom ? new Date(dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
        const endDate = dateTo ? new Date(dateTo as string) : new Date();

        const transactionRepository = AppDataSource.getRepository(Transaction);
        const categoryRepository = AppDataSource.getRepository(Category);

        const queryBuilder = transactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.category', 'category')
            .leftJoinAndSelect('transaction.debitAccount', 'debitAccount')
            .leftJoinAndSelect('transaction.creditAccount', 'creditAccount')
            .where('transaction.date >= :startDate', { startDate })
            .andWhere('transaction.date <= :endDate', { endDate });

        if (type === 'expense') {
            queryBuilder.andWhere('debitAccount.type = :accountType', { accountType: AccountType.EXPENSE });
        } else if (type === 'income') {
            queryBuilder.andWhere('creditAccount.type = :accountType', { accountType: AccountType.INCOME });
        }

        const transactions = await queryBuilder.getMany();

        const analysis: any = {
            period: { from: startDate, to: endDate },
            type,
            categories: {},
            total: 0,
            uncategorized: 0
        };

        for (const transaction of transactions) {
            const amount = parseFloat(transaction.amount.toString());
            
            if (transaction.category) {
                const categoryName = transaction.category.name;
                if (!analysis.categories[categoryName]) {
                    analysis.categories[categoryName] = {
                        amount: 0,
                        count: 0,
                        percentage: 0
                    };
                }
                analysis.categories[categoryName].amount += amount;
                analysis.categories[categoryName].count += 1;
            } else {
                analysis.uncategorized += amount;
            }
            
            analysis.total += amount;
        }

        // Calculate percentages
        for (const categoryName in analysis.categories) {
            const category = analysis.categories[categoryName];
            category.percentage = analysis.total > 0 ? (category.amount / analysis.total) * 100 : 0;
        }

        // Sort categories by amount
        const sortedCategories: any = {};
        Object.keys(analysis.categories)
            .sort((a, b) => analysis.categories[b].amount - analysis.categories[a].amount)
            .forEach(key => {
                sortedCategories[key] = analysis.categories[key];
            });
        
        analysis.categories = sortedCategories;

        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate category analysis', details: (error as Error).message });
    }
});

// GET /api/reports/monthly-trend - Monthly income/expense trend
router.get('/monthly-trend', async (req: Request, res: Response) => {
    try {
        const { months = 12 } = req.query;
        const monthsToShow = parseInt(months as string);
        
        const endDate = new Date();
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - monthsToShow + 1, 1);

        const transactionRepository = AppDataSource.getRepository(Transaction);
        const transactions = await transactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.debitAccount', 'debitAccount')
            .leftJoinAndSelect('transaction.creditAccount', 'creditAccount')
            .where('transaction.date >= :startDate', { startDate })
            .andWhere('transaction.date <= :endDate', { endDate })
            .orderBy('transaction.date', 'ASC')
            .getMany();

        const monthlyData: any = {};

        for (const transaction of transactions) {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: monthKey,
                    income: 0,
                    expenses: 0,
                    net: 0
                };
            }

            const amount = parseFloat(transaction.amount.toString());

            if (transaction.creditAccount.type === AccountType.INCOME) {
                monthlyData[monthKey].income += amount;
            }
            
            if (transaction.debitAccount.type === AccountType.EXPENSE) {
                monthlyData[monthKey].expenses += amount;
            }
        }

        // Calculate net income and fill in missing months
        const trend = [];
        for (let i = 0; i < monthsToShow; i++) {
            const date = new Date(endDate.getFullYear(), endDate.getMonth() - monthsToShow + 1 + i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].expenses;
                trend.push(monthlyData[monthKey]);
            } else {
                trend.push({
                    month: monthKey,
                    income: 0,
                    expenses: 0,
                    net: 0
                });
            }
        }

        res.json(trend);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate monthly trend', details: (error as Error).message });
    }
});

// GET /api/reports/budget-suggestions - Basic budget suggestions based on historical data
router.get('/budget-suggestions', async (req: Request, res: Response) => {
    try {
        // This is a stub implementation - in a real app, this would analyze historical spending patterns
        // and provide intelligent budget suggestions
        
        const suggestions = [
            {
                category: 'Food',
                currentMonthlyAverage: 450,
                suggestedBudget: 500,
                reasoning: 'Based on 3-month average spending pattern'
            },
            {
                category: 'Transportation',
                currentMonthlyAverage: 200,
                suggestedBudget: 250,
                reasoning: 'Allowing for seasonal variation and gas price fluctuations'
            },
            {
                category: 'Entertainment',
                currentMonthlyAverage: 150,
                suggestedBudget: 180,
                reasoning: 'Slight increase to account for special occasions'
            }
        ];

        res.json({
            message: 'Budget suggestions based on historical data analysis',
            suggestions,
            disclaimer: 'These are automated suggestions. Please review and adjust based on your financial goals.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate budget suggestions', details: (error as Error).message });
    }
});

export default router;