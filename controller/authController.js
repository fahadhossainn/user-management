const crypto = require('crypto');
const util = require('util');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const handleAsync = require('../utils/handleAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');




exports.signup = handleAsync (async (req,res,next) => {

    const newUser = await User.create(req.body);
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser , url).sendWelcome();
    sendResponse(newUser , 201 , res);
});


exports.login = handleAsync( async (req,res,next) => {
    const {email , password } = req.body;

    if(!email || !password) return next(new AppError('Please provide email and Password to sign in',400));

    const user = await User.findOne({email}).select('+password');

    if(!user || !await user.isCorrectPassword(password , user.password)){
        return next(new AppError('Invalid email or passowrd', 401));
    }
    sendResponse(user , 200 , res);
});

exports.logout = (req,res ) => {

    res.cookie('jwt' , 'loremipsumdolaremmet' , {
      expires : new Date(Date.now() + 10 * 1000),
      httpOnly : true,
      sameSite : 'strict',
      secure : true
    })
    res.status(200).json({status : 'success'})
}


exports.forgotPassword = handleAsync(async (req,res,next) => {
    const user = await User.findOne({email : req.body.email});
    if(!user) return next( new AppError('There is no user with that email address', 404));

    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave : false});

    try 
    {
        const resetUrl = `${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`;
        await new Email(user , resetUrl).sendPasswordReset();
        res.status(200).json({
        status : 'success',
        message : 'token sent to email'})
    } catch (err){
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save({validateBeforeSave : false});

        return next(new AppError('There was an error sending  mail . Try again later !' , 500));
    }
});
exports.resetPassword = handleAsync(async (req,res,next) => {

    const token = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({passwordResetToken : hashedToken , passwordResetTokenExpires : {$gt : Date.now()}});

    if(!user) return next(new AppError('Token is invalid or Expired',400));

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    sendResponse(user,200,res);

});

exports.updatePassword = handleAsync(async (req,res,next)=> {

    const user = await User.findById( req.user.id).select('+password');

    const match = await user.isCorrectPassword(req.body.passwordCurrent , user.password);
    if(!match) {
        return next (new AppError('Current password is not valid', 401));
    } 

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    sendResponse(user , 200 , res);
});


const generateToken = (id) => {

  return jwt.sign({id:id} , process.env.JWT_SECRET, {
      expiresIn : process.env.JWT_EXPIRES_IN
  });
}

const sendResponse = (user , statusCode , res) => {

  const token = generateToken(user._id);
  user.password = undefined;

  res.status(statusCode).json({
    status : 'success',
    token,
    data : {
      user
    }
  });
}

exports.protect = handleAsync(async (req,res,next) => {

  let token;
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
      token = req.headers.authorization.split(' ')[1];
  }
  if(!token) return next(new AppError('You are not logged in ! Please log in to get access', 401));

  const decoded = await util.promisify(jwt.verify) (token , process.env.JWT_SECRET);
  const user = await User.findOne({id : decoded.id});
  if(!user) return next( new AppError('User with specified token no longer exists.',401));

  if(user.isPasswordChanged(decoded.iat)){
      return next( new AppError('Password for this account was changed recently . Please login again', 401));
  }

  req.user = user;
  next();
});


