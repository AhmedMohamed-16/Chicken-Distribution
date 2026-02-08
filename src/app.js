const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); 


require('dotenv').config();

const routes = require('./routes'); 
const AppError = require('./utils/app-error.utility');
const errorHandleMiddleware = require('./middleware/error-handle.middleware');

const app = express();


// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
  methods:['GET','POST','PUT','DELETE','PATCH'],
  allowedOrigns:['content-type','Authorization'] 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));


 
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp:  new Date().toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }) });
});

app.use('/api', routes);

// 404 handler
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(errorHandleMiddleware);

module.exports = app;