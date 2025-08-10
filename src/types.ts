export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  stockQuantity: number;
  type: 'raw_material' | 'consumable';
  consumableType?: 'per_unit' | 'percentage' | 'fixed_per_wo';
  allocationRate?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  isService?: boolean;
}

export interface BOMItem {
  materialId: string;
  quantity: number;
}

export interface BOM {
  id: string;
  productId: string;
  items: BOMItem[];
}

export interface Quotation {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  materialCost: number;
  consumableCost: number;
  sellingPrice: number;
  status: 'draft' | 'approved';
  createdAt: Date;
}

export interface WorkOrder {
  id: string;
  quotationId: string;
  status: 'pending' | 'in_progress' | 'completed';
  materialReservations: Array<{
    materialId: string;
    quantity: number;
    reserved: boolean;
  }>;
  consumableAllocations?: Array<{
    materialId: string;
    allocatedQuantity: number;
    allocatedCost: number;
  }>;
  createdAt: Date;
  completedAt?: Date;
}

export interface FinishedGood {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  createdAt: Date;
  workOrderId?: string;
}

export interface InfoMessage {
  type: 'info' | 'warning' | 'success';
  message: string;
}