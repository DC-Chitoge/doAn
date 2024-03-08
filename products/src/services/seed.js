const Product = require("../models/Product");
// const products = require("../faker");

const seed = async () => {
  await Product.deleteMany({});
  //   for (let i = 0; i < products.length; i++) {
  //     const newProduct = new Product({ ...products[i], images: [] });
  //     await newProduct.save();
  //   }
  //   await Product.insertMany(products);
};

seed();
