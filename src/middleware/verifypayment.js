const pool = require('../database/db')
const tablename = require('../middleware/tablename')

module.exports = async(req, res, next) => {
  try{
    const { payAmount, studentID, schoolyear }  = req.body

    if(payAmount === "" || payAmount != parseInt(payAmount, 10) || payAmount == 0){
      res.json({status: 400, message: "Empty or Invalid amount"})
    }
    else{
      let studentaccounts = tablename("studentaccounts", schoolyear)
      const getBalance = await pool.query(`SELECT total_balance FROM ${studentaccounts} WHERE student_id=${studentID}`)
      
      let total_balance = getBalance.rows[0].total_balance
      let amount = parseInt(payAmount, 10)
      if (total_balance < amount){
        res.json({status: 400, message: "Pay amount is greater than balance"})
      }
      else{
        next()
      }
    }
  }
  catch(error){
    console.log(error)
    res.json({status: 500, message: 'Server error'})
  }
  
}
