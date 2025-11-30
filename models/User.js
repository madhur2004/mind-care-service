// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     unique: true,
//     required: true,
//     lowercase: true,
//     trim: true
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     select: false
//   },
//   googleId: {
//     type: String,
//     sparse: true
//   },
//   avatar: String,
//   lastLogin: Date,
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Update updatedAt before saving
// userSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// const User = mongoose.model("User", userSchema);

// export default User;


// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     unique: true,
//     required: true,
//     lowercase: true,
//     trim: true
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     select: false
//   },
//   googleId: {
//     type: String,
//     sparse: true
//   },
//   avatar: String,
//   lastLogin: Date,
  
//   // NEW FIELDS FOR EMAIL SYSTEM
//   resetPasswordToken: String,
//   resetPasswordExpires: Date,
  
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Update updatedAt before saving
// userSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// const User = mongoose.model("User", userSchema);

// export default User;

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  password: { 
    type: String, 
    select: false 
  },
  googleId: { 
    type: String, 
    sparse: true 
  },
  avatar: {
    type: String,
    default: null
  },
  lastLogin: Date,
  
  // Settings field
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    emailUpdates: {
      type: Boolean,
      default: true
    },
    privacyMode: {
      type: Boolean,
      default: false
    },
    dataSaving: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    fontStyle: { type: String, default: 'inter' },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isModified('settings')) {
    this.settings.updatedAt = new Date();
  }
  next();
});

const User = mongoose.model("User", userSchema);
export default User;