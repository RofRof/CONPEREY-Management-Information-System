module.exports = async = (tablename, schoolyear) => {
  try{
    const name = tablename + '_' + schoolyear
    return name
  }
  catch(error){
    return error
  }
 
}





