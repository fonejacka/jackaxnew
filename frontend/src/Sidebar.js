import React from 'react';
import './Sidebar.css';

const Sidebar = ({ onOptionClick }) => {
  return (
    <div className="sidebar">
      <h2>Dashboard</h2>
      <ul>
        <li onClick={() => onOptionClick('createOrder')}>Create Order</li>
        <li onClick={() => onOptionClick('products')}>Products</li>
      </ul>
    </div>
  );
};

export default Sidebar;
