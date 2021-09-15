--NOTES
--1. DONT USE "" instead use ''
--2. Use `` for multiline string
--SELECT QUERIES WITH AS statements can be used for variables
--Commas are used for multiple shiz
--Default is immutable(cant be changed) Example can be used for date data types
--References used https://www.postgresql.org/docs/9.1/
--(for date data types)https://www.geeksforgeeks.org/sql-date-functions/#:~:text=In%20SQL%2C%20dates%20are%20complicated%20for%20newbies%2C%20since,NOW%20%28%29%3A%20Returns%20the%20current%20date%20and%20time.
-- :: operator can be used to cast a variable into a date
-- 

--CREATE student table
CREATE TABLE students_2020(
  id INT GENERATED ALWAYS AS IDENTITY(START WITH 20001 INCREMENT BY 1),
  firstname VARCHAR(30) NOT NULL,
  middleini VARCHAR(10) NOT NULL,
  lastname VARCHAR(30) NOT NULL,
  address VARCHAR(100) NOT NULL,
  gradelevel VARCHAR(30) NOT NULL,
  birthdate DATE NOT NULL,
  sex VARCHAR(5) NOT NULL,
);

CREATE TABLE gradeaccounts_2020(
  gradelevel VARCHAR(50),
  student_id INT NOT NULL,
  entrance INT NOT NULL,
  misc INT NOT NULL,
  aralinks INT NOT NULL,
  books INT NOT NULL,
  tuition INT [] NOT NULL,
  PRIMARY KEY (gradelevel),
  CONSTRAINT fk_student_id
    FOREIGN KEY(student_id)
      REFERENCES students_2020(id)
);

CREATE TABLE studentaccounts_2020(
  account_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id INT NOT NULL,
  gradelevel VARCHAR(50) NOT NULL,
  entrance INT NOT NULL,
  misc INT NOT NULL,
  aralinks INT NOT NULL,
  books INT NOT NULL,
  tuition INT [] NOT NULL,
  prev_balance INT,
  CONSTRAINT fk_gradelevel
    FOREIGN KEY(gradelevel)
      REFERENCES gradeaccounts_2020(gradelevel),
  CONSTRAINT fk_student_id
    FOREIGN KEY(student_id)
      REFERENCES students_2020(id)
);

CREATE TABLE payments_2020(
  payment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id INT NOT NULL,
  account_id INT NOT NULL,
  entrance INT NOT NULL,
  misc INT NOT NULL,
  aralinks INT NOT NULL,
  books INT NOT NULL,
  tuition INT NOT NULL,
  prev_balance INT,
  amount INT,
  payment_date DATE,
  CONSTRAINT fk_student_id
    FOREIGN KEY(student_id)
      REFERENCES students_2020(id),
  CONSTRAINT fk_account_id
    FOREIGN KEY(account_id)
      REFERENCES studentaccounts_2020(account_id)
);

--This query creates a student_accounts table with the same data
CREATE TABLE student_accounts 
AS SELECT * FROM grade_accounts
WHERE grade_level = 'GR1';

--This is also the same but no values added
CREATE TABLE student_accounts 
AS SELECT * FROM grade_accounts
WITH NO DATA


--Insert payments dummy 
INSERT INTO payments(account_id, student_id, entrance_fee, misc_fee, aralinks, books, tuition_fee, amount)
VALUES(14, '21-0003', 500, 800, 200, 100, '{500,500}', 2600)
--Insert 
INSERT INTO payments
 (student_id,entrance_fee, misc_fee, aralinks, books, tuition_fee, amount, account_id)
 VALUES
 (
   '21-0001', 500, 100, 200, 0, '{100,100}', 1000,
   (SELECT account_id FROM student_accounts WHERE student_id = '21-0001')
 );

--SELECT WITH INNER JOIN QUERIES
SELECT id, firstname, lastname, grade_level, misc_fee, entrance_fee, tuition_fee FROM
students INNER JOIN grade_accounts ON students.gradelevel = grade_accounts.grade_level;

SELECT student_id, firstname, lastname, grade_level, misc_fee, entrance_fee, tuition_fee FROM
student_accounts INNER JOIN students ON student_accounts.student_id = students.id;

SELECT 
entrance_fee, misc_fee, aralinks, books, tuition_fee, 
(SELECT tuition_fee[1] FROM grade_accounts WHERE grade_level='K1') AS base_value FROM student_accounts 
WHERE student_id='21-0001';

--unnest array
SELECT SUM(tuitions) AS total_tuitions FROM
(SELECT unnest(ARRAY[tuition]) AS tuitions FROM gradeaccounts_2020 WHERE gradelevel='Grade 1') 
AS b;

--search route
SELECT CONCAT(students_2020.firstname, ', ' students_2020.lastname) AS studentname, gradelevel
FROM students_2020 WHERE firstname = ${name} OR lastname = ${name} OR lastname AND firstname = ${name} 
OR firstname AND lastname = ${name};


--Inserting from two tables without inner join
INSERT INTO student_accounts
SELECT id,grade_level,misc_fee,entrance_fee,tuition_fee FROM students,grade_accounts
WHERE id = 1 AND grade_level = 'GR1';
--cleaner version (with inner join) 
INSERT INTO student_accounts(student_id, grade_level, misc_fee, tuition_fee, entrance_fee)
SELECT id, grade_level, misc_fee, tuition_fee, entrance_fee
FROM students INNER JOIN grade_accounts ON students.gradelevel = grade_accounts.grade_level
WHERE id=5;

--ALTER QUERIES
--alter column payments
ALTER TABLE
payments
ADD CONSTRAINT fk_student_id
  FOREIGN KEY (student_id)
    REFERENCES students(id),
ADD CONSTRAINT fk_account_id
  FOREIGN KEY (account_id)
    REFERENCES student_accounts(account_id);
--alter a sequence
ALTER SEQUENCE student_num
AS INT 
INCREMENT BY 1
START WITH 0001;

--add months for tuition
ALTER TABLE student_accounts
ADD COLUMN aralinks INT,
ADD COLUMN total_balance INT,
ADD COLUMN prev_balance INT;
--generated columns can be used for mostly converting data types or total balances 
--generated columns with stored should be mutable(can be modified)
--add column total balance for student_accounts with generated always as STORED
ALTER TABLE studentaccounts_2020
ADD COLUMN total_balance INT
GENERATED ALWAYS AS 
(
misc + entrance + books + aralinks + prev_balance +
tuition[1] + tuition[2] + tuition[3] + tuition[4] + tuition[5] + tuition[6] + tuition[7] + tuition[8] + tuition[9]
) 
STORED;
--alter table to drop a constraint
ALTER TABLE student_accounts
DROP CONSTRAINT fk_student_id;
--alter a column data type
ALTER TABLE student_accounts
ALTER COLUMN student_id TYPE VARCHAR(50);
--alter a column to remove a default value
ALTER TABLE studentaccounts_2020 ALTER COLUMN discounts DROP DEFAULT;

--reseting tuition fee account based on grade account tuition
UPDATE student_accounts
SET tuition_fee = base.tuition_fee
FROM (SELECT tuition_fee FROM grade_accounts WHERE grade_level = 'K1') AS base
WHERE student_id = '21-0001';

--update query default value
UPDATE student_accounts
SET misc_fee = base.misc_fee, entrance_fee = base.entrance_fee,
aralinks = base.aralinks, books = base.books, tuition_fee = base.tuition_fee
FROM
(SELECT * FROM grade_accounts WHERE grade_level='K1') AS base
WHERE student_id = '21-0003';
--update query 

--substrings with concat using ||
SELECT 
substring(schoolyear_enrolled[1], 3, 2) || '-' || id --substring(2019 2020) 
FROM students
WHERE id = 5;
--select queries can be used as a variable! by using AS
SELECT CAST(SUM(tuitions) AS INT) AS total_tuitions  --cast converts strings
FROM (SELECT unnest(ARRAY[tuition_fee]) AS tuitions FROM grade_accounts WHERE grade_level='GR1') 
AS b; --unnest sets the array into rows(it functions like spread)
--select query for getting the latest row
SELECT lastname, row_number () OVER (ORDER BY lastname) FROM students;

--Sequence queries
CREATE SEQUENCE student_num 
AS INT
INCREMENT BY 1
START WITH 20000
OWNED BY student.id;  

--Date format for psql
ALTER TABLE payments
ADD COLUMN 
payment_date DATE DEFAULT CURRENT_DATE;
--extract function for date
SELECT * FROM payments 
WHERE EXTRACT('YEAR' FROM payment_date) = 2020; --extract year from payment_date column
--add constraint
ALTER TABLE student_accounts
ADD CONSTRAINT tuition_fee
CHECK(tuition_fee >= '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}');

--TEMPLATES
--select account
SELECT student_id, firstname, middleini, lastname, entrance, misc, aralinks,books, tuition, total_balance
FROM studentaccounts_2020 INNER JOIN students_2020 ON studentaccounts_2020.student_id = students_2020.id;

--insert student row
INSERT INTO 
students_2020(firstname, lastname, address, gradelevel, birthdate, sex)
VALUES
('Rolf Ian', 'R', 'Caticlan,Malay,Aklan', 'GR1', '1999-05-03', 'M');

--insert grade_accounts row
INSERT INTO
gradeaccounts_2020(gradelevel, entrance, misc, books, aralinks, tuition)
VALUES('Grade 1', 1500, 2500, 4500, 2500, '{700, 700, 700, 700, 700, 700, 700, 700, 700, 700}');

--insert student_accounts row
INSERT INTO studentaccounts_2020(student_id, gradelevel, entrance, misc, books, aralinks, tuition)
SELECT id, students_2020.gradelevel, entrance, misc, books, aralinks, tuition FROM students_2020 
INNER JOIN gradeaccounts_2020 ON students_2020.gradelevel = gradeaccounts_2020.gradelevel 
WHERE firstname = 'Rolf Ian' AND lastname = 'Rey' ;

--update a student account
UPDATE studentaccounts_2020
SET
prev_balance = 1000,
entrance = 1500,
misc = 2000,
aralinks = 3000,
books = 400,
tuition = '{700, 700, 700, 700, 700, 700, 700, 700, 700}'
WHERE student_id = '20016';

--update student account to default value
UPDATE studentaccounts_2020
SET misc = base.misc, entrance = base.entrance,
aralinks = base.aralinks, books = base.books, tuition = base.tuition,
discounts = '{}'
FROM
(SELECT * FROM gradeaccounts_2020 WHERE gradeaccounts_2020.gradelevel='Grade 1') AS base
WHERE student_id = '20016';

UPDATE studentaccounts_2020
SET
discounts = '{}'
WHERE student_id = '20016';



