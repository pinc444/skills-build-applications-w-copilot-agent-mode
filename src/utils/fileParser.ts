export interface QifTransaction {
    date: string;
    amount: number;
    description: string;
    category?: string;
    cleared?: string;
    reference?: string;
}

export interface CsvTransaction {
    [key: string]: string;
}

export function parseQif(qifContent: string): QifTransaction[] {
    const transactions: QifTransaction[] = [];
    const entries = qifContent.split('^').filter(entry => entry.trim());
    
    for (const entry of entries) {
        const lines = entry.trim().split('\n');
        const transaction: Partial<QifTransaction> = {};
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const code = line.charAt(0);
            const value = line.substring(1).trim();
            
            switch (code) {
                case 'D': // Date
                    transaction.date = value;
                    break;
                case 'T': // Amount
                    transaction.amount = parseFloat(value);
                    break;
                case 'P': // Payee/Description
                case 'M': // Memo
                    transaction.description = transaction.description 
                        ? `${transaction.description} - ${value}` 
                        : value;
                    break;
                case 'L': // Category
                    transaction.category = value;
                    break;
                case 'C': // Cleared status
                    transaction.cleared = value;
                    break;
                case 'N': // Reference/Check number
                    transaction.reference = value;
                    break;
            }
        }
        
        if (transaction.date && transaction.amount !== undefined) {
            transactions.push(transaction as QifTransaction);
        }
    }
    
    return transactions;
}

export function parseCsv(csvContent: string, delimiter: string = ','): CsvTransaction[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
    const transactions: CsvTransaction[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
        const transaction: CsvTransaction = {};
        
        for (let j = 0; j < headers.length && j < values.length; j++) {
            transaction[headers[j]] = values[j];
        }
        
        transactions.push(transaction);
    }
    
    return transactions;
}