import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

function ImportPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [importType, setImportType] = useState<'qif' | 'csv'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [csvMappings, setCsvMappings] = useState({
    dateField: 'Date',
    amountField: 'Amount',
    descriptionField: 'Description',
    categoryField: 'Category',
    referenceField: 'Reference'
  });
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldSuggestions, setFieldSuggestions] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsData, suggestionsData] = await Promise.all([
        ApiService.getAccounts(),
        ApiService.getFieldSuggestions()
      ]);
      setAccounts(accountsData);
      setFieldSuggestions(suggestionsData);
    } catch (error: any) {
      setError(error.message || 'Failed to load data');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
      setError('');
      setSuccess('');
    }
  };

  const handlePreview = async () => {
    if (!file || !selectedAccount) {
      setError('Please select a file and account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let previewData;
      
      if (importType === 'qif') {
        previewData = await ApiService.previewQifImport(file, parseInt(selectedAccount));
      } else {
        previewData = await ApiService.previewCsvImport(file, parseInt(selectedAccount), csvMappings);
      }

      setPreview(previewData);
      
      if (previewData.errors.length > 0) {
        setError(`Preview completed with errors: ${previewData.errors.join(', ')}`);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to preview import');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await ApiService.executeImport(preview, parseInt(selectedAccount));
      setSuccess(result.message);
      
      if (result.errors.length > 0) {
        setError(`Import completed with some errors: ${result.errors.join(', ')}`);
      }

      // Clear form
      setFile(null);
      setPreview(null);
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      setError(error.message || 'Failed to execute import');
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = async (type: 'qif' | 'csv') => {
    try {
      const content = type === 'qif' 
        ? await ApiService.getSampleQif()
        : await ApiService.getSampleCsv();

      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sample.${type}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.message || `Failed to download sample ${type.toUpperCase()}`);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Import Data</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Import Transactions</h5>

              {/* File Type Selection */}
              <div className="mb-3">
                <label className="form-label">Import Format</label>
                <div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="importType"
                      id="csv"
                      value="csv"
                      checked={importType === 'csv'}
                      onChange={(e) => setImportType(e.target.value as 'csv')}
                    />
                    <label className="form-check-label" htmlFor="csv">
                      CSV File
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="importType"
                      id="qif"
                      value="qif"
                      checked={importType === 'qif'}
                      onChange={(e) => setImportType(e.target.value as 'qif')}
                    />
                    <label className="form-check-label" htmlFor="qif">
                      QIF File
                    </label>
                  </div>
                </div>
              </div>

              {/* Account Selection */}
              <div className="mb-3">
                <label htmlFor="account" className="form-label">Target Account *</label>
                <select
                  className="form-select"
                  id="account"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  required
                >
                  <option value="">Select Account</option>
                  {accounts.map((account: any) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div className="mb-3">
                <label htmlFor="fileInput" className="form-label">
                  Select {importType.toUpperCase()} File *
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="fileInput"
                  accept={importType === 'qif' ? '.qif' : '.csv'}
                  onChange={handleFileChange}
                />
              </div>

              {/* CSV Field Mapping */}
              {importType === 'csv' && (
                <div className="mb-4">
                  <h6>Field Mapping</h6>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label">Date Field</label>
                      <select
                        className="form-select form-select-sm"
                        value={csvMappings.dateField}
                        onChange={(e) => setCsvMappings(prev => ({ ...prev, dateField: e.target.value }))}
                      >
                        {fieldSuggestions?.dateFields?.map((field: string) => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Amount Field</label>
                      <select
                        className="form-select form-select-sm"
                        value={csvMappings.amountField}
                        onChange={(e) => setCsvMappings(prev => ({ ...prev, amountField: e.target.value }))}
                      >
                        {fieldSuggestions?.amountFields?.map((field: string) => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Description Field</label>
                      <select
                        className="form-select form-select-sm"
                        value={csvMappings.descriptionField}
                        onChange={(e) => setCsvMappings(prev => ({ ...prev, descriptionField: e.target.value }))}
                      >
                        {fieldSuggestions?.descriptionFields?.map((field: string) => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Category Field (Optional)</label>
                      <select
                        className="form-select form-select-sm"
                        value={csvMappings.categoryField}
                        onChange={(e) => setCsvMappings(prev => ({ ...prev, categoryField: e.target.value }))}
                      >
                        <option value="">None</option>
                        {fieldSuggestions?.categoryFields?.map((field: string) => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={handlePreview}
                  disabled={loading || !file || !selectedAccount}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    'Preview Import'
                  )}
                </button>

                {preview && (
                  <button
                    className="btn btn-success"
                    onClick={handleImport}
                    disabled={loading || preview.errors.length > 0}
                  >
                    Import {preview.transactions.length} Transactions
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preview Table */}
          {preview && (
            <div className="card mt-4">
              <div className="card-body">
                <h5 className="card-title">
                  Import Preview ({preview.transactions.length} transactions)
                </h5>

                {preview.errors.length > 0 && (
                  <div className="alert alert-warning">
                    <strong>Errors found:</strong>
                    <ul className="mb-0 mt-1">
                      {preview.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                  <table className="table table-sm">
                    <thead className="sticky-top bg-light">
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.transactions.slice(0, 50).map((transaction: any, index: number) => (
                        <tr key={index}>
                          <td>{new Date(transaction.date).toLocaleDateString()}</td>
                          <td>{transaction.description}</td>
                          <td className={transaction.isDebit ? 'text-danger' : 'text-success'}>
                            {transaction.isDebit ? '-' : '+'}
                            ${transaction.amount.toFixed(2)}
                          </td>
                          <td>
                            <span className={`badge ${transaction.isDebit ? 'bg-warning' : 'bg-success'}`}>
                              {transaction.isDebit ? 'Expense' : 'Income'}
                            </span>
                          </td>
                          <td>{transaction.category || 'Uncategorized'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {preview.transactions.length > 50 && (
                  <small className="text-muted">
                    Showing first 50 transactions. All {preview.transactions.length} will be imported.
                  </small>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">📋 Import Help</h5>
              
              <h6>Supported Formats</h6>
              <ul className="list-unstyled">
                <li>📄 <strong>CSV:</strong> Comma-separated values with headers</li>
                <li>💾 <strong>QIF:</strong> Quicken Interchange Format</li>
              </ul>

              <h6 className="mt-3">Sample Files</h6>
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => downloadSample('csv')}
                >
                  Download CSV Sample
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => downloadSample('qif')}
                >
                  Download QIF Sample
                </button>
              </div>

              <h6 className="mt-3">Tips</h6>
              <ul className="small">
                <li>Ensure your CSV has column headers</li>
                <li>Date formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD</li>
                <li>Negative amounts are treated as expenses</li>
                <li>Categories will be auto-created if they don't exist</li>
                <li>Review the preview before importing</li>
              </ul>
            </div>
          </div>

          {/* Automated Import Card */}
          <div className="card mt-3">
            <div className="card-body">
              <h5 className="card-title">🤖 Automated Import</h5>
              <p className="small text-muted">
                Set up automated data fetching from your bank accounts using Puppeteer automation.
              </p>
              <a href="/accounts" className="btn btn-outline-primary btn-sm">
                Configure Automation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportPage;