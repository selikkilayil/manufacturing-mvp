import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { CustomerManager } from './components/CustomerManager';
import { MaterialManager } from './components/MaterialManager';
import { ProductManager } from './components/ProductManager';
import { BOMManager } from './components/BOMManager';
import { QuotationManager } from './components/QuotationManager';
import { WorkOrderManager } from './components/WorkOrderManager';
import { MessageCenter } from './components/MessageCenter';
import { store } from './store';
import { InfoMessage } from './types';
import './App.css';

function App() {
  const [messages, setMessages] = useState<InfoMessage[]>(store.getMessages());

  const handleMessage = (messageText: string) => {
    setMessages(store.getMessages());
  };

  const clearMessages = () => {
    store.clearMessages();
    setMessages([]);
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>Manufacturing MVP</h1>
          </div>
          <ul className="nav-links">
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/customers">Customers</Link></li>
            <li><Link to="/materials">Materials</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/bom">BOMs</Link></li>
            <li><Link to="/quotations">Quotations</Link></li>
            <li><Link to="/work-orders">Work Orders</Link></li>
          </ul>
        </nav>

        <div className="app-content">
          <MessageCenter 
            messages={messages} 
            onClearMessages={clearMessages} 
          />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard onMessage={handleMessage} />} />
              <Route path="/customers" element={<CustomerManager onMessage={handleMessage} />} />
              <Route path="/materials" element={<MaterialManager onMessage={handleMessage} />} />
              <Route path="/products" element={<ProductManager onMessage={handleMessage} />} />
              <Route path="/bom" element={<BOMManager onMessage={handleMessage} />} />
              <Route path="/quotations" element={<QuotationManager onMessage={handleMessage} />} />
              <Route path="/work-orders" element={<WorkOrderManager onMessage={handleMessage} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
