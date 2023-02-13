const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name:{
        type : String,
        trim : true,
        required : [true , 'Please tell us your name ']
    },
    email :{
        type: String,
        unique : true,
        lowercase : true,
        trim : true,
        required : [true , 'Please provide your email address'],
        validate : [validator.isEmail , 'Please provide a valid email address']
    },
    role : {
        type : String,
        enum : ['user' ,'admin'],
        default : 'user'
    },
    password : {
        type: String,
        required : [true, 'Please provide a password'],
        minlength : 12,
        select :false
    },
    passwordConfirm : {
        type : String,
        required : [true , 'Please Confirm your password'],
        validate : {
            validator : function (el) {
                return el === this.password;
            },
            message : 'Passwords should be same '
        }
    },
    photo :{
      type : String,
      default : 'default.jpg'
    },
    passwordChangedAt : Date,
    passwordResetToken : String,
    passwordResetTokenExpires : Date
});

userSchema.methods.isCorrectPassword = async (currPassword , originalPassword) => {
    
  return await bcrypt.compare(currPassword , originalPassword);
};

userSchema.methods.isPasswordChanged = function (timestamp)  {

  if(this.passwordChangedAt){
      const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000);
      return changedTimeStamp > timestamp;
  }
   return false;
};

userSchema.methods.createPasswordResetToken = function () {

  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetTokenExpires = Date.now() + (10 * 60 * 1000);

  return resetToken;
}

userSchema.pre('save', async function (next) {

  if(!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password , 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save',function (next) {
  if(!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() + 1000;
  next();
})


userSchema.pre(/^find/, function (next) {
  this.where({role : { $ne : 'admin'}});
  next();
})


const User = mongoose.model('User',userSchema);

module.exports = User;