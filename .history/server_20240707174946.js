const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Serve static files from the React app
const buildPath = path.join(__dirname, 'frontend', 'build');
app.use(express.static(buildPath));

// Fallback to the index.html file for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Use environment variable for MongoDB URI
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://Sam:Popadopilis1%21@polarx.aad9alq.mongodb.net/?retryWrites=true&w=majority&appName=PolarX';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  sku: String,
  price: String,
  images: Array,
  updatedAt: Date
});

const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
  orderId: String,
  customer: {
    firstName: String,
    lastName: String,
    email: String,
    contactNumber: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    postcode: String,
    state: String,
    country: String
  },
  selectedProducts: [{
    id: Number,
    name: String,
    sku: String,
    price: String,
    images: Array,
    quantity: { type: Number, default: 1 }
  }]
});

const Order = mongoose.model('Order', orderSchema);

const counterSchema = new mongoose.Schema({
  _id: String,
  sequenceValue: Number
});

const Counter = mongoose.model('Counter', counterSchema);

const userSchema = new mongoose.Schema({
  id: Number,
  first_name: String,
  last_name: String,
  email: String,
  billing: Object,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

const consumerKey = 'ck_02cb945aa64945755aa555a52161163d76d65c76';
const consumerSecret = 'cs_cea4d134ad3ad9f15c584a7fa12aa44c2c4529e5';
const baseUrl = 'https://polarxornaments.co.uk/wp-json/wc/v3';
const wpBaseUrl = 'https://polarxornaments.co.uk/wp-json/wp/v2';

const auth = {
  username: consumerKey,
  password: consumerSecret
};

let cachedUsers = [];
let lastFetchTime = null;

const fetchAllPages = async (url, params, auth) => {
  let page = 1;
  const perPage = 100;
  let allData = [];
  let data;

  do {
    try {
      const response = await axios.get(url, {
        auth,
        params: {
          ...params,
          per_page: perPage,
          page
        }
      });

      data = response.data;
      allData = [...allData, ...data];
      page += 1;

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      if (error.response && error.response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.error(`Error fetching data from ${url} on page ${page}:`, error.toString());
        break;
      }
    }
  } while (data.length === perPage);

  return allData;
};

const fetchAndCacheUsers = async () => {
  try {
    const allCustomers = await fetchAllPages(`${baseUrl}/customers`, { role: 'all' }, auth);
    const allUsers = await fetchAllPages(`${wpBaseUrl}/users`, { context: 'edit' }, auth);

    const bulkOps = allCustomers.map(user => ({
      updateOne: {
        filter: { id: user.id },
        update: { ...user, updatedAt: new Date() },
        upsert: true
      }
    }));

    await User.bulkWrite(bulkOps);
    console.log('Total users cached:', allCustomers.length + allUsers.length);
  } catch (error) {
    console.error('Error fetching and caching users:', error.toString());
  }
};

const fetchAndCacheProducts = async () => {
  try {
    const allProducts = await fetchAllPages(`${baseUrl}/products`, {}, auth);

    const bulkOps = allProducts.map(product => ({
      updateOne: {
        filter: { id: product.id },
        update: { ...product, updatedAt: new Date() },
        upsert: true
      }
    }));

    await Product.bulkWrite(bulkOps);
    console.log('Total products cached:', allProducts.length);
  } catch (error) {
    console.error('Error fetching and caching products:', error.toString());
  }
};

const initializeCounter = async () => {
  const counter = await Counter.findById('orderId');
  if (!counter) {
    const newCounter = new Counter({ _id: 'orderId', sequenceValue: 0 });
    await newCounter.save();
  }
};

const getNextOrderId = async () => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'orderId' },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  return `PX${String(counter.sequenceValue).padStart(4, '0')}`;
};

initializeCounter();
fetchAndCacheUsers();
fetchAndCacheProducts();

setInterval(fetchAndCacheUsers, 3600000);
setInterval(fetchAndCacheProducts, 3600000);

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find().exec();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products from MongoDB:', error.toString());
    res.status(500).send(error.toString());
  }
});

app.get('/categories', async (req, res) => {
  try {
    const response = await axios.get(`${baseUrl}/products/categories`, {
      auth,
      params: {
        per_page: 100
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching categories:', error.toString());
    res.status(500).send(error.toString());
  }
});

app.get('/categories/:id/products', async (req, res) => {
  const categoryId = req.params.id;
  const page = req.query.page || 1;
  const perPage = req.query.per_page || 50;
  try {
    const response = await axios.get(`${baseUrl}/products`, {
      auth,
      params: {
        category: categoryId,
        per_page: perPage,
        page
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching products for category ${categoryId} on page ${page}:`, error.toString());
    res.status(500).send(error.toString());
  }
});

app.get('/categories/:id/products/count', async (req, res) => {
  const categoryId = req.params.id;
  try {
    const response = await axios.get(`${baseUrl}/products`, {
      auth,
      params: {
        category: categoryId,
        per_page: 1,
        page: 1
      }
    });
    const totalProducts = parseInt(response.headers['x-wp-total'], 10);
    res.json({ total: totalProducts });
  } catch (error) {
    console.error(`Error fetching product count for category ${categoryId}:`, error.toString());
    res.status(500).send(error.toString());
  }
});

app.get('/all-users', async (req, res) => {
  try {
    const users = await User.find().exec();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users from MongoDB:', error.toString());
    res.status(500).send(error.toString());
  }
});

app.post('/resync-users', async (req, res) => {
  try {
    await fetchAndCacheUsers();
    res.json({ message: 'Users resynced successfully', totalUsers: cachedUsers.length });
  } catch (error) {
    console.error('Error resyncing users:', error.toString());
    res.status(500).send(error.toString());
  }
});

app.post('/create-order', async (req, res) => {
  try {
    const orderData = req.body;
    const orderId = await getNextOrderId();
    const order = new Order({ ...orderData, orderId });
    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error.toString());
    res.status(500).send(error.toString());
  }
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().exec();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error.toString());
    res.status(500).send(error.toString());
  }
});

app.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).exec();
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error fetching order details:', error.toString());
    res.status(500).send(error.toString());
  }
});

app.delete('/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    await Order.deleteOne({ orderId });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error(`Error deleting order ${orderId}:`, error);
    res.status(500).send(error.toString());
  }
});

app.put('/orders/:orderId/products/:productId', async (req, res) => {
  const { orderId, productId } = req.params;
  const { quantity } = req.body;

  try {
    console.log(`Updating product ID ${productId} in order ID ${orderId} to quantity ${quantity}`);
    const order = await Order.findOne({ orderId }).exec();
    if (!order) {
      console.error('Order not found');
      return res.status(404).json({ error: 'Order not found' });
    }

    const product = order.selectedProducts.find(p => p.id == productId);
    if (product) {
      product.quantity = quantity;
      await order.save();
      console.log('Updated order:', JSON.stringify(order));
      res.json(order);
    } else {
      console.error('Product not found in order');
      res.status(404).json({ error: 'Product not found in order' });
    }
  } catch (error) {
    console.error('Error updating product quantity:', error.toString());
    res.status(500).send(error.toString());
  }
});

app.delete('/orders/:orderId/products/:productId', async (req, res) => {
  const { orderId, productId } = req.params;

  try {
    const order = await Order.findOne({ orderId }).exec();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const productIndex = order.selectedProducts.findIndex(p => p.id == productId);
    if (productIndex !== -1) {
      order.selectedProducts.splice(productIndex, 1);
      await order.save();
      res.json(order);
    } else {
      res.status(404).json({ error: 'Product not found in order' });
    }
  } catch (error) {
    console.error('Error deleting product from order:', error.toString());
    res.status(500).send(error.toString());
  }
});

app.post('/orders/:orderId/products', async (req, res) => {
  const { orderId } = req.params;
  const { product } = req.body;

  try {
    const order = await Order.findOne({ orderId }).exec();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const existingProduct = order.selectedProducts.find(p => p.id === product.id);
    if (existingProduct) {
      existingProduct.quantity += product.quantity;
    } else {
      order.selectedProducts.push(product);
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Error adding product to order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on port 3000');
});
