import express from 'express';
import 'dotenv/config';
import sequelize from './config/db.sequelize.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import './models/index.js';
import authRoutes from './router/auth.routes.js';



const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));


const port = process.env.PORT || 3000;

app.use('/api/auth', authRoutes);

async function initDatabase() {
    try {
        console.log('Connecting to DB...');
        await sequelize.authenticate();
        console.log('✅ Database connected');

        console.log('Syncing tables...');
        await sequelize.sync({ alter: true });
        console.log('✅ All tables synced');

    } catch (err) {
        console.error('❌ Database init failed:', err);
        process.exit(1);
    }
}



(async () => {
    await initDatabase();
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
})();