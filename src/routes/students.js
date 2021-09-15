require('dotenv').config()
const express = require('express')
const student = express.Router()
const authorization = require('../middleware/authorization') //middleware function to check for invalid tokens
const pool = require('../database/db')
const selectTable = require('../middleware/tablename')
const tablename = require('../middleware/tablename') //used to choose what schoolyear table to use

student.get('/recommendSearch', async(req,res) => {
  try {
    let schoolyear = req.header("schoolyear")
    const name  = req.header("name").toLowerCase().replace(/^\w|\s\w/g, ((x) => x.toUpperCase()))
    // for Capitalizing Every first letter and removing whitespace after words
    let students = tablename('students', schoolyear)

    let query = `SELECT CONCAT(firstname, ' ', lastname) AS studentname
                FROM ${students} WHERE firstname LIKE '%${name}%' OR lastname LIKE '%${name}%'
                OR CONCAT(lastname, ' ', firstname) ='${name}' 
                OR CONCAT(firstname, ' ', lastname) LIKE '%${name}%'
                LIMIT 10
                `

    const result = await pool.query(query)
    res.json(result.rows)
    
  } catch (error) {
    console.log(error)
    return error
  }
})

student.post('/addStudent', authorization, async(req,res) => {
  try {
      const values = Object.values(req.body)
      for(let i = 0; i < values.length; i++){
        if(values[i] == ""){
          return res.status(400).json({status: 400, message: "Incorrect or empty input"})
        }    
      } 
      // the values variable is an array of the req.body, 
      // then make a for loop to check if there is an empty string
      const { firstname, middle, lastname, city, municipality, province, sex, birthdate, gradeLevel, schoolyear} = req.body
      const address = city.concat(' ' + municipality.trim() + ' ' + province.trim())
      let students = selectTable('students', schoolyear)
      let studentaccounts = selectTable('studentaccounts', schoolyear)
      let gradeaccounts = selectTable('gradeaccounts', schoolyear)

      const query1 = `INSERT INTO ${students}(firstname, middleini, lastname, address, gradelevel, birthdate, sex)
                      VALUES('${firstname}', '${middle}', '${lastname}', '${address}', '${gradeLevel}', '${birthdate}', '${sex}');`
     
      const query2 = `INSERT INTO ${studentaccounts}(student_id, gradelevel, entrance, misc, books, aralinks, prev_balance, tuition, discounts)
                      SELECT id, ${students}.gradelevel, entrance, misc, books, aralinks, 0, tuition, '{}' FROM ${students} 
                      INNER JOIN ${gradeaccounts} ON ${students}.gradelevel = ${gradeaccounts}.gradelevel 
                      WHERE firstname = '${firstname}' AND lastname = '${lastname}'`

      const newStudent = await pool.query(query1)
      const newStudentAccount = await pool.query(query2)

      return res.status(200).json({status: 200, message: 'Student Enrolled'})

  } catch (error) {
      console.log(error);
      return res.status(500).json({status: 500, message: 'Internal Server error', error: error});
  }
}); 


//view specific student name id
student.get('/studentCounter', async(req, res) => {
  try {
      // schoolyearpicker(databasename, )
      const viewStudent = await pool.query("SELECT * FROM students");  // query to pass to PSQL
      res.json(viewStudent);  // response query with JSON format if successful
      // }
  } catch (error) {
      console.log(error);
      return error;
  }
});
//update students firstname
student.put('/updateStudent/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const { firstname } = req.body;
      const updateFirstname = await pool.query("UPDATE students SET firstname = $1 WHERE id = $2", 
                              [firstname, id]);
      res.json(updateFirstname);
  } catch (error) {
      console.log(error)
      return error
  }
})
//delete a student row
student.delete('/deleteStudent/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const deleteStudent = await pool.query("DELETE FROM students WHERE id =$1", [id]);
      res.json(deleteStudent);

  } catch (error) {
      console.log(error)
      return error
  }
})

module.exports = student;