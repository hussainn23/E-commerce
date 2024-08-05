const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Route to get categories
router.get('/categories', productController.addCategory);
router.get('/getcategories', productController.getAllCategories);
router.post('/save-sub-categories', productController.createSubCategory);
router.get('/sub-categories/:categoryId', productController.getSubCategoriesByCategoryId);

router.post('/add-product', productController.upload, productController.addProduct);
router.get('/categories-with-products', productController.getCategoriesWithSubCategoriesAndProducts);
router.post('/create-order', productController.createOrder);
router.get('/get-orders', productController.getOrderList);
router.get('/order-details/:orderID', productController.getOrderDetails);
router.post('/confirm-order/:orderID', productController.confirmOrder);








module.exports = router;






