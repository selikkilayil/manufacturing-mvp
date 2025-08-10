import React, { useState } from 'react';
import { Product } from '../types';
import { store } from '../store';

interface ProductManagerProps {
  onMessage: (message: string) => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({ onMessage }) => {
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProduct: Product = {
      id: `PROD-${Date.now()}`,
      ...formData
    };

    const message = store.addProduct(newProduct);
    setProducts(store.getProducts());
    onMessage(message.message);
    
    setFormData({ name: '', description: '' });
    setShowForm(false);
  };

  const getBOMStatus = (productId: string): string => {
    const bom = store.getBOMByProductId(productId);
    return bom ? 'Defined' : 'Missing';
  };

  return (
    <div className="product-manager">
      <div className="header">
        <h2>Product Management</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="product-form">
          <h3>Add New Product</h3>
          <input
            type="text"
            placeholder="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Product Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <button type="submit">Add Product</button>
        </form>
      )}

      <div className="product-list">
        <h3>Products ({products.length})</h3>
        {products.length === 0 ? (
          <p>No products yet. Add products to define BOMs and create quotations.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>BOM Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.description}</td>
                  <td>
                    <span className={getBOMStatus(product.id) === 'Missing' ? 'warning' : 'success'}>
                      {getBOMStatus(product.id)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};