import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

function ReportsPage() {
  const [activeReport, setActiveReport] = useState('balance-sheet');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateFilters, setDateFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReport();
  }, [activeReport, dateFilters]);

  const loadReport = async () => {
    setLoading(true);
    setError('');

    try {
      let data;
      switch (activeReport) {
        case 'balance-sheet':
          data = await ApiService.getBalanceSheet();
          break;
        case 'income-statement':
          data = await ApiService.getIncomeStatement(dateFilters.dateFrom, dateFilters.dateTo);
          break;
        case 'category-analysis':
          data = await ApiService.getCategoryAnalysis('expense', dateFilters.dateFrom, dateFilters.dateTo);
          break;
        case 'monthly-trend':
          data = await ApiService.getMonthlyTrend(12);
          break;
        case 'budget-suggestions':
          data = await ApiService.getBudgetSuggestions();
          break;
        default:
          data = null;
      }
      setReportData(data);
    } catch (error: any) {
      setError(error.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const reportTabs = [
    { id: 'balance-sheet', label: 'Balance Sheet', icon: '⚖️' },
    { id: 'income-statement', label: 'Income Statement', icon: '📊' },
    { id: 'category-analysis', label: 'Category Analysis', icon: '📈' },
    { id: 'monthly-trend', label: 'Monthly Trend', icon: '📅' },
    { id: 'budget-suggestions', label: 'Budget Suggestions', icon: '💡' }
  ];

  const renderBalanceSheet = (data: any) => (
    <div className="row">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Assets</h5>
          </div>
          <div className="card-body">
            {data.assets.bank.length > 0 && (
              <div className="mb-3">
                <h6>Bank Accounts</h6>
                {data.assets.bank.map((account: any) => (
                  <div key={account.id} className="d-flex justify-content-between">
                    <span>{account.name}</span>
                    <span>{formatCurrency(account.balance)}</span>
                  </div>
                ))}
              </div>
            )}
            
            {data.assets.investment.length > 0 && (
              <div className="mb-3">
                <h6>Investments</h6>
                {data.assets.investment.map((account: any) => (
                  <div key={account.id} className="d-flex justify-content-between">
                    <span>{account.name}</span>
                    <span>{formatCurrency(account.balance)}</span>
                  </div>
                ))}
              </div>
            )}
            
            <hr />
            <div className="d-flex justify-content-between fw-bold">
              <span>Total Assets</span>
              <span className="text-success">{formatCurrency(data.assets.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">Liabilities</h5>
          </div>
          <div className="card-body">
            {data.liabilities.creditCard.length > 0 && (
              <div className="mb-3">
                <h6>Credit Cards</h6>
                {data.liabilities.creditCard.map((account: any) => (
                  <div key={account.id} className="d-flex justify-content-between">
                    <span>{account.name}</span>
                    <span>{formatCurrency(account.balance)}</span>
                  </div>
                ))}
              </div>
            )}
            
            {data.liabilities.loan.length > 0 && (
              <div className="mb-3">
                <h6>Loans</h6>
                {data.liabilities.loan.map((account: any) => (
                  <div key={account.id} className="d-flex justify-content-between">
                    <span>{account.name}</span>
                    <span>{formatCurrency(account.balance)}</span>
                  </div>
                ))}
              </div>
            )}
            
            <hr />
            <div className="d-flex justify-content-between fw-bold">
              <span>Total Liabilities</span>
              <span className="text-danger">{formatCurrency(data.liabilities.total)}</span>
            </div>
          </div>
        </div>

        <div className="card mt-3">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Net Worth</h5>
          </div>
          <div className="card-body">
            <div className="d-flex justify-content-between fs-4 fw-bold">
              <span>Total Equity</span>
              <span className={data.equity.total >= 0 ? 'text-success' : 'text-danger'}>
                {formatCurrency(data.equity.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIncomeStatement = (data: any) => (
    <div>
      <div className="text-center mb-4">
        <h4>Income Statement</h4>
        <p className="text-muted">
          {formatDate(data.period.from)} - {formatDate(data.period.to)}
        </p>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Income</h5>
            </div>
            <div className="card-body">
              {Object.entries(data.income.categories).map(([category, amount]: [string, any]) => (
                <div key={category} className="d-flex justify-content-between mb-2">
                  <span>{category}</span>
                  <span className="text-success">{formatCurrency(amount)}</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between fw-bold">
                <span>Total Income</span>
                <span className="text-success">{formatCurrency(data.income.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">Expenses</h5>
            </div>
            <div className="card-body">
              {Object.entries(data.expenses.categories).map(([category, amount]: [string, any]) => (
                <div key={category} className="d-flex justify-content-between mb-2">
                  <span>{category}</span>
                  <span className="text-danger">{formatCurrency(amount)}</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between fw-bold">
                <span>Total Expenses</span>
                <span className="text-danger">{formatCurrency(data.expenses.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-body text-center">
          <h3 className={`mb-0 ${data.netIncome >= 0 ? 'text-success' : 'text-danger'}`}>
            Net Income: {formatCurrency(data.netIncome)}
          </h3>
        </div>
      </div>
    </div>
  );

  const renderCategoryAnalysis = (data: any) => (
    <div>
      <div className="text-center mb-4">
        <h4>Expense Analysis by Category</h4>
        <p className="text-muted">
          {formatDate(data.period.from)} - {formatDate(data.period.to)}
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Transactions</th>
                  <th className="text-end">Percentage</th>
                  <th>Visual</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.categories).map(([category, details]: [string, any]) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td className="text-end">{formatCurrency(details.amount)}</td>
                    <td className="text-end">{details.count}</td>
                    <td className="text-end">{details.percentage.toFixed(1)}%</td>
                    <td>
                      <div className="progress" style={{ height: '20px' }}>
                        <div 
                          className="progress-bar" 
                          style={{ width: `${details.percentage}%` }}
                        >
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-3">
            <strong>Total: {formatCurrency(data.total)}</strong>
            {data.uncategorized > 0 && (
              <span className="text-muted ms-3">
                Uncategorized: {formatCurrency(data.uncategorized)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonthlyTrend = (data: any[]) => (
    <div>
      <h4 className="text-center mb-4">Monthly Income & Expense Trend</h4>
      
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="text-end text-success">Income</th>
                  <th className="text-end text-danger">Expenses</th>
                  <th className="text-end">Net Income</th>
                </tr>
              </thead>
              <tbody>
                {data.map((month: any) => (
                  <tr key={month.month}>
                    <td>{month.month}</td>
                    <td className="text-end text-success">{formatCurrency(month.income)}</td>
                    <td className="text-end text-danger">{formatCurrency(month.expenses)}</td>
                    <td className={`text-end ${month.net >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(month.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBudgetSuggestions = (data: any) => (
    <div>
      <h4 className="text-center mb-4">Budget Suggestions</h4>
      
      <div className="alert alert-info">
        <p className="mb-0">{data.message}</p>
        <small className="text-muted">{data.disclaimer}</small>
      </div>

      <div className="row">
        {data.suggestions.map((suggestion: any, index: number) => (
          <div key={index} className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{suggestion.category}</h5>
                <div className="mb-2">
                  <small className="text-muted">Current Average</small>
                  <div className="fw-bold">{formatCurrency(suggestion.currentMonthlyAverage)}</div>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Suggested Budget</small>
                  <div className="fw-bold text-primary">{formatCurrency(suggestion.suggestedBudget)}</div>
                </div>
                <small className="text-muted">{suggestion.reasoning}</small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Reports & Analytics</h2>
        
        {/* Date Filters for applicable reports */}
        {['income-statement', 'category-analysis'].includes(activeReport) && (
          <div className="d-flex gap-2">
            <input
              type="date"
              className="form-control"
              value={dateFilters.dateFrom}
              onChange={(e) => setDateFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
            <input
              type="date"
              className="form-control"
              value={dateFilters.dateTo}
              onChange={(e) => setDateFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Report Tabs */}
      <ul className="nav nav-tabs mb-4">
        {reportTabs.map(tab => (
          <li key={tab.id} className="nav-item">
            <button
              className={`nav-link ${activeReport === tab.id ? 'active' : ''}`}
              onClick={() => setActiveReport(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Report Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-2">Loading report...</div>
        </div>
      ) : reportData ? (
        <div>
          {activeReport === 'balance-sheet' && renderBalanceSheet(reportData)}
          {activeReport === 'income-statement' && renderIncomeStatement(reportData)}
          {activeReport === 'category-analysis' && renderCategoryAnalysis(reportData)}
          {activeReport === 'monthly-trend' && renderMonthlyTrend(reportData)}
          {activeReport === 'budget-suggestions' && renderBudgetSuggestions(reportData)}
        </div>
      ) : (
        <div className="text-center py-5">
          <h4 className="text-muted">No data available</h4>
          <p className="text-muted">Add some transactions to see reports</p>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;