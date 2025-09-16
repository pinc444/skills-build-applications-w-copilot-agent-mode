import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import AccountForm from '../components/AccountForm';
import PuppeteerConfig from '../components/PuppeteerConfig';

function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showPuppeteerConfig, setShowPuppeteerConfig] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getAccounts();
      setAccounts(data);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEditAccount = (account: any) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleAccountSaved = () => {
    setShowForm(false);
    setEditingAccount(null);
    loadAccounts();
  };

  const handleDeleteAccount = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await ApiService.deleteAccount(id);
        loadAccounts();
      } catch (error: any) {
        setError(error.message || 'Failed to delete account');
      }
    }
  };

  const handleConfigurePuppeteer = (account: any) => {
    setSelectedAccount(account);
    setShowPuppeteerConfig(true);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset_bank':
      case 'asset_investment':
      case 'asset_cash':
        return 'success';
      case 'liability_credit_card':
      case 'liability_loan':
        return 'danger';
      case 'income':
        return 'primary';
      case 'expense':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatAccountType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
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
        <h2>Accounts</h2>
        <button 
          className="btn btn-primary"
          onClick={handleCreateAccount}
        >
          Add Account
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        {accounts.map((account: any) => (
          <div key={account.id} className="col-md-6 col-lg-4 mb-3">
            <div className="card card-hover h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="card-title mb-1">{account.name}</h5>
                  <span className={`badge bg-${getAccountTypeColor(account.type)}`}>
                    {formatAccountType(account.type)}
                  </span>
                </div>
                
                <p className="text-muted mb-2">{account.description}</p>
                
                <div className="mb-3">
                  <strong>Balance: </strong>
                  <span className={parseFloat(account.balance) >= 0 ? 'text-success' : 'text-danger'}>
                    ${parseFloat(account.balance).toLocaleString('en-US', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </span>
                </div>

                <div className="btn-group-sm" role="group">
                  <button
                    className="btn btn-outline-primary me-1"
                    onClick={() => handleEditAccount(account)}
                  >
                    Edit
                  </button>
                  
                  {(account.type === 'asset_bank' || account.type === 'liability_credit_card') && (
                    <button
                      className="btn btn-outline-info me-1"
                      onClick={() => handleConfigurePuppeteer(account)}
                    >
                      Automate
                    </button>
                  )}
                  
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => handleDeleteAccount(account.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && !loading && (
        <div className="text-center py-5">
          <h4 className="text-muted">No accounts found</h4>
          <p className="text-muted">Create your first account to get started</p>
          <button 
            className="btn btn-primary"
            onClick={handleCreateAccount}
          >
            Add Account
          </button>
        </div>
      )}

      {showForm && (
        <AccountForm
          account={editingAccount}
          onSave={handleAccountSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showPuppeteerConfig && selectedAccount && (
        <PuppeteerConfig
          account={selectedAccount}
          onClose={() => {
            setShowPuppeteerConfig(false);
            setSelectedAccount(null);
          }}
        />
      )}
    </div>
  );
}

export default AccountsPage;