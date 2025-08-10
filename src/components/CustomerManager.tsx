import React, { useState } from 'react';
import { Customer } from '../types';
import { store } from '../store';

interface CustomerManagerProps {
  onMessage: (message: string) => void;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({ onMessage }) => {
  const [customers, setCustomers] = useState<Customer[]>(store.getCustomers());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCustomer: Customer = {
      id: `CUST-${Date.now()}`,
      ...formData
    };

    const message = store.addCustomer(newCustomer);
    setCustomers(store.getCustomers());
    onMessage(message.message);
    
    setFormData({ name: '', email: '', phone: '' });
    setShowForm(false);
  };

  return (
    <div className="customer-manager">
      <div className="header">
        <h2>Customer Management</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Customer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="customer-form">
          <h3>Add New Customer</h3>
          <input
            type="text"
            placeholder="Customer Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <button type="submit">Add Customer</button>
        </form>
      )}

      <div className="customer-list">
        <h3>Customers ({customers.length})</h3>
        {customers.length === 0 ? (
          <p>No customers yet. Add your first customer to start creating quotations.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};