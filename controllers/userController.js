const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const User = require('../models/User');
const JWT_KEY = "e-comm";
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { registerValidation, loginValidation } = require("../middleware/validation");
const { createUserObj } = require('../helpers/userHelper'); // Adjust the path based on your project structure

const bucket = require('../utils/firebase'); // Path to firebase.js
const path = require('path');
const fs = require('fs');



//signup user
exports.signup = async (req, res) => {
    const { error, value } = registerValidation(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) {
        return res.status(400).send({ message: "Email already exists!" });
    }

    try {
        const newUser = await createUserObj(req); 
        const savedUser = await User.create(newUser);
        return res.status(200).send({ message: "User created successfully!" });
    } catch (err) {
        console.error("Error creating user:", err);
        return res.status(500).send({ error: "User creation failed!", details: err.message });
    }
};

exports.logIn = async (req, res) => {
    const { email, password } = req.body;

    try {
        const foundUser = await User.findOne({ email });
        if (!foundUser) {
            return res.status(400).send({ message: "Invalid login credentials" });
        }

        if (password !== foundUser.password) {
            return res.status(400).send({ message: "Invalid login credentials" });
        }

        const token = jwt.sign({ _id: foundUser._id }, JWT_KEY);

        return res.status(200).header("auth-token", token).send({ message: "Login successful", "auth-token": token, userId: foundUser._id });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).send({ error: "Internal server error", details: error.message });
    }
};




// get user data 
exports.getUserData = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).send({ message: "User not found" });
        res.status(200).send(user);
    } catch (err) {
        console.error("Error fetching user data:", err);
        res.status(500).send({ message: "Internal server error" });
    }
};




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

// Example function to upload an image
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    const localFilePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    const uploadTo = `images/${req.file.filename}`;

    // Upload file to Firebase Storage
    await uploadFile(localFilePath, uploadTo);

    // Remove local file after uploading
    fs.unlinkSync(localFilePath);

    // Construct Firebase Storage URL
    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uploadTo)}?alt=media`;

    // Update user document with imageUrl
    const userId = req.user._id; // Assuming authMiddleware populates req.user correctly
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { imageUrl: fileUrl },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.status(200).send({ message: 'File uploaded successfully', url: fileUrl });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).send({ message: 'Internal server error', details: err.message });
  }
};




function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
}

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
      // Find the user by email
      const user = await User.findOne({ email });

      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Generate OTP and set expiration time
      const otp = generateOTP();
      user.resetPasswordToken = otp;
      user.resetPasswordExpires = Date.now() + 60000; // 1 hour

      await user.save();

      // Configure nodemailer transporter
      const transporter = nodemailer.createTransport({
          service: 'gmail', // Ensure you use 'gmail' as the service name
          auth: {
              user: 'hussainnhussain023@gmail.com',
              pass: 'brus awnb heja eoyn' // App Password
          }
      });

      // Set up mail options
      const mailOptions = {
          to: user.email,
          from: 'hussainnhussain023@gmail.com',
          subject: 'Password Reset',
          text: `Your OTP for password reset is ${otp}. It will expire in 1 hour.`
      };

      // Send email
      await transporter.sendMail(mailOptions);

      res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({ success: false, message: `Error requesting password reset: ${error.message}` });
  }
};




//varify otp service 

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
      const user = await User.findOne({ email });

      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.resetPasswordToken !== otp) {
          return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }

      if (Date.now() > user.resetPasswordExpires) {
          return res.status(400).json({ success: false, message: 'OTP has expired' });
      }

      res.status(200).json({ success: true, message: 'OTP verified' });
  } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ success: false, message: `Error verifying OTP: ${error.message}` });
  }
};



/// reset password

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).send({ success: true, message: 'Password updated successfully', user });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).send({ message: `Error resetting password: ${error.message}` });
  }
};



