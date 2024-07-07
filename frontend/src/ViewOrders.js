import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ViewOrders.css';

const ViewOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:3000/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.delete(`http://localhost:3000/orders/${orderId}`);
      setOrders(orders.filter(order => order.orderId !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  return (
    <div className="view-orders-page">
      {orders.length === 0 ? (
        <p>No orders created yet.</p>
      ) : (
        <ul className="orders-list">
          {orders.map((order) => (
            <li key={order.orderId} className="order-item">
              <span>Order ID: {order.orderId}</span>
              <span>Customer: {order.customer.firstName} {order.customer.lastName}</span>
              <Link to={`/orders/${order.orderId}`}>View Details</Link>
              <button onClick={() => handleDeleteOrder(order.orderId)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ViewOrders;
