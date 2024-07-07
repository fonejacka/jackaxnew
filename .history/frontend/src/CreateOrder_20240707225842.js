import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuickSelectModal from './QuickSelectModal';
import './CreateOrder.css';

const placeholderImage = 'https://via.placeholder.com/60';

function CreateOrder() {
  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    state: '',
    country: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [message, setMessage] = useState('');
  const [showQuickSelect, setShowQuickSelect] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/all-users');
        setAllUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      const filteredUsers = allUsers.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredUsers);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setCustomer({
      firstName: suggestion.first_name,
      lastName: suggestion.last_name,
      email: suggestion.email,
      contactNumber: suggestion.billing?.phone || '',
      addressLine1: suggestion.billing?.address_1 || '',
      addressLine2: suggestion.billing?.address_2 || '',
      city: suggestion.billing?.city || '',
      postcode: suggestion.billing?.postcode || '',
      state: suggestion.billing?.state || '',
      country: suggestion.billing?.country || ''
    });
    setSearchQuery('');
    setSuggestions([]);
  };

  const handlePageClick = () => {
    setSuggestions([]);
  };

  const handleCreateOrder = async () => {
    try {
      await axios.post('http://localhost:3000/create-order', {
        customer,
        selectedProducts
      });
      setMessage('Pre-order created successfully!');
      setSelectedProducts([]); // Clear selected products after order creation
    } catch (error) {
      console.error('Error creating order:', error);
      setMessage('Failed to create pre-order. Please try again.');
    }
  };

  const calculateSubtotal = () => {
    return selectedProducts.reduce((total, product) => total + product.price * product.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + subtotal * 0.2; // Adding 20% VAT
  };

  const calculateTotalBoxes = () => {
    return selectedProducts.reduce((total, product) => total + product.quantity, 0);
  };

  const handleQuickSelect = (newProducts) => {
    const updatedProducts = newProducts.map(product => ({
      ...product,
      quantity: product.quantity || 1 // Ensure the quantity is set to 1 if not already set
    }));
    setSelectedProducts([...selectedProducts, ...updatedProducts]);
  };

  const handleQuantityChange = (productId, quantity) => {
    setSelectedProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId ? { ...product, quantity: parseInt(quantity, 10) } : product
      )
    );
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prevSelected =>
      prevSelected.map(product =>
        product.id === productId ? { ...product, selected: !product.selected } : product
      )
    );
  };

  const removeSelectedProducts = () => {
    setSelectedProducts(prevProducts =>
      prevProducts.filter(product => !product.selected)
    );
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

  return (
    <div className="create-order-page" onClick={handlePageClick}>
      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="customer-details-box">
        <h2>Customer Information</h2>
        <div className="search-customers">
          <input
            type="text"
            placeholder="Search Users by Name or Email"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id} onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion.first_name} {suggestion.last_name} ({suggestion.email})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="products-list-box">
        <div className="products-header">
          <h3>Order Products ({selectedProducts.length})</h3>
          <button className="quick-select-btn" onClick={() => setShowQuickSelect(true)}>Quick Select</button>
        </div>
        {selectedProducts.length === 0 ? (
          <p>No products selected for this order.</p>
        ) : (
          <ul className="product-list">
            {selectedProducts.map((product) => (
              <li key={product.id} className={`product-item ${product.selected ? 'selected' : ''}`} onClick={() => toggleSelectProduct(product.id)}>
                <input 
                  type="checkbox" 
                  className="checkbox"
                  checked={product.selected || false} 
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelectProduct(product.id);
                  }} 
                />
                <img src={product.images[0]?.src || placeholderImage} alt={product.name} />
                <div className="product-details">
                  <h3>{product.name}</h3>
                  <p>SKU: {product.sku}</p>
                  <p>Price: £{parseFloat(product.price).toFixed(2)}</p>
                  <p>
                    Quantity: 
                    <input 
                      type="number" 
                      value={product.quantity} 
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
      {showQuickSelect && (
        <QuickSelectModal 
          onClose={() => setShowQuickSelect(false)} 
          onSelect={handleQuickSelect} 
        />
      )}
      <div className="footer">
        <div className="left-buttons">
          <button 
            className={`remove-selected-btn ${areAnyProductsSelected ? 'active' : ''}`}
            onClick={removeSelectedProducts}
            disabled={!areAnyProductsSelected}
          >
            Remove selected products
          </button>
          <button className="select-all-btn" onClick={selectAllProducts}>
            Select all products
          </button>
        </div>
        <button className="create-order-btn" onClick={handleCreateOrder}>Create Order</button>
      </div>
    </div>
  );
}

export default CreateOrder;
