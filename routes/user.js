const express = require("express");
const router = express.Router();
const User = require('../models/user');
const Blog = require('../models/blog');
const { createHmac } = require('crypto');
const { createTokenForUser } = require('../services/auth');
const checkAuthenticationCookie =require('../middleware/authetication')

// Home Route
router.get('/', checkAuthenticationCookie('token'), async (req, res) => {
    const blogs = await Blog.find().populate("createdBy").sort({createdAt:-1});
    res.render('home.ejs', {
        
        user: req.user,
        blogs
    });
});

// Login Route
router.get('/login', (req, res) => {
    res.render('login.ejs');
});

// Signup Route
router.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('login.ejs', { error: "Email not found" });
        }

        const salt = user.salt;
        const hashedPassword = createHmac('sha256', salt).update(password).digest('hex');
        if (user.password !== hashedPassword) {
            return res.render('login.ejs', { error: "Incorrect email or password" });
        }

        const token = createTokenForUser(user);
        return res.cookie('token', token).redirect('/');
    } catch (error) {
        return res.render('login.ejs', { error: "Incorrect email or password" });
    }
});

router.post('/signup', async (req, res) => {

  

    const { fullName, email, password } = req.body;

    try {

         // Check if the email already exists
   const existingUser = await User.findOne({ email });

   if (existingUser) {
       // Email already exists, render signup page with error
       return res.render('signup.ejs', { error: "User already exists with this email" });
   }

   // If email is not taken, proceed to create new user
        const newUser = new User({
            fullName,
            email,
            password
        });

        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        return res.render('signup.ejs', { error: "User already exists with this email" });
    }
});

// Logout Route
router.get("/logout", (req, res) => {
    res.clearCookie('token').redirect('/');
});

module.exports = router;
