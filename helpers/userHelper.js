// Example implementation of createUserObj in a helper file
function createUserObj(req) {
    // Logic to create and return a user object based on req.body or other data
    const newUser = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone,
        address: req.body.address,
        imageUrl: req.body.imageUrl
        // Additional fields as needed
    };
    return newUser;
}

module.exports = { createUserObj };
