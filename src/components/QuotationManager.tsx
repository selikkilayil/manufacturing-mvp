import React, { useState, useCallback } from 'react';
import { Quotation } from '../types';
import { store } from '../store';

interface QuotationManagerProps {
  onMessage: (message: string) => void;
}

export const QuotationManager: React.FC<QuotationManagerProps> = ({ onMessage }) => {
  const [quotations, setQuotations] = useState<Quotation[]>(store.getQuotations());
  const [customers] = useState(store.getCustomers());
  const [products, setProducts] = useState(store.getProducts());
  const [showForm, setShowForm] = useState(false);
  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    quantity: '',
    sellingPrice: ''
  });
  const [quickProductData, setQuickProductData] = useState({
    name: '',
    description: '',
    estimatedCost: '',
    isService: false
  });
  const [calculatedCost, setCalculatedCost] = useState<number>(0);
  const [materialCostBreakdown, setMaterialCostBreakdown] = useState<number>(0);
  const [consumableCostBreakdown, setConsumableCostBreakdown] = useState<number>(0);
  const [manualPricing, setManualPricing] = useState<boolean>(false);

  const calculateMaterialCost = (productId: string, quantity: number): number => {
    const bom = store.getBOMByProductId(productId);
    if (!bom) return 0;

    const materials = store.getMaterials();
    return bom.items.reduce((total, bomItem) => {
      const material = materials.find(m => m.id === bomItem.materialId);
      if (material && material.type === 'raw_material') {
        return total + (material.costPerUnit * bomItem.quantity * quantity);
      }
      return total;
    }, 0);
  };

  const calculateConsumableCost = (productId: string, quantity: number, materialCost: number): number => {
    const materials = store.getMaterials();
    const consumables = materials.filter(m => m.type === 'consumable');
    
    return consumables.reduce((total, consumable) => {
      if (!consumable.consumableType || !consumable.allocationRate) return total;
      
      let consumableCost = 0;
      switch (consumable.consumableType) {
        case 'per_unit':
          consumableCost = consumable.costPerUnit * consumable.allocationRate * quantity;
          break;
        case 'percentage':
          consumableCost = materialCost * (consumable.allocationRate / 100);
          break;
        case 'fixed_per_wo':
          consumableCost = consumable.costPerUnit * consumable.allocationRate;
          break;
      }
      return total + consumableCost;
    }, 0);
  };

  const handleProductOrQuantityChange = useCallback(() => {
    if (formData.productId && formData.quantity && !manualPricing) {
      const materialCost = calculateMaterialCost(formData.productId, parseInt(formData.quantity));
      const consumableCost = calculateConsumableCost(formData.productId, parseInt(formData.quantity), materialCost);
      const totalCost = materialCost + consumableCost;
      
      setMaterialCostBreakdown(materialCost);
      setConsumableCostBreakdown(consumableCost);
      setCalculatedCost(totalCost);
      
      if (totalCost > 0) {
        const suggestedPrice = totalCost * 1.3;
        setFormData(prev => ({ ...prev, sellingPrice: suggestedPrice.toFixed(2) }));
      }
    }
  }, [formData.productId, formData.quantity, manualPricing]);

  const handleQuickAddProduct = () => {
    if (!quickProductData.name) {
      onMessage('Please enter product name');
      return;
    }

    const newProduct = {
      id: `PROD-${Date.now()}`,
      name: quickProductData.name,
      description: quickProductData.description,
      isService: quickProductData.isService
    };

    const message = store.addProduct(newProduct);
    setProducts(store.getProducts());
    setFormData({ ...formData, productId: newProduct.id });
    
    // Set manual pricing if it's a service or has estimated cost
    if (quickProductData.isService || quickProductData.estimatedCost) {
      setManualPricing(true);
      setCalculatedCost(0);
      if (quickProductData.estimatedCost) {
        const estimatedCost = parseFloat(quickProductData.estimatedCost);
        setFormData(prev => ({ 
          ...prev, 
          productId: newProduct.id,
          sellingPrice: (estimatedCost * 1.3).toFixed(2)
        }));
      }
    }

    setQuickProductData({ name: '', description: '', estimatedCost: '', isService: false });
    setShowQuickAddProduct(false);
    onMessage(message.message + ' Product added to quotation.');
  };

  React.useEffect(() => {
    handleProductOrQuantityChange();
  }, [formData.productId, formData.quantity, handleProductOrQuantityChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow quotations without BOM if it's manual pricing (service items, one-time products)
    const bom = store.getBOMByProductId(formData.productId);
    
    let finalMaterialCost = 0;
    let finalConsumableCost = 0;
    
    if (!manualPricing) {
      finalMaterialCost = calculateMaterialCost(formData.productId, parseInt(formData.quantity));
      finalConsumableCost = calculateConsumableCost(formData.productId, parseInt(formData.quantity), finalMaterialCost);
    }
    
    if (!bom && !manualPricing) {
      onMessage('Cannot create quotation: No BOM defined for this product. Enable manual pricing for service items.');
      return;
    }

    const newQuotation: Quotation = {
      id: `QUOT-${Date.now()}`,
      customerId: formData.customerId,
      productId: formData.productId,
      quantity: parseInt(formData.quantity),
      materialCost: finalMaterialCost,
      consumableCost: finalConsumableCost,
      sellingPrice: parseFloat(formData.sellingPrice),
      status: 'draft',
      createdAt: new Date()
    };

    const message = store.addQuotation(newQuotation);
    setQuotations(store.getQuotations());
    onMessage(message.message);
    
    setFormData({ customerId: '', productId: '', quantity: '', sellingPrice: '' });
    setCalculatedCost(0);
    setManualPricing(false);
    setShowForm(false);
  };

  const approveQuotation = (quotationId: string) => {
    const message = store.approveQuotation(quotationId);
    if (message) {
      setQuotations(store.getQuotations());
      onMessage(message.message);
    }
  };

  const getCustomerName = (customerId: string): string => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown';
  };

  const getProductName = (productId: string): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown';
  };

  return (
    <div className="quotation-manager">
      <div className="header">
        <h2>Quotation Management</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Quotation'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="quotation-form">
          <h3>Create New Quotation</h3>
          
          <select
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            required
          >
            <option value="">Select Customer</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>

          <div className="product-selection">
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              required
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} {!store.getBOMByProductId(product.id) ? '(No BOM)' : ''}
                </option>
              ))}
            </select>
            <button 
              type="button" 
              onClick={() => setShowQuickAddProduct(true)}
              className="quick-add-btn"
            >
              + Add Product
            </button>
          </div>

          {showQuickAddProduct && (
            <div className="quick-add-product">
              <h4>Quick Add Product</h4>
              <input
                type="text"
                placeholder="Product Name *"
                value={quickProductData.name}
                onChange={(e) => setQuickProductData({ ...quickProductData, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={quickProductData.description}
                onChange={(e) => setQuickProductData({ ...quickProductData, description: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Estimated Cost (optional)"
                value={quickProductData.estimatedCost}
                onChange={(e) => setQuickProductData({ ...quickProductData, estimatedCost: e.target.value })}
              />
              <label>
                <input
                  type="checkbox"
                  checked={quickProductData.isService}
                  onChange={(e) => setQuickProductData({ ...quickProductData, isService: e.target.checked })}
                />
                Service Item (No inventory/BOM required)
              </label>
              <div className="quick-add-actions">
                <button type="button" onClick={handleQuickAddProduct}>Add & Select</button>
                <button type="button" onClick={() => setShowQuickAddProduct(false)}>Cancel</button>
              </div>
            </div>
          )}

          <label>
            <input
              type="checkbox"
              checked={manualPricing}
              onChange={(e) => setManualPricing(e.target.checked)}
            />
            Manual Pricing (Override BOM-based calculation)
          </label>

          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />

          {calculatedCost > 0 && !manualPricing && (
            <div className="cost-calculation">
              <p><strong>Raw Material Cost: ${materialCostBreakdown.toFixed(2)}</strong></p>
              <p><strong>Consumable Cost: ${consumableCostBreakdown.toFixed(2)}</strong></p>
              <p><strong>Total Cost: ${calculatedCost.toFixed(2)}</strong></p>
              <p>Cost per Unit: ${(calculatedCost / parseInt(formData.quantity || '1')).toFixed(2)}</p>
            </div>
          )}

          {manualPricing && (
            <div className="manual-pricing-note">
              <p><strong>Manual Pricing Mode:</strong> Enter your own pricing (no BOM calculation)</p>
            </div>
          )}

          <input
            type="number"
            step="0.01"
            placeholder="Selling Price per Unit"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
            required
          />

          {formData.sellingPrice && calculatedCost > 0 && (
            <div className="profit-margin">
              <p>Total Revenue: ${(parseFloat(formData.sellingPrice) * parseInt(formData.quantity || '0')).toFixed(2)}</p>
              <p>Total Profit: ${(parseFloat(formData.sellingPrice) * parseInt(formData.quantity || '0') - calculatedCost).toFixed(2)}</p>
              <p>Profit Margin: {(((parseFloat(formData.sellingPrice) * parseInt(formData.quantity || '0') - calculatedCost) / (parseFloat(formData.sellingPrice) * parseInt(formData.quantity || '0'))) * 100).toFixed(1)}%</p>
            </div>
          )}

          <button type="submit">Create Quotation</button>
        </form>
      )}

      <div className="quotation-list">
        <h3>Quotations ({quotations.length})</h3>
        {quotations.length === 0 ? (
          <p>No quotations yet. Create quotations for customers to start the sales process.</p>
        ) : (
          <div className="quotation-cards">
            {quotations.map(quotation => (
              <div key={quotation.id} className={`quotation-card ${quotation.status}`}>
                <div className="quotation-header">
                  <h4>{quotation.id}</h4>
                  <span className={`status ${quotation.status}`}>{quotation.status.toUpperCase()}</span>
                </div>
                <p><strong>Customer:</strong> {getCustomerName(quotation.customerId)}</p>
                <p><strong>Product:</strong> {getProductName(quotation.productId)}</p>
                <p><strong>Quantity:</strong> {quotation.quantity}</p>
                <p><strong>Unit Price:</strong> ${quotation.sellingPrice.toFixed(2)}</p>
                <p><strong>Total Value:</strong> ${(quotation.sellingPrice * quotation.quantity).toFixed(2)}</p>
                <p><strong>Material Cost:</strong> ${quotation.materialCost.toFixed(2)}</p>
                <p><strong>Consumable Cost:</strong> ${(quotation.consumableCost || 0).toFixed(2)}</p>
                <p><strong>Total Cost:</strong> ${(quotation.materialCost + (quotation.consumableCost || 0)).toFixed(2)}</p>
                <p><strong>Profit:</strong> ${(quotation.sellingPrice * quotation.quantity - quotation.materialCost - (quotation.consumableCost || 0)).toFixed(2)}</p>
                <p><strong>Created:</strong> {quotation.createdAt.toLocaleDateString()}</p>
                
                {quotation.status === 'draft' && (
                  <button 
                    onClick={() => approveQuotation(quotation.id)}
                    className="approve-btn"
                  >
                    Approve Quotation
                  </button>
                )}
                
                {quotation.status === 'approved' && (
                  <p className="approved-note">✓ Approved - Ready for Work Order</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};