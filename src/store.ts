import { Customer, Material, Product, BOM, Quotation, WorkOrder, FinishedGood, InfoMessage } from './types';

class Store {
  private customers: Customer[] = [];
  private materials: Material[] = [];
  private products: Product[] = [];
  private boms: BOM[] = [];
  private quotations: Quotation[] = [];
  private workOrders: WorkOrder[] = [];
  private finishedGoods: FinishedGood[] = [];
  private messages: InfoMessage[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('manufacturing-customers', JSON.stringify(this.customers));
      localStorage.setItem('manufacturing-materials', JSON.stringify(this.materials));
      localStorage.setItem('manufacturing-products', JSON.stringify(this.products));
      localStorage.setItem('manufacturing-boms', JSON.stringify(this.boms));
      localStorage.setItem('manufacturing-quotations', JSON.stringify(this.quotations.map(q => ({
        ...q,
        createdAt: q.createdAt.toISOString()
      }))));
      localStorage.setItem('manufacturing-workorders', JSON.stringify(this.workOrders.map(wo => ({
        ...wo,
        createdAt: wo.createdAt.toISOString(),
        completedAt: wo.completedAt?.toISOString()
      }))));
      localStorage.setItem('manufacturing-finishedgoods', JSON.stringify(this.finishedGoods.map(fg => ({
        ...fg,
        createdAt: fg.createdAt.toISOString()
      }))));
      localStorage.setItem('manufacturing-messages', JSON.stringify(this.messages));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const customers = localStorage.getItem('manufacturing-customers');
      if (customers) this.customers = JSON.parse(customers);

      const materials = localStorage.getItem('manufacturing-materials');
      if (materials) this.materials = JSON.parse(materials);

      const products = localStorage.getItem('manufacturing-products');
      if (products) this.products = JSON.parse(products);

      const boms = localStorage.getItem('manufacturing-boms');
      if (boms) this.boms = JSON.parse(boms);

      const quotations = localStorage.getItem('manufacturing-quotations');
      if (quotations) {
        this.quotations = JSON.parse(quotations).map((q: any) => ({
          ...q,
          createdAt: new Date(q.createdAt)
        }));
      }

      const workOrders = localStorage.getItem('manufacturing-workorders');
      if (workOrders) {
        this.workOrders = JSON.parse(workOrders).map((wo: any) => ({
          ...wo,
          createdAt: new Date(wo.createdAt),
          completedAt: wo.completedAt ? new Date(wo.completedAt) : undefined
        }));
      }

      const finishedGoods = localStorage.getItem('manufacturing-finishedgoods');
      if (finishedGoods) {
        this.finishedGoods = JSON.parse(finishedGoods).map((fg: any) => ({
          ...fg,
          createdAt: new Date(fg.createdAt)
        }));
      }

      const messages = localStorage.getItem('manufacturing-messages');
      if (messages) this.messages = JSON.parse(messages);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  getCustomers(): Customer[] {
    return [...this.customers];
  }

  addCustomer(customer: Customer): InfoMessage {
    this.customers.push(customer);
    this.saveToLocalStorage();
    const message: InfoMessage = {
      type: 'success',
      message: `Customer "${customer.name}" added to customer database. Ready for quotations.`
    };
    this.addMessage(message);
    return message;
  }

  getMaterials(): Material[] {
    return [...this.materials];
  }

  addMaterial(material: Material): InfoMessage {
    this.materials.push(material);
    this.saveToLocalStorage();
    const message: InfoMessage = {
      type: 'success',
      message: `Material "${material.name}" added with ${material.stockQuantity} ${material.unit} in inventory at $${material.costPerUnit}/${material.unit}.`
    };
    this.addMessage(message);
    return message;
  }

  updateMaterialStock(materialId: string, newQuantity: number): InfoMessage | null {
    const material = this.materials.find(m => m.id === materialId);
    if (material) {
      const oldQuantity = material.stockQuantity;
      material.stockQuantity = newQuantity;
      this.saveToLocalStorage();
      const message: InfoMessage = {
        type: 'info',
        message: `Material "${material.name}" stock updated from ${oldQuantity} to ${newQuantity} ${material.unit}.`
      };
      this.addMessage(message);
      return message;
    }
    return null;
  }

  getProducts(): Product[] {
    return [...this.products];
  }

  addProduct(product: Product): InfoMessage {
    this.products.push(product);
    this.saveToLocalStorage();
    const message: InfoMessage = {
      type: 'success',
      message: `Product "${product.name}" added. Define BOM to enable quotations and production.`
    };
    this.addMessage(message);
    return message;
  }

  getBOMs(): BOM[] {
    return [...this.boms];
  }

  addBOM(bom: BOM): InfoMessage {
    const existingIndex = this.boms.findIndex(b => b.productId === bom.productId);
    if (existingIndex >= 0) {
      this.boms[existingIndex] = bom;
    } else {
      this.boms.push(bom);
    }
    this.saveToLocalStorage();
    
    const product = this.products.find(p => p.id === bom.productId);
    const materialNames = bom.items.map(item => {
      const material = this.materials.find(m => m.id === item.materialId);
      return `${item.quantity} ${material?.unit} ${material?.name}`;
    }).join(', ');
    
    const message: InfoMessage = {
      type: 'success',
      message: `BOM defined for "${product?.name}": requires ${materialNames}. Product ready for quotations.`
    };
    this.addMessage(message);
    return message;
  }

  getBOMByProductId(productId: string): BOM | undefined {
    return this.boms.find(bom => bom.productId === productId);
  }

  getQuotations(): Quotation[] {
    return [...this.quotations];
  }

  addQuotation(quotation: Quotation): InfoMessage {
    this.quotations.push(quotation);
    this.saveToLocalStorage();
    const customer = this.customers.find(c => c.id === quotation.customerId);
    const product = this.products.find(p => p.id === quotation.productId);
    const message: InfoMessage = {
      type: 'success',
      message: `Quotation created for ${customer?.name}: ${quotation.quantity}x ${product?.name} at $${quotation.sellingPrice} each (material cost: $${quotation.materialCost}). Awaiting approval.`
    };
    this.addMessage(message);
    return message;
  }

  approveQuotation(quotationId: string): InfoMessage | null {
    const quotation = this.quotations.find(q => q.id === quotationId);
    if (quotation) {
      quotation.status = 'approved';
      this.saveToLocalStorage();
      const customer = this.customers.find(c => c.id === quotation.customerId);
      const product = this.products.find(p => p.id === quotation.productId);
      const message: InfoMessage = {
        type: 'success',
        message: `Quotation approved for ${customer?.name}: ${quotation.quantity}x ${product?.name}. Ready to create work order.`
      };
      this.addMessage(message);
      return message;
    }
    return null;
  }

  getWorkOrders(): WorkOrder[] {
    return [...this.workOrders];
  }

  createWorkOrder(quotationId: string): { workOrder: WorkOrder | null; message: InfoMessage } {
    const quotation = this.quotations.find(q => q.id === quotationId);
    if (!quotation || quotation.status !== 'approved') {
      return {
        workOrder: null,
        message: { type: 'warning', message: 'Cannot create work order: quotation not found or not approved.' }
      };
    }

    const bom = this.getBOMByProductId(quotation.productId);
    if (!bom) {
      return {
        workOrder: null,
        message: { type: 'warning', message: 'Cannot create work order: no BOM defined for this product.' }
      };
    }

    const materialReservations = bom.items.map(bomItem => {
      const requiredQuantity = bomItem.quantity * quotation.quantity;
      const material = this.materials.find(m => m.id === bomItem.materialId);
      const canReserve = material && material.stockQuantity >= requiredQuantity;
      
      if (canReserve && material) {
        material.stockQuantity -= requiredQuantity;
      }

      return {
        materialId: bomItem.materialId,
        quantity: requiredQuantity,
        reserved: canReserve || false
      };
    });

    // Calculate consumable allocations
    const consumableAllocations = this.materials
      .filter(m => m.type === 'consumable' && m.consumableType && m.allocationRate)
      .map(consumable => {
        let allocatedQuantity = 0;
        let allocatedCost = 0;

        switch (consumable.consumableType) {
          case 'per_unit':
            allocatedQuantity = consumable.allocationRate! * quotation.quantity;
            allocatedCost = consumable.costPerUnit * allocatedQuantity;
            break;
          case 'percentage':
            allocatedCost = quotation.materialCost * (consumable.allocationRate! / 100);
            allocatedQuantity = allocatedCost / consumable.costPerUnit;
            break;
          case 'fixed_per_wo':
            allocatedQuantity = consumable.allocationRate!;
            allocatedCost = consumable.costPerUnit * allocatedQuantity;
            break;
        }

        return {
          materialId: consumable.id,
          allocatedQuantity,
          allocatedCost
        };
      });

    const workOrder: WorkOrder = {
      id: `WO-${Date.now()}`,
      quotationId,
      status: 'pending',
      materialReservations,
      consumableAllocations,
      createdAt: new Date()
    };

    this.workOrders.push(workOrder);
    this.saveToLocalStorage();

    const allReserved = materialReservations.every(r => r.reserved);
    const customer = this.customers.find(c => c.id === quotation.customerId);
    const product = this.products.find(p => p.id === quotation.productId);
    
    let messageText = `Work Order ${workOrder.id} created for ${customer?.name}: ${quotation.quantity}x ${product?.name}. `;
    
    if (allReserved) {
      messageText += 'All materials reserved from inventory. ';
      if (consumableAllocations.length > 0) {
        const totalConsumableCost = consumableAllocations.reduce((sum, alloc) => sum + alloc.allocatedCost, 0);
        messageText += `Consumables allocated: $${totalConsumableCost.toFixed(2)}. `;
      }
      messageText += 'Ready for production.';
    } else {
      const shortages = materialReservations
        .filter(r => !r.reserved)
        .map(r => {
          const material = this.materials.find(m => m.id === r.materialId);
          return `${material?.name}: need ${r.quantity}, have ${material?.stockQuantity}`;
        });
      messageText += `Material shortages detected: ${shortages.join(', ')}. Purchase required before production.`;
    }

    const message: InfoMessage = {
      type: allReserved ? 'success' : 'warning',
      message: messageText
    };
    this.addMessage(message);

    return { workOrder, message };
  }

  startProduction(workOrderId: string): InfoMessage | null {
    const workOrder = this.workOrders.find(wo => wo.id === workOrderId);
    if (!workOrder) {
      return null;
    }

    const allReserved = workOrder.materialReservations.every(r => r.reserved);
    if (!allReserved) {
      return {
        type: 'warning',
        message: 'Cannot start production: not all materials are reserved. Purchase required first.'
      };
    }

    // Check consumable availability
    let consumableShortages: string[] = [];
    if (workOrder.consumableAllocations && workOrder.consumableAllocations.length > 0) {
      workOrder.consumableAllocations.forEach(allocation => {
        const consumable = this.materials.find(m => m.id === allocation.materialId);
        if (consumable && consumable.stockQuantity < allocation.allocatedQuantity) {
          consumableShortages.push(`${consumable.name}: need ${allocation.allocatedQuantity.toFixed(2)}, have ${consumable.stockQuantity}`);
        }
      });
    }

    if (consumableShortages.length > 0) {
      return {
        type: 'warning',
        message: `Cannot start production: consumable shortages detected: ${consumableShortages.join(', ')}. Restock required first.`
      };
    }

    workOrder.status = 'in_progress';
    this.saveToLocalStorage();
    const message: InfoMessage = {
      type: 'info',
      message: `Production started for Work Order ${workOrder.id}. Materials and consumables being consumed from inventory.`
    };
    this.addMessage(message);
    return message;
  }

  completeProduction(workOrderId: string): InfoMessage | null {
    const workOrder = this.workOrders.find(wo => wo.id === workOrderId);
    if (!workOrder || workOrder.status !== 'in_progress') {
      return null;
    }

    // Consume consumables from inventory
    let consumableConsumptionDetails: string[] = [];
    if (workOrder.consumableAllocations && workOrder.consumableAllocations.length > 0) {
      workOrder.consumableAllocations.forEach(allocation => {
        const consumable = this.materials.find(m => m.id === allocation.materialId);
        if (consumable) {
          const beforeQuantity = consumable.stockQuantity;
          consumable.stockQuantity = Math.max(0, consumable.stockQuantity - allocation.allocatedQuantity);
          const consumed = beforeQuantity - consumable.stockQuantity;
          consumableConsumptionDetails.push(`${consumable.name}: -${consumed.toFixed(2)} ${consumable.unit}`);
        }
      });
    }

    workOrder.status = 'completed';
    workOrder.completedAt = new Date();
    this.saveToLocalStorage();

    const quotation = this.quotations.find(q => q.id === workOrder.quotationId);
    if (quotation) {
      const product = this.products.find(p => p.id === quotation.productId);
      
      // Calculate unit cost (material cost + consumable cost) / quantity
      const totalCost = quotation.materialCost + (quotation.consumableCost || 0);
      const unitCost = totalCost / quotation.quantity;
      
      // Add finished goods to inventory
      const finishedGood: FinishedGood = {
        id: `FG-${Date.now()}`,
        productId: quotation.productId,
        quantity: quotation.quantity,
        unitCost: unitCost,
        createdAt: new Date(),
        workOrderId: workOrder.id
      };
      
      this.addFinishedGood(finishedGood);
      
      let messageText = `Production completed for Work Order ${workOrder.id}. ${quotation.quantity}x ${product?.name} added to finished goods inventory (Unit cost: $${unitCost.toFixed(2)}).`;
      
      if (consumableConsumptionDetails.length > 0) {
        messageText += ` Consumables consumed: ${consumableConsumptionDetails.join(', ')}.`;
      }
      
      const message: InfoMessage = {
        type: 'success',
        message: messageText
      };
      this.addMessage(message);
      return message;
    }

    return null;
  }

  getFinishedGoods(): FinishedGood[] {
    return [...this.finishedGoods];
  }

  addFinishedGood(finishedGood: FinishedGood): void {
    this.finishedGoods.push(finishedGood);
    this.saveToLocalStorage();
  }

  getFinishedGoodsByProductId(productId: string): FinishedGood[] {
    return this.finishedGoods.filter(fg => fg.productId === productId);
  }

  getTotalFinishedGoodsQuantity(productId: string): number {
    return this.finishedGoods
      .filter(fg => fg.productId === productId)
      .reduce((sum, fg) => sum + fg.quantity, 0);
  }

  getMessages(): InfoMessage[] {
    return [...this.messages];
  }

  addMessage(message: InfoMessage): void {
    this.messages.unshift(message);
    if (this.messages.length > 50) {
      this.messages = this.messages.slice(0, 50);
    }
    this.saveToLocalStorage();
  }

  clearMessages(): void {
    this.messages = [];
    this.saveToLocalStorage();
  }

  clearAllData(): void {
    this.customers = [];
    this.materials = [];
    this.products = [];
    this.boms = [];
    this.quotations = [];
    this.workOrders = [];
    this.finishedGoods = [];
    this.messages = [];
    localStorage.removeItem('manufacturing-customers');
    localStorage.removeItem('manufacturing-materials');
    localStorage.removeItem('manufacturing-products');
    localStorage.removeItem('manufacturing-boms');
    localStorage.removeItem('manufacturing-quotations');
    localStorage.removeItem('manufacturing-workorders');
    localStorage.removeItem('manufacturing-finishedgoods');
    localStorage.removeItem('manufacturing-messages');
  }
}

export const store = new Store();