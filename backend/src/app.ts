import cors from 'cors';
import express from 'express';
import * as helmet from 'helmet';
import { env } from './config/env.js';
import { apiRoutes } from './routes/api.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet.default());
app.use(cors({ origin: env.frontendOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
