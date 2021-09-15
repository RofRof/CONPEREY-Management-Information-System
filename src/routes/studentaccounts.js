require('dotenv').config()
const express = require('express')
const account = express.Router()
const authorization = require('../middleware/authorization') //middleware function to check for invalid tokens
const pool = require('../database/db')
const verifypayment = require('../middleware/verifypayment')
const tablename = require('../middleware/tablename')

account.get('/viewStudentAccounts', authorization, async(req,res) => {
  try {
    const schoolyear= req.header("schoolyear")
    const gradelevel = req.header("gradelevel")
    // console.log(gradelevel)
    let studentaccounts = tablename('studentaccounts', schoolyear)
    let students = tablename('students', schoolyear)
    
    let query = `SELECT student_id, firstname, middleini, lastname, ${students}.gradelevel, entrance, misc, aralinks,books, tuition, prev_balance, total_balance,discounts
                 FROM ${studentaccounts} INNER JOIN ${students} ON ${studentaccounts}.student_id = ${students}.id
                 WHERE ${studentaccounts}.gradelevel = '${gradelevel}' ORDER BY lastname ASC
                `
    const viewAccounts = await pool.query(query)
    res.status(200).json(viewAccounts) 
  } catch (error) {
    console.log(error)
    return res.status(500).json({status: 500, message: 'Internal Server error', error: error})
  }
})

account.get('/searchAccount', authorization, async(req,res) => {
  try {
    const schoolyear= req.header("schoolyear")
    const name  = req.header("name").toLowerCase().replace(/^\w|\s\w/g, ((x) => x.toUpperCase())).replace(/(\s+\W)/g, '')
    let studentaccounts = tablename('studentaccounts', schoolyear)
    let students = tablename('students', schoolyear)

    let query = `SELECT student_id, firstname, middleini, lastname, ${students}.gradelevel, entrance, misc, aralinks,books, tuition, prev_balance, total_balance,discounts
                FROM ${studentaccounts} INNER JOIN ${students} ON ${studentaccounts}.student_id = ${students}.id
                WHERE ${students}.firstname = '${name}' 
                OR ${students}.lastname = '${name}'
                OR CONCAT(${students}.lastname, ' ', ${students}.firstname) = '${name}'
                OR CONCAT(${students}.firstname, ' ', ${students}.lastname) = '${name}'
                ORDER BY lastname ASC
                `
    const searchAccounts = await pool.query(query)
    res.status(200).json(searchAccounts)
  }
  catch (error) {
    console.log(error)
    return res.status(500).json({status: 500, message: 'Internal Server error', error: error})
  }
})

account.post('/payStudentAccount', authorization, verifypayment, async(req,res) => {
  try {
    const { studentID, schoolyear, payAmount } = req.body
 
    let studentaccounts = tablename("studentaccounts", schoolyear)
    let payments = tablename('payments', schoolyear)
    let query = `
                SELECT entrance, misc, aralinks, books, tuition, prev_balance 
                FROM ${studentaccounts} WHERE student_id = ${studentID}
                `
    const getFees = await pool.query(query)
    let { entrance, misc, aralinks, books, tuition, prev_balance } = getFees.rows[0]
    let feesArray = [prev_balance, entrance, misc, aralinks, books] //feesArray[0] = payArray[0]; this means entrance = payEntrance                  
    let payFeesArray = [0, 0, 0, 0, 0] //payment values to use for updating student accounts 
    let payTuitionArray = [] //this is the array for payment of tuition

    const amount = parseInt(payAmount, 10) //convert string to int
    let change = amount
    
    for(let i = 0; i <= 5; i++){
      if(change > feesArray[i]){
        payFeesArray[i] = feesArray[i]
        change = change - feesArray[i]
      }
      else if(change < feesArray[i]){
        payFeesArray[i] = change
        break
      }
      else if(change == feesArray[i]){
        payFeesArray[i] = change
        break
      }
      if(i == 5 && change != 0){
        // console.log('change inside tuition', change)
        for(let i = 0; i < tuition.length; i++){ 
          if(change > tuition[i]){
            change = change - tuition[i]
            payTuitionArray.push(tuition[i])
          }
          else if(change < tuition[i]){
            payTuitionArray.push(change)
            break
          }
          else if(change == tuition[i]){
            payTuitionArray.push(change)
            break
          }
        }
      }
    }
    
    let updatedFees = []
    let updatedTuition = []
    let addZero = [] 
    
    //this is to add zeroes to payTuition array so that it can match when subtracting it to tuition array
    for(let i = 0; i < tuition.length - payTuitionArray.length; i++){
      addZero.push(0)
    }
    payTuitionArray.push.apply(payTuitionArray, addZero) //functions like concat
    //substracts the payment amount to the fees
    for(let i = 0; i < feesArray.length; i++){
      fees = feesArray[i] - payFeesArray[i]
      updatedFees.push(fees)
    }
    //subtract the payment amount of tuition to tuition
    for(let i = 0; i < tuition.length; i++){
      fees = tuition[i] - payTuitionArray[i]
      updatedTuition.push(fees)
    }
    // console.log("prev balance, entrance, misc, aralinks, books")
    // console.log(`pay fees array ${payFeesArray}`)
    // console.log("tuition")
    // console.log(`pay fees array ${payTuitionArray}`)

    const query1 = `INSERT INTO ${payments}(student_id, prev_balance, entrance, misc, aralinks, books, tuition, amount)
                    VALUES 
                      (${studentID}, ${payFeesArray[0]}, ${payFeesArray[1]}, ${payFeesArray[2]}, 
                      ${payFeesArray[3]}, ${payFeesArray[4]}, '{${payTuitionArray}}', ${payAmount})
                    `
   
    const query2 = `UPDATE ${studentaccounts}
                    SET 
                    prev_balance = ${updatedFees[0]},
                    entrance = ${updatedFees[1]},
                    misc = ${updatedFees[2]},
                    aralinks = ${updatedFees[3]},
                    books = ${updatedFees[4]},
                    tuition = '{${updatedTuition}}'
                    WHERE student_id = '${studentID}'
                    `
    const addPayment = await pool.query(query1)
    const updateFees = await pool.query(query2)

    res.json({status: 200, message: 'Success', payFeesArray, payTuitionArray})

  } catch (error) {
    console.log(error)
    res.status(500).json({status: 500, message: 'Internal Server error', error: error})
  }
})

account.put('/payInitial/:id', authorization, async(req,res) => {
  try {
    const student_id = req.params.id
    const {schoolyear, fees} = req.body
    const payments = tablename('payments', schoolyear)
    const studentaccounts = tablename('studentaccounts', schoolyear)
    let verifyInitialPayment = ''

    const query1 = `SELECT * FROM ${payments} WHERE student_id = ${student_id}`
    const checkInitialPay = await pool.query(query1)
    const query2 = `
                    SELECT prev_balance, entrance, misc, aralinks, books, tuition 
                    FROM ${studentaccounts} WHERE student_id = ${student_id}
                    `
    const getFees = await pool.query(query2)

    checkInitialPay.rowCount != 0 ? verifyInitialPayment = false : verifyInitialPayment = true
    
    if(verifyInitialPayment == false){
      res.json({status: 400, message: 'Initial payment has already been paid'})
    }
    else if(getFees.rows[0].prev_balance != 0){
      res.json({status: 400, message: 'Student still has balance from previous year'})
    }
    else{ 
      const {entrance, misc, aralinks, books, tuition} = getFees.rows[0]
      let baseFees = [entrance, misc, aralinks, books]
      let updatedFees = []
      let updatedTuition = []
      let amount = fees.reduce((a, b) => a + b)
      
      for(let i = 0; i < baseFees.length; i++){
        updatedFees.push(baseFees[i] - fees[i])
      }
      for(let i = 0; tuition.length > i; i++){
        let updated = tuition[i] - (tuition[i] * 0.10)
        updatedTuition.push(updated)
      }
      console.log(updatedTuition)
      const query3 = `
                      UPDATE ${studentaccounts} SET 
                      entrance = ${updatedFees[0]},
                      misc = ${updatedFees[1]},
                      aralinks = ${updatedFees[2]},
                      books = ${updatedFees[3]},
                      tuition = '{${updatedTuition}}',
                      discounts = array_append(discounts, '-10% Tuition')
                      WHERE student_id = ${student_id}
                    `
      const query4 = `
                      INSERT INTO ${payments}(student_id, prev_balance, entrance, misc, aralinks, books, tuition, amount)
                      VALUES 
                      (${student_id}, 0 , ${fees[0]}, ${fees[1]}, ${fees[2]}, ${fees[3]}, '{0, 0, 0, 0, 0, 0, 0, 0, 0}' , ${amount})
                    `               
                      
      const updatePayment = await pool.query(query4)
      const updateAccount = await pool.query(query3)
      
      res.json({status: 200, message: 'Success', fees})
    }
  } catch (error) {
    res.status(500).json({status: 500, message: 'Internal Server error', error: error})
  }

})

account.put('/updateDiscount/:id', authorization, async(req, res) => {
  try {
    const student_id = req.params.id
    const {famDiscount, honorDiscount, schoolyear} = req.body
    const studentaccounts = tablename('studentaccounts', schoolyear)
    const students = tablename('students', schoolyear)
    
    const query1 = `SELECT tuition, discounts FROM ${studentaccounts} WHERE student_id = ${student_id}`
    const getTuition = await pool.query(query1)
    let {tuition, discounts} = getTuition.rows[0]
    // compare the values of individual tuition to check if it has been paid
    const verifyTuition = (currentVal) => tuition[0] == currentVal 
    const invalidSiblingName = (currentVal) => currentVal == true
    const siblingNames = []
    
    for(let i = 0; famDiscount.length > i; i++){
      const query = `SELECT firstname, lastname FROM ${students} WHERE CONCAT(firstname, ' ', lastname) = '${famDiscount[i]}'`
      await pool.query(query).then((res) => res.rowCount == 0 ? siblingNames.push(true) : siblingNames.push(false))  
    }
    
    if(parseInt(famDiscount.length) > 4) {
      res.json({status: 400, message: 'Maximum sibling discount can only be up to 4'})
    }
    else if(siblingNames.every(invalidSiblingName) == true){
      res.json({status: 400, message: 'Invalid sibling name'})
    }
    else if(discounts.length >= 3){
      res.json({status: 400, message: 'Account has already reached maximum available discounts'})
    } 
    else if(tuition.every(verifyTuition) == false || tuition.reduce((a, b) => a + b) == 0) {
      res.json({status: 400, message: 'Tuition fee has already been paid'})
    }
    else if(honorDiscount == 'None' && famDiscount.length == 0){
      res.json({status: 400, message: 'Empty or Invalid input'})
    }
    else {
      let honorDiscountDeduction = 0
      let siblingDiscountDeduction = 0
      let updatedDiscountTags = []
      
      switch(honorDiscount) {
        case 'With Honors':
          honorDiscountDeduction = 0.25
          updatedDiscountTags.push('-25% Tuition')
          break
        case 'With High Honors':
          honorDiscountDeduction = 0.50
          updatedDiscountTags.push('-50% Tuition')
          break
        case 'With Highest Honors':
          honorDiscountDeduction = 1
          updatedDiscountTags.push('-100% Tuition')
          break
        case 'None':
          honorDiscountDeduction = 0
          updatedDiscountTags.push()
          break
        default: 
          res.json({status: 401, message: 'Invalid option'})
      }
      switch(famDiscount.length) {
        case 0:
          siblingDiscountDeduction = 0
          updatedDiscountTags.push()
          break
        case 1:
          siblingDiscountDeduction = 50
          updatedDiscountTags.push('-(P50) Tuition')
          break
        case 2:
          siblingDiscountDeduction = 100
          updatedDiscountTags.push('-(P100) Tuition')
          break
        case 3:
          siblingDiscountDeduction = 150
          updatedDiscountTags.push('-(P150) Tuition')
          break
        default:
          res.json({status: 401, message: 'Invalid option'})
      }
  
        // update the siblings of student discount tags and fee
        famDiscount.map(async(x) => {
          const query3 = `SELECT tuition FROM studentaccounts_2020
                          WHERE student_id = 
                          (SELECT id FROM ${students} WHERE CONCAT(firstname, ' ', lastname) = '${x}')`
    
          let updatedSiblingDiscountTag = []
          const getDiscountSibling = await pool.query(query3)
          const { tuition } = getDiscountSibling.rows[0]
          updatedSiblingDiscountTag.push(`-(P${siblingDiscountDeduction}) Tuition`)
          
          let updatedSiblingTuition = tuition.map((x) => {
            x = Math.round(x - siblingDiscountDeduction)
            x < 0 ? x = 0 : x = x
            return x 
          }) 
    
          const updateSiblingsQuery = ` UPDATE ${studentaccounts} SET 
                                        discounts = array_append(discounts, '${updatedSiblingDiscountTag}'),
                                        tuition = '{${updatedSiblingTuition}}'
                                        WHERE student_id = (SELECT id FROM ${students} 
                                        WHERE CONCAT(firstname, ' ', lastname) = '${x}'); `
          await pool.query(updateSiblingsQuery)
          updatedSiblingDiscountTag = []
        })
        // update tuition of student
        let updatedTuition = tuition.map((x) => {
          x = x - Math.round((x * honorDiscountDeduction))
          x = Math.round(x - siblingDiscountDeduction)
          x < 0 ? x = 0 : x = x
          return x 
        }) 
        
        let updateQuery = ` UPDATE ${studentaccounts} 
                            SET discounts = array_append(discounts, '${updatedDiscountTags}'), 
                            tuition = '{${updatedTuition}}' 
                            WHERE student_id = ${student_id}`
            
        let update = await pool.query(updateQuery)
        res.json({status: 200, update})
    }

  }
  catch(error){
    res.json({status: 500, message: 'Internal Server Error', error: error})
  }
})

account.put('/clearDiscount/:id', authorization, async(req,res) => {
  try {
    const student_id = req.params.id
    const { schoolyear } = req.body
    let studentaccounts = tablename('studentaccounts', schoolyear)
    let gradeaccounts = tablename('gradeaccounts', schoolyear)
    let students = tablename('students', schoolyear)

    const query1 = `  UPDATE ${studentaccounts}
                      SET tuition = base.tuition, discounts = '{}'
                      FROM (SELECT tuition FROM ${gradeaccounts} WHERE gradelevel = 
                      (SELECT gradelevel FROM ${students} WHERE id = ${student_id})) AS base
                      WHERE ${studentaccounts}.student_id = ${student_id}`

    const updateAccount = await pool.query(query1)
    res.json({status: 200, message: 'Success'})
  } catch (error) {
    res.json({status: 500, message: 'Internal Server Error', error: error})
  }
})

module.exports = account

