require('dotenv').config()
const express = require('express')
const payment = express.Router()
const authorization = require('../middleware/authorization')
const pool = require('../database/db')
const tablename = require('../middleware/tablename')

payment.get('/viewPayments', authorization, async(req, res) => {
  try {
    const schoolyear = req.header("schoolyear")
    const paymentDate = req.header("paymentDate")
    const payments = tablename('payments', schoolyear)
    const students = tablename('students', schoolyear)
    
    const query1 = `
                    SELECT 
                    payment_id, student_id, firstname, lastname, middleini, gradelevel, payment_date, 
                    entrance, misc, books, aralinks, prev_balance, amount, tuition,
                    (tuition[1] + tuition[2] + tuition[3] + tuition[4] + tuition[5] + tuition[6] + tuition[7] + tuition[8] + tuition[9])
                    AS total_tuition
                    FROM ${payments} INNER JOIN ${students} ON ${payments}.student_id = ${students}.id 
                    WHERE payment_date = '${paymentDate}'
                    `
    const getPayments = await pool.query(query1)
    res.status(200).json(getPayments)
  } catch (error) {
    res.json({ status: 500, message: 'Internal Server Error', error: error })
  }
})

payment.get('/searchPayment', authorization, async(req, res) => {
  try {
    const schoolyear = req.header('schoolyear')
    const name = req.header('name')
    const payments = tablename('payments', schoolyear)
    const students = tablename('students', schoolyear)

    const query1 = `
                    SELECT 
                    payment_id, student_id, firstname, lastname, middleini, gradelevel, payment_date, 
                    entrance, misc, books, aralinks, prev_balance, amount, tuition,
                    (tuition[1] + tuition[2] + tuition[3] + tuition[4] + tuition[5] + tuition[6] + tuition[7] + tuition[8] + tuition[9])
                    AS total_tuition
                    FROM ${payments} INNER JOIN ${students} ON ${payments}.student_id = ${students}.id 
                    WHERE ${students}.firstname = '${name}' 
                    OR ${students}.lastname = '${name}'
                    OR CONCAT(${students}.lastname, ' ', ${students}.firstname) = '${name}'
                    OR CONCAT(${students}.firstname, ' ', ${students}.lastname) = '${name}'
                    ORDER BY lastname ASC
                    `
    const searchPayment = await pool.query(query1)
    res.status(200).json(searchPayment)
  } catch (error) {
    res.json({ status: 500, message: 'Internal Server Error', error: error })
  }
})

payment.get('/report/:from/:to/:schoolyear', authorization, async(req, res) => {
  const fromDate = req.params.from
  const toDate = req.params.to
  const schoolyear = req.params.schoolyear
  const payments = tablename('payments', schoolyear)
  const students = tablename('students', schoolyear)

  const query1 = `
                  SELECT 
                  payment_id, student_id, firstname, lastname, middleini, gradelevel, payment_date, 
                  entrance, misc, books, aralinks, prev_balance, amount, tuition,
                  (tuition[1] + tuition[2] + tuition[3] + tuition[4] + tuition[5] + tuition[6] + tuition[7] + tuition[8] + tuition[9])
                  AS total_tuition
                  FROM ${payments} INNER JOIN ${students} ON ${payments}.student_id = ${students}.id 
                  WHERE payment_date BETWEEN '${fromDate}' AND '${toDate}'
                `
  const getReport = await pool.query(query1)
  res.json(getReport)
})

payment.delete('/refundPayment', authorization, async(req, res) => {
  try {
    const { schoolyear, studentID, paymentID, prevBalance, entranceFee, miscFee, aralinksFee, booksFee, tuitionFee } = req.body
    const payments = tablename('payments', schoolyear)
    const studentaccounts = tablename('studentaccounts', schoolyear)

    const query1 = `SELECT prev_balance, entrance, misc, aralinks, books, tuition 
                    FROM ${studentaccounts} WHERE student_id='${studentID}'`
    const getBaseFee = await pool.query(query1)
    
    const { prev_balance, entrance, misc, aralinks, books, tuition } = getBaseFee.rows[0]
    const refundFee = [prevBalance, entranceFee, miscFee, aralinksFee, booksFee]
    const baseFee = [prev_balance, entrance, misc, aralinks, books]
    const updatedFee = []
    const updatedTuition = []
    // proccess to update fee
    for(let i = 0; baseFee.length > i; i++){
      const updated = baseFee[i] + refundFee[i]
      updatedFee.push(updated)
    }
    for(let i = 0; tuition.length > i; i++){
      const updated = tuition[i] + tuitionFee[i]
      updatedTuition.push(updated)
    }
    const query2 = `
                    UPDATE ${studentaccounts} SET prev_balance=${updatedFee[0]}, entrance=${updatedFee[1]}, 
                    misc=${updatedFee[2]}, aralinks=${updatedFee[3]}, books=${updatedFee[4]}, tuition='{${updatedTuition}}'
                    WHERE student_id=${studentID}
                    `
    const query3 = `DELETE FROM ${payments} WHERE payment_id='${paymentID}'`
    const updateStudentAccount = await pool.query(query2)
    const deletePayment = await pool.query(query3)
    res.json({ status: 200, message: 'Success', updateStudentAccount, deletePayment })
    
  } catch (error) {
    console.log(error)
    res.json({ status: 500, message: 'Internal Server Error', error: error })
  }
})

module.exports = payment