module.exports = async = (req, res, next) => {
  try {
    const { username, password } = req.body;
    if(!username || !password) {
      return res.status(401).json({ status:401, message: "Empty username or password" });
    }
    else{
      next();
    }
  }
  catch (error){
    console.log(error);
    return error;
  }
}