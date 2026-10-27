import cors from 'cors';
import express from 'express';
import {
  contentSecurityPolicy,
  crossOriginOpenerPolicy,
  crossOriginResourcePolicy,
  originAgentCluster,
  referrerPolicy,
  strictTransportSecurity,
  xContentTypeOptions,
  xDnsPrefetchControl,
  xDownloadOptions,
  xFrameOptions,
  xPermittedCrossDomainPolicies,
  xPoweredBy,
  xXssProtection,
} from 'helmet';
import { env } from './config/env.js';
import { apiRoutes } from './routes/api.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

export const app = express();

app.disable('x-powered-by');
app.use(contentSecurityPolicy());
app.use(crossOriginOpenerPolicy());
app.use(crossOriginResourcePolicy());
app.use(originAgentCluster());
app.use(referrerPolicy());
app.use(strictTransportSecurity());
app.use(xContentTypeOptions());
app.use(xDnsPrefetchControl());
app.use(xDownloadOptions());
app.use(xFrameOptions());
app.use(xPermittedCrossDomainPolicies());
app.use(xPoweredBy());
app.use(xXssProtection());
app.use(cors({ origin: env.frontendOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
