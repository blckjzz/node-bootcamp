const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/ToursRoutes');
const userRouter = require('./routes/UsersRoutes');
const reviewRouter = require('./routes/ReviewRoutes');

const { whitelist } = require('validator');

// 1) global MIDDLEWARES
const app = express();
// set security HTTP
app.use(helmet());

// "message": "It appears you have done something like `app.use(helmet)`, but it should be `app.use(helmet())`.",

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

// serving static files
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

// // const { error } = require('console');
// const express = require('express');
// const appError = require('./utils/appError');
// const globalErrorHandler = require('./controllers/errorController');

// const app = express();

// const morgan = require('morgan');

// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// app.use(express.json());
// app.use(express.static(`${__dirname}/public`));

// // app.use((request, respose, next) => {
// //   request.requested_at = new Date().toISOString();
// //   next();
// // });

// // console.log(toursData);

// const toursRouter = require('./routes/ToursRoutes');
// const usersRouter = require('./routes/UsersRoutes');
// const AppError = require('./utils/appError');

// app.use('/api/v1/users', usersRouter);
// app.use('/api/v1/tours', toursRouter);
// app.all('*', (req, res, next) => {
//   next(
//     new AppError(
//       `resource ${req.originalUrl} not available in this server.`,
//       404,
//     ),
//   );
// });

// app.use(globalErrorHandler);

// module.exports = app;
