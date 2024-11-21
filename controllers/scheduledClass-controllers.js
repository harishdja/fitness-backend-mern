const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const ScheduledClass = require("../models/scheduledClass"); 
const Trainer = require("../models/trainer");


const getSchedulesByTrainerId = async (req, res, next) => {
  const userId = req.query.trainerId;

  // let places;
  let trainerWithSchedules;
  try {
    trainerWithSchedules = await Trainer.findById(userId).populate("schedules");
  } catch (err) {
    const error = new HttpError(
      "Fetching schedules failed, please try again later",
      500
    );
    return next(error);
  }
 
  if (!trainerWithSchedules || trainerWithSchedules.schedules.length === 0) {
    return next(
      new HttpError("Could not find schedules for the provided trainer id.", 404)
    );
  }

  res.json({
    schedules: trainerWithSchedules.schedules.map((schedule) =>
      schedule.toObject({ getters: true })
    ),
  });
};

const deleteScheduledClass = async (req, res, next) => {
  const scheduledClassId = req.query.scheduleId;
  console.log(req.query)
  let scheduledClass;
  try {
    scheduledClass = await ScheduledClass.findById(scheduledClassId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete scheduledClass.",
      500
    );
    return next(error);
  }

  if (!scheduledClass) {
    const error = new HttpError(
      "Could not find scheduledClass for this id.",
      404
    );
    return next(error);
  }

  try {

    const sess = await mongoose.startSession();
    sess.startTransaction();
    await scheduledClass.remove({ session: sess });
    scheduledClass.creator.schedules.pull(scheduledClass);
    await scheduledClass.creator.save({ session: sess });
    await sess.commitTransaction();

  } catch (err) {
    console.log(err)
    const error = new HttpError(
      "Something went wrong, could not delete scheduledClass.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted scheduledClass." });
};

const updateScheduledClass = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { date, schedules,scheduleId } = req.body;

  let schedule;
  try {
    schedule = await ScheduledClass.findById(scheduleId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update schedules.",
      500
    );
    return next(error);
  }

  schedule.date = date;
  schedule.schedules = schedules;

  try {
    await schedule.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update schedules.",
      500
    );
    return next(error);
  }

  res.status(200).json({ schedule: schedule.toObject({ getters: true }) });
};




///       Upcoming API that will be used for filtering


const createScheduledClasses = async (req, res, next) => {
  const scheduledClass = req.body;
  let createdScheduledClass;
  try {
    createdScheduledClass = await ScheduledClass.insertMany(scheduledClass);
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again.", 500);
    return next(error);
  }
  res.status(201).json({ scheduledClass: createdScheduledClass });
};

const getAllScheduledClass = async (req, res, next) => {
  let scheduledClass;
  try {
    scheduledClass = await ScheduledClass.find();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!scheduledClass) {
    const error = new HttpError(
      "Could not find a scheduledClass for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ scheduledClass: scheduledClass });
};

const getScheduledClassByName = async (req, res, next) => {
  const name = req.params.pid;
  console.log(name);
  let scheduledClass;
  try {
    scheduledClass = await ScheduledClass.find({
      name: { $regex: name, $options: "i" },
    });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!scheduledClass) {
    const error = new HttpError(
      "Could not find a scheduledClass for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ scheduledClass: scheduledClass });
};

const getScheduledClassByExpertise = async (req, res, next) => {
  const expertise = req.query.expertise;
  console.log(expertise);
  let scheduledClass;
  try {
    scheduledClass = await ScheduledClass.find({
      expertise: { $regex: expertise, $options: "i" },
    });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!scheduledClass) {
    const error = new HttpError(
      "Could not find a scheduledClass for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ scheduledClass: scheduledClass });
};

const createScheduledClass = async (req, res, next) => {
  const { trainerId, type, date,duration, schedules, capacity } = req.body;

  const createdScheduledClass = new ScheduledClass({
    classType:type,
    duration,
    date,
    schedules:schedules,
    capacity,
    availableSpots: capacity,
    creator: trainerId,
  });

  let trainer;
  try {
    trainer = await Trainer.findById(trainerId);
  } catch (err) {
    const error = new HttpError(
      "Creatings schedule class failed, please try again",
      500
    );
    return next(error);
  }

  if (!trainer) {
    const error = new HttpError("Could not find trainer for provided id", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdScheduledClass.save({ session: sess });
    trainer.schedules.push(createdScheduledClass.id);
    await trainer.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating schedule class failed, please try again",
      500
    );
    return next(error);
  }
  res.status(201).json({
    scheduledClass: createdScheduledClass.toObject({ getters: true }),
  });
};







exports.createScheduledClass = createScheduledClass;
exports.getScheduledClassByExpertise = getScheduledClassByExpertise;
exports.getScheduledClassByName = getScheduledClassByName;
exports.getAllScheduledClass = getAllScheduledClass;
exports.getSchedulesByTrainerId = getSchedulesByTrainerId;
exports.updateScheduledClass = updateScheduledClass;
exports.deleteScheduledClass = deleteScheduledClass;
