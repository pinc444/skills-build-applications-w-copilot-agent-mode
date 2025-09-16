import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Simplified page components for demo
function AccountsPage() {
  return (
    <div className="container mt-4">
      <h2>🏦 Accounts</h2>
      <p>Manage bank accounts, credit cards, and configure Puppeteer automation.</p>
      <div className="alert alert-info">
        <strong>Features:</strong> Create accounts, store encrypted credentials, configure CSS selectors for automation
      </div>
    </div>
  );
}

function TransactionsPage() {
  return (
    <div className="container mt-4">
      <h2>💸 Transactions</h2>
      <p>View and manage double-entry transactions with bulk operations.</p>
      <div className="alert alert-info">
        <strong>Features:</strong> Manual transaction entry, bulk editing, categorization, filtering
      </div>
    </div>
  );
}

function ImportPage() {
  return (
    <div className="container mt-4">
      <h2>📥 Import Data</h2>
      <p>Import transactions from QIF/CSV files or trigger automated data fetching.</p>
      <div className="alert alert-info">
        <strong>Features:</strong> File upload, field mapping, preview before import, Puppeteer automation triggers
      </div>
    </div>
  );
}

function ReportsPage() {
  return (
    <div className="container mt-4">
      <h2>📊 Reports</h2>
      <p>Generate financial reports and analytics.</p>
      <div className="alert alert-info">
        <strong>Features:</strong> Balance sheet, income statement, category analysis, budget suggestions
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
          <div className="container">
            <Link className="navbar-brand" to="/">
              💰 Personal Finance
            </Link>
            <button 
              className="navbar-toggler" 
              type="button" 
              data-bs-toggle="collapse" 
              data-bs-target="#navbarNav"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav me-auto">
                <li className="nav-item">
                  <Link className="nav-link" to="/accounts">
                    Accounts
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/transactions">
                    Transactions
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/import">
                    Import Data
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/reports">
                    Reports
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <main className="container mt-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function HomePage() {
  return (
    <div className="text-center">
      <h1 className="mb-4">Welcome to Personal Finance Manager</h1>
      <p className="lead mb-4">
        Manage your finances with powerful double-entry bookkeeping, automated imports, and insightful reports.
      </p>
      
      <div className="row mt-5">
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body text-center">
              <h5 className="card-title">🏦 Accounts</h5>
              <p className="card-text">
                Create and manage bank accounts, credit cards, and expense categories.
              </p>
              <Link to="/accounts" className="btn btn-primary">
                Manage Accounts
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body text-center">
              <h5 className="card-title">💸 Transactions</h5>
              <p className="card-text">
                Record transactions with proper double-entry bookkeeping.
              </p>
              <Link to="/transactions" className="btn btn-primary">
                View Transactions
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body text-center">
              <h5 className="card-title">📥 Import Data</h5>
              <p className="card-text">
                Import transactions from QIF/CSV files or automate with Puppeteer.
              </p>
              <Link to="/import" className="btn btn-primary">
                Import Data
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body text-center">
              <h5 className="card-title">📊 Reports</h5>
              <p className="card-text">
                Generate balance sheets, income statements, and budget analysis.
              </p>
              <Link to="/reports" className="btn btn-primary">
                View Reports
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-5 p-4 bg-light rounded">
        <h3>Key Features</h3>
        <div className="row mt-3">
          <div className="col-md-6">
            <ul className="list-unstyled">
              <li>✅ Double-entry bookkeeping</li>
              <li>✅ Bank account automation (Puppeteer)</li>
              <li>✅ QIF/CSV file import</li>
              <li>✅ Bulk transaction management</li>
            </ul>
          </div>
          <div className="col-md-6">
            <ul className="list-unstyled">
              <li>✅ Category management</li>
              <li>✅ Balance sheet & income statement</li>
              <li>✅ Budget suggestions</li>
              <li>✅ Secure credential storage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;