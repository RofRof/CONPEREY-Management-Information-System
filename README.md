##Conperey MIS 

DESCRIPTION
This web application was a little project of mine made to digitalize the accounting assets of Conperey Integrated Learning School(CILS).

INSTALLATION
  Dependencies:
    -Node.js
    -Node Package Manager
    -PostgreSQL

INITIALIZATION
  STEP 1: Create a postgresql user by opening the psql shell. It is important to remember the postgresql user details as you will 
  use it for your .env's later.
  STEP 2: Create a database for the backend, "conperey" is a recommended name but it is optional.
  STEP 3: Import the schema by running this command: "psql -U psqluser -d dbname >> database"
  STEP 4: Inside the backend folder create a .env file, contents should be the ff:
	   PORT=5000
	   PGHOST='localhost'
	   PGUSER='postgres'
	   PGPASSWORD='dbpassword'
	   PGDATABASE='dbname'
	   PGPORT=5432
	   JWTSECRET='jwtpass'

STARTING THE BACKEND
  Inside the backend folder run commands sequentially: 
  -npm install
  -npm install nodemon -g
  -nondemon npm start

STARTING THE FRONTEND
  Inside the frontend folder run comnabds sequentially:
  -npm install
  -npm start

Conperey MIS is now running @localhost:3000, to login use:
-Username: admin1
-Password: testpass

CONTACTS 
Contact No.: 09194110125
Email: rolfianreyy@gmail.com


  