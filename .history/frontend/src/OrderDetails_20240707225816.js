import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './OrderDetails.css';
import * as XLSX from 'xlsx';
import QuickSelectModal from './QuickSelectModal'; // Ensure this component is created/imported

const placeholderImage = 'https://via.placeholder.com/60';

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantityChanges, setQuantityChanges] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showQuickSelect, setShowQuickSelect] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/orders/${orderId}`);
        setOrder(response.data);
        setSelectedProducts(response.data.selectedProducts.map(product => ({
          ...product,
          selected: false // Initialize selected property
        })));
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Error fetching order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleQuantityChange = (productId, quantity) => {
    const parsedQuantity = parseInt(quantity, 10);
    if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
      setQuantityChanges((prevChanges) => ({
        ...prevChanges,
        [productId]: parsedQuantity,
      }));
      setSelectedProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? { ...product, quantity: parsedQuantity } : product
        )
      );
    }
  };

  const handleSaveChanges = async () => {
    try {
      for (const [productId, quantity] of Object.entries(quantityChanges)) {
        await axios.put(`http://localhost:3000/orders/${orderId}/products/${productId}`, { quantity });
      }
      // Re-fetch the order details to reflect changes
      const response = await axios.get(`http://localhost:3000/orders/${orderId}`);
      setOrder(response.data);
      setQuantityChanges({});
    } catch (error) {
      console.error('Error saving changes:', error);
      setError('Error saving changes.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await axios.delete(`http://localhost:3000/orders/${orderId}/products/${productId}`);
      setOrder(response.data);
      setSelectedProducts(response.data.selectedProducts.map(product => ({
        ...product,
        selected: false // Initialize selected property
      })));
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Error deleting product.');
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const productId of selectedProducts.filter(product => product.selected).map(product => product.id)) {
        await axios.delete(`http://localhost:3000/orders/${orderId}/products/${productId}`);
      }
      // Re-fetch the order details to reflect changes
      const response = await axios.get(`http://localhost:3000/orders/${orderId}`);
      setOrder(response.data);
      setSelectedProducts(response.data.selectedProducts.map(product => ({
        ...product,
        selected: false // Initialize selected property
      })));
    } catch (error) {
      console.error('Error deleting products:', error);
      setError('Error deleting products.');
    }
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prevSelected =>
      prevSelected.map(product =>
        product.id === productId ? { ...product, selected: !product.selected } : product
      )
    );
  };

  const handleCardClick = (e, productId) => {
    e.stopPropagation(); // Prevent event bubbling to avoid conflicts with other handlers
    toggleSelectProduct(productId);
  };

  const handleQuickSelect = async (newProducts) => {
    try {
      for (const product of newProducts) {
        await axios.post(`http://localhost:3000/orders/${orderId}/products`, { product });
      }
      // Re-fetch the order details to reflect changes
      const response = await axios.get(`http://localhost:3000/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error adding products:', error);
      setError('Error adding products.');
    } finally {
      setShowQuickSelect(false);
    }
  };

  const calculateSubtotal = () => {
    return selectedProducts.reduce((total, product) => total + product.price * product.quantity, 0);
  };

  const calculateTotalBoxes = () => {
    return selectedProducts.reduce((total, product) => total + product.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + subtotal * 0.2; // Adding 20% VAT
  };

  const selectAllProducts = () => {
    const allSelected = selectedProducts.every(product => product.selected);
    setSelectedProducts(prevProducts =>
      prevProducts.map(product => ({
        ...product,
        selected: !allSelected
      }))
    );
  };

  const areAnyProductsSelected = selectedProducts.some(product => product.selected);

  const downloadExcel = () => {
    const worksheetData = selectedProducts.map(product => ({
      "Customer Name": `${order.customer.firstName} ${order.customer.lastName}`,
      "Product Name": product.name,
      "Boxes": product.quantity,
      "SKU": product.sku,
      "Box Price": product.price,
      "Total Price": (product.price * product.quantity).toFixed(2),
      "Unit Price" : (product.price / 12)
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");

    XLSX.writeFile(workbook, `order_${order.orderId}_details.xlsx`);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!order) {
    return <p>Order not found.</p>;
  }

  return (
    <div className="order-details-page">
      {error && <p className="error">{error}</p>}
      <div className="customer-details-box">
      <h2>
        Customer Information
        <span className="order-id"> (Order ID: {order.orderId})</span>
      </h2>
        <p><strong>Name:</strong> {order.customer.firstName} {order.customer.lastName}</p>
        <p><strong>Email:</strong> {order.customer.email}</p>
        <p><strong>Contact Number:</strong> {order.customer.contactNumber}</p>
        <p><strong>Address:</strong> {order.customer.addressLine1}, {order.customer.addressLine2}, {order.customer.city}, {order.customer.state}, {order.customer.country}, {order.customer.postcode}</p>
      </div>
      <div className="products-list-box">
        <div className="products-header">
          <h3>Order Products ({order.selectedProducts.length})</h3>
          <button className="quick-select-btn" onClick={() => setShowQuickSelect(true)}>Quick Select</button>
        </div>
        {selectedProducts.length === 0 ? (
          <p>No products selected for this order.</p>
        ) : (
          <ul className="product-list">
            {selectedProducts.map((product) => (
              <li key={product.id} className={`product-item ${product.selected ? 'selected' : ''}`} onClick={(e) => handleCardClick(e, product.id)}>
                <input 
                  type="checkbox" 
                  className="checkbox"
                  checked={product.selected || false} 
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelectProduct(product.id);
                  }} 
                />
                <img src={product.images?.[0]?.src || placeholderImage} alt={product.name} />
                <div className="product-details">
                  <h3>{product.name}</h3>
                  <p>SKU: {product.sku}</p>
                  <p>Price: £{parseFloat(product.price).toFixed(2)}</p>
                  <p>
                    Quantity: 
                    <input 
                      type="number" 
                      value={quantityChanges[product.id] ?? product.quantity} 
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)} 
                      onClick={(e) => e.stopPropagation()} 
                    />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="order-summary">
        <h2>Order Summary</h2>
        <p><strong>Subtotal:</strong> £{calculateSubtotal().toFixed(2)}</p>
        <p><strong>VAT (20%):</strong> £{(calculateSubtotal() * 0.2).toFixed(2)}</p>
        <p><strong>Total:</strong> £{calculateTotal().toFixed(2)}</p>
        <p><strong>Total Boxes:</strong> {calculateTotalBoxes()}</p>
      </div>
      <div className="footer">
  <div className="left-buttons">
    <button 
      className={`remove-selected-btn ${areAnyProductsSelected ? 'active' : ''}`}
      onClick={handleBulkDelete}
      disabled={!areAnyProductsSelected}
    >
      Remove selected products
    </button>
    <button className="select-all-btn" onClick={selectAllProducts}>
      Select all products
    </button>
    <button className="download-excel-btn" onClick={downloadExcel}>
      Download Excel
    </button>
  </div>
  <button className="save-changes-btn" onClick={handleSaveChanges}>Save Quantity Changes</button>
</div>


      {showQuickSelect && <QuickSelectModal onClose={() => setShowQuickSelect(false)} onSelect={handleQuickSelect} />}
    </div>
  );
};

export default OrderDetails;
