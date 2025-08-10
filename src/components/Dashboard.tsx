import React, { useState } from 'react';
import { store } from '../store';

interface DashboardProps {
  onMessage: (message: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onMessage }) => {
  const [customers] = useState(store.getCustomers());
  const [materials] = useState(store.getMaterials());
  const [products] = useState(store.getProducts());
  const [boms] = useState(store.getBOMs());
  const [quotations] = useState(store.getQuotations());
  const [workOrders] = useState(store.getWorkOrders());
  const [finishedGoods] = useState(store.getFinishedGoods());

  const getTotalInventoryValue = (): number => {
    const materialsValue = materials.reduce((sum, material) => sum + (material.stockQuantity * material.costPerUnit), 0);
    const finishedGoodsValue = finishedGoods.reduce((sum, fg) => sum + (fg.quantity * fg.unitCost), 0);
    return materialsValue + finishedGoodsValue;
  };

  const getFinishedGoodsValue = (): number => {
    return finishedGoods.reduce((sum, fg) => sum + (fg.quantity * fg.unitCost), 0);
  };

  const getTotalFinishedGoodsQuantity = (): number => {
    return finishedGoods.reduce((sum, fg) => sum + fg.quantity, 0);
  };

  const getLowStockMaterials = () => {
    return materials.filter(material => material.stockQuantity <= 10);
  };

  const getRawMaterials = () => {
    return materials.filter(material => material.type === 'raw_material');
  };

  const getConsumables = () => {
    return materials.filter(material => material.type === 'consumable');
  };

  const getPendingQuotations = () => {
    return quotations.filter(q => q.status === 'draft').length;
  };

  const getApprovedQuotations = () => {
    return quotations.filter(q => q.status === 'approved').length;
  };

  const getActiveWorkOrders = () => {
    return workOrders.filter(wo => wo.status !== 'completed').length;
  };

  const getCompletedWorkOrders = () => {
    return workOrders.filter(wo => wo.status === 'completed').length;
  };

  const getTotalQuotationValue = (): number => {
    return quotations.reduce((sum, quotation) => sum + (quotation.sellingPrice * quotation.quantity), 0);
  };

  const getProductsWithoutBOM = () => {
    return products.filter(product => !boms.find(bom => bom.productId === product.id));
  };

  return (
    <div className="dashboard">
      <h2>Manufacturing Dashboard</h2>
      
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Quick Stats</h3>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{customers.length}</span>
              <span className="stat-label">Customers</span>
            </div>
            <div className="stat">
              <span className="stat-value">{materials.length}</span>
              <span className="stat-label">Materials</span>
            </div>
            <div className="stat">
              <span className="stat-value">{products.length}</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat">
              <span className="stat-value">{boms.length}</span>
              <span className="stat-label">BOMs Defined</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Inventory Overview</h3>
          <div className="inventory-overview">
            <p><strong>Total Inventory Value: ${getTotalInventoryValue().toFixed(2)}</strong></p>
            <p>Raw Materials: {getRawMaterials().length} | Consumables: {getConsumables().length}</p>
            <p>Finished Goods: {getTotalFinishedGoodsQuantity()} units (${getFinishedGoodsValue().toFixed(2)})</p>
            {getLowStockMaterials().length > 0 && (
              <div className="warning">
                <p><strong>⚠️ Low Stock Alerts:</strong></p>
                <ul>
                  {getLowStockMaterials().map(material => (
                    <li key={material.id}>
                      {material.name} ({material.type === 'consumable' ? 'Consumable' : 'Raw Material'}): {material.stockQuantity} {material.unit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Sales Pipeline</h3>
          <div className="sales-pipeline">
            <div className="pipeline-item">
              <span className="pipeline-count">{getPendingQuotations()}</span>
              <span className="pipeline-label">Pending Quotations</span>
            </div>
            <div className="pipeline-item">
              <span className="pipeline-count">{getApprovedQuotations()}</span>
              <span className="pipeline-label">Approved Quotations</span>
            </div>
            <div className="pipeline-item">
              <span className="pipeline-value">${getTotalQuotationValue().toFixed(2)}</span>
              <span className="pipeline-label">Total Quotation Value</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Production Status</h3>
          <div className="production-status">
            <div className="production-item">
              <span className="production-count">{getActiveWorkOrders()}</span>
              <span className="production-label">Active Work Orders</span>
            </div>
            <div className="production-item">
              <span className="production-count">{getCompletedWorkOrders()}</span>
              <span className="production-label">Completed Work Orders</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Setup Checklist</h3>
          <div className="setup-checklist">
            <div className={`checklist-item ${customers.length > 0 ? 'completed' : 'pending'}`}>
              <span className="checkbox">{customers.length > 0 ? '✓' : '○'}</span>
              <span>Add Customers ({customers.length})</span>
            </div>
            <div className={`checklist-item ${materials.length > 0 ? 'completed' : 'pending'}`}>
              <span className="checkbox">{materials.length > 0 ? '✓' : '○'}</span>
              <span>Add Raw Materials ({materials.length})</span>
            </div>
            <div className={`checklist-item ${products.length > 0 ? 'completed' : 'pending'}`}>
              <span className="checkbox">{products.length > 0 ? '✓' : '○'}</span>
              <span>Add Products ({products.length})</span>
            </div>
            <div className={`checklist-item ${boms.length > 0 ? 'completed' : 'pending'}`}>
              <span className="checkbox">{boms.length > 0 ? '✓' : '○'}</span>
              <span>Define BOMs ({boms.length})</span>
            </div>
          </div>
        </div>

        {getProductsWithoutBOM().length > 0 && (
          <div className="dashboard-card warning">
            <h3>⚠️ Products Without BOMs</h3>
            <p>The following products need BOMs defined before quotations can be created:</p>
            <ul>
              {getProductsWithoutBOM().map(product => (
                <li key={product.id}>{product.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="workflow-guide">
        <h3>Manufacturing Workflow Guide</h3>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Setup</h4>
              <p>Add customers → Add raw materials → Add products → Define BOMs</p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Quotation</h4>
              <p>Select customer → Select product → Enter quantity → System calculates costs → Set selling price → Save quotation</p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Approval</h4>
              <p>Review and approve quotation</p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Work Order</h4>
              <p>Convert approved quotation to work order → System checks material availability → Reserves materials or flags shortages</p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h4>Production</h4>
              <p>Start production → Consume reserved materials → Complete production → Update inventory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};