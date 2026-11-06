const User = require("../models/User");
const tokenGenerator = require("../utils/generateToken");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

const isPasswordWithinBcryptLimit = (password) => {
  return Buffer.byteLength(password, "utf8") <= 72;
};

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "codecollab/avatars",
        resource_type: "image",
        transformation: [
          {
            width: 400,
            height: 400,
            crop: "fill",
            gravity: "face",
          },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    Readable.from([buffer]).pipe(uploadStream);
  });
};

const registerUser = async (req, res) => {
  let uploadedAvatarPublicId = null;

  try {
    const {
      name,
      email,
      password,
      role = "candidate",
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    if (
      typeof name !== "string" ||
      name.trim().length < 3 ||
      name.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must contain 3–50 characters.",
      });
    }

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 6 ||
      !isPasswordWithinBcryptLimit(password)
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must contain 6–72 characters.",
      });
    }

    const allowedRoles = ["candidate", "interviewer"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration role.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    let avatarUrl = null;

    // Upload avatar only when an image was provided
    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file.buffer);

      avatarUrl = uploadedImage.secure_url;
      uploadedAvatarPublicId = uploadedImage.public_id;
    }

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      role,
      avatar: avatarUrl,
    });

    await newUser.setPassword(password);
    await newUser.save();

    const token = tokenGenerator(newUser);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    // Remove uploaded image if registration fails after upload
    if (uploadedAvatarPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedAvatarPublicId);
      } catch (cleanupError) {
        console.error(
          "Avatar cleanup error:",
          cleanupError.message
        );
      }
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// login user

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!isPasswordWithinBcryptLimit(password)) {
      return res.status(400).json({
        success: false,
        message: "Password is too long. Maximum length is 72 characters",
      });
    }

    // check password limit
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = tokenGenerator(user);
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
