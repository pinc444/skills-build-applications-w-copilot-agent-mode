import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [filters, setFilters] = useState({
    accountId: '',
    categoryId: '',
    dateFrom: '',
    dateTo: '',
    status: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadData = async () => {
    try {
      const [accountsData, categoriesData] = await Promise.all([
        ApiService.getAccounts(),
        ApiService.getCategories()
      ]);
      setAccounts(accountsData);
      setCategories(categoriesData);
    } catch (error: any) {
      setError(error.message || 'Failed to load data');
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getTransactions(filters);
      setTransactions(data.transactions || data);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectTransaction = (id: number) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTransactions(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map((t: any) => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.size === 0) return;
    
    if (window.confirm(`Delete ${selectedTransactions.size} selected transactions?`)) {
      try {
        await ApiService.bulkDeleteTransactions(Array.from(selectedTransactions));
        setSelectedTransactions(new Set());
        loadTransactions();
      } catch (error: any) {
        setError(error.message || 'Failed to delete transactions');
      }
    }
  };

  const handleBulkCategorize = async (categoryId: number) => {
    if (selectedTransactions.size === 0) return;

    try {
      await ApiService.bulkUpdateTransactions(
        Array.from(selectedTransactions),
        { categoryId }
      );
      setSelectedTransactions(new Set());
      loadTransactions();
    } catch (error: any) {
      setError(error.message || 'Failed to update transactions');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Transactions</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add Transaction
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <h6 className="card-title">Filters</h6>
          <div className="row g-3">
            <div className="col-md-3">
              <select
                className="form-select"
                name="accountId"
                value={filters.accountId}
                onChange={handleFilterChange}
              >
                <option value="">All Accounts</option>
                {accounts.map((account: any) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                placeholder="From"
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                placeholder="To"
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="cleared">Cleared</option>
                <option value="reconciled">Reconciled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTransactions.size > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center">
          <span>{selectedTransactions.size} transactions selected</span>
          <div>
            <div className="btn-group me-2">
              <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                Categorize
              </button>
              <ul className="dropdown-menu">
                {categories.map((category: any) => (
                  <li key={category.id}>
                    <button
                      className="dropdown-item"
                      onClick={() => handleBulkCategorize(category.id)}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <button 
              className="btn btn-sm btn-danger"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>From Account</th>
              <th>To Account</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction: any) => (
              <tr key={transaction.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTransactions.has(transaction.id)}
                    onChange={() => handleSelectTransaction(transaction.id)}
                  />
                </td>
                <td>{formatDate(transaction.date)}</td>
                <td>{transaction.description}</td>
                <td className="text-end">{formatAmount(transaction.amount)}</td>
                <td>
                  <small className="text-muted">
                    {transaction.debitAccount?.name}
                  </small>
                </td>
                <td>
                  <small className="text-muted">
                    {transaction.creditAccount?.name}
                  </small>
                </td>
                <td>
                  {transaction.category ? (
                    <span className="badge bg-secondary">
                      {transaction.category.name}
                    </span>
                  ) : (
                    <span className="text-muted">Uncategorized</span>
                  )}
                </td>
                <td>
                  <span className={`badge bg-${
                    transaction.status === 'cleared' ? 'success' :
                    transaction.status === 'reconciled' ? 'primary' : 'warning'
                  }`}>
                    {transaction.status}
                  </span>
                </td>
                <td>
                  <div className="btn-group-sm">
                    <button className="btn btn-outline-primary btn-sm">
                      Edit
                    </button>
                    <button className="btn btn-outline-danger btn-sm ms-1">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && !loading && (
        <div className="text-center py-5">
          <h4 className="text-muted">No transactions found</h4>
          <p className="text-muted">Add your first transaction or import data to get started</p>
        </div>
      )}

      {showForm && (
        <TransactionForm
          accounts={accounts}
          categories={categories}
          onSave={() => {
            setShowForm(false);
            loadTransactions();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// Transaction Form Component (simplified for demo)
function TransactionForm({ accounts, categories, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    debitAccountId: '',
    creditAccountId: '',
    categoryId: '',
    reference: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        debitAccountId: parseInt(formData.debitAccountId),
        creditAccountId: parseInt(formData.creditAccountId),
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined
      };

      await ApiService.createTransaction(data);
      onSave();
    } catch (error: any) {
      setError(error.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Transaction</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <div className="mb-3">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Description *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">From Account (Debit) *</label>
                    <select
                      className="form-select"
                      value={formData.debitAccountId}
                      onChange={(e) => setFormData(prev => ({ ...prev, debitAccountId: e.target.value }))}
                      required
                    >
                      <option value="">Select Account</option>
                      {accounts.map((account: any) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">To Account (Credit) *</label>
                    <select
                      className="form-select"
                      value={formData.creditAccountId}
                      onChange={(e) => setFormData(prev => ({ ...prev, creditAccountId: e.target.value }))}
                      required
                    >
                      <option value="">Select Account</option>
                      {accounts.map((account: any) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                >
                  <option value="">Select Category</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TransactionsPage;