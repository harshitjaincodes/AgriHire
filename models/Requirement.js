const mongoose = require("mongoose");

const requirementSchema = new mongoose.Schema({
    farmerId: {
        type: String,
        required: true
    },
    activity: {
        type: String,
        required: true,
        enum: [
            "Land Preparation",
            "Sowing",
            "Irrigation",
            "Spraying",
            "Harvesting"
        ]
    },
    equipmentRequired: {
        type: String,
        required: true,
        enum: [
            "Tractor",
            "Harrow",
            "Cultivator",
            "Rotavator",
            "Seed Drill",
            "Plough",
            "Digger",
            "Harvester"
        ]
    },
    farmArea: {
        type: Number,
        required: true,
        min: 0
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    requiredFrom: {
        type: String,
        required: true
    },
    requiredUntil: {
        type: String,
        required: true
    },
    additionalRequirements: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Requirement", requirementSchema);
