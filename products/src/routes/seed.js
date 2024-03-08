const products = require("../faker");
const Product = require("../models/Product");

module.exports = async (app) => {
  app.get("/seed", async (req, res) => {
    await Product.deleteMany({});
    const createdProducts = await Product.insertMany(products);
    res.send({ createdProducts });
  });
};
