const Product = require("../models/Product");

const calculateCountInStock = async (productsOrdered) => {
  const products = await Product.find({ _id: { $in: productsOrdered } });
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    product.countInStock =
      product.countInStock -
      productsOrdered.find((product) => product._id === product._id).quantity;
    await product.save();
  }
  return "done";
};

const SubscribeEvents = async (payload) => {
  payload = JSON.parse(payload);
  const { event, data } = payload;

  switch (event) {
    case "ORDER_CREATED":
      calculateCountInStock(data);
      break;
    // case "REMOVE_FROM_CART":
    //   this.ManageCart(userId, product, qty, true);
    //   break;
    default:
      break;
  }
};

module.exports = SubscribeEvents;
