import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

interface PuppeteerConfigProps {
  account: any;
  onClose: () => void;
}

function PuppeteerConfig({ account, onClose }: PuppeteerConfigProps) {
  const [formData, setFormData] = useState({
    loginUrl: '',
    username: '',
    password: '',
    loginSelector: '',
    passwordSelector: '',
    submitSelector: '',
    exportSelector: ''
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    loadConfig();
  }, [account.id]);

  const loadConfig = async () => {
    try {
      const config = await ApiService.getPuppeteerConfig(account.id);
      if (config) {
        setFormData({
          loginUrl: config.loginUrl || '',
          username: '', // Don't load username for security
          password: '', // Don't load password for security
          loginSelector: config.loginSelector || '',
          passwordSelector: config.passwordSelector || '',
          submitSelector: config.submitSelector || '',
          exportSelector: config.exportSelector || ''
        });
      }
    } catch (error: any) {
      // Config not found is OK - it means this is the first time setting it up
      if (!error.message.includes('not found')) {
        setError(error.message || 'Failed to load configuration');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await ApiService.savePuppeteerConfig(account.id, formData);
      setSuccess('Configuration saved successfully!');
      // Clear sensitive fields
      setFormData(prev => ({ ...prev, username: '', password: '' }));
    } catch (error: any) {
      setError(error.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSelectors = async () => {
    setTesting(true);
    setTestResult('');
    setError('');

    try {
      const result = await ApiService.testSelectors(account.id, formData);
      setTestResult(result.message);
    } catch (error: any) {
      setError(error.message || 'Failed to test selectors');
    } finally {
      setTesting(false);
    }
  };

  const handleFetchData = async () => {
    setFetching(true);
    setError('');
    setSuccess('');

    try {
      const result = await ApiService.fetchAccountData(account.id);
      if (result.success) {
        setSuccess(`Data fetched successfully! Found ${result.transactionCount} transactions.`);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch data');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              🤖 Automation Setup - {account.name}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
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

              {testResult && (
                <div className="alert alert-info" role="alert">
                  <strong>Selector Test Result:</strong> {testResult}
                </div>
              )}

              <div className="alert alert-warning" role="alert">
                <strong>Security Notice:</strong> Your credentials will be encrypted and stored securely. 
                This automation feature is for demonstration purposes.
              </div>

              <div className="row">
                <div className="col-md-6">
                  <h6 className="mb-3">Login Information</h6>
                  
                  <div className="mb-3">
                    <label htmlFor="loginUrl" className="form-label">Login URL *</label>
                    <input
                      type="url"
                      className="form-control"
                      id="loginUrl"
                      name="loginUrl"
                      value={formData.loginUrl}
                      onChange={handleChange}
                      required
                      placeholder="https://banking.example.com/login"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      placeholder="Your banking username"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Your banking password"
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <h6 className="mb-3">CSS Selectors</h6>
                  
                  <div className="mb-3">
                    <label htmlFor="loginSelector" className="form-label">Username Field Selector</label>
                    <input
                      type="text"
                      className="form-control"
                      id="loginSelector"
                      name="loginSelector"
                      value={formData.loginSelector}
                      onChange={handleChange}
                      placeholder="#username, [name='username']"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="passwordSelector" className="form-label">Password Field Selector</label>
                    <input
                      type="text"
                      className="form-control"
                      id="passwordSelector"
                      name="passwordSelector"
                      value={formData.passwordSelector}
                      onChange={handleChange}
                      placeholder="#password, [name='password']"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="submitSelector" className="form-label">Login Button Selector</label>
                    <input
                      type="text"
                      className="form-control"
                      id="submitSelector"
                      name="submitSelector"
                      value={formData.submitSelector}
                      onChange={handleChange}
                      placeholder="#login-btn, [type='submit']"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="exportSelector" className="form-label">Export/Download Selector</label>
                    <input
                      type="text"
                      className="form-control"
                      id="exportSelector"
                      name="exportSelector"
                      value={formData.exportSelector}
                      onChange={handleChange}
                      placeholder=".export-btn, #download-transactions"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-info"
                    onClick={handleTestSelectors}
                    disabled={testing || !formData.loginUrl}
                  >
                    {testing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Testing...
                      </>
                    ) : (
                      'Test Selectors'
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleFetchData}
                    disabled={fetching}
                  >
                    {fetching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Fetching...
                      </>
                    ) : (
                      'Fetch Data Now'
                    )}
                  </button>
                </div>
                
                <small className="text-muted mt-2 d-block">
                  Test selectors first to verify they work correctly on the bank's website.
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PuppeteerConfig;