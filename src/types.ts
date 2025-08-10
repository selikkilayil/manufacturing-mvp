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
  createdAt: Date;
  completedAt?: Date;
}

export interface InfoMessage {
  type: 'info' | 'warning' | 'success';
  message: string;
}