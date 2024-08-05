const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: true,
    },
    lastName: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,

    },
    phone: {
      type: String,
        required: true,
        minlength: 11,
        maxlength: 11,

    },
    address: {
      type: String,
      required:true,
      trim: true,

    },
    imageUrl: {
       type: String ,
       required:true,
      },
      resetPasswordToken: {
        type: String ,
        default: 'null'
       },
       resetPasswordExpires: { 
        type: Date,
        default:''
       }
  },
  { timestamps: true } // to include createdAt and updatedAt
);


module.exports = mongoose.model("User", userSchema);

