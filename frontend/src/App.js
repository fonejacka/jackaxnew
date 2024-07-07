import React, { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import CreateOrder from './CreateOrder';
import ViewOrders from './ViewOrders';
import OrderDetails from './OrderDetails';
import './App.css';

function App() {
  const [activeOption, setActiveOption] = useState('createOrder');
  const navigate = useNavigate();

  const handleOptionClick = (option) => {
    setActiveOption(option);
    navigate(option === 'createOrder' ? '/create-order' : '/view-orders');
  };

  const getPageTitle = () => {
    switch (activeOption) {
      case 'createOrder':
        return 'Create Order';
      case 'viewOrders':
        return 'View Orders';
      default:
        return '';
    }
  };

  return (
    <div className="App">
      <header className="main-header">
        <div className="logo">Logo</div>
        <div className="account-info">Account Info</div>
      </header>
      <div className="app-body">
        <Sidebar onOptionClick={handleOptionClick} />
        <div className="main-content">
          <header className="sub-header">
            <h2>{getPageTitle()}</h2>
          </header>
          <div className="content">
            <Routes>
              <Route path="/" element={<CreateOrder />} />
              <Route path="/create-order" element={<CreateOrder />} />
              <Route path="/view-orders" element={<ViewOrders />} />
              <Route path="/orders/:orderId" element={<OrderDetails />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
