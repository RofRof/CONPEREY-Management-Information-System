const pool = require('./src/database/db')
require('dotenv').config()

const test = async() => {
  
  try {
    const student_accounts = "student_accounts"
    const student_id = '21-0008'
    const query =   
    `SELECT tuition_fee FROM ` + student_accounts + 
    ` WHERE student_id = ` + "'" + student_id + "'"
                
    const fee = await pool.query(query)
    const tuition = fee.rows[0].tuition_fee
    console.log(tuition)
    // return fee
  } catch (error) {
    return error
  }
} 

const toFormat = (name) => {
  
  const str = name.toLowerCase().replace(/^\w|\s\w/g, ((x) => x.toUpperCase()))
  console.log(str)
}

// toFormat("rolF ian")