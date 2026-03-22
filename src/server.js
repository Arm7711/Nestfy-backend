import express from 'express';
import dotenv from 'dotenv';
import sequelize, { connectDB } from './config/db.sequelze';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('ESM Server with Sequelize is active!');
});

const startServer = async () => {
    try {
        await connectDB();

        await sequelize.sync();
        console.log('✅ Database synchronized.');

        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server failed to start:', error);
    }
};

startServer();
