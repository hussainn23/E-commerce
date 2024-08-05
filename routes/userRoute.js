const router = require("express").Router();
const userController = require("../controllers/userController");
const authMiddleware = require('../middleware/varifyToken');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Save uploaded files to the 'uploads' folder temporarily



router.post("/login", userController.logIn);
router.post("/signUp", userController.signup);
router.post('/getdata', authMiddleware, userController.getUserData);
router.post('/upload', authMiddleware, upload.single('file'), userController.uploadImage);
router.post('/request-password-reset', userController.requestPasswordReset);

router.post('/varify-otp', userController.verifyOTP);
router.post('/reset-pin', userController.resetPassword);


module.exports = router;










