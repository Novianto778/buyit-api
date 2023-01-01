const Order = require('../models/Order');

// @desc    get all orders or single order by id
// @route   GET /orders
// @access  Private
exports.getOrders = async (req, res, next) => {
    // make pagination
    const { page = 2, limit = 5 } = req.query;
    const startIndex = (page - 1) * limit;
    const total = await Order.countDocuments().exec();
    const orders = await Order.find()
        .populate('user', 'username')
        .populate('products.productId', 'image')
        // .limit(limit * 1)
        // .skip(startIndex)
        .lean()
        .exec();

    // const orders = await Order.find();

    if (!orders.length) {
        return res.status(404).json({ message: 'No orders found' });
    }

    const result = {
        orders,
        // pagination: {
        //     total,
        //     limit,
        //     page,
        //     pages: Math.ceil(total / limit),
        // },
    };

    res.status(200).json(result);

    // const { id } = req.query;
    // if (id) {
    //     const order = await Order.findById(id)
    //         .populate('user', 'username')
    //         // .populate('products.productId', 'name')
    //         .lean()
    //         .exec();
    //     if (!order) {
    //         return res.status(404).json({ message: 'Order not found' });
    //     }
    //     return res.status(200).json(order);
    // }
    // const orders = await Order.find()
    //     // to get relation username from the id reference
    //     .populate('user', 'username')
    //     // .populate('products.productId', 'name')
    //     .lean()
    //     .exec();
    // if (!orders.length) {
    //     return res.status(404).json({ message: 'No orders found' });
    // }
    // res.status(200).json(orders);
};

// @desc    Create a order
// @route   POST /orders
// @access  Private
exports.createOrder = async (req, res, next) => {
    const { products, totalPrice, customerName } = req.body;

    if (!products || !totalPrice || !customerName) {
        return res.status(400).json({ message: 'Please provide all fields' });
    }

    const user = req.userId;

    if (!user) {
        return res
            .status(400)
            .json({ message: 'Please login to create order' });
    }

    const order = await Order.create({
        user,
        products,
        totalPrice,
        customerName,
    });

    res.status(201).json({ message: `Order ${order._id} created` });
};
