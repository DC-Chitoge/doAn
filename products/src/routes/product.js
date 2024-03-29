const expressAsyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { isAuth, isAdmin } = require('../middlewares/authentication');
const { generateToken } = require('../middlewares/jsonwebtoken');

module.exports = (app, channel) => {
  app.get('/', async (req, res) => {
    const products = await Product.find();
    res.send(products);
  });

  app.post(
    '/',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
      const newProduct = new Product({
        name: 'sample name ' + Date.now(),
        slug: 'sample-name-' + Date.now(),
        image: '/images/p1.jpg',
        price: 0,
        category: 'sample category',
        brand: 'sample brand',
        countInStock: 0,
        rating: 0,
        numReviews: 0,
        description: 'sample description',
      });
      const product = await newProduct.save();
      res.send({ message: 'Product Created', product });
    })
  );

  app.put(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
      const productId = req.params.id;
      const product = await Product.findById(productId);
      if (product) {
        product.name = req.body.name || product.name;
        product.slug = req.body.slug || product.slug;
        product.price = req.body.price || product.price;
        product.image = req.body.image || product.image;
        product.images = req.body.images || product.images;
        product.category = req.body.category || product.category;
        product.brand = req.body.brand || product.brand;
        product.countInStock = req.body.countInStock || product.countInStock;
        product.description = req.body.description || product.description;
        await product.save();
        res.send({ message: 'Product Updated' });
      } else {
        res.status(404).send({ message: 'Product Not Found' });
      }
    })
  );
  app.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
      const product = await Product.findById(req.params.id);
      if (product) {
        await product.deleteOne();
        res.send({ message: 'Product Deleted' });
      } else {
        res.status(404).send({ message: 'Product Not Found' });
      }
    })
  );

  app.get(
    '/summary',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
      const productCategories = await Product.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]);

      return res.status(200).json({ productCategories });
    })
  );

  const PAGE_SIZE = 3;
  app.get(
    '/admin',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
      const { query } = req;
      const page = query.page || 1;
      const pageSize = query.pageSize || PAGE_SIZE;

      const products = await Product.find()
        .skip(pageSize * (page - 1))
        .limit(pageSize);
      const countProducts = await Product.countDocuments();
      res.send({
        products,
        countProducts,
        page,
        pages: Math.ceil(countProducts / pageSize),
      });
    })
  );

  app.get(
    '/search',
    expressAsyncHandler(async (req, res) => {
      const { query } = req;
      const pageSize = query.pageSize || PAGE_SIZE;
      const page = query.page || 1;
      const category = query.category || '';
      const price = query.price || '';
      const rating = query.rating || '';
      const order = query.order || '';
      const searchQuery = query.query || '';

      const queryFilter =
        searchQuery && searchQuery !== 'all'
          ? {
              name: {
                $regex: searchQuery,
                $options: 'i',
              },
            }
          : {};
      const categoryFilter = category && category !== 'all' ? { category } : {};
      const ratingFilter =
        rating && rating !== 'all'
          ? {
              rating: {
                $gte: Number(rating),
              },
            }
          : {};
      const priceFilter =
        price && price !== 'all'
          ? {
              // 1-50
              price: {
                $gte: Number(price.split('-')[0]),
                $lte: Number(price.split('-')[1]),
              },
            }
          : {};
      const sortOrder =
        order === 'featured'
          ? { featured: -1 }
          : order === 'lowest'
          ? { price: 1 }
          : order === 'highest'
          ? { price: -1 }
          : order === 'toprated'
          ? { rating: -1 }
          : order === 'newest'
          ? { createdAt: -1 }
          : { _id: -1 };

      const products = await Product.find({
        ...queryFilter,
        ...categoryFilter,
        ...priceFilter,
        ...ratingFilter,
      })
        .sort(sortOrder)
        .skip(pageSize * (page - 1))
        .limit(pageSize);

      const countProducts = await Product.countDocuments({
        ...queryFilter,
        ...categoryFilter,
        ...priceFilter,
        ...ratingFilter,
      });
      res.send({
        products,
        countProducts,
        page,
        pages: Math.ceil(countProducts / pageSize),
      });
    })
  );

  app.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
      const categories = await Product.find().distinct('category');
      res.send(categories);
    })
  );

  app.get('/slug/:slug', async (req, res) => {
    const product = await Product.findOne({ slug: { $eq: req.params.slug } });
    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  });

  app.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  });
};
