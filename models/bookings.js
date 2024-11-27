const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    classType: { type: String, required: true },
    duration:{ type: String, required: true },
    date: { type: String, required: true },
    time:{ type: String, required: true },
    status: { type: String, required: true },
    confirmationNotificationSent:{ type: Boolean, required: true },
    scheduleId: { type: mongoose.Types.ObjectId, required: true,ref:'ScheduledClass' },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'Member'}
});

module.exports = mongoose.model('Booking', bookingSchema);