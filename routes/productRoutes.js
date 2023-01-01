const express = require('express');
const router = express.Router();
const {
    getProducts,
    createProduct,
    getCategories,
    updateProduct,
    deleteProduct,
} = require('../controllers/productControllers');
const verifyRoles = require('../middleware/verifyRoles');

router
    .route('/')
    .get(getProducts)
    .post(verifyRoles('admin'), createProduct)
    .patch(verifyRoles('admin'), updateProduct)
    .delete(verifyRoles('admin'), deleteProduct);

router.route('/categories').get(getCategories);

module.exports = router;
