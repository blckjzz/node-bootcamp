const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/ToursRoutes');
const userRouter = require('./routes/UsersRoutes');
const reviewRouter = require('./routes/ReviewRoutes');
const viewRouter = require('./routes/ViewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const { whitelist } = require('validator');

// 1) global MIDDLEWARES
const app = express();
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
} else {
  app.set('trust proxy', false);
}

app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://api.mapbox.com',
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com',
        'https://unpkg.com',
        'https://js.stripe.com', // Corrigido, removido "/v3/"
      ],
      styleSrc: [
        "'self'",
        'https://api.mapbox.com',
        'https://fonts.googleapis.com',
        'https://unpkg.com',
        "'unsafe-inline'",
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://api.mapbox.com'],
      connectSrc: [
        "'self'",
        'https://api.mapbox.com',
        'https://api.stripe.com', // Adicionado para permitir conexões com a API do Stripe
        'https://r.stripe.com', // 🔥 Adicionado Stripe Analytics
        'http://127.0.0.1',
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'ws://localhost:*', // Permite WebSockets para desenvolvimento
      ],
      frameSrc: [
        "'self'",
        'https://js.stripe.com',
        'https://checkout.stripe.com', // Adicionado para permitir iframes do Stripe
      ],
    },
  }),
);

app.use(
  cors({
    // origin: 'http://127.0.0.1:3000', // A origem do seu front-end
    credentials: true, // Permite que cookies sejam enviados
  }),
);

app.options('*', cors());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// rate limitation
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // one hour
  message: 'Too many requests from the same IP.',
});
// body parser  --- limitation
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// protecting nosql injection and XSSR
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);
// limits every route under /api
app.use('/api', limiter);
app.use(compression());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
