const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Booking = require("../models/bookings");
const Schedule = require("../models/scheduledClass"); 
 
const Member = require("../models/member");

const createBookedClass = async (req, res, next) => {
  const {
    scheduleId,
    date,
    classType,
    duration,
    time, 
    confirmationNotificationSent,
    memberId,
  } = req.body;

  const createdBookedClass = new Booking({
    scheduleId,
    date,
    classType,
    duration,
    time,
    status:"confirmed",
    confirmationNotificationSent,
    creator: memberId,
  });

  let schedule;
  let member;
  try {
    schedule = await Schedule.findById(scheduleId);
  } catch (err) {
    const error = new HttpError(
      "Creatings booking class failed, please try again",
      500
    );
    return next(error);
  }
  try {
    member = await Member.findById(memberId);
  } catch (err) {
    const error = new HttpError(
      "Creatings booking class failed, please try again",
      500
    );
    return next(error);
  }

  if (!schedule) {
    const error = new HttpError("Could not find schedule for provided schedule id", 404);
    return next(error);
  }
  

  if (!member) {
    const error = new HttpError("Could not find member for provided member id", 404);
    return next(error);
  }
  if(schedule.availableSpots===0)
  {
    const error = new HttpError("Could not book seats, seats are booked", 404);
    return next(error);
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdBookedClass.save({ session: sess });
    schedule.bookings.push(createdBookedClass.id);
    member.bookings.push(createdBookedClass.id);
    schedule.availableSpots=schedule.availableSpots-1
    await schedule.save({ session: sess });
    await member.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating booking class failed, please try again",
      500
    );
    return next(error);
  }
  res.status(201).json({
    bookedClass: createdBookedClass.toObject({ getters: true }),
  });
};

const getBookingsByMemberId = async (req, res, next) => {
  const userId = req.query.memberId;

  // let places;
  let memberWithBookings;
  try {
    memberWithBookings = await Member.findById(userId).populate("bookings");
  } catch (err) {
    const error = new HttpError(
      "Fetching bookings failed, please try again later",
      500
    );
    return next(error);
  }

  if (!memberWithBookings || memberWithBookings.bookings.length === 0) {
    return next(
      new HttpError(
        "Could not find bookings for the provided schedule id.",
        404
      )
    );
  }

  res.json({
    bookings: memberWithBookings.bookings.map((schedule) =>
      schedule.toObject({ getters: true })
    ),
  });
};

const deleteBookedClass = async (req, res, next) => {
  const bookedClassId = req.query.bookingId;
  console.log(req.query);
  let bookedClass;
  try {
    bookedClass = await Booking.findById(bookedClassId).populate("creator");
    bookedClassSchedule= await Booking.findById(bookedClassId).populate("scheduleId");
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      "Something went wrong, could not delete bookedClass.",
      500
    );
    return next(error);
  }

  if (!bookedClass) {
    const error = new HttpError("Could not find bookedClasss for this id.", 404);
    return next(error);
  }

  if (!bookedClassSchedule) {
    const error = new HttpError("Could not find bookedClass for this id.", 404);
    return next(error);
  }
 
  try {
    console.log('bookedClass',bookedClass)
    console.log('bookedClassSchedule',bookedClassSchedule)
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await bookedClass.remove({ session: sess });
    bookedClass.creator.bookings.pull(bookedClass);
    bookedClassSchedule.scheduleId.bookings.pull(bookedClass);
    bookedClassSchedule.scheduleId.availableSpots=bookedClassSchedule.scheduleId.availableSpots+1
    bookedClassSchedule.scheduleId.save({ session: sess })
    await bookedClass.creator.save({ session: sess });
    await bookedClass.save({ session: sess })
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not delete bookedClass.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted bookedClass." });
};

const updateBookedClass = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { date, bookings, scheduleId } = req.body;

  let schedule;
  try {
    schedule = await Booking.findById(scheduleId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update bookings.",
      500
    );
    return next(error);
  }

  schedule.date = date;
  schedule.bookings = bookings;

  try {
    await schedule.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update bookings.",
      500
    );
    return next(error);
  }

  res.status(200).json({ schedule: schedule.toObject({ getters: true }) });
};

///       Upcoming API that will be used for filtering

const createBookedClasses = async (req, res, next) => {
  const bookedClass = req.body;
  let createdBookedClass;
  try {
    createdBookedClass = await Booking.insertMany(bookedClass);
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again.", 500);
    return next(error);
  }
  res.status(201).json({ bookedClass: createdBookedClass });
};

const getAllBookedClass = async (req, res, next) => {
  let bookedClass;
  try {
    bookedClass = await Booking.find();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!bookedClass) {
    const error = new HttpError(
      "Could not find a bookedClass for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ bookedClass: bookedClass });
};

const getBookedClassByName = async (req, res, next) => {
  const name = req.params.pid;
  console.log(name);
  let bookedClass;
  try {
    bookedClass = await Booking.find({
      name: { $regex: name, $options: "i" },
    });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!bookedClass) {
    const error = new HttpError(
      "Could not find a bookedClass for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ bookedClass: bookedClass });
};

const getBookedClassByExpertise = async (req, res, next) => {
  const expertise = req.query.expertise;
  console.log(expertise);
  let bookedClass;
  try {
    bookedClass = await Booking.find({
      expertise: { $regex: expertise, $options: "i" },
    });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!bookedClass) {
    const error = new HttpError(
      "Could not find a bookedClass for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ bookedClass: bookedClass });
};

exports.createBookedClass = createBookedClass;
exports.getBookedClassByExpertise = getBookedClassByExpertise;
exports.getBookedClassByName = getBookedClassByName;
exports.getAllBookedClass = getAllBookedClass;
exports.getBookingsByMemberId = getBookingsByMemberId;
exports.updateBookedClass = updateBookedClass;
exports.deleteBookedClass = deleteBookedClass;
