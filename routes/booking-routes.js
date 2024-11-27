const express = require('express');
const { check } = require('express-validator');

const bookingClassControllers = require('../controllers/bookings-controller');

const router = express.Router();


router.get('/getAllBookings/', bookingClassControllers.getBookingsByMemberId);

router.post(
  '/bookClass',
  bookingClassControllers.createBookedClass
);

router.delete('/deleteBooking', bookingClassControllers.deleteBookedClass);
module.exports = router;