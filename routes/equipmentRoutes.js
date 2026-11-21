
const express = require("express");
const router = express.Router();

const Equipment = require("../models/Equipment");

// CREATE - Add new equipment
router.post("/", async (req, res) => {
    try {
        const equipment = await Equipment.create(req.body);

        res.status(201).json({
            success: true,
            message: "Equipment added successfully",
            data: equipment
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// READ - Get all equipment
router.get("/", async (req, res) => {
    try {
        const equipment = await Equipment.find();

        res.json({
            success: true,
            count: equipment.length,
            data: equipment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// READ - Get equipment by ID
router.get("/:id", async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        res.json({
            success: true,
            data: equipment
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid equipment ID"
        });
    }
});

// UPDATE - Update equipment
router.put("/:id", async (req, res) => {
    try {
        const equipment = await Equipment.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        res.json({
            success: true,
            message: "Equipment updated successfully",
            data: equipment
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE - Delete equipment
router.delete("/:id", async (req, res) => {
    try {
        const equipment = await Equipment.findByIdAndDelete(req.params.id);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        res.json({
            success: true,
            message: "Equipment deleted successfully"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid equipment ID"
        });
    }
});

module.exports = router;
