import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const users = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'users.json'), 'utf8'));

router.post('/login', (req, res) => {
    const { login, password } = req.body;

    const user = users.find(u => u.login === login);

    if (!user) {
        return res.status(401).send('Invalid credentials');
    }

    const isValid = bcrypt.compareSync(password, user.hashedPassword);

    if (!isValid) {
        return res.status(401).send('Invalid credentials');
    }

    req.session.user = {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        login: user.login,
        role: user.role
    };

    if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    } else {
        return res.redirect('/user/transactions');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

export default router;
