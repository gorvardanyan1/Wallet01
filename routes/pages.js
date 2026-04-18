import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { requireAuth, requireAdmin, requireUser } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const viewsPath = join(__dirname, '..', 'views');

function readHtml(file) {
    return readFileSync(join(viewsPath, file), 'utf8');
}

router.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') {
            return res.redirect('/admin/dashboard');
        } else {
            return res.redirect('/user/transactions');
        }
    }
    res.redirect('/login');
});

router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.send(readHtml('login.html'));
});

router.get('/admin/dashboard', requireAdmin, (req, res) => {
    let html = readHtml('admin/dashboard.html');
    html = html.replace('{{userName}}', `${req.session.user.name} ${req.session.user.lastName}`);
    res.send(html);
});

router.get('/admin/transactions', requireAdmin, (req, res) => {
    let html = readHtml('admin/transactions.html');
    html = html.replace('{{userName}}', `${req.session.user.name} ${req.session.user.lastName}`);
    res.send(html);
});

router.get('/user/transactions', requireUser, (req, res) => {
    let html = readHtml('user/transactions.html');
    html = html.replace('{{userName}}', `${req.session.user.name} ${req.session.user.lastName}`);
    res.send(html);
});

export default router;
