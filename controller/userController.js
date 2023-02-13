const multer = require('multer');
const sharp = require('sharp');
const User = require('../model/userModel');
const AppError = require('../utils/appError');
const handleAsync = require('../utils/handleAsync');



const multerStorage = multer.memoryStorage();

const multerFilter = (req , file , callback) => {

    if(file.mimetype.startsWith('image')) callback(null , true);
    else callback(new AppError('Please upload an Image', 400) , false);
}

const upload = multer(
  {
      storage: multerStorage,
      fileFilter : multerFilter
  }
);

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = handleAsync(async (req, res, next) => {

  if(!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(400, 400)
    .toFormat('jpg')
    .toFile(`public/img/users/${req.file.filename}`)

  next();
})

const filterObj = (obj , ...args) => {
    const result = {};
    Object.keys(obj).forEach(prop => {
        if(args.includes(prop)) result[prop] = obj[prop];
    });
    return result;
}


exports.getMe = (req,res,next) => {
  req.params.id = req.user.id;
  next();
}


exports.getUser = handleAsync(async(req, res, next) => {

      let user = await  User.findById(req.params.id).select('name email photo');

      if(!user) return next(new AppError('user not found with given ID', 404));

      res.status(200).json({
          status:'success',
          data : {
              user
          }
      });
})

exports.getAllUsers = handleAsync(async(req, res, next) => {

  let users = await User.find().select('name email photo');

  res.status(200).json({
      status:'success',
      results : users.length,
      data : {
          users
      }
  });
})
exports.updateInfo = handleAsync(async (req,res,next) => {

    if(req.body.password || req.body.passwordConfirm) {
        return next(new AppError(` You can't change password in this route.  go to /updatePassword route ` , 400));
    }

    const filterdObj = filterObj(req.body , 'name' , 'email');
    if(req.file) filterdObj.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(req.user.id , filterdObj , {
        new : true,
        runValidators : true
    });
    res.status(200).json({
        status : 'success',
        data : {
            user : updatedUser
        }
    });
});

exports.deleteUser = handleAsync(async (req,res,next) => {

  if(!req.user.role === 'admin') return next(new AppError('You are not allowed to perform this action' , 401));

  const user = await User.findByIdAndDelete(req.params.id);

  if(!user) return next(new AppError('user not found with given ID', 404));

  res.status(204).json({
      status : 'success',
      data : null
  });

});



