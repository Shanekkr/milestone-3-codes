const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql');
const bcrypt = require('bcrypt'); // Import bcrypt

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL Connection
const db = mysql.createConnection({
    host: 'db4free.net',
    user: 'shanekkr',
    password: 'whitesmoke77',
    database: 'c237_projectlib'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database.');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Dummy data to simulate the total amount (in a real app, this would come from a database)
let totalAmount = 0;
let transactions = [];

// Define your routes
app.get('/', (req, res) => {
    res.render('welcome');
});

app.get('/welcome', (req, res) => {
    res.render('welcome');
});

app.get('/create-account', (req, res) => {
    res.render('create-account');
});

app.post('/create-account', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(query, [name, email, hashedPassword], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server error');
            }
            res.redirect('/login');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                // Successful login
                res.redirect('/');
            } else {
                res.status(400).send('Invalid credentials');
            }
        } else {
            res.status(400).send('User not found');
        }
    });
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/subscription', (req, res) => {
    res.render('subscription');
});


app.get('/purchase/:plan', (req, res) => {
    const plan = req.params.plan;
    let price;

    switch (plan) {
        case 'basic':
            price = 10;
            break;
        case 'standard':
            price = 20;
            break;
        case 'enterprise':
            price = 40;
            break;
        default:
            res.status(400).send('Invalid plan');
            return;
    }

    if (totalAmount >= price) {
        totalAmount -= price;
        transactions.push({ type: 'Purchase', plan: plan.charAt(0).toUpperCase() + plan.slice(1), amount: price.toFixed(2), date: new Date().toLocaleString() });
        res.redirect('/wallet');
    } else {
        res.status(400).send('Insufficient funds');
    }
});

app.get('/subscription1', (req, res) => {
    res.render('subscription1');
});

app.get('/wallet', (req, res) => {
    res.render('wallet', { totalAmount: totalAmount.toFixed(2) });
});

app.get('/topup', (req, res) => {
    res.render('topup');
});

app.post('/topup', (req, res) => {
    const amount = parseFloat(req.body.amount);
    if (!isNaN(amount) && amount > 0) {
        totalAmount += amount;
        transactions.push({ type: 'Top Up', amount: amount.toFixed(2), date: new Date().toLocaleString() });
    }
    res.redirect('/wallet');
});

app.get('/withdraw', (req, res) => {
    res.render('withdraw');
});

app.post('/withdraw', (req, res) => {
    const amount = parseFloat(req.body.amount);
    if (!isNaN(amount) && amount > 0 && amount <= totalAmount) {
        totalAmount -= amount;
        transactions.push({ type: 'Withdraw', amount: amount.toFixed(2), date: new Date().toLocaleString() });
    }
    res.redirect('/wallet');
});

app.get('/transactions', (req, res) => {
    res.render('transactions', { transactions: transactions });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
