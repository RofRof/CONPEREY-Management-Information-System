require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
//middleware
app.use(express.json())
app.use(cors())
//routes for login, student
app.use('/auth', require('./routes/auth'))
app.use('/student', require('./routes/students'))
app.use('/account', require('./routes/studentaccounts'))
app.use('/payment', require('./routes/payments'))
//list to port 5000 declared in .env
app.listen(process.env.PORT, () => {
    console.log("server has started on port " + process.env.PORT)
});

module.exports = app;

