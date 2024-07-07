import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from './Loader';
import './QuickSelectModal.css';
import { FaChevronRight } from 'react-icons/fa';

const QuickSelectModal = ({ onSelect, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const fetchProducts = async (categoryId, page) => {
    try {
      const response = await axios.get(`http://localhost:3000/categories/${categoryId}/products`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const fetchTotalProducts = async (categoryId) => {
    try {
      const response = await axios.get(`http://localhost:3000/categories/${categoryId}/products/count`);
      return response.data.total;
    } catch (error) {
      console.error('Error fetching total products:', error);
      return 0;
    }
  };

  const handleCategoryClick = async (categoryId, categoryName) => {
    setSelectedCategory(categoryId);
    setCurrentCategory(categoryName);
    setPage(1);
    setLoading(true);
    const initialProducts = await fetchProducts(categoryId, 1);
    const total = await fetchTotalProducts(categoryId);
    setProducts(initialProducts);
    setTotalProducts(total);
    setHasMore(initialProducts.length > 0);
    setLoading(false);
  };

  const loadMoreProducts = async () => {
    const nextPage = page + 1;
    const newProducts = await fetchProducts(selectedCategory, nextPage);
    setProducts([...products, ...newProducts]);
    setPage(nextPage);
    setHasMore(newProducts.length > 0);
  };

  const handleProductSelect = (product) => {
    setSelectedProducts((prevSelectedProducts) => {
      if (prevSelectedProducts.includes(product)) {
        return prevSelectedProducts.filter((p) => p !== product);
      } else {
        return [...prevSelectedProducts, product];
      }
    });
  };

  const handleAddProducts = () => {
    onSelect(selectedProducts);
    onClose();
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setProducts([]);
    setCurrentCategory('');
  };

  const formatPrice = (price) => {
    return `£${parseFloat(price).toFixed(2)}`;
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Quick Select</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {selectedCategory && (
          <div className="back-bar">
            <button className="back-btn" onClick={handleBackToCategories}>
              Back to Categories
            </button>
            <div className="breadcrumb">- {currentCategory}</div>
            <div className="results-count">{totalProducts} Results</div>
          </div>
        )}
        <div
          className="scrollable-content"
          onScroll={(e) => {
            const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
            if (bottom && hasMore && !loading) {
              loadMoreProducts();
            }
          }}
        >
          {loading && page === 1 ? (
            <Loader />
          ) : !selectedCategory ? (
            <ul className="category-list">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="category-item"
                  onClick={() => handleCategoryClick(category.id, category.name)}
                >
                  <div className="category-details">
                    <h3>{category.name}</h3>
                    <p>{category.count} products</p>
                  </div>
                  <FaChevronRight className="chevron-icon" />
                </li>
              ))}
            </ul>
          ) : (
            <>
              <ul className="product-list">
                {products.map((product) => (
                  <li
                    key={product.id}
                    className={`product-item ${
                      selectedProducts.includes(product) ? 'selected' : ''
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedProducts.includes(product)}
                      onChange={() => handleProductSelect(product)}
                    />
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0].src} alt={product.name} className="product-image" />
                    ) : (
                      <div className="product-image-placeholder">No Image</div>
                    )}
                    <div className="product-details">
                      <h3>{product.name}</h3>
                      <p>SKU: {product.sku}</p>
                    </div>
                    <div className="product-price">
                      <p>{formatPrice(product.price)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {loading && <Loader />}
            </>
          )}
        </div>
        <div className="modal-footer">
          <span>{selectedProducts.length} Selected</span>
          <div className="modal-footer-buttons">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="add-btn" onClick={handleAddProducts}>
              Add Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSelectModal;
