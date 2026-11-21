const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    equipmentId: {
        type: String,
        required: true
    },
    equipmentName: {
        type: String,
        required: true
    },
    equipmentImage: {
    type: String,
    default: ""
},
    ownerId: {
        type: String,
        required: true
    },
    farmerId: {
        type: String,
        required: true
    },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    },
    durationType: {
        type: String,
        required: true
    },
    units: {
        type: Number,
        required: true
    },
    unitPrice: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: "pending"
    },
    updatedAt: {
    type: Date,
    default: null
},
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Booking", bookingSchema);
