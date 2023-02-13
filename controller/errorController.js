const AppError = require ('../utils/appError');

const handleJWTError = (err) => new AppError('Invalid user token . Please login again',401);

const handleJWTExpiredError = (err) => new AppError('Token Expired . Please login again',401);

const handleCastError = (err) => {
  const msg = ` Invalid ${err.path} : ${err.value} `;
  return new AppError (msg , 400);
}
const handleDuplicateFields = (err) => {
  const val = err.errmsg.match(/"(?:\\.|[^"\\])*"/)[0];
  const msg = `duplicate field value : ${val} .Try another one`;
  return new AppError (msg , 400);
}

const handleValidationError = (err) => {
  let error = Object.values(err.errors).map(el => el.message);
  const msg = `${error.join('. ')}`;
  return new AppError (msg , 400);
}

const sendError= (err , req , res) => {

    res.status(err.statusCode).json({
      status : err.status,
      message : err.message,
    });

}


module.exports = (err,req,res,next) => {
    err.status = err.status || 'error';
    err.statusCode = err.statusCode || 500;

    let error = err;
    if(error.name === 'CastError') error = handleCastError(error);
    if (error.code === 11000) error = handleDuplicateFields(error);
    if(error.name === 'ValidationError') error = handleValidationError(error);
    if(error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if(error.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
    
    sendError(error, req ,res);
}