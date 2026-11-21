const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true,
        trim: true
    },

    lastName: {
        type: String,
        required: true,
        trim: true
    },

    mobile: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    location: {
        type: String,
        required: true,
        trim: true
    },

    roles: {
        type: [{
            type: String,
            enum: ["farmer", "owner"]
        }],
        required: true,
        validate: {
            validator: roles => roles.length > 0,
            message: "At least one role is required."
        }
    },

    language: {
        type: String,
        enum: ["English", "हिंदी"],
        required: true
    },

    passwordHash: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("User", userSchema);
