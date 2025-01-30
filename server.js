const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors'); // Added CORS middleware
const app = express();
const port = process.env.PORT || 3000;

// Middleware to allow CORS from your Netlify frontend
app.use(cors({
    origin: 'https://resilient-jalebi-11b410.netlify.app/', // Replace with your actual Netlify frontend URL
    credentials: true
}));

// Middleware to parse incoming requests with JSON payloads
app.use(bodyParser.json());

const bcrypt = require('bcryptjs'); // For hashing passwords
const session = require('express-session'); // For session management

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: 'SESSION_SECRET_123', // Replace with a secret
    resave: false,
    saveUninitialized: true,
}));

// Import mongoose library
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://famherygbttb:1234@cluster0.guvsu.mongodb.net/financebuddy_db?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,  // Set the connection timeout to 30 seconds
    serverSelectionTimeoutMS: 30000  // Add this to give the server more time to respond
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));


// Define the route for the root URL
app.get('/', (req, res) => {
    res.send('Backend server is running');
});

// User model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    user_id: { type: Number, required: true, unique: true } // Add this field for unique user_id
});

const User = mongoose.model('User', userSchema);
// Sign up route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ error: 'Username already exists.' });
    }

    // Generate a unique user_id
    const lastUser = await User.findOne().sort({ user_id: -1 }).limit(1); // Get the last user by user_id
    const newUserId = lastUser ? lastUser.user_id + 1 : 1; // Increment the user_id or start at 1

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = new User({ username, password: hashedPassword, user_id: newUserId });
        await user.save();
        res.status(201).json({ message: 'User created successfully!', userId: user._id, userIdNum: newUserId });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error creating user.' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id; // Store MongoDB _id in session
        req.session.userNumId = user.user_id; // Store unique user_id (integer) in session
        res.status(200).json({ message: 'Login successful!' });
    } else {
        res.status(401).json({ error: 'Invalid username or password!' });
    }
});

// Expense model
const expenseSchema = new mongoose.Schema({
    userId: { type: Number, required: true }, // Store the integer user_id
    name: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: Date, required: true },
    category: { type: String, required: true }
});

const Expense = mongoose.model('Expense', expenseSchema);

// POST route for adding expenses
app.post('/expenses', async (req, res) => {
    const { name, price, date, category } = req.body; // Get category from request body
    const userNumId = req.session.userNumId; // Get the user_id (integer) from the session

    if (!userNumId) {
        return res.status(401).json({ error: 'User not authenticated.' });
    }

    const expense = new Expense({
        userId: userNumId, // Use user_id (integer) here
        name,
        price,
        date,
        category // Save the category
    });

    try {
        await expense.save();
        res.status(201).json({ message: 'Expense added successfully!' });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(400).json({ error: 'Failed to add expense.' });
    }
});

// GET route for total expenses
app.get('/total-expenses', async (req, res) => {
    try {
        const userNumId = req.session.userNumId; // Retrieve the user ID from the session

        if (!userNumId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }

        // Aggregate total expenses for the logged-in user
        const totalExpenses = await Expense.aggregate([
            { $match: { userId: userNumId } },  // Match expenses for the logged-in user
            {
                $group: {
                    _id: null,  
                    total: { $sum: "$price" }  // Sum the 'price' field
                }
            }
        ]);

        const total = totalExpenses.length > 0 ? totalExpenses[0].total : 0;  // Ensure we handle cases with no expenses
        res.json({ totalExpenses: total });
    } catch (error) {
        console.error('Error fetching total expenses:', error);
        res.status(500).json({ error: 'Failed to fetch total expenses.' });
    }
});

let needs = [];
let wants = [];


// API to add a need item
app.post('/add-need', (req, res) => {
    const { item } = req.body;
    needs.push(item);
    res.json({ message: 'Need item added successfully', needs });
});

// API to add a want item
app.post('/add-want', (req, res) => {
    const { item } = req.body;
    wants.push(item);
    res.json({ message: 'Want item added successfully', wants });
});

// API to calculate remaining income

app.post('/calculate-remaining', (req, res) => {
    const { monthlyIncome } = req.body;
    const totalNeedsCost = needs.reduce((acc, need) => acc + need.cost, 0);
    const remainingIncome = monthlyIncome - totalNeedsCost;
    res.json({ remainingIncome });
  });

// API to calculate how long it will take to afford want items
app.post('/calculate-priorities', (req, res) => {
    const { remainingIncome } = req.body;
    let result = wants.map(wantItem => {
        const months = Math.ceil(wantItem.cost / remainingIncome);
        return { item: wantItem.name, months };
    });
    res.json({ result });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Update the budget schema to include remainingIncome
const budgetSchema = new mongoose.Schema({
    userId: { type: Number, required: true, unique: true },
    needs: [{ name: String, cost: Number }],
    wants: [{ name: String, cost: Number }],
    remainingIncome: { type: Number, default: 0 }
});

const Budget = mongoose.model('Budget', budgetSchema);

// Save budget data for the current user
app.post('/save-budget', async (req, res) => {
    const userId = req.session.userNumId;
    const { needs, wants, remainingIncome } = req.body;


    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }


    try {
        let budget = await Budget.findOne({ userId });


        if (budget) {
            // Update existing budget
            budget.needs = needs;
            budget.wants = wants;
            budget.remainingIncome = remainingIncome;
        } else {
            // Create a new budget if none exists
            budget = new Budget({ userId, needs, wants, remainingIncome });
        }


        await budget.save();
        res.status(200).json({ message: 'Budget saved successfully' });
    } catch (error) {
        console.error('Error saving budget:', error);
        res.status(500).json({ error: 'Failed to save budget' });
    }
});


// Load budget data for the current user
app.get('/load-budget', async (req, res) => {
    const userId = req.session.userNumId;


    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }


    try {
        const budget = await Budget.findOne({ userId });
        if (budget) {
            res.json({
                needs: budget.needs,
                wants: budget.wants,
                remainingIncome: budget.remainingIncome
            });
        } else {
            res.json({ needs: [], wants: [], remainingIncome: 0 });
        }
    } catch (error) {
        console.error('Error loading budget:', error);
        res.status(500).json({ error: 'Failed to load budget' });
    }
});
