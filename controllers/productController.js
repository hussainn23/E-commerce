const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/orderModel'); // Update the path as needed
const Category = require('../models/category');
const SubCategory = require('../models/SubCategory');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Product = require('../models/ProductModel'); // Update the path to your product model
const bucket = require('../utils/firebase'); // Path to firebase.js
const { createInvoice } = require('../utils/invoiceUtils'); // Ensure this path is correct
const { sendInvoiceEmail } = require('../utils/emailUtils'); // Ensure this path is correct


const PDFDocument = require('pdfkit');



//save categories

exports.addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const newCategory = new Category({ name, description });
        await newCategory.save();

        res.status(201).json({ message: 'Category added successfully', category: newCategory });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

//////////////////////////////


/// get list of all categories

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({}, 'name description');
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//////////create sub-catogry

// Function to create a new sub-category
exports.createSubCategory = async (req, res) => {
    const { categoryId, name, description } = req.body;

    // Check if the category ID exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
        return res.status(400).send({ message: 'Category not found!' });
    }

    try {
        const newSubCategory = new SubCategory({ categoryId, name, description });
        const savedSubCategory = await newSubCategory.save();
        return res.status(200).send({ message: 'Sub-category created successfully!', subCategory: savedSubCategory });
    } catch (err) {
        console.error('Error creating sub-category:', err);
        return res.status(500).send({ error: 'Sub-category creation failed!', details: err.message });
    }
};


// Function to get sub-categories by category ID
exports.getSubCategoriesByCategoryId = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const subCategories = await SubCategory.find({ categoryId }).exec();
        
        if (!subCategories || subCategories.length === 0) {
            return res.status(404).json({ message: 'No sub-categories found for the given category ID' });
        }
        
        return res.status(200).json(subCategories);
    } catch (error) {
        console.error('Error fetching sub-categories:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Ensure unique filenames
    },
  });
  
  const upload = multer({ storage: storage });
  
  // Function to upload a file to Firebase Storage
  async function uploadFile(filePath, destination) {
    try {
      const uploadResponse = await bucket.upload(filePath, {
        destination: destination,
        gzip: true,
        metadata: {
          cacheControl: 'public, max-age=31536000',
          contentType: 'image/jpeg' // Replace with correct content type
        },
      });
  
      console.log(`${filePath} uploaded to ${bucket.name}.`);
      return uploadResponse;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  // Middleware to handle multipart/form-data
  exports.upload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).send({ message: 'Error uploading file', details: err.message });
      } 
      next();
    });
  };
  
  // Add product API
  exports.addProduct = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
      }
  
      // Set up paths
      const localFilePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      const uploadTo = `images/${req.file.filename}`;
  
      // Upload file to Firebase Storage
      await uploadFile(localFilePath, uploadTo);
  
      // Remove local file after uploading
      fs.unlinkSync(localFilePath);
  
      // Construct Firebase Storage URL
      const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uploadTo)}?alt=media`;
  
      // Create product with uploaded image URL
      const newProduct = new Product({
        productName: req.body.productName,
        productDescription: req.body.productDescription,
        subcategory: req.body.subcategory,
        price: req.body.price,
        stockQuantity: req.body.stockQuantity || 0,
        brand: req.body.brand,
        color: req.body.color,
        weight: req.body.weight,
        availabilityStatus: req.body.availabilityStatus || 'in stock',
        image: fileUrl,
      });
  
      // Save product to the database
      await newProduct.save();
  
      res.status(201).send({ message: 'Product added successfully', product: newProduct });
    } catch (err) {
      console.error('Error adding product:', err);
      res.status(500).send({ message: 'Internal server error', details: err.message });
    }
  };




  
  exports.getCategoriesWithSubCategoriesAndProducts = async (req, res) => {
    try {
        const categories = await Category.aggregate([
            {
                $lookup: {
                    from: 'subcategories',
                    localField: '_id',
                    foreignField: 'categoryId',
                    as: 'subCategories'
                }
            },
            {
                $unwind: {
                    path: '$subCategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'subCategories._id',
                    foreignField: 'subcategory',
                    as: 'subCategories.products'
                }
            },
            {
                $group: {
                    _id: '$_id',
                    name: { $first: '$name' },
                    description: { $first: '$description' },
                    subCategories: {
                        $push: {
                            _id: '$subCategories._id',
                            name: '$subCategories.name',
                            description: '$subCategories.description',
                            products: '$subCategories.products'
                        }
                    }
                }
            },

            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    subCategories: {
                        _id: 1,
                        name: 1,
                        description: 1,
                        products: {
                            _id: 1,
                            productName: 1,
                            productDescription: 1,
                            subcategory: 1,
                            price: 1,
                            stockQuantity: 1,
                            brand: 1,
                            color: 1,
                            weight: 1,
                            availabilityStatus: 1,
                            image: 1,
                            createdAt: 1,
                            updatedAt: 1
                        }
                    }
                }
                
            }
        ]);
   


        console.log(JSON.stringify(categories, null, 2)); // Log the categories

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: "Error fetching categories", error: error.message });
    }
};



exports.createOrder = async (req, res) => {
    const { userId, orderItems, paymentMethod, shippingAddress, contactNumber } = req.body;
  
    // Calculate total amount
    const totalAmount = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
  
    // Calculate estimated delivery date (4 days after order date)
    const orderDate = new Date();
    const estimatedDeliveryDate = new Date(orderDate);
    estimatedDeliveryDate.setDate(orderDate.getDate() + 4);
  
    // Generate a unique order ID
    const orderID = Math.floor(1000000 + Math.random() * 9000000).toString();
  
    try {
      const newOrder = new Order({
        userId,
        orderItems,
        totalAmount,
        paymentMethod,
        shippingAddress,
        contactNumber,
        paymentStatus: 'pending', // default
        orderStatus: 'pending', // default
        orderDate, // default
        estimatedDeliveryDate, // 4 days after order date
        trackingNumber: null, // default
        orderID // generated order ID
      });
  
      await newOrder.save();
      res.status(201).send({ success: true, message: 'Order created successfully', order: newOrder });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).send({ success: false, message: `Error creating order: ${error.message}` });
    }
  };





  exports.getOrderList = async (req, res) => {
    try {
      const orders = await Order.find({})
        .populate({
          path: 'orderItems.productId',
          select: 'productName'
        })
        .select('orderID orderDate orderStatus totalAmount');
  
      const orderList = orders.map(order => ({
        documentId: order._id,
        orderID: order.orderID,
        productName: order.orderItems.map(item => item.productId.productName).join(', '),
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        orderStatus: order.orderStatus
      }));
  
      res.status(200).send({ success: true, orders: orderList });
    } catch (error) {
      console.error('Error retrieving orders:', error);
      res.status(500).send({ success: false, message: `Error retrieving orders: ${error.message}` });
    }
  };




// getOrderDetails.js
exports.getOrderDetails = async (req, res) => {
  const { orderID } = req.params;

  try {
    const order = await Order.findOne({ orderID })
      .populate({
        path: 'userId',
        select: 'firstName lastName email phone address imageUrl'
      })
      .populate({
        path: 'orderItems.productId',
        select: 'productName productDescription price stockQuantity brand color weight availabilityStatus image subcategory',
        populate: {
          path: 'subcategory',
          select: 'name categoryId',
          populate: {
            path: 'categoryId',
            select: 'name'
          }
        }
      });

    if (!order) {
      return res.status(404).send({ success: false, message: 'Order not found' });
    }

    const formattedOrder = {
      orderID: order.orderID,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      contactNumber: order.contactNumber,
      orderStatus: order.orderStatus,
      orderDate: order.orderDate,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.userId,
      orderItems: order.orderItems.map(item => {
        const product = item.productId;
        const subcategory = product.subcategory;
        const category = subcategory ? subcategory.categoryId : null;

        return {
          product: {
            productName: product.productName,
            productDescription: product.productDescription,
            price: product.price,
            stockQuantity: product.stockQuantity,
            brand: product.brand,
            color: product.color,
            weight: product.weight,
            availabilityStatus: product.availabilityStatus,
            image: product.image,
          
              subcategory: subcategory?.name,
              category: category ? category.name : null
          
          },
          quantity: item.quantity,
          price: item.price
        };
      }),
     
    };

    res.status(200).send({ success: true, order: formattedOrder });
  } catch (error) {
    console.error('Error retrieving order details:', error);
    res.status(500).send({ success: false, message: `Error retrieving order details: ${error.message}` });
  }
};






 





exports.confirmOrder = async (req, res) => {
  const { orderID } = req.params;

  try {
    console.log('Searching for order with ID:', orderID);
    const order = await Order.findOne({ orderID })
      .populate('userId')
      .populate({
        path: 'orderItems.productId',
        select: 'productName price'
      });

    if (!order) {
      console.log('Order not found');
      return res.status(404).send({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus !== 'pending') {
      console.log('Order cannot be confirmed');
      return res.status(400).send({ success: false, message: 'Order cannot be confirmed' });
    }

    // Debug: Print orderItems
    console.log('Order Items:', order.orderItems);

    // Check if all products are populated
    for (const item of order.orderItems) {
      if (!item.productId) {
        console.log('Product not found for item:', item);
        return res.status(400).send({ success: false, message: 'Product not found for some items' });
      }
    }

    order.orderStatus = 'confirmed';
    await order.save();

    console.log('Order found and status updated to confirmed');

    // Generate invoice
    console.log('Generating invoice...');
    const invoicePath = await createInvoice(order);
    console.log('Invoice generated:', invoicePath);

    // Send email with invoice
    console.log('Sending invoice email...');
    await sendInvoiceEmail(order, invoicePath);
    console.log('Invoice email sent');

    res.status(200).send({ success: true, message: 'Order confirmed and invoice sent successfully', order });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).send({ success: false, message: `Error confirming order: ${error.message}` });
  }
};