const mongoose = require('mongoose');
const validator = require('validator');
const AppError = require('../utils/appError');
const crypto = require('crypto');

const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'User require a Name'] },
  email: {
    type: String,
    required: [true, 'User must have an e-mail'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
    // validate: {
    //   validator: (val) => validator.isEmail(val),
    //   message: 'Verify e-mail and retry',
    // },
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'tour-guide', 'lead-guide', 'guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'User must have a password'],
    // validate: {
    //   validator: (val) => validator.isStrongPassword(val),
    // },
    select: false,
    min: [6, 'A password must have at least 6 chars'],
    max: [50, 'A password must have up to 50 chars'],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Password confirmation is required.'],
    validate: {
      validator: function (val) {
        return this.password === val;
      },
      message: 'The passwords must match!',
    },
  },
  photo: { type: String },
  passwordChangedAt: Date,
  passwordResetToken: { type: String },
  passwordTokenExpires: { type: Date },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', function (next) {
  if (!this.isModified('passwordChangedAt') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', async function (next) {
  // console.log(this);
  //encrypt pass with hash
  //   if (this.password.trim() === this.passwordConfirm.trim()) {
  if (!this.isModified('password')) next();
  //   throw new AppError('The passwords must match.', 400);
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordTokenExpires = Date.now() + 10 * 60 * 1000;

  return resetToken; // return plain token to main function
};

const User = mongoose.model('User', userSchema);

module.exports = User;
