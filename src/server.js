import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import  http from "http";
import { Server }      from 'socket.io';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import {globalLimiter} from './middleware/rate.limitter.js';
import {errorHandler, notFoundHandler} from './middleware/errorHandler.middleware.js';
import {sequelize} from './models/Common/index.js';
import {validateEnv} from './config/env.js';
import {registerChatSocket} from "./sockets/chat.sockets.js";
import routes from "./routes/index.js";
import 'dotenv/config';

validateEnv();

const app = express();
const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

app.set('io', io);


app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    })
);

app.set('trust proxy', 1);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: false, limit: '10kb'}));
app.use(cookieParser());

app.use(globalLimiter);

app.use('/api', routes)

registerChatSocket(io);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('[DB] Connection established.');


        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('[DB] Schema synced.');
        }

        app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
    } catch (err) {
        console.error('[Server] Failed to start:', err);
        process.exit(1);
    }
};

start();

export { io };
