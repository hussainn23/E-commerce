const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { 
        type: String, 
        required: true 
    },
    productDescription: { 
        type: String ,
        required: true 

    },
    subcategory: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'SubCategory',
        required: true  
    },
    price: { 
        type: Number, 
        required: true 
    },
    stockQuantity: { 
        type: Number, 
        default: 0 
    },
    brand: { 
        type: String , 
        required: true , 
    },
    color: { 
        type: String, 
        required: true  
    },
    weight: { 
        type: Number 
    },
    availabilityStatus: { 
        type: String, 
        enum: ['in stock', 'out of stock', 'pre-order'], 
        default: 'in stock'
    },
    image: { 
        type: String , 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Product', productSchema);
