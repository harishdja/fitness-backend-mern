const express = require('express');
const { check } = require('express-validator');

const scheduledClassesControllers = require('../controllers/scheduledClass-controllers');

const router = express.Router();


router.get('/getAllSchedules/', scheduledClassesControllers.getSchedulesByTrainerId);

router.post(
  '/',
  scheduledClassesControllers.createScheduledClass
);



router.patch(
  '/updateSchedule/',
  // [
  //   check('date')
  //     .not()
  //     .isEmpty(),
  //     check('scheduleId')
  //     .not()
  //     .isEmpty(),
  //   check('description').isLength({ min: 5 })
  // ],
  scheduledClassesControllers.updateScheduledClass
);

router.delete('/deleteSchedule', scheduledClassesControllers.deleteScheduledClass);

// Upcoming scheduled class APIs

router.post(
    '/createScheduledClasss',
    scheduledClassesControllers.createScheduledClass
  );
  

  router.get('/getAllScheduledClasss', scheduledClassesControllers.getAllScheduledClass);

  router.get('/search', (req, res, next) => {
    const { expertise, name } = req.query;

    if (expertise) {
        return scheduledClassesControllers.getScheduledClassByExpertise(req, res, next);
    } else if (name) {
        return scheduledClassesControllers.getScheduledClassByName(req, res, next);
    } else {
        res.status(400).send('Bad Request: Missing required query parameters');
    }
});

module.exports = router;
