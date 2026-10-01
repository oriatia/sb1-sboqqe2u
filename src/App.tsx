import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceDetail from './components/InvoiceDetail';
import EmailList from './components/EmailList';
import Settings from './components/Settings';
import InvoiceExtractor from './components/InvoiceExtractor';

const App: React.FC = () => {
  const { isAuthenticated } = useAppStore();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" /> : <LoginForm />} 
        />
        <Route element={<Layout />}>
          <Route 
            path="/" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/invoices" 
            element={isAuthenticated ? <InvoiceList /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/invoices/:id" 
            element={isAuthenticated ? <InvoiceDetail /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/emails" 
            element={isAuthenticated ? <EmailList /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/extract" 
            element={isAuthenticated ? <InvoiceExtractor /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/settings" 
            element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} 
          />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;