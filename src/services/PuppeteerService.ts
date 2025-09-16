import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Account } from "../entities/Account";
import { encrypt, decrypt } from "../utils/encryption";

export interface PuppeteerConfig {
    loginUrl: string;
    username: string;
    password: string;
    loginSelector: string;
    passwordSelector: string;
    submitSelector: string;
    exportSelector: string;
}

export interface PuppeteerJobResult {
    success: boolean;
    data?: string; // Downloaded file content or CSV data
    error?: string;
    transactionCount?: number;
}

export class PuppeteerService {
    private accountRepository: Repository<Account>;

    constructor() {
        this.accountRepository = AppDataSource.getRepository(Account);
    }

    async saveAccountConfig(accountId: number, config: PuppeteerConfig): Promise<void> {
        const account = await this.accountRepository.findOneBy({ id: accountId });
        if (!account) {
            throw new Error("Account not found");
        }

        // Encrypt sensitive data
        const encryptedUsername = encrypt(config.username);
        const encryptedPassword = encrypt(config.password);

        // Update account with config
        await this.accountRepository.update(accountId, {
            loginUrl: config.loginUrl,
            encryptedUsername,
            encryptedPassword,
            loginSelector: config.loginSelector,
            passwordSelector: config.passwordSelector,
            submitSelector: config.submitSelector,
            exportSelector: config.exportSelector
        });
    }

    async getAccountConfig(accountId: number): Promise<PuppeteerConfig | null> {
        const account = await this.accountRepository.findOneBy({ id: accountId });
        if (!account || !account.loginUrl || !account.encryptedUsername || !account.encryptedPassword) {
            return null;
        }

        try {
            return {
                loginUrl: account.loginUrl,
                username: decrypt(account.encryptedUsername),
                password: decrypt(account.encryptedPassword),
                loginSelector: account.loginSelector || '',
                passwordSelector: account.passwordSelector || '',
                submitSelector: account.submitSelector || '',
                exportSelector: account.exportSelector || ''
            };
        } catch (error) {
            console.error('Failed to decrypt account config:', error);
            return null;
        }
    }

    async triggerDataFetch(accountId: number): Promise<PuppeteerJobResult> {
        const config = await this.getAccountConfig(accountId);
        if (!config) {
            return {
                success: false,
                error: "Account configuration not found or invalid"
            };
        }

        // This is a stub implementation - in a real application, you would:
        // 1. Launch a Puppeteer browser instance
        // 2. Navigate to the login URL
        // 3. Fill in credentials and submit
        // 4. Navigate to export/download section
        // 5. Download the transaction data
        // 6. Parse and return the data

        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate async job completion
                const mockSuccess = Math.random() > 0.3; // 70% success rate for demo

                if (mockSuccess) {
                    // Mock CSV data that might be downloaded
                    const mockCsvData = `Date,Description,Amount,Balance
2024-01-15,"Coffee Shop Purchase",-4.50,1245.67
2024-01-14,"Payroll Deposit",2500.00,1250.17
2024-01-13,"Gas Station",-35.20,750.17
2024-01-12,"Online Transfer",-100.00,785.37`;

                    resolve({
                        success: true,
                        data: mockCsvData,
                        transactionCount: 4
                    });
                } else {
                    resolve({
                        success: false,
                        error: "Failed to login or download data. Please check credentials and selectors."
                    });
                }
            }, 2000); // Simulate 2 second processing time
        });
    }

    async scheduleDataFetch(accountId: number, frequency: 'daily' | 'weekly' | 'monthly'): Promise<boolean> {
        // Stub for scheduling automated fetches
        // In a real implementation, this would integrate with a job queue like Bull or Agenda
        console.log(`Scheduling ${frequency} data fetch for account ${accountId}`);
        
        // Return success for now
        return true;
    }

    async getScheduledJobs(accountId: number): Promise<any[]> {
        // Stub for getting scheduled jobs
        // Would return actual scheduled jobs from the job queue
        return [
            {
                id: 'job_1',
                accountId,
                frequency: 'weekly',
                nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'active'
            }
        ];
    }

    async cancelScheduledJob(jobId: string): Promise<boolean> {
        // Stub for canceling scheduled jobs
        console.log(`Canceling job ${jobId}`);
        return true;
    }

    // Helper method to validate selectors (could be expanded)
    validateConfig(config: PuppeteerConfig): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!config.loginUrl || !config.loginUrl.startsWith('http')) {
            errors.push("Valid login URL is required");
        }

        if (!config.username || config.username.trim().length === 0) {
            errors.push("Username is required");
        }

        if (!config.password || config.password.length < 4) {
            errors.push("Password must be at least 4 characters");
        }

        if (!config.loginSelector || !config.passwordSelector || !config.submitSelector) {
            errors.push("Login, password, and submit selectors are required");
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Mock method for testing selectors
    async testSelectors(config: PuppeteerConfig): Promise<{ valid: boolean; message: string }> {
        // In a real implementation, this would:
        // 1. Launch a browser
        // 2. Navigate to the login URL
        // 3. Test if the selectors exist and are valid
        // 4. Return validation results without actually logging in

        return new Promise((resolve) => {
            setTimeout(() => {
                const mockSuccess = Math.random() > 0.5;
                resolve({
                    valid: mockSuccess,
                    message: mockSuccess 
                        ? "All selectors found on the page" 
                        : "Some selectors could not be found. Please verify the CSS selectors."
                });
            }, 1500);
        });
    }
}