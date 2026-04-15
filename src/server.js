import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {globalLimiter} from './middleware/rate.limitter.js';
import {errorHandler, notFoundHandler} from './middleware/errorHandler.middleware.js';
import authRoutes from './routes/auth.routes.js';
import {sequelize} from './models/index.js';
import {validateEnv} from './config/env.js';
import 'dotenv/config';

validateEnv();

const app = express();

app.use(helmet());

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    })
);

app.set('trust proxy', 1);

app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: false, limit: '10kb'}));
app.use(cookieParser());

app.use(globalLimiter);

app.use('/api/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('[DB] Connection established.');


        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync();
            console.log('[DB] Schema synced.');
        }

        app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
    } catch (err) {
        console.error('[Server] Failed to start:', err);
        process.exit(1);
    }
};

start();

export default app;