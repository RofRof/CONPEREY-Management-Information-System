const express = require('express');
const pool = require('../database/db'); //cache of database properties to establish connection quicker
const jwtGenerator = require('../utils/jwtGenerator');
const validatelogin = require('../middleware/validatelogin');
const authorization = require('../middleware/authorization');

const auth = express.Router(); // .Router() used for requests?? 

auth.post('/login', validatelogin, async(req, res) => {
  try {
    const { username, password } = req.body; //destructured body for username and password in request body
    const login = await pool.query
                  ("SELECT firstname, lastname FROM users WHERE username=$1 AND password=$2", [username, password]); //check if user is in the db
    if(login.rowCount === 1){
      const token = jwtGenerator(login.rows[0].user_id);
      return res.json({token: token, data: login.rows[0]});
    }
    else{
      return res.status(401).json({ status:401, message: "Incorrect username or password"})
    }
  } catch (error) {
    console.log(error);
    return error;
  }
})

auth.get('/verify', authorization, async(req, res) => {
  try {
    return res.json(true);
  } catch (error) {
    console.log(error);
    return res.status(500).message({ status: 500, message: "Unauthorized User" });
  }
})

module.exports = auth;