import React, { useState } from 'react';
import { store } from '../store';

interface InventoryManagerProps {
  onMessage: (message: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ onMessage }) => {
  const [materials] = useState(store.getMaterials());
  const [products] = useState(store.getProducts());
  const [finishedGoods] = useState(store.getFinishedGoods());

  const getRawMaterials = () => {
    return materials.filter(m => m.type === 'raw_material');
  };

  const getConsumables = () => {
    return materials.filter(m => m.type === 'consumable');
  };

  const getProductName = (productId: string): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const getFinishedGoodsInventory = () => {
    const inventory = new Map<string, { product: string; totalQuantity: number; avgUnitCost: number; totalValue: number }>();
    
    finishedGoods.forEach(fg => {
      const existing = inventory.get(fg.productId);
      if (existing) {
        const newTotalQuantity = existing.totalQuantity + fg.quantity;
        const newTotalValue = existing.totalValue + (fg.quantity * fg.unitCost);
        inventory.set(fg.productId, {
          ...existing,
          totalQuantity: newTotalQuantity,
          avgUnitCost: newTotalValue / newTotalQuantity,
          totalValue: newTotalValue
        });
      } else {
        inventory.set(fg.productId, {
          product: getProductName(fg.productId),
          totalQuantity: fg.quantity,
          avgUnitCost: fg.unitCost,
          totalValue: fg.quantity * fg.unitCost
        });
      }
    });

    return Array.from(inventory.entries()).map(([productId, data]) => ({
      productId,
      ...data
    }));
  };

  const getTotalInventoryValue = (): number => {
    const materialsValue = materials.reduce((sum, m) => sum + (m.stockQuantity * m.costPerUnit), 0);
    const finishedGoodsValue = finishedGoods.reduce((sum, fg) => sum + (fg.quantity * fg.unitCost), 0);
    return materialsValue + finishedGoodsValue;
  };

  return (
    <div className="inventory-manager">
      <div className="header">
        <h2>Complete Inventory Management</h2>
        <div className="inventory-summary">
          <p><strong>Total Inventory Value: ${getTotalInventoryValue().toFixed(2)}</strong></p>
        </div>
      </div>

      {/* Raw Materials */}
      <div className="inventory-section">
        <h3>Raw Materials ({getRawMaterials().length})</h3>
        {getRawMaterials().length === 0 ? (
          <p>No raw materials in inventory.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Unit</th>
                <th>Cost/Unit</th>
                <th>Stock</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {getRawMaterials().map(material => (
                <tr key={material.id}>
                  <td>{material.id}</td>
                  <td>{material.name}</td>
                  <td>{material.unit}</td>
                  <td>${material.costPerUnit.toFixed(2)}</td>
                  <td>
                    <span className={material.stockQuantity <= 10 ? 'low-stock' : ''}>
                      {material.stockQuantity} {material.unit}
                    </span>
                  </td>
                  <td>${(material.stockQuantity * material.costPerUnit).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Consumables */}
      <div className="inventory-section">
        <h3>Consumables ({getConsumables().length})</h3>
        {getConsumables().length === 0 ? (
          <p>No consumables in inventory.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Unit</th>
                <th>Cost/Unit</th>
                <th>Stock</th>
                <th>Allocation Method</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {getConsumables().map(material => (
                <tr key={material.id}>
                  <td>{material.id}</td>
                  <td>{material.name}</td>
                  <td>{material.unit}</td>
                  <td>${material.costPerUnit.toFixed(2)}</td>
                  <td>
                    <span className={material.stockQuantity <= 10 ? 'low-stock' : ''}>
                      {material.stockQuantity} {material.unit}
                    </span>
                  </td>
                  <td>
                    {material.consumableType && material.allocationRate ? (
                      material.consumableType === 'per_unit' ? `${material.allocationRate} per unit` :
                      material.consumableType === 'percentage' ? `${material.allocationRate}% of material cost` :
                      `${material.allocationRate} per WO`
                    ) : 'Not configured'}
                  </td>
                  <td>${(material.stockQuantity * material.costPerUnit).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Finished Goods */}
      <div className="inventory-section">
        <h3>Finished Goods ({getFinishedGoodsInventory().length} product types)</h3>
        {getFinishedGoodsInventory().length === 0 ? (
          <p>No finished goods in inventory. Complete work orders to build inventory.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Total Quantity</th>
                <th>Avg Unit Cost</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {getFinishedGoodsInventory().map(item => (
                <tr key={item.productId}>
                  <td>{item.product}</td>
                  <td>{item.totalQuantity} units</td>
                  <td>${item.avgUnitCost.toFixed(2)}</td>
                  <td>${item.totalValue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {finishedGoods.length > 0 && (
          <div className="finished-goods-detail">
            <h4>Production History</h4>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total Value</th>
                  <th>Produced</th>
                  <th>Work Order</th>
                </tr>
              </thead>
              <tbody>
                {finishedGoods
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .map(fg => (
                    <tr key={fg.id}>
                      <td>{fg.id}</td>
                      <td>{getProductName(fg.productId)}</td>
                      <td>{fg.quantity}</td>
                      <td>${fg.unitCost.toFixed(2)}</td>
                      <td>${(fg.quantity * fg.unitCost).toFixed(2)}</td>
                      <td>{fg.createdAt.toLocaleDateString()}</td>
                      <td>{fg.workOrderId || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};