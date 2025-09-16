import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ImportService } from '../services/ImportService';

const router = Router();
const importService = new ImportService();

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/plain' || 
            file.mimetype === 'text/csv' || 
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only QIF and CSV files are allowed'));
        }
    }
});

// POST /api/import/preview-qif - Preview QIF file import
router.post('/preview-qif', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { accountId } = req.body;
        if (!accountId) {
            return res.status(400).json({ error: 'Account ID is required' });
        }

        const qifContent = req.file.buffer.toString('utf8');
        const preview = await importService.previewQifImport(qifContent, parseInt(accountId));

        res.json(preview);
    } catch (error) {
        res.status(500).json({ error: 'Failed to preview QIF import', details: (error as Error).message });
    }
});

// POST /api/import/preview-csv - Preview CSV file import
router.post('/preview-csv', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { 
            accountId, 
            dateField, 
            amountField, 
            descriptionField, 
            categoryField, 
            referenceField 
        } = req.body;

        if (!accountId || !dateField || !amountField || !descriptionField) {
            return res.status(400).json({ 
                error: 'Account ID, date field, amount field, and description field are required' 
            });
        }

        const mappings = {
            dateField,
            amountField,
            descriptionField,
            categoryField,
            referenceField
        };

        const csvContent = req.file.buffer.toString('utf8');
        const preview = await importService.previewCsvImport(csvContent, mappings, parseInt(accountId));

        res.json(preview);
    } catch (error) {
        res.status(500).json({ error: 'Failed to preview CSV import', details: (error as Error).message });
    }
});

// POST /api/import/execute - Execute import from preview
router.post('/execute', async (req: Request, res: Response) => {
    try {
        const { 
            preview, 
            accountId, 
            defaultCreditAccountId, 
            defaultDebitAccountId 
        } = req.body;

        if (!preview || !accountId) {
            return res.status(400).json({ error: 'Preview data and account ID are required' });
        }

        const result = await importService.importTransactions(
            preview,
            parseInt(accountId),
            defaultCreditAccountId ? parseInt(defaultCreditAccountId) : undefined,
            defaultDebitAccountId ? parseInt(defaultDebitAccountId) : undefined
        );

        res.json({
            message: `Import completed: ${result.success} transactions imported`,
            success: result.success,
            errors: result.errors
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to execute import', details: (error as Error).message });
    }
});

// GET /api/import/sample-qif - Get sample QIF format
router.get('/sample-qif', (req: Request, res: Response) => {
    const sampleQif = `!Type:Bank
D12/1/2024
T-50.00
PGrocery Store
LFood
CX
NCheck 1001
^
D12/2/2024
T2500.00
PPayroll Deposit
LSalary
C*
^
D12/3/2024
T-25.00
PGas Station
LTransportation
CX
^`;

    res.type('text/plain').send(sampleQif);
});

// GET /api/import/sample-csv - Get sample CSV format
router.get('/sample-csv', (req: Request, res: Response) => {
    const sampleCsv = `Date,Description,Amount,Category,Reference
12/1/2024,"Grocery Store",-50.00,"Food","Check 1001"
12/2/2024,"Payroll Deposit",2500.00,"Salary",""
12/3/2024,"Gas Station",-25.00,"Transportation",""
12/4/2024,"Online Purchase",-75.50,"Shopping","Card Transaction"`;

    res.type('text/csv').send(sampleCsv);
});

// GET /api/import/field-suggestions - Get field mapping suggestions for CSV
router.get('/field-suggestions', (req: Request, res: Response) => {
    const suggestions = {
        dateFields: ['date', 'Date', 'DATE', 'transaction_date', 'trans_date', 'posted_date'],
        amountFields: ['amount', 'Amount', 'AMOUNT', 'debit', 'credit', 'transaction_amount', 'value'],
        descriptionFields: ['description', 'Description', 'DESCRIPTION', 'payee', 'memo', 'details', 'transaction_description'],
        categoryFields: ['category', 'Category', 'CATEGORY', 'type', 'classification'],
        referenceFields: ['reference', 'Reference', 'REFERENCE', 'check_number', 'transaction_id', 'ref_number']
    };

    res.json(suggestions);
});

// Error handling middleware for multer
router.use((error: any, req: Request, res: Response, next: any) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    
    if ((error as Error).message === 'Only QIF and CSV files are allowed') {
        return res.status(400).json({ error: (error as Error).message });
    }
    
    next(error);
});

export default router;