const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
    async request(endpoint: string, options: RequestInit = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Accounts
    getAccounts() {
        return this.request('/accounts');
    }

    createAccount(account: any) {
        return this.request('/accounts', {
            method: 'POST',
            body: JSON.stringify(account),
        });
    }

    updateAccount(id: number, account: any) {
        return this.request(`/accounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(account),
        });
    }

    deleteAccount(id: number) {
        return this.request(`/accounts/${id}`, {
            method: 'DELETE',
        });
    }

    savePuppeteerConfig(accountId: number, config: any) {
        return this.request(`/accounts/${accountId}/puppeteer-config`, {
            method: 'POST',
            body: JSON.stringify(config),
        });
    }

    getPuppeteerConfig(accountId: number) {
        return this.request(`/accounts/${accountId}/puppeteer-config`);
    }

    testSelectors(accountId: number, config: any) {
        return this.request(`/accounts/${accountId}/test-selectors`, {
            method: 'POST',
            body: JSON.stringify(config),
        });
    }

    fetchAccountData(accountId: number) {
        return this.request(`/accounts/${accountId}/fetch-data`, {
            method: 'POST',
        });
    }

    // Transactions
    getTransactions(filters?: any) {
        const params = new URLSearchParams();
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    params.append(key, filters[key]);
                }
            });
        }
        const queryString = params.toString();
        return this.request(`/transactions${queryString ? '?' + queryString : ''}`);
    }

    createTransaction(transaction: any) {
        return this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction),
        });
    }

    updateTransaction(id: number, transaction: any) {
        return this.request(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transaction),
        });
    }

    deleteTransaction(id: number) {
        return this.request(`/transactions/${id}`, {
            method: 'DELETE',
        });
    }

    bulkUpdateTransactions(transactionIds: number[], updates: any) {
        return this.request('/transactions/bulk-update', {
            method: 'POST',
            body: JSON.stringify({ transactionIds, updates }),
        });
    }

    bulkDeleteTransactions(transactionIds: number[]) {
        return this.request('/transactions/bulk-delete', {
            method: 'DELETE',
            body: JSON.stringify({ transactionIds }),
        });
    }

    // Categories
    getCategories(type?: string) {
        const params = type ? `?type=${type}` : '';
        return this.request(`/categories${params}`);
    }

    createCategory(category: any) {
        return this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(category),
        });
    }

    updateCategory(id: number, category: any) {
        return this.request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(category),
        });
    }

    deleteCategory(id: number) {
        return this.request(`/categories/${id}`, {
            method: 'DELETE',
        });
    }

    // Import
    async uploadFile(endpoint: string, file: File, additionalData?: any) {
        const formData = new FormData();
        formData.append('file', file);
        
        if (additionalData) {
            Object.keys(additionalData).forEach(key => {
                formData.append(key, additionalData[key]);
            });
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    previewQifImport(file: File, accountId: number) {
        return this.uploadFile('/import/preview-qif', file, { accountId });
    }

    previewCsvImport(file: File, accountId: number, mappings: any) {
        return this.uploadFile('/import/preview-csv', file, { accountId, ...mappings });
    }

    executeImport(preview: any, accountId: number, defaultAccounts?: any) {
        return this.request('/import/execute', {
            method: 'POST',
            body: JSON.stringify({
                preview,
                accountId,
                ...defaultAccounts,
            }),
        });
    }

    getFieldSuggestions() {
        return this.request('/import/field-suggestions');
    }

    getSampleQif() {
        return fetch(`${API_BASE_URL}/import/sample-qif`).then(r => r.text());
    }

    getSampleCsv() {
        return fetch(`${API_BASE_URL}/import/sample-csv`).then(r => r.text());
    }

    // Reports
    getBalanceSheet() {
        return this.request('/reports/balance-sheet');
    }

    getIncomeStatement(dateFrom?: string, dateTo?: string) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        const queryString = params.toString();
        return this.request(`/reports/income-statement${queryString ? '?' + queryString : ''}`);
    }

    getCategoryAnalysis(type?: string, dateFrom?: string, dateTo?: string) {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        const queryString = params.toString();
        return this.request(`/reports/category-analysis${queryString ? '?' + queryString : ''}`);
    }

    getMonthlyTrend(months?: number) {
        const params = months ? `?months=${months}` : '';
        return this.request(`/reports/monthly-trend${params}`);
    }

    getBudgetSuggestions() {
        return this.request('/reports/budget-suggestions');
    }
}

export default new ApiService();