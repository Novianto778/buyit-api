const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    categories: [
        {
            type: String,
            required: true,
        },
    ],
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        // required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
});

module.exports = mongoose.model('Product', productSchema);
