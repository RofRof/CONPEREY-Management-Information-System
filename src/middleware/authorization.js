const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  try {
    const jwtToken = req.header("token"); //request token in request header
    if(!jwtToken) {
      return res.status(401).json({ status: 401, message: "Unauthorized User" });
    }
    else{
      const payload = jwt.verify(jwtToken, process.env.JWTSECRET);//API for verifying if the token is legit
      req.user = payload.user; // pass the payload user to the current user?
      next(); // go next in functions. like then()   
    }
  }
  catch (err) {
    console.log(err.message);
    return res.status(403).json("Unauthorized User");
  }
}