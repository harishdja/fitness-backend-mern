const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    date: { type: String, required: true },
    status: { type: String, required: true },
    confirmationNotificationSent:{ type: Boolean, required: true },
    scheduledClassId: { type: mongoose.Types.ObjectId, required: true,ref:'Schedule' },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'Member'}
});

module.exports = mongoose.model('Booking', bookingSchema);