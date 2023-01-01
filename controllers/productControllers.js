const Product = require('../models/Product');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// @desc    get all products or single product by id
// @route   GET /products
// @access  Private
exports.getProducts = async (req, res, next) => {
    const { id } = req.query;

    if (id) {
        const product = await Product.findById(id).lean().exec();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json(product);
    }
    const products = await Product.find().lean().exec();
    // get product with image

    if (!products.length) {
        return res.status(404).json({ message: 'No products found' });
    }

    res.status(200).json(products);
};

// @desc    Create a product with image
// @route   POST /products
// @access  Private
exports.createProduct = async (req, res, next) => {
    const { name, price, description, categories } = req.body;
    const user = req.userId;

    if (!name || !price || !categories) {
        return res.status(400).json({ message: 'Please provide all fields' });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    // upload file
    const files = req.files.picture;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json('No files were uploaded.');
    }

    // The name of the input field (i.e. "file") is used to retrieve the uploaded file

    // saving files
    const fileName = uuidv4() + path.extname(files.name);

    const filePath = path.join(__dirname, '../files', fileName);

    files.mv(filePath, (err) => {
        if (err) return res.status(500).json({ message: err.message });
    });

    const product = await Product.create({
        name,
        price,
        description,
        categories,
        image: fileName,
        user,
    });

    res.status(201).json({ message: `Product ${product.name} created` });
};

// @desc    Update a product
// @route   PATCH /products/:id
// @access  Private
exports.updateProduct = async (req, res, next) => {
    const { id, name, price, description, categories, user } = req.body;

    if (!name || !price || !categories) {
        return res.status(400).json({ message: 'Please provide all fields' });
    }

    const files = req.files?.picture;

    if (files) {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: 'No files were uploaded.' });
        }
        // delete old file
        const product = await Product.findById(id).lean().exec();

        const filePath = path.join(__dirname, '../files', product.image);
        fs.unlink(filePath, (err) => {
            if (err) return res.status(500).json({ message: err.message });
        });

        // upload new file
        const fileName = uuidv4() + path.extname(files.name);

        const newFilePath = path.join(__dirname, '../files', fileName);

        files.mv(newFilePath, (err) => {
            if (err) return res.status(500).json({ message: err.message });
        });

        const newProduct = await Product.findByIdAndUpdate(id, {
            name,
            price,
            description,
            categories,
            image: fileName,
            user,
        })
            .lean()
            .exec();

        if (!newProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: `Product ${newProduct.name} updated` });
    } else {
        const product = await Product.findByIdAndUpdate(id, {
            name,
            price,
            description,
            categories,
            user,
        })
            .lean()
            .exec();

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: `Product ${product.name} updated` });
    }
};

// @desc    Delete a product
// @route   DELETE /products?id=:id
// @access  Private
exports.deleteProduct = async (req, res, next) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Please provide id' });
    }

    const product = await Product.findByIdAndDelete(id).lean().exec();

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // delete file
    const filePath = path.join(__dirname, '../files', product.image);
    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ message: err.message });
    });

    res.status(200).json({ message: `Product ${product.name} deleted` });
};

exports.getCategories = async (req, res, next) => {
    const categories = await Product.find()
        .distinct('categories')
        .lean()
        .exec();
    if (!categories.length) {
        return res.status(404).json({ message: 'No categories found' });
    }
    res.status(200).json(categories);
};
