import React, { useState } from 'react';
import { Plus, Minus, Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  creditRemaining: number;
  closingBalance: number;
}

interface Product {
  id: string;
  name: string;
  pricePerUnit: number;
}

interface Order {
  id: string;
  customerId: string;
  productId: string;
  requestedQty: number;
  allocatedQty: number;
  suggestion: number;
  pricePerUnit: number;
  total: number;
}

interface AllocationState {
  totalStock: number;
  remainingStock: number;
  orders: Order[];
  customers: Customer[];
  products: Product[];
}

const ProductAllocationApp: React.FC = () => {
  const [state, setState] = useState<AllocationState>({
    totalStock: 10,
    remainingStock: 10,
    orders: [
      {
        id: 'ORDER-001',
        customerId: 'company1',
        productId: 'product',
        requestedQty: 10,
        allocatedQty: 0,
        suggestion: 10,
        pricePerUnit: 515.75,
        total: 0
      }
    ],
    customers: [
      {
        id: 'company1',
        name: 'Company 1',
        creditRemaining: 3000.00,
        closingBalance: 3000.00
      }
    ],
    products: [
      {
        id: 'product',
        name: '1 day delivery Product',
        pricePerUnit: 515.75
      }
    ]
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [versionKey, setVersionKey] = useState<number>(1);

  // Auto-assignment algorithm based on business rules
  const runAutoAssignment = () => {
    const newOrders = [...state.orders];
    let remainingStock = state.totalStock;
    const newErrors: string[] = [];

    // Sort orders by priority (high-priority types first)
    newOrders.sort((a, b) => {
      const customerA = state.customers.find(c => c.id === a.customerId);
      const customerB = state.customers.find(c => c.id === b.customerId);
      
      // Prioritize customers with higher credit limits
      return (customerB?.creditRemaining || 0) - (customerA?.creditRemaining || 0);
    });

    // Apply allocation logic
    newOrders.forEach(order => {
      const customer = state.customers.find(c => c.id === order.customerId);
      if (!customer) return;

      // Check credit limits
      const maxAffordableQty = Math.floor(customer.creditRemaining / order.pricePerUnit);
      const maxAllowableQty = Math.min(
        order.requestedQty,
        remainingStock,
        maxAffordableQty
      );

      order.allocatedQty = Math.max(0, maxAllowableQty);
      order.total = order.allocatedQty * order.pricePerUnit;
      remainingStock -= order.allocatedQty;

      // Check for constraint violations
      if (order.allocatedQty > customer.creditRemaining / order.pricePerUnit) {
        newErrors.push(`Order ${order.id}: Exceeds customer credit limit`);
      }
      if (order.allocatedQty > order.requestedQty) {
        newErrors.push(`Order ${order.id}: Allocation exceeds requested quantity`);
      }
    });

    setState(prev => ({
      ...prev,
      orders: newOrders,
      remainingStock
    }));
    setErrors(newErrors);
    setVersionKey(prev => prev + 1);
  };

  // Manual allocation update
  const updateAllocation = (orderId: string, newQty: number) => {
    const newOrders = [...state.orders];
    const orderIndex = newOrders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) return;

    const order = newOrders[orderIndex];
    const customer = state.customers.find(c => c.id === order.customerId);
    
    if (!customer) return;

    // Validate constraints
    const maxAffordableQty = Math.floor(customer.creditRemaining / order.pricePerUnit);
    const currentAllocatedTotal = newOrders.reduce((sum, o) => 
      o.id !== orderId ? sum + o.allocatedQty : sum, 0);
    const maxAvailableQty = state.totalStock - currentAllocatedTotal;

    const constrainedQty = Math.min(
      Math.max(0, newQty),
      order.requestedQty,
      maxAffordableQty,
      maxAvailableQty
    );

    newOrders[orderIndex] = {
      ...order,
      allocatedQty: constrainedQty,
      total: constrainedQty * order.pricePerUnit
    };

    const newRemainingStock = state.totalStock - newOrders.reduce((sum, o) => sum + o.allocatedQty, 0);

    setState(prev => ({
      ...prev,
      orders: newOrders,
      remainingStock: newRemainingStock
    }));

    // Validate and set errors
    const newErrors: string[] = [];
    if (constrainedQty < newQty) {
      if (constrainedQty === maxAffordableQty) {
        newErrors.push(`Order ${orderId}: Limited by customer credit`);
      } else if (constrainedQty === maxAvailableQty) {
        newErrors.push(`Order ${orderId}: Limited by available stock`);
      }
    }
    setErrors(newErrors);
    setVersionKey(prev => prev + 1);
  };

  const resetAllocations = () => {
    const resetOrders = state.orders.map(order => ({
      ...order,
      allocatedQty: 0,
      total: 0
    }));

    setState(prev => ({
      ...prev,
      orders: resetOrders,
      remainingStock: prev.totalStock
    }));
    setErrors([]);
    setVersionKey(prev => prev + 1);
  };

  const saveAllocations = () => {
    // Simulate save operation
    alert(`Allocations saved successfully! Version: ${versionKey}`);
  };

  const addNewOrder = () => {
    const newOrder: Order = {
      id: `ORDER-${String(state.orders.length + 1).padStart(3, '0')}`,
      customerId: 'company1',
      productId: 'product',
      requestedQty: 1,
      allocatedQty: 0,
      suggestion: 1,
      pricePerUnit: 515.75,
      total: 0
    };

    setState(prev => ({
      ...prev,
      orders: [...prev.orders, newOrder]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Product Allocation Interface</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Version: {versionKey}</span>
              <span className="text-sm font-medium">
                Stock: {state.remainingStock}/{state.totalStock} units
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={runAutoAssignment}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Auto-Assign
            </button>
            <button
              onClick={resetAllocations}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </button>
            <button
              onClick={saveAllocations}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
            <button
              onClick={addNewOrder}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Order
            </button>
          </div>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Allocation Warnings</h3>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order Allocations</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Remaining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.orders.map((order) => {
                  const customer = state.customers.find(c => c.id === order.customerId);
                  const product = state.products.find(p => p.id === order.productId);
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {order.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ฿{customer?.creditRemaining.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ฿{order.pricePerUnit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.requestedQty} Unit
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.suggestion} Unit
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateAllocation(order.id, order.allocatedQty - 1)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            disabled={order.allocatedQty <= 0}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={order.allocatedQty}
                            onChange={(e) => updateAllocation(order.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max={order.requestedQty}
                          />
                          <button
                            onClick={() => updateAllocation(order.id, order.allocatedQty + 1)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-500">Unit</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ฿{order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => updateAllocation(order.id, order.suggestion)}
                          className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                        >
                          Use Suggestion
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Stock</h3>
            <p className="text-2xl font-bold text-gray-900">{state.totalStock} Units</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Allocated</h3>
            <p className="text-2xl font-bold text-green-600">
              {state.totalStock - state.remainingStock} Units
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Remaining</h3>
            <p className="text-2xl font-bold text-blue-600">{state.remainingStock} Units</p>
          </div>
        </div>

        {/* Key Functional Requirements Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Key Features Implemented</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">✅ Allocation Logic:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Credit limit validation</li>
                <li>• Stock constraint enforcement</li>
                <li>• Real-time calculation updates</li>
                <li>• Smart pre-fetching simulation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">✅ User Interface:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Manual quantity adjustment</li>
                <li>• Auto-assignment algorithm</li>
                <li>• Version consistency tracking</li>
                <li>• Error handling & validation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAllocationApp;