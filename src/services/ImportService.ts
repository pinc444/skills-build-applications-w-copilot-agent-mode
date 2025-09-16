import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Transaction } from "../entities/Transaction";
import { Account, AccountType } from "../entities/Account";
import { Category, CategoryType } from "../entities/Category";
import { parseQif, parseCsv, QifTransaction, CsvTransaction } from "../utils/fileParser";
import { TransactionService } from "./TransactionService";

export interface ImportMapping {
    dateField: string;
    amountField: string;
    descriptionField: string;
    categoryField?: string;
    referenceField?: string;
}

export interface ImportPreview {
    transactions: any[];
    mappings: ImportMapping;
    errors: string[];
    warnings: string[];
}

export class ImportService {
    private transactionService: TransactionService;
    private accountRepository: Repository<Account>;
    private categoryRepository: Repository<Category>;

    constructor() {
        this.transactionService = new TransactionService();
        this.accountRepository = AppDataSource.getRepository(Account);
        this.categoryRepository = AppDataSource.getRepository(Category);
    }

    async previewQifImport(qifContent: string, accountId: number): Promise<ImportPreview> {
        const parsedTransactions = parseQif(qifContent);
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Validate account exists
        const account = await this.accountRepository.findOneBy({ id: accountId });
        if (!account) {
            errors.push("Target account not found");
        }

        const transactions = parsedTransactions.map((qifTrans, index) => {
            const transaction: any = {
                originalIndex: index,
                date: this.parseDate(qifTrans.date),
                amount: Math.abs(qifTrans.amount), // Always positive for preview
                description: qifTrans.description,
                reference: qifTrans.reference,
                category: qifTrans.category,
                isDebit: qifTrans.amount < 0, // Negative amounts are debits (money out)
            };

            // Validate date
            if (!transaction.date || isNaN(transaction.date.getTime())) {
                errors.push(`Invalid date format at row ${index + 1}: ${qifTrans.date}`);
            }

            // Validate amount
            if (isNaN(transaction.amount) || transaction.amount === 0) {
                errors.push(`Invalid amount at row ${index + 1}: ${qifTrans.amount}`);
            }

            return transaction;
        });

        return {
            transactions,
            mappings: {
                dateField: 'date',
                amountField: 'amount',
                descriptionField: 'description',
                categoryField: 'category',
                referenceField: 'reference'
            },
            errors,
            warnings
        };
    }

    async previewCsvImport(csvContent: string, mappings: ImportMapping, accountId: number): Promise<ImportPreview> {
        const parsedData = parseCsv(csvContent);
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate account exists
        const account = await this.accountRepository.findOneBy({ id: accountId });
        if (!account) {
            errors.push("Target account not found");
        }

        // Validate mappings
        if (parsedData.length > 0) {
            const firstRow = parsedData[0];
            const availableFields = Object.keys(firstRow);
            
            if (!availableFields.includes(mappings.dateField)) {
                errors.push(`Date field '${mappings.dateField}' not found in CSV`);
            }
            if (!availableFields.includes(mappings.amountField)) {
                errors.push(`Amount field '${mappings.amountField}' not found in CSV`);
            }
            if (!availableFields.includes(mappings.descriptionField)) {
                errors.push(`Description field '${mappings.descriptionField}' not found in CSV`);
            }
        }

        const transactions = parsedData.map((csvRow, index) => {
            const amount = parseFloat(csvRow[mappings.amountField]?.replace(/[,$]/g, '') || '0');
            const transaction: any = {
                originalIndex: index,
                date: this.parseDate(csvRow[mappings.dateField]),
                amount: Math.abs(amount),
                description: csvRow[mappings.descriptionField] || '',
                reference: mappings.referenceField ? csvRow[mappings.referenceField] : undefined,
                category: mappings.categoryField ? csvRow[mappings.categoryField] : undefined,
                isDebit: amount < 0,
                originalData: csvRow
            };

            // Validate date
            if (!transaction.date || isNaN(transaction.date.getTime())) {
                errors.push(`Invalid date format at row ${index + 2}: ${csvRow[mappings.dateField]}`);
            }

            // Validate amount
            if (isNaN(transaction.amount) || transaction.amount === 0) {
                errors.push(`Invalid amount at row ${index + 2}: ${csvRow[mappings.amountField]}`);
            }

            return transaction;
        });

        return {
            transactions,
            mappings,
            errors,
            warnings
        };
    }

    async importTransactions(
        preview: ImportPreview, 
        accountId: number, 
        defaultCreditAccountId?: number,
        defaultDebitAccountId?: number
    ): Promise<{ success: number; errors: string[] }> {
        const account = await this.accountRepository.findOneBy({ id: accountId });
        if (!account) {
            throw new Error("Target account not found");
        }

        let successCount = 0;
        const errors: string[] = [];
        const importBatch = `import_${Date.now()}`;

        // Get default accounts for double-entry
        let defaultCredit: Account | null = null;
        let defaultDebit: Account | null = null;

        if (defaultCreditAccountId) {
            defaultCredit = await this.accountRepository.findOneBy({ id: defaultCreditAccountId });
        }
        if (defaultDebitAccountId) {
            defaultDebit = await this.accountRepository.findOneBy({ id: defaultDebitAccountId });
        }

        for (const transaction of preview.transactions) {
            try {
                // Determine debit and credit accounts based on transaction type
                let debitAccountId: number;
                let creditAccountId: number;

                if (transaction.isDebit) {
                    // Money going out - debit an expense account, credit the bank account
                    debitAccountId = defaultDebitAccountId || await this.getOrCreateExpenseAccount(transaction.category);
                    creditAccountId = accountId;
                } else {
                    // Money coming in - debit the bank account, credit an income account
                    debitAccountId = accountId;
                    creditAccountId = defaultCreditAccountId || await this.getOrCreateIncomeAccount(transaction.category);
                }

                // Find or create category
                const categoryId = transaction.category ? 
                    await this.getOrCreateCategory(transaction.category, transaction.isDebit ? CategoryType.EXPENSE : CategoryType.INCOME) :
                    undefined;

                await this.transactionService.createTransaction({
                    date: transaction.date,
                    amount: transaction.amount,
                    description: transaction.description,
                    debitAccountId,
                    creditAccountId,
                    categoryId,
                    reference: transaction.reference,
                    notes: `Imported from ${importBatch}`
                });

                successCount++;
            } catch (error) {
                errors.push(`Row ${transaction.originalIndex + 1}: ${(error as Error).message}`);
            }
        }

        return { success: successCount, errors };
    }

    private parseDate(dateString: string): Date {
        // Handle common date formats
        const formats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, // MM/DD/YYYY or MM/DD/YY
            /(\d{1,2})-(\d{1,2})-(\d{2,4})/, // MM-DD-YYYY or MM-DD-YY
            /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
        ];

        for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
                let year = parseInt(match[3]);
                let month = parseInt(match[1]);
                let day = parseInt(match[2]);

                // Handle 2-digit years
                if (year < 100) {
                    year += year < 50 ? 2000 : 1900;
                }

                // For YYYY-MM-DD format, swap month and day
                if (format === formats[2]) {
                    [month, day] = [day, month];
                }

                return new Date(year, month - 1, day); // Month is 0-indexed
            }
        }

        // Fallback to Date constructor
        return new Date(dateString);
    }

    private async getOrCreateExpenseAccount(categoryName?: string): Promise<number> {
        const accountName = `Expenses${categoryName ? ` - ${categoryName}` : ''}`;
        
        let account = await this.accountRepository.findOne({
            where: { name: accountName, type: AccountType.EXPENSE }
        });

        if (!account) {
            account = this.accountRepository.create({
                name: accountName,
                type: AccountType.EXPENSE,
                description: `Auto-created expense account for ${categoryName || 'general expenses'}`
            });
            account = await this.accountRepository.save(account);
        }

        return account.id;
    }

    private async getOrCreateIncomeAccount(categoryName?: string): Promise<number> {
        const accountName = `Income${categoryName ? ` - ${categoryName}` : ''}`;
        
        let account = await this.accountRepository.findOne({
            where: { name: accountName, type: AccountType.INCOME }
        });

        if (!account) {
            account = this.accountRepository.create({
                name: accountName,
                type: AccountType.INCOME,
                description: `Auto-created income account for ${categoryName || 'general income'}`
            });
            account = await this.accountRepository.save(account);
        }

        return account.id;
    }

    private async getOrCreateCategory(categoryName: string, type: CategoryType): Promise<number> {
        let category = await this.categoryRepository.findOne({
            where: { name: categoryName, type }
        });

        if (!category) {
            category = this.categoryRepository.create({
                name: categoryName,
                type,
                description: `Auto-created from import`
            });
            category = await this.categoryRepository.save(category);
        }

        return category.id;
    }
}