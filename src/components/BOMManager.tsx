import React, { useState } from 'react';
import { BOM, BOMItem } from '../types';
import { store } from '../store';

interface BOMManagerProps {
  onMessage: (message: string) => void;
}

export const BOMManager: React.FC<BOMManagerProps> = ({ onMessage }) => {
  const [boms, setBOMs] = useState<BOM[]>(store.getBOMs());
  const [products] = useState(store.getProducts());
  const [materials] = useState(store.getMaterials());
  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [bomItems, setBOMItems] = useState<BOMItem[]>([]);
  const [currentItem, setCurrentItem] = useState({ materialId: '', quantity: '' });

  const addBOMItem = () => {
    if (currentItem.materialId && currentItem.quantity) {
      const newItem: BOMItem = {
        materialId: currentItem.materialId,
        quantity: parseFloat(currentItem.quantity)
      };
      setBOMItems([...bomItems, newItem]);
      setCurrentItem({ materialId: '', quantity: '' });
    }
  };

  const removeBOMItem = (index: number) => {
    setBOMItems(bomItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductId || bomItems.length === 0) {
      onMessage('Please select a product and add at least one material.');
      return;
    }

    const newBOM: BOM = {
      id: `BOM-${Date.now()}`,
      productId: selectedProductId,
      items: bomItems
    };

    const message = store.addBOM(newBOM);
    setBOMs(store.getBOMs());
    onMessage(message.message);
    
    setSelectedProductId('');
    setBOMItems([]);
    setShowForm(false);
  };

  const getMaterialName = (materialId: string): string => {
    const material = materials.find(m => m.id === materialId);
    return material ? `${material.name} (${material.unit})` : 'Unknown';
  };

  const getProductName = (productId: string): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown';
  };

  const calculateBOMCost = (bomItems: BOMItem[]): number => {
    return bomItems.reduce((total, item) => {
      const material = materials.find(m => m.id === item.materialId);
      return total + (material ? material.costPerUnit * item.quantity : 0);
    }, 0);
  };

  return (
    <div className="bom-manager">
      <div className="header">
        <h2>Bill of Materials (BOM) Management</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Define BOM'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bom-form">
          <h3>Define Bill of Materials</h3>
          
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            required
          >
            <option value="">Select Product</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          <div className="bom-items">
            <h4>Materials Required</h4>
            <div className="add-item">
              <select
                value={currentItem.materialId}
                onChange={(e) => setCurrentItem({ ...currentItem, materialId: e.target.value })}
              >
                <option value="">Select Material</option>
                {materials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} (${material.costPerUnit}/{material.unit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Quantity"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
              />
              <button type="button" onClick={addBOMItem}>Add</button>
            </div>

            {bomItems.length > 0 && (
              <table className="bom-items-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Total Cost</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bomItems.map((item, index) => {
                    const material = materials.find(m => m.id === item.materialId);
                    const totalCost = material ? material.costPerUnit * item.quantity : 0;
                    return (
                      <tr key={index}>
                        <td>{getMaterialName(item.materialId)}</td>
                        <td>{item.quantity}</td>
                        <td>${material?.costPerUnit.toFixed(2) || '0.00'}</td>
                        <td>${totalCost.toFixed(2)}</td>
                        <td>
                          <button type="button" onClick={() => removeBOMItem(index)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}><strong>Total BOM Cost:</strong></td>
                    <td><strong>${calculateBOMCost(bomItems).toFixed(2)}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <button type="submit">Save BOM</button>
        </form>
      )}

      <div className="bom-list">
        <h3>Defined BOMs ({boms.length})</h3>
        {boms.length === 0 ? (
          <p>No BOMs defined yet. Define BOMs to enable quotations and production planning.</p>
        ) : (
          <div className="bom-cards">
            {boms.map(bom => (
              <div key={bom.id} className="bom-card">
                <h4>{getProductName(bom.productId)}</h4>
                <p><strong>BOM ID:</strong> {bom.id}</p>
                <div className="bom-materials">
                  <h5>Required Materials:</h5>
                  <ul>
                    {bom.items.map((item, index) => {
                      const material = materials.find(m => m.id === item.materialId);
                      return (
                        <li key={index}>
                          {item.quantity} {material?.unit} {material?.name} 
                          (${material?.costPerUnit.toFixed(2)}/{material?.unit})
                        </li>
                      );
                    })}
                  </ul>
                  <p><strong>Total Material Cost: ${calculateBOMCost(bom.items).toFixed(2)}</strong></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};