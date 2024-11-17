const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');


const trainerRoutes = require('./routes/trainer-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

app.use('/api/trainer', trainerRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

mongoose
  .connect('mongodb+srv://harishdja:USkPmjYJbb9jK3b7@cluster0.q0a7s.mongodb.net/fitnesssystemdb?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('connection success')
    app.listen(5001);
  })
  .catch(err => {
    console.log(err);
  });

