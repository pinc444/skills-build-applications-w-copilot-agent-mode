import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Transaction, TransactionStatus } from "../entities/Transaction";
import { Account } from "../entities/Account";
import { Category } from "../entities/Category";

export class TransactionService {
    private transactionRepository: Repository<Transaction>;
    private accountRepository: Repository<Account>;
    private categoryRepository: Repository<Category>;

    constructor() {
        this.transactionRepository = AppDataSource.getRepository(Transaction);
        this.accountRepository = AppDataSource.getRepository(Account);
        this.categoryRepository = AppDataSource.getRepository(Category);
    }

    async createTransaction(transactionData: {
        date: Date;
        amount: number;
        description: string;
        debitAccountId: number;
        creditAccountId: number;
        categoryId?: number;
        reference?: string;
        notes?: string;
    }): Promise<Transaction> {
        // Validate accounts exist
        const [debitAccount, creditAccount] = await Promise.all([
            this.accountRepository.findOneBy({ id: transactionData.debitAccountId }),
            this.accountRepository.findOneBy({ id: transactionData.creditAccountId })
        ]);

        if (!debitAccount || !creditAccount) {
            throw new Error("One or both accounts not found");
        }

        // Create transaction
        const transaction = this.transactionRepository.create({
            ...transactionData,
            status: TransactionStatus.PENDING
        });

        const savedTransaction = await this.transactionRepository.save(transaction);

        // Update account balances
        await this.updateAccountBalances(transactionData.debitAccountId, transactionData.creditAccountId, transactionData.amount);

        return savedTransaction;
    }

    async getTransactions(filters?: {
        accountId?: number;
        categoryId?: number;
        dateFrom?: Date;
        dateTo?: Date;
        status?: TransactionStatus;
    }): Promise<Transaction[]> {
        const queryBuilder = this.transactionRepository
            .createQueryBuilder("transaction")
            .leftJoinAndSelect("transaction.debitAccount", "debitAccount")
            .leftJoinAndSelect("transaction.creditAccount", "creditAccount")
            .leftJoinAndSelect("transaction.category", "category")
            .orderBy("transaction.date", "DESC");

        if (filters?.accountId) {
            queryBuilder.where(
                "(transaction.debitAccountId = :accountId OR transaction.creditAccountId = :accountId)",
                { accountId: filters.accountId }
            );
        }

        if (filters?.categoryId) {
            queryBuilder.andWhere("transaction.categoryId = :categoryId", { categoryId: filters.categoryId });
        }

        if (filters?.dateFrom) {
            queryBuilder.andWhere("transaction.date >= :dateFrom", { dateFrom: filters.dateFrom });
        }

        if (filters?.dateTo) {
            queryBuilder.andWhere("transaction.date <= :dateTo", { dateTo: filters.dateTo });
        }

        if (filters?.status) {
            queryBuilder.andWhere("transaction.status = :status", { status: filters.status });
        }

        return await queryBuilder.getMany();
    }

    async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction> {
        const transaction = await this.transactionRepository.findOneBy({ id });
        if (!transaction) {
            throw new Error("Transaction not found");
        }

        // If amount or accounts are changing, revert old balance changes and apply new ones
        if (updates.amount !== undefined || updates.debitAccountId !== undefined || updates.creditAccountId !== undefined) {
            // Revert old balance changes
            await this.updateAccountBalances(transaction.debitAccountId, transaction.creditAccountId, -transaction.amount);
            
            // Apply new balance changes
            const newAmount = updates.amount ?? transaction.amount;
            const newDebitAccountId = updates.debitAccountId ?? transaction.debitAccountId;
            const newCreditAccountId = updates.creditAccountId ?? transaction.creditAccountId;
            
            await this.updateAccountBalances(newDebitAccountId, newCreditAccountId, newAmount);
        }

        Object.assign(transaction, updates);
        return await this.transactionRepository.save(transaction);
    }

    async deleteTransaction(id: number): Promise<void> {
        const transaction = await this.transactionRepository.findOneBy({ id });
        if (!transaction) {
            throw new Error("Transaction not found");
        }

        // Revert balance changes
        await this.updateAccountBalances(transaction.debitAccountId, transaction.creditAccountId, -transaction.amount);

        await this.transactionRepository.remove(transaction);
    }

    async bulkUpdateTransactions(ids: number[], updates: Partial<Transaction>): Promise<void> {
        await this.transactionRepository.update(ids, updates);
    }

    async bulkDeleteTransactions(ids: number[]): Promise<void> {
        // Get transactions first to revert balance changes
        const transactions = await this.transactionRepository.findByIds(ids);
        
        for (const transaction of transactions) {
            await this.updateAccountBalances(transaction.debitAccountId, transaction.creditAccountId, -transaction.amount);
        }

        await this.transactionRepository.delete(ids);
    }

    private async updateAccountBalances(debitAccountId: number, creditAccountId: number, amount: number): Promise<void> {
        // In double-entry bookkeeping:
        // - Debiting an asset/expense account increases its balance
        // - Crediting a liability/income account increases its balance
        // - The amount increases debit account and decreases credit account
        
        await Promise.all([
            this.accountRepository.increment({ id: debitAccountId }, "balance", amount),
            this.accountRepository.decrement({ id: creditAccountId }, "balance", amount)
        ]);
    }

    async getAccountBalance(accountId: number): Promise<number> {
        const account = await this.accountRepository.findOneBy({ id: accountId });
        return account?.balance || 0;
    }
}