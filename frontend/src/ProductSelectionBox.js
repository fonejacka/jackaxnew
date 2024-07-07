import React, { useState } from 'react';
import QuickSelectModal from './QuickSelectModal';
import './ProductSelectionBox.css';

const placeholderImage = 'https://via.placeholder.com/60';

const ProductSelectionBox = ({ selectedProducts, setSelectedProducts, onCreateOrder }) => {
  const [checkedProducts, setCheckedProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const handleAddProduct = (product) => {
    setSelectedProducts(prevProducts => [...prevProducts, { ...product, quantity: 1 }]);
  };

  const handleSelectAll = () => {
    setCheckedProducts(selectedProducts.map(product => product.id));
  };

  const handleRemoveSelected = () => {
    setSelectedProducts(prevProducts =>
      prevProducts.filter(product => !checkedProducts.includes(product.id))
    );
    setCheckedProducts([]);
  };

  const handleCheck = (productId) => {
    setCheckedProducts(prevChecked => 
      prevChecked.includes(productId)
        ? prevChecked.filter(id => id !== productId)
        : [...prevChecked, productId]
    );
  };

  const handleQuantityChange = (productId, quantity) => {
    setSelectedProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId ? { ...product, quantity } : product
      )
    );
  };

  const handleCreatePreOrder = () => {
    onCreateOrder();
  };

  return (
    <div className="product-selection-box">
      <div className="header">
        <button className="quick-select-btn" onClick={() => setShowModal(true)}>Quick Select</button>
      </div>
      <div className="selected-products">
        {selectedProducts.length === 0 ? (
          <p>You have not added any products to this order.</p>
        ) : (
          <ul>
            {selectedProducts.map(product => (
              <li 
                key={product.id} 
                className={`selected-product-item ${checkedProducts.includes(product.id) ? 'selected' : ''}`}
              >
                <input 
                  type="checkbox" 
                  checked={checkedProducts.includes(product.id)}
                  onChange={() => handleCheck(product.id)}
                />
                <img src={product.images[0]?.src || placeholderImage} alt={product.name} />
                <div className="product-details">
                  <h3>{product.name}</h3>
                  <p>SKU: {product.sku}</p>
                  <p>Price: £{parseFloat(product.price).toFixed(2)}</p>
                  <input 
                    type="number" 
                    min="1" 
                    value={product.quantity} 
                    onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10))}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="footer">
        <button 
          className="select-all-btn" 
          onClick={handleSelectAll} 
          disabled={selectedProducts.length === 0}
        >
          Select all products
        </button>
        <button 
          className="remove-selected-btn" 
          onClick={handleRemoveSelected} 
          disabled={checkedProducts.length === 0}
        >
          Remove selected products
        </button>
        <button 
          className="create-preorder-btn" 
          onClick={handleCreatePreOrder} 
          disabled={selectedProducts.length === 0}
        >
          Create Pre-order
        </button>
      </div>
      {showModal && (
        <QuickSelectModal 
          onSelectProduct={handleAddProduct} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
};

export default ProductSelectionBox;
