import { Router } from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const dataPath = join(__dirname, '..', 'data');

function getUsers() {
    return JSON.parse(readFileSync(join(dataPath, 'users.json'), 'utf8'));
}

function getTransactions() {
    return JSON.parse(readFileSync(join(dataPath, 'transactions.json'), 'utf8'));
}

function saveTransactions(transactions) {
    writeFileSync(join(dataPath, 'transactions.json'), JSON.stringify(transactions, null, 2));
}

router.get('/user/transactions', requireAuth, (req, res) => {
    const transactions = getTransactions();
    const userTransactions = transactions.filter(t => t.userId === req.session.user.id);
    res.json(userTransactions);
});

router.get('/admin/users', requireAdmin, (req, res) => {
    const users = getUsers();
    const sanitizedUsers = users.map(u => ({
        id: u.id,
        name: u.name,
        lastName: u.lastName,
        year: u.year,
        login: u.login,
        role: u.role
    }));
    res.json(sanitizedUsers);
});

router.get('/admin/transactions', requireAdmin, (req, res) => {
    const transactions = getTransactions();
    res.json(transactions);
});

router.post('/admin/transactions', requireAdmin, (req, res) => {
    const { userId, amount, type, description, date, status } = req.body;
    
    if (!userId || !amount || !type || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const transactions = getTransactions();
    
    const newTransaction = {
        id: uuidv4(),
        userId,
        amount: parseFloat(amount),
        type,
        description: description || '',
        date,
        status: status || 'pending'
    };

    transactions.push(newTransaction);
    saveTransactions(transactions);

    res.status(201).json(newTransaction);
});

router.get('/admin/dashboard-data', requireAdmin, (req, res) => {
    const transactions = getTransactions();
    const users = getUsers();

    const monthlyData = {};
    transactions.forEach(t => {
        const month = t.date.substring(0, 7);
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expense: 0 };
        }
        if (t.amount > 0) {
            monthlyData[month].income += t.amount;
        } else {
            monthlyData[month].expense += Math.abs(t.amount);
        }
    });

    const usersByRole = {
        admin: users.filter(u => u.role === 'admin').length,
        user: users.filter(u => u.role === 'user').length
    };

    res.json({
        monthlyData,
        usersByRole,
        totalTransactions: transactions.length,
        totalUsers: users.length
    });
});

export default router;
