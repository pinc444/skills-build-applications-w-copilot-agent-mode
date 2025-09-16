import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

interface AccountFormProps {
  account?: any;
  onSave: () => void;
  onCancel: () => void;
}

function AccountForm({ account, onSave, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'asset_bank',
    description: '',
    balance: '0'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        type: account.type || 'asset_bank',
        description: account.description || '',
        balance: account.balance?.toString() || '0'
      });
    }
  }, [account]);

  const accountTypes = [
    { value: 'asset_bank', label: 'Bank Account' },
    { value: 'asset_investment', label: 'Investment Account' },
    { value: 'asset_cash', label: 'Cash Account' },
    { value: 'liability_credit_card', label: 'Credit Card' },
    { value: 'liability_loan', label: 'Loan Account' },
    { value: 'income', label: 'Income Account' },
    { value: 'expense', label: 'Expense Account' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        balance: parseFloat(formData.balance) || 0
      };

      if (account) {
        await ApiService.updateAccount(account.id, data);
      } else {
        await ApiService.createAccount(data);
      }

      onSave();
    } catch (error: any) {
      setError(error.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {account ? 'Edit Account' : 'Create Account'}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onCancel}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="name" className="form-label">Account Name *</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Chase Checking, Visa Credit Card"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="type" className="form-label">Account Type *</label>
                <select
                  className="form-select"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Optional description of the account"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="balance" className="form-label">Initial Balance</label>
                <input
                  type="number"
                  className="form-control"
                  id="balance"
                  name="balance"
                  value={formData.balance}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                />
                <div className="form-text">
                  Enter the current balance of this account
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onCancel}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  account ? 'Update Account' : 'Create Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AccountForm;