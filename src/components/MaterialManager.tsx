import React, { useState } from 'react';
import { Material } from '../types';
import { store } from '../store';

interface MaterialManagerProps {
  onMessage: (message: string) => void;
}

export const MaterialManager: React.FC<MaterialManagerProps> = ({ onMessage }) => {
  const [materials, setMaterials] = useState<Material[]>(store.getMaterials());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    costPerUnit: '',
    stockQuantity: '',
    type: 'raw_material' as 'raw_material' | 'consumable',
    consumableType: 'per_unit' as 'per_unit' | 'percentage' | 'fixed_per_wo',
    allocationRate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMaterial: Material = {
      id: `MAT-${Date.now()}`,
      name: formData.name,
      unit: formData.unit,
      costPerUnit: parseFloat(formData.costPerUnit),
      stockQuantity: parseInt(formData.stockQuantity),
      type: formData.type,
      consumableType: formData.type === 'consumable' ? formData.consumableType : undefined,
      allocationRate: formData.type === 'consumable' && formData.allocationRate ? parseFloat(formData.allocationRate) : undefined
    };

    const message = store.addMaterial(newMaterial);
    setMaterials(store.getMaterials());
    onMessage(message.message);
    
    setFormData({ 
      name: '', 
      unit: '', 
      costPerUnit: '', 
      stockQuantity: '', 
      type: 'raw_material', 
      consumableType: 'per_unit',
      allocationRate: '' 
    });
    setShowForm(false);
  };

  const updateStock = (materialId: string, newQuantity: number) => {
    const message = store.updateMaterialStock(materialId, newQuantity);
    if (message) {
      setMaterials(store.getMaterials());
      onMessage(message.message);
    }
  };

  return (
    <div className="material-manager">
      <div className="header">
        <h2>Materials & Consumables Management</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Material'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="material-form">
          <h3>Add New Material</h3>
          <input
            type="text"
            placeholder="Material Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Unit (kg, pcs, liters, etc.)"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Cost per Unit ($)"
            value={formData.costPerUnit}
            onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Initial Stock Quantity"
            value={formData.stockQuantity}
            onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
            required
          />
          
          <select
            value={formData.type}
            onChange={(e) => setFormData({ 
              ...formData, 
              type: e.target.value as 'raw_material' | 'consumable',
              consumableType: e.target.value === 'consumable' ? formData.consumableType : 'per_unit',
              allocationRate: e.target.value === 'consumable' ? formData.allocationRate : ''
            })}
            required
          >
            <option value="raw_material">Raw Material</option>
            <option value="consumable">Consumable</option>
          </select>
          
          {formData.type === 'consumable' && (
            <>
              <select
                value={formData.consumableType}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  consumableType: e.target.value as 'per_unit' | 'percentage' | 'fixed_per_wo'
                })}
                required
              >
                <option value="per_unit">Per Unit (consumed per product unit)</option>
                <option value="percentage">Percentage (% of material cost)</option>
                <option value="fixed_per_wo">Fixed per Work Order</option>
              </select>
              
              <input
                type="number"
                step="0.01"
                placeholder={
                  formData.consumableType === 'per_unit' ? 'Quantity per product unit' :
                  formData.consumableType === 'percentage' ? 'Percentage (e.g., 5 for 5%)' :
                  'Fixed quantity per work order'
                }
                value={formData.allocationRate}
                onChange={(e) => setFormData({ ...formData, allocationRate: e.target.value })}
                required
              />
            </>
          )}
          
          <button type="submit">Add Material</button>
        </form>
      )}

      <div className="material-list">
        <h3>Materials Inventory ({materials.length})</h3>
        {materials.length === 0 ? (
          <p>No materials yet. Add raw materials to define product BOMs and enable production.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Unit</th>
                <th>Cost/Unit</th>
                <th>Stock</th>
                <th>Allocation</th>
                <th>Total Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(material => (
                <tr key={material.id}>
                  <td>{material.id}</td>
                  <td>{material.name}</td>
                  <td>
                    <span className={material.type === 'consumable' ? 'consumable-type' : 'raw-material-type'}>
                      {material.type === 'consumable' ? 'Consumable' : 'Raw Material'}
                    </span>
                  </td>
                  <td>{material.unit}</td>
                  <td>${material.costPerUnit.toFixed(2)}</td>
                  <td>
                    <span className={material.stockQuantity <= 10 ? 'low-stock' : ''}>
                      {material.stockQuantity} {material.unit}
                    </span>
                  </td>
                  <td>
                    {material.type === 'consumable' && material.consumableType && material.allocationRate ? (
                      <span className="allocation-info">
                        {material.consumableType === 'per_unit' ? `${material.allocationRate} per unit` :
                         material.consumableType === 'percentage' ? `${material.allocationRate}% of material cost` :
                         `${material.allocationRate} per WO`}
                      </span>
                    ) : '-'}
                  </td>
                  <td>${(material.stockQuantity * material.costPerUnit).toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      style={{ width: '80px' }}
                      defaultValue={material.stockQuantity}
                      onBlur={(e) => {
                        const newQuantity = parseInt(e.target.value);
                        if (newQuantity !== material.stockQuantity) {
                          updateStock(material.id, newQuantity);
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {materials.length > 0 && (
          <div className="inventory-summary">
            <p><strong>Total Inventory Value: ${materials.reduce((sum, m) => sum + (m.stockQuantity * m.costPerUnit), 0).toFixed(2)}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
};