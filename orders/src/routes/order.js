const expressAsyncHandler = require('express-async-handler');
const axios = require('axios');
const { isAdmin, isAuth } = require('../middlewares/authentication');
const Order = require('../models/Order');
const { USER_URL, PRODUCT_URL, PRODUCT_SERVICE } = require('../config/index');
const { PublishMessage } = require('../utils');

module.exports = async (app, channel) => {
  app.get(
    '/',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
      const users = (
        await axios.get(`${USER_URL}`, {
          headers: {
            Authorization: `${req.headers.authorization}`,
          },
        })
      ).data;
      const orders = await Order.find({
        userId: { $in: users.map((user) => user.id) },
      });
      res.send(orders);
    })
  );

  app.post(
    '/',
    isAuth,
    expressAsyncHandler(async (req, res) => {
      if (req.body.orderItems.length === 0) {
        res.status(400).send({ message: 'Cart is empty' });
      }

      for (const product of req.body.orderItems) {
        const productId = product._id;

        const productFromDatabase = await axios.get(
          `${PRODUCT_URL}/${productId}`,
          {
            headers: {
              Authorization: `${req.headers.authorization}`,
            },
          }
        );

        if (productFromDatabase.data.countInStock < product.quantity) {
          return res.status(400).send({
            message: `Product ${product.name} is out of stock.`,
          });
        }
      }

      const newOrder = new Order({
        orderItems: req.body.orderItems.map((x) => ({ ...x, product: x._id })),
        shippingAddress: req.body.shippingAddress,
        paymentMethod: req.body.paymentMethod,
        itemsPrice: req.body.itemsPrice,
        shippingPrice: req.body.shippingPrice,
        taxPrice: req.body.taxPrice,
        totalPrice: req.body.totalPrice,
        user: req.user._id,
      });

      const order = await newOrder.save();

      PublishMessage(
        channel,
        PRODUCT_SERVICE,
        JSON.stringify({ event: 'ORDER_CREATED', data: req.body.orderItems })
      );

      res.status(201).send({ message: 'New Order Created', order });
    })
  );

  app.get(
    '/summary',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
      const orders = await Order.aggregate([
        {
          $group: {
            _id: null,
            numOrders: { $sum: 1 },
            totalSales: { $sum: '$totalPrice' },
          },
        },
      ]);

      const users = (
        await axios.get(`${USER_URL}/summary`, {
          headers: {
            Authorization: `${req.headers.authorization}`,
          },
        })
      ).data;

      const dailyOrders = await Order.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            sales: { $sum: '$totalPrice' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const productCategories = (
        await axios.get(`${PRODUCT_URL}/summary`, {
          headers: {
            Authorization: `${req.headers.authorization}`,
          },
        })
      ).data;
      res.send({ users, orders, dailyOrders, productCategories });
    })
  );

  app.get(
    '/mine',
    isAuth,
    expressAsyncHandler(async (req, res) => {
      const orders = await Order.find({ user: req.user._id });
      res.send(orders);
    })
  );

  app.get('/keys/paypal', (req, res) => {
    res.send(process.env.PAYPAL_CLIENT_ID || 'sb');
  });

  app.get(
    '/:id',
    isAuth,
    expressAsyncHandler(async (req, res) => {
      const order = await Order.findById(req.params.id);
      if (order) {
        res.send(order);
      } else {
        res.status(404).send({ message: 'Order Not Found' });
      }
    })
  );

  app.put(
    '/:id/deliver',
    isAuth,
    expressAsyncHandler(async (req, res) => {
      const order = await Order.findById(req.params.id);
      if (order) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        await order.save();
        res.send({ message: 'Order Delivered' });
      } else {
        res.status(404).send({ message: 'Order Not Found' });
      }
    })
  );

  app.put(
    '/:id/pay',
    isAuth,
    expressAsyncHandler(async (req, res) => {
      const order = await Order.findById(req.params.id);
      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: req.body.id,
          status: req.body.status,
          update_time: req.body.update_time,
          email_address: req.body.email_address,
        };

        const updatedOrder = await order.save();
        res.send({ message: 'Order Paid', order: updatedOrder });
      } else {
        res.status(404).send({ message: 'Order Not Found' });
      }
    })
  );

  app.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
      const order = await Order.findById(req.params.id);
      if (order) {
        await order.deleteOne();
        res.send({ message: 'Order Deleted' });
      } else {
        res.status(404).send({ message: 'Order Not Found' });
      }
    })
  );
};
