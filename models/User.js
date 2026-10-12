const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the information each user stores
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Hide password in normal queries
    },
  },
  {
    // Automatically record creation and update times
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },

    // Remove password when converting a user to JSON
    toJSON: {
      transform(doc, result) {
        delete result.password;
        return result;
      },
    },
  }
);

// Hash a new or changed password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  // bcrypt supports passwords up to 72 bytes
  if (Buffer.byteLength(this.password, "utf8") > 72) {
    throw new Error("Password must not exceed 72 bytes");
  }

  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model("User", userSchema);