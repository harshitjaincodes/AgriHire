const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const Equipment = require("./models/Equipment");
const Booking = require("./models/Booking");
const User = require("./models/User");
const Requirement = require("./models/Requirement");
const RequirementResponse = require("./models/RequirementResponse");

const equipmentRoutes = require("./routes/equipmentRoutes");

require("dotenv").config();
const session = require("express-session");

const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");

const app = express();
const PORT = 3000;

const dataDirectory = path.join(__dirname, "data");
const usersFile = path.join(dataDirectory, "users.json");

const multer = require("multer");

const imagesDirectory = path.join(__dirname, "images");

const imageStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        fs.mkdir(imagesDirectory, { recursive: true })
            .then(() => callback(null, imagesDirectory))
            .catch(callback);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `equipment-${Date.now()}${extension}`);
    }
});

const upload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new Error("Only JPG, PNG, and WebP images are allowed."));
        }
    }
});


app.use(express.json());
app.use("/api/mongo/equipment", equipmentRoutes);
app.use(session({
    name: "agrihire.admin.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 1000
    }
}));
app.get("/pages/admin-dashboard.html", (req, res, next) => {
    if (!req.session || req.session.isAdmin !== true) {
        return res.redirect("/pages/admin-login.html");
    }

    res.sendFile(path.join(__dirname, "pages", "admin-dashboard.html"));
});

app.use(express.static(__dirname));
app.use(express.static(__dirname));

// Test the backend
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "AgriHire backend is running!"
    });
});

// Register a new user

app.post("/api/signup", async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            mobile,
            email,
            location,
            roles,
            language,
            password
        } = req.body;

        // Validate required fields
        if (
            !firstName?.trim() ||
            !lastName?.trim() ||
            !mobile ||
            !email ||
            !location?.trim() ||
            !Array.isArray(roles) ||
            roles.length === 0 ||
            !password
        ) {
            return res.status(400).json({
                message: "Please complete all required fields."
            });
        }

        // Validate mobile number
        if (!/^[0-9]{10}$/.test(mobile)) {
            return res.status(400).json({
                message: "Mobile number must contain 10 digits."
            });
        }

        // Validate email
        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        // Validate password
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        // Validate roles
        if (
            !roles.every(role => ["farmer", "owner"].includes(role)) ||
            new Set(roles).size !== roles.length
        ) {
            return res.status(400).json({
                message: "Please select a valid account role."
            });
        }

        // Validate language
        if (!["English", "हिंदी"].includes(language)) {
            return res.status(400).json({
                message: "Please select a valid language."
            });
        }

        // Check existing account in MongoDB
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { mobile }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email or mobile already exists."
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create new user in MongoDB
        const newUser = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            mobile,
            email: normalizedEmail,
            location: location.trim(),
            roles,
            language,
            passwordHash
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully!"
        });

    } catch (error) {
        console.error("Signup error:", error);

        // Handle duplicate unique-index errors
        if (error.code === 11000) {
            return res.status(409).json({
                message: "An account with this email or mobile already exists."
            });
        }

        return res.status(500).json({
            message: "Unable to create account right now."
        });
    }
});



app.post("/api/login", async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (
            typeof identifier !== "string" ||
            !identifier.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                message: "Email/mobile and password are required."
            });
        }

        const input = identifier.trim().toLowerCase();

        // Find user in MongoDB using email or mobile
        const user = await User.findOne({
            $or: [
                { email: input },
                { mobile: input }
            ]
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email/mobile or password."
            });
        }

        // Compare entered password with stored hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email/mobile or password."
            });
        }

        // Regenerate session after successful login
        req.session.regenerate((sessionError) => {
            if (sessionError) {
                console.error("Session error:", sessionError);
                return res.status(500).json({
                    message: "Unable to create login session."
                });
            }

            req.session.user = {
                id: String(user._id),
                firstName: user.firstName,
                email: user.email,
                roles: user.roles
            };

            req.session.save((saveError) => {
                if (saveError) {
                    console.error("Session save error:", saveError);
                    return res.status(500).json({
                        message: "Unable to save login session."
                    });
                }

                return res.json({
                    success: true,
                    message: "Login successful!",
                    user: {
                        firstName: user.firstName,
                        email: user.email,
                        roles: user.roles
                    }
                });
            });
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Unable to login right now."
        });
    }
});




app.post("/api/forgot-password", async (req, res) => {
    try {
        const { email, mobile, newPassword } = req.body;

        if (
            typeof email !== "string" ||
            typeof mobile !== "string" ||
            typeof newPassword !== "string"
        ) {
            return res.status(400).json({
                message: "Please provide all required details."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedMobile = mobile.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Enter a valid email address."
            });
        }

        if (!/^[0-9]{10}$/.test(normalizedMobile)) {
            return res.status(400).json({
                message: "Enter a valid 10-digit mobile number."
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        // Find user in MongoDB
        const user = await User.findOne({
            email: normalizedEmail,
            mobile: normalizedMobile
        });

        if (!user) {
            return res.status(400).json({
                message: "Email and mobile number do not match our records."
            });
        }

        // Hash the new password
        user.passwordHash = await bcrypt.hash(newPassword, 10);

        // Save updated password in MongoDB
        await user.save();

        console.log("Password reset completed for:", normalizedEmail);

        return res.json({
            success: true,
            message: "Password reset successfully."
        });

    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            message: "Unable to reset password."
        });
    }
});


const equipmentFile = path.join(dataDirectory, "equipment.json");
const requirementsFile = path.join(dataDirectory, "requirements.json");


app.post("/api/equipment", upload.single("equipmentImage"), async (req, res) => {
    if (
        !req.session?.user ||
        !req.session.user.roles.includes("owner")
    ) {
        return res.status(401).json({
            message: "Please log in as an equipment owner."
        });
    }

    try {
        const {
            category,
            equipmentName,
            model,
            description,
            location,
            hourlyPrice,
            dailyPrice,
            weeklyPrice,
            tenDayPrice,
            specialOffer
        } = req.body;

        const allowedCategories = [
            "Tractor", "Harrow", "Cultivator", "Rotavator",
            "Seed Drill", "Plough", "Bund Former", "Digger",
            "Sprayer", "Thresher", "Harvester","Reaper",
    "Potato Equipment","Seeder"
        ];

        if (
            !allowedCategories.includes(category) ||
            typeof equipmentName !== "string" ||
            !equipmentName.trim() ||
            equipmentName.trim().length > 100 ||
            typeof location !== "string" ||
            !location.trim() ||
            location.trim().length > 150
        ) {
            return res.status(400).json({
                message: "Please provide a valid category, equipment name, and location."
            });
        }

        for (const [field, value, limit] of [
            ["model", model, 100],
            ["description", description, 2000],
            ["specialOffer", specialOffer, 200]
        ]) {
            if (value !== undefined && value.length > limit) {
                return res.status(400).json({
                    message: `Invalid ${field}.`
                });
            }
        }

        function parsePrice(value, field) {
            if (value === undefined || value === "") return null;

            const price = Number(value);

            if (!Number.isFinite(price) || price < 0) {
                throw new Error(`Please enter a valid ${field}.`);
            }

            return price;
        }

        const prices = {
            hourlyPrice: parsePrice(hourlyPrice, "hourly price"),
            dailyPrice: parsePrice(dailyPrice, "daily price"),
            weeklyPrice: parsePrice(weeklyPrice, "weekly price"),
            tenDayPrice: parsePrice(tenDayPrice, "10-day price")
        };

       const newEquipment = await Equipment.create({
    ownerId: req.session.user.id,
    category,
    equipmentName: equipmentName.trim(),
    model: (model || "").trim(),
    description: (description || "").trim(),
    location: location.trim(),
    ...prices,
    specialOffer: (specialOffer || "").trim(),
    image: req.file ? `/images/${req.file.filename}` : "",
    createdAt: new Date()
});

        return res.status(201).json({
            success: true,
            message: "Equipment published successfully!",
            equipment: newEquipment
        });

    } catch (error) {
        console.error("Equipment posting error:", error);

        return res.status(400).json({
            message: error.message || "Unable to save equipment right now."
        });
    }
});



// Get all equipment listings

app.get("/api/equipment", async (req, res) => {
    try {
        const equipment = await Equipment.find().sort({
            createdAt: -1
        });

        res.json(equipment);

    } catch (error) {
        console.error("Fetch equipment error:", error);

        res.status(500).json({
            message: "Unable to load equipment."
        });
    }
});

// Fetch equipment belonging to the logged-in owner
app.get(
    "/api/equipment/mine",
    requireUser,
    requireRole("owner"),
    async (req, res) => {
        try {
            const equipment = await Equipment.find({
                ownerId: req.session.user.id
            }).sort({ createdAt: -1 });

            res.json(equipment);

        } catch (error) {
            console.error("Load owner equipment error:", error);

            res.status(500).json({
                message: "Unable to load your equipment."
            });
        }
    }
);




app.post("/api/requirements",requireUser,requireRole("farmer"),async (req, res) => {
        try {
            const {
                activity,
                equipmentRequired,
                farmArea,
                location,
                requiredFrom,
                requiredUntil,
                additionalRequirements
            } = req.body;

            const allowedActivities = [
                "Land Preparation",
                "Sowing",
                "Irrigation",
                "Spraying",
                "Harvesting"
            ];

            const allowedEquipment = [
                "Tractor",
                "Harrow",
                "Cultivator",
                "Rotavator",
                "Seed Drill",
                "Plough",
                "Digger",
                "Harvester"
            ];

            if (
                !allowedActivities.includes(activity) ||
                !allowedEquipment.includes(equipmentRequired) ||
                typeof farmArea !== "number" ||
                !Number.isFinite(farmArea) ||
                farmArea <= 0 ||
                farmArea > 100000 ||
                typeof location !== "string" ||
                !location.trim() ||
                location.trim().length > 150 ||
                typeof requiredFrom !== "string" ||
                typeof requiredUntil !== "string"
            ) {
                return res.status(400).json({
                    message: "Please provide valid requirement details."
                });
            }

            function isValidDate(value) {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    return false;
                }

                const date = new Date(value + "T00:00:00Z");

                return !Number.isNaN(date.getTime()) &&
                    date.toISOString().slice(0, 10) === value;
            }

            const today = new Date().toLocaleDateString("en-CA", {
                timeZone: "Asia/Kolkata"
            });

            if (
                !isValidDate(requiredFrom) ||
                !isValidDate(requiredUntil) ||
                requiredFrom < today ||
                requiredUntil < requiredFrom
            ) {
                return res.status(400).json({
                    message: "Please provide valid rental dates."
                });
            }

            if (
                additionalRequirements !== undefined &&
                (
                    typeof additionalRequirements !== "string" ||
                    additionalRequirements.length > 2000
                )
            ) {
                return res.status(400).json({
                    message: "Additional requirements must be under 2000 characters."
                });
            }

            const newRequirement = await Requirement.create({
                farmerId: req.session.user.id,
                activity,
                equipmentRequired,
                farmArea,
                location: location.trim(),
                requiredFrom,
                requiredUntil,
                additionalRequirements:
                    (additionalRequirements || "").trim()
            });

            return res.status(201).json({
                success: true,
                message: "Requirement posted successfully!",
                requirement: newRequirement
            });

        } catch (error) {
            console.error("Requirement posting error:", error);

            return res.status(500).json({
                message: "Unable to save your requirement right now."
            });
        }
    }
);


 // Get one equipment listing by ID

app.get("/api/equipment/:id", async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({
                message: "Equipment not found."
            });
        }

        res.json(equipment);

    } catch (error) {
        console.error("Fetch equipment details error:", error);

        res.status(400).json({
            message: "Invalid equipment ID."
        });
    }
});
    


function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin === true) {
        return next();
    }

    return res.status(401).json({
        message: "Admin login required."
    });
}

// Admin login
app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !process.env.ADMIN_EMAIL ||
            !process.env.ADMIN_PASSWORD_HASH ||
            !process.env.SESSION_SECRET
        ) {
            return res.status(400).json({
                message: "Please provide valid login details."
            });
        }

        const emailMatches =
            email.trim().toLowerCase() ===
            process.env.ADMIN_EMAIL.trim().toLowerCase();

        const passwordMatches = await bcrypt.compare(
            password,
            process.env.ADMIN_PASSWORD_HASH
        );

        if (!emailMatches || !passwordMatches) {
            return res.status(401).json({
                message: "Invalid admin email or password."
            });
        }

        req.session.regenerate((error) => {
            if (error) {
                console.error("Session error:", error);
                return res.status(500).json({
                    message: "Unable to create admin session."
                });
            }

            req.session.isAdmin = true;

            req.session.save((saveError) => {
                if (saveError) {
                    console.error("Session save error:", saveError);
                    return res.status(500).json({
                        message: "Unable to save admin session."
                    });
                }

                return res.json({
                    success: true,
                    message: "Admin login successful."
                });
            });
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({
            message: "Unable to log in."
        });
    }
});

// Check whether the current browser has an admin session
app.get("/api/admin/session", requireAdmin, (req, res) => {
    res.json({ authenticated: true });
});

// Admin logout
app.post("/api/admin/logout", requireAdmin, (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: "Unable to log out."
            });
        }

        res.clearCookie("agrihire.admin.sid");
        res.json({ success: true });
    });
});

// Live user counts — admin access only

app.get("/api/admin/user-analytics", requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();

        const farmers = await User.countDocuments({
            $and: [
                { roles: "farmer" },
                { roles: { $nin: ["owner"] } }
            ]
        });

        const owners = await User.countDocuments({
            $and: [
                { roles: "owner" },
                { roles: { $nin: ["farmer"] } }
            ]
        });

        const both = await User.countDocuments({
            roles: { $all: ["farmer", "owner"] }
        });

        return res.json({
            totalUsers,
            farmers,
            owners,
            both
        });

    } catch (error) {
        console.error("User analytics error:", error);

        return res.status(500).json({
            message: "Unable to load user analytics."
        });
    }
});


// Complete admin dashboard analytics from MongoDB
app.get("/api/admin/dashboard-stats", requireAdmin, async (req, res) => {
    try {
        // Total counts
        const totalEquipment = await Equipment.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const totalRequirements = await Requirement.countDocuments();

        // Booking status counts
        const pendingBookings = await Booking.countDocuments({
            status: "pending"
        });

        const approvedBookings = await Booking.countDocuments({
            status: "approved"
        });

        const rejectedBookings = await Booking.countDocuments({
            status: "rejected"
        });

        // Revenue from approved bookings
        const revenueResult = await Booking.aggregate([
            { $match: { status: "approved" } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalPrice" }
                }
            }
        ]);

        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        // Equipment category analytics
        const equipmentByCategory = await Equipment.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Recent bookings
        const recentBookings = await Booking.find()
    .sort({ createdAt: -1 })
    .lean();

     

// Fetch farmer names from MongoDB and legacy users.json

const farmerIds = [
    ...new Set(
        recentBookings
            .map(booking => String(booking.farmerId))
            .filter(id => /^[0-9a-fA-F]{24}$/.test(id))
    )
];

const users = await User.find({
    _id: { $in: farmerIds }
}).select("firstName lastName");

const farmerMap = new Map(
    users.map(user => [
        String(user._id),
        `${user.firstName} ${user.lastName}`
    ])
);

// Look up older timestamp-based user IDs

    legacyUsers.forEach(user => {
        farmerMap.set(
            String(user.id),
            `${user.firstName} ${user.lastName}`
        );
    });

} catch (error) {
    console.error("Legacy users lookup error:", error.message);
}

        const formattedBookings = recentBookings.map(booking => ({
            _id: booking._id,
            farmerName: farmerMap.get(booking.farmerId) || "Unknown Farmer",
            equipmentName: booking.equipmentName,
            start: booking.start,
            end: booking.end,
            durationType: booking.durationType,
            units: booking.units,
            totalPrice: booking.totalPrice,
            status: booking.status
        }));

        return res.json({
            totalEquipment,
            totalBookings,
            totalRequirements,
            totalRevenue,
            pendingBookings,
            approvedBookings,
            rejectedBookings,
            equipmentByCategory,
            recentBookings: formattedBookings
        });

   

});



const bookingsFile = path.join(dataDirectory, "bookings.json");

function requireUser(req, res, next) {
    if (!req.session?.user?.id) {
        return res.status(401).json({
            message: "Please log in first."
        });
    }
    next();
}


app.get("/api/me", requireUser, (req, res) => {
    res.json({
        id: req.session.user.id,
        firstName: req.session.user.firstName,
        email: req.session.user.email,
        roles: req.session.user.roles
    });
});


function requireRole(role) {
    return (req, res, next) => {
        if (!req.session?.user?.roles?.includes(role)) {
            return res.status(403).json({
                message: `This action requires the ${role} role.`
            });
        }
        next();
    };
}

async function readJsonArray(file) {
    try {
        const content = await fs.readFile(file, "utf8");
        const value = JSON.parse(content);

        if (!Array.isArray(value)) {
            throw new Error(`${path.basename(file)} must contain a JSON array.`);
        }

        return value;
    } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
    }
}

async function saveBookings(bookings) {
    await fs.mkdir(dataDirectory, { recursive: true });
    await fs.writeFile(
        bookingsFile,
        JSON.stringify(bookings, null, 2),
        "utf8"
    );
}

const rentalRates = {
    hourly: { field: "hourlyPrice", milliseconds: 60 * 60 * 1000 },
    daily: { field: "dailyPrice", milliseconds: 24 * 60 * 60 * 1000 },
    weekly: { field: "weeklyPrice", milliseconds: 7 * 24 * 60 * 60 * 1000 },
    tenDay: { field: "tenDayPrice", milliseconds: 10 * 24 * 60 * 60 * 1000 }
};

// Create a booking request
app.post("/api/bookings",requireUser,requireRole("farmer"),async (req, res) => {
        try {
            const { equipmentId, start, end, durationType } = req.body;

            const rate = rentalRates[durationType];

            if (
                typeof equipmentId !== "string" ||
                !rate ||
                typeof start !== "string" ||
                typeof end !== "string"
            ) {
                return res.status(400).json({
                    message: "Provide equipment, rental type, start and end."
                });
            }

            const startDate = new Date(start);
            const endDate = new Date(end);

            if (
                Number.isNaN(startDate.getTime()) ||
                Number.isNaN(endDate.getTime()) ||
                endDate <= startDate ||
                startDate <= new Date()
            ) {
                return res.status(400).json({
                    message: "Choose a valid future rental period."
                });
            }

            const duration = endDate.getTime() - startDate.getTime();

            // Require exact blocks for the selected pricing unit.
            if (duration % rate.milliseconds !== 0) {
                return res.status(400).json({
                    message: "The rental period must use whole selected units."
                });
            }

            const units = duration / rate.milliseconds;

            if (durationType === "weekly" && units < 1) {
                return res.status(400).json({
                    message: "Weekly rentals must be at least one week."
                });
            }

            if (durationType === "tenDay" && units !== 1) {
                return res.status(400).json({
                    message: "A 10-day rental must be exactly 10 days."
                });
            }

           // Fetch selected equipment from MongoDB
if (!/^[a-f\d]{24}$/i.test(equipmentId)) {
    return res.status(400).json({
        message: "Invalid equipment ID."
    });
}

const item = await Equipment.findById(equipmentId);

            if (!item) {
                return res.status(404).json({
                    message: "Equipment not found."
                });
            }

            const unitPrice = item[rate.field];

            if (
                typeof unitPrice !== "number" ||
                !Number.isFinite(unitPrice) ||
                unitPrice < 0
            ) {
                return res.status(400).json({
                    message: "This equipment has no valid price for that duration."
                });
            }

           // Check for overlapping bookings in MongoDB
const conflict = await Booking.findOne({
    equipmentId: String(item._id),
    status: { $in: ["pending", "approved"] },
    start: { $lt: endDate },
    end: { $gt: startDate }
});

if (conflict) {
    return res.status(409).json({
        message: "This equipment is already requested or booked for an overlapping period."
    });
}

            if (conflict) {
                return res.status(409).json({
                    message: "This equipment is already requested or booked for an overlapping period."
                });
            }

           const booking = await Booking.create({
    equipmentId: String(item._id),
    equipmentName: item.equipmentName,
    equipmentImage: item.image || "",
    ownerId: item.ownerId,
    farmerId: req.session.user.id,
    start: startDate,
    end: endDate,
    durationType,
    units,
    unitPrice,
    totalPrice: Math.round(unitPrice * units * 100) / 100,
    status: "pending"
});

            res.status(201).json({
                success: true,
                message: "Booking request sent to the equipment owner.",
                booking
            });
        } catch (error) {
            console.error("Create booking error:", error);
            res.status(500).json({
                message: "Unable to create booking."
            });
        }
    }
);

// Farmer sees their own booking requests
app.get("/api/bookings/mine", requireUser, async (req, res) => {
    try {
        const bookings = await Booking.find({
            farmerId: req.session.user.id
        }).sort({ createdAt: -1 });

        res.json(bookings);

    } catch (error) {
        console.error("Load farmer bookings error:", error);

        res.status(500).json({
            message: "Unable to load bookings."
        });
    }
});



// Owner sees booking requests for their own equipment
app.get(
    "/api/bookings/owner",
    requireUser,
    requireRole("owner"),
    async (req, res) => {
        try {
            const bookings = await Booking.find({
                ownerId: req.session.user.id
            }).sort({ createdAt: -1 });

            res.json(bookings);

        } catch (error) {
            console.error("Load owner bookings error:", error);

            res.status(500).json({
                message: "Unable to load bookings."
            });
        }
    }
);


// Owner approves or rejects a pending request

app.patch(
    "/api/bookings/:id/status",
    requireUser,
    requireRole("owner"),
    async (req, res) => {
        try {
            const { status } = req.body;

            // Validate requested status
            if (!["approved", "rejected"].includes(status)) {
                return res.status(400).json({
                    message: "Status must be approved or rejected."
                });
            }

            // Validate MongoDB ObjectId
            if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid booking ID."
                });
            }

            // Find booking in MongoDB
            const booking = await Booking.findById(req.params.id);

            if (!booking) {
                return res.status(404).json({
                    message: "Booking not found."
                });
            }

            // Verify booking ownership
            if (
                !booking.ownerId ||
                booking.ownerId !== req.session.user.id
            ) {
                return res.status(403).json({
                    message: "You cannot manage this booking."
                });
            }

            // Only pending bookings can be updated
            if (booking.status !== "pending") {
                return res.status(409).json({
                    message: "Only pending bookings can be updated."
                });
            }

            // Check overlapping bookings before approval
            if (status === "approved") {

                const conflict = await Booking.findOne({
                    _id: { $ne: booking._id },
                    equipmentId: booking.equipmentId,
                    status: { $in: ["pending", "approved"] },
                    start: { $lt: booking.end },
                    end: { $gt: booking.start }
                });

                if (conflict) {
                    return res.status(409).json({
                        message: "Another active request overlaps these dates. Resolve it first."
                    });
                }
            }

            // Update booking in MongoDB
            booking.status = status;
            booking.updatedAt = new Date();

            await booking.save();

            res.json({
                success: true,
                message: `Booking ${status}.`,
                booking
            });

        } catch (error) {
            console.error("Update booking error:", error);

            res.status(500).json({
                message: "Unable to update booking."
            });
        }
    }
);


// Get logged-in user's details
app.get("/api/me", requireUser, (req, res) => {
    res.json({
        id: req.session.user.id,
        firstName: req.session.user.firstName,
        email: req.session.user.email,
        roles: req.session.user.roles
    });
});



/* GET REQUIREMENTS POSTED BY LOGGED-IN FARMER */

app.get(
    "/api/requirements/mine",
    requireUser,
    requireRole("farmer"),
    async (req, res) => {
        try {
            const requirements = await Requirement.find({
                farmerId: req.session.user.id
            }).sort({ createdAt: -1 });

            return res.json(requirements);

        } catch (error) {
            console.error("Farmer requirements error:", error);

            return res.status(500).json({
                message: "Unable to fetch your requirements."
            });
        }
    }
);


/* GET REQUIREMENTS FOR EQUIPMENT OWNERS */

app.get(
    "/api/requirements/owner",
    requireUser,
    requireRole("owner"),
    async (req, res) => {
        try {
            const requirements = await Requirement.find({
                farmerId: { $ne: req.session.user.id }
            }).sort({ createdAt: -1 });

            return res.json(requirements);

        } catch (error) {
            console.error("Owner requirements error:", error);

            return res.status(500).json({
                message: "Unable to fetch farmer requirements."
            });
        }
    }
);


/* OWNER RESPONDS TO A FARMER REQUIREMENT */

app.post(
    "/api/requirements/:id/respond",
    requireUser,
    requireRole("owner"),
    async (req, res) => {
        try {
            const requirementId = req.params.id;
            const ownerId = req.session.user.id;

            // Validate MongoDB ObjectId
            if (!/^[0-9a-fA-F]{24}$/.test(requirementId)) {
                return res.status(400).json({
                    message: "Invalid requirement ID."
                });
            }

            // Find the requirement
            const requirement = await Requirement.findById(requirementId);

            if (!requirement) {
                return res.status(404).json({
                    message: "Requirement not found."
                });
            }

            // Prevent owners from responding to their own requirements
            if (requirement.farmerId === ownerId) {
                return res.status(403).json({
                    message: "You cannot respond to your own requirement."
                });
            }

            // Validate optional message
            const message = req.body.message || "";

            if (
                typeof message !== "string" ||
                message.trim().length > 1000
            ) {
                return res.status(400).json({
                    message: "Message must be under 1000 characters."
                });
            }

            // Prevent duplicate responses
            const existingResponse = await RequirementResponse.findOne({
                requirementId: requirement._id,
                ownerId
            });

            if (existingResponse) {
                return res.status(409).json({
                    message: "You have already responded to this requirement."
                });
            }

            // Save response in MongoDB
            const newResponse = await RequirementResponse.create({
                requirementId: requirement._id,
                farmerId: requirement.farmerId,
                ownerId,
                message: message.trim(),
                status: "interested"
            });

            return res.status(201).json({
                success: true,
                message: "Your interest has been submitted successfully!",
                response: newResponse
            });

        } catch (error) {
            console.error("Requirement response error:", error);

            // Handle duplicate database index error
            if (error.code === 11000) {
                return res.status(409).json({
                    message: "You have already responded to this requirement."
                });
            }

            return res.status(500).json({
                message: "Unable to submit your response right now."
            });
        }
    }
);


/* GET INTERESTED OWNERS FOR LOGGED-IN FARMER */

app.get(
    "/api/requirements/responses/mine",
    requireUser,
    requireRole("farmer"),
    async (req, res) => {
        try {
            const farmerId = req.session.user.id;

            // Find responses to this farmer's requirements
            const responses = await RequirementResponse.find({
                farmerId
            }).sort({ createdAt: -1 }).lean();

            if (responses.length === 0) {
                return res.json([]);
            }

            // Get unique owner IDs
            const ownerIds = [
                ...new Set(responses.map(response => response.ownerId))
            ];

            // Fetch owner details without password hashes
            const owners = await User.find({
                _id: { $in: ownerIds }
            })
                .select("firstName lastName email mobile location")
                .lean();

            // Fetch related requirements
            const requirementIds = [
                ...new Set(
                    responses.map(response =>
                        String(response.requirementId)
                    )
                )
            ];

            const requirements = await Requirement.find({
                _id: { $in: requirementIds },
                farmerId
            })
                .select("equipmentRequired activity farmArea location requiredFrom requiredUntil")
                .lean();

            const ownerMap = new Map(
                owners.map(owner => [String(owner._id), owner])
            );

            const requirementMap = new Map(
                requirements.map(requirement => [
                    String(requirement._id),
                    requirement
                ])
            );

            // Combine response, owner and requirement details
            const result = responses.map(response => {
                const owner = ownerMap.get(response.ownerId);
                const requirement = requirementMap.get(
                    String(response.requirementId)
                );

                return {
                    _id: response._id,
                    message: response.message,
                    status: response.status,
                    createdAt: response.createdAt,

                    owner: owner ? {
                        firstName: owner.firstName,
                        lastName: owner.lastName,
                        email: owner.email,
                        mobile: owner.mobile,
                        location: owner.location
                    } : null,

                    requirement: requirement || null
                };
            });

            return res.json(result);

        } catch (error) {
            console.error("Fetching owner responses error:", error);

            return res.status(500).json({
                message: "Unable to fetch interested owners."
            });
        }
    }
);


app.get("/api/profile", requireUser, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id)
            .select("firstName lastName mobile email location language roles");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json({ user });
    } catch (error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({ message: "Unable to load profile." });
    }
});


app.put("/api/profile", requireUser, async (req, res) => {
    try {
        const { firstName, lastName, mobile, email, location, language } = req.body;

        const updatedData = {
            firstName: String(firstName || "").trim(),
            lastName: String(lastName || "").trim(),
            mobile: String(mobile || "").trim(),
            email: String(email || "").trim().toLowerCase(),
            location: String(location || "").trim(),
            language
        };

        if (
            !updatedData.firstName ||
            !updatedData.lastName ||
            !/^[0-9]{10}$/.test(updatedData.mobile) ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedData.email) ||
            !["English", "हिंदी"].includes(updatedData.language)
        ) {
            return res.status(400).json({
                message: "Please enter valid profile information."
            });
        }

        const existingUser = await User.findOne({
            _id: { $ne: req.session.user.id },
            $or: [
                { email: updatedData.email },
                { mobile: updatedData.mobile }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email or mobile number is already registered."
            });
        }

        const user = await User.findByIdAndUpdate(
            req.session.user.id,
            { $set: updatedData },
            { new: true, runValidators: true }
        ).select("firstName lastName mobile email location language roles");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        req.session.user.firstName = user.firstName;
        req.session.user.email = user.email;

        res.json({
            message: "Profile updated successfully.",
            user
        });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ message: "Unable to update profile." });
    }
});



connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`AgriHire running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to start AgriHire:", error.message);
        process.exit(1);
    });
