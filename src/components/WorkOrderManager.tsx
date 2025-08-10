import React, { useState } from 'react';
import { WorkOrder } from '../types';
import { store } from '../store';

interface WorkOrderManagerProps {
  onMessage: (message: string) => void;
}

export const WorkOrderManager: React.FC<WorkOrderManagerProps> = ({ onMessage }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(store.getWorkOrders());
  const [quotations] = useState(store.getQuotations());
  const [customers] = useState(store.getCustomers());
  const [products] = useState(store.getProducts());
  const [materials] = useState(store.getMaterials());

  const createWorkOrder = (quotationId: string) => {
    const result = store.createWorkOrder(quotationId);
    setWorkOrders(store.getWorkOrders());
    onMessage(result.message.message);
  };

  const startProduction = (workOrderId: string) => {
    const message = store.startProduction(workOrderId);
    if (message) {
      setWorkOrders(store.getWorkOrders());
      onMessage(message.message);
    }
  };

  const completeProduction = (workOrderId: string) => {
    const message = store.completeProduction(workOrderId);
    if (message) {
      setWorkOrders(store.getWorkOrders());
      onMessage(message.message);
    }
  };

  const getApprovedQuotations = () => {
    return quotations.filter(q => q.status === 'approved');
  };

  const getQuotationDetails = (quotationId: string) => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) return null;
    
    const customer = customers.find(c => c.id === quotation.customerId);
    const product = products.find(p => p.id === quotation.productId);
    
    return { quotation, customer, product };
  };

  const getMaterialName = (materialId: string): string => {
    const material = materials.find(m => m.id === materialId);
    return material ? `${material.name} (${material.unit})` : 'Unknown';
  };

  const quotationHasWorkOrder = (quotationId: string): boolean => {
    return workOrders.some(wo => wo.quotationId === quotationId);
  };

  return (
    <div className="work-order-manager">
      <h2>Work Order Management</h2>

      <div className="approved-quotations">
        <h3>Approved Quotations Ready for Work Orders</h3>
        {getApprovedQuotations().filter(q => !quotationHasWorkOrder(q.id)).length === 0 ? (
          <p>No approved quotations available for work order creation.</p>
        ) : (
          <div className="quotation-cards">
            {getApprovedQuotations()
              .filter(q => !quotationHasWorkOrder(q.id))
              .map(quotation => {
                const details = getQuotationDetails(quotation.id);
                if (!details) return null;
                
                return (
                  <div key={quotation.id} className="quotation-card">
                    <h4>{quotation.id}</h4>
                    <p><strong>Customer:</strong> {details.customer?.name}</p>
                    <p><strong>Product:</strong> {details.product?.name}</p>
                    <p><strong>Quantity:</strong> {quotation.quantity}</p>
                    <p><strong>Total Value:</strong> ${(quotation.sellingPrice * quotation.quantity).toFixed(2)}</p>
                    <button 
                      onClick={() => createWorkOrder(quotation.id)}
                      className="create-wo-btn"
                    >
                      Create Work Order
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="work-order-list">
        <h3>Work Orders ({workOrders.length})</h3>
        {workOrders.length === 0 ? (
          <p>No work orders yet. Create work orders from approved quotations.</p>
        ) : (
          <div className="work-order-cards">
            {workOrders.map(workOrder => {
              const details = getQuotationDetails(workOrder.quotationId);
              if (!details) return null;

              const allMaterialsReserved = workOrder.materialReservations.every(r => r.reserved);
              
              return (
                <div key={workOrder.id} className={`work-order-card ${workOrder.status}`}>
                  <div className="wo-header">
                    <h4>{workOrder.id}</h4>
                    <span className={`status ${workOrder.status}`}>{workOrder.status.toUpperCase()}</span>
                  </div>
                  
                  <div className="wo-details">
                    <p><strong>Customer:</strong> {details.customer?.name}</p>
                    <p><strong>Product:</strong> {details.product?.name}</p>
                    <p><strong>Quantity:</strong> {details.quotation.quantity}</p>
                    <p><strong>Created:</strong> {workOrder.createdAt.toLocaleDateString()}</p>
                    {workOrder.completedAt && (
                      <p><strong>Completed:</strong> {workOrder.completedAt.toLocaleDateString()}</p>
                    )}
                  </div>

                  <div className="material-reservations">
                    <h5>Material Requirements:</h5>
                    <table>
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Required</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workOrder.materialReservations.map((reservation, index) => (
                          <tr key={index}>
                            <td>{getMaterialName(reservation.materialId)}</td>
                            <td>{reservation.quantity}</td>
                            <td>
                              <span className={reservation.reserved ? 'reserved' : 'shortage'}>
                                {reservation.reserved ? 'Reserved' : 'Shortage'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="wo-actions">
                    {workOrder.status === 'pending' && allMaterialsReserved && (
                      <button 
                        onClick={() => startProduction(workOrder.id)}
                        className="start-production-btn"
                      >
                        Start Production
                      </button>
                    )}
                    
                    {workOrder.status === 'pending' && !allMaterialsReserved && (
                      <p className="shortage-warning">⚠️ Cannot start: Material shortages detected</p>
                    )}
                    
                    {workOrder.status === 'in_progress' && (
                      <button 
                        onClick={() => completeProduction(workOrder.id)}
                        className="complete-production-btn"
                      >
                        Complete Production
                      </button>
                    )}
                    
                    {workOrder.status === 'completed' && (
                      <p className="completed-note">✓ Production Completed</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};