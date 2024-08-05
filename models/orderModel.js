const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderItems: [orderItemSchema],
    orderID: {
      type: String,
      required: true,
      unique: true
    },
    totalAmount: {
      type: Number,
      default: 0 // Default value should be a number, not a string
    },
    paymentMethod: {
      type: String,
      required: true
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['paid', 'pending'],
      default: 'pending'
    },
    shippingAddress: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      zipCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      }
    },
    contactNumber: {
      type: String,
      required: true
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    estimatedDeliveryDate: {
      type: Date,
      default: null
    },
    trackingNumber: {
      type: String,
      default: null
    }
  },
  { timestamps: true } // to include createdAt and updatedAt
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
