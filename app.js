const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const dbpath = path.join(__dirname, "userData.db");
let db = null;

const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initialize();
app.use(express.json());

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("-----------");
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser !== undefined) {
    response.status = 400;
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status = 400;
    response.send("Password is too short");
  } else {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
    const dbResponse = await db.run(createUserQuery);

    response.send("User created successfully");
  }
});

//2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//3.
app.put("/change-password", async (request, response) => {
  console.log("hello");
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * From user WHERE username = "${username}"`;
  const dbUser = await db.get(selectUserQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (newPassword.length < 5) {
    response.status = 400;
    response.send("Password is too short");
  } else if (isPasswordMatched === true) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(hashedPassword);
    console.log(dbUser.username);
    const createUserQuery = `
        update user 
        set password = "${newPassword}"
        where username = "${username}"
       `;
    const dbResponse = await db.run(createUserQuery);

    response.send("Password updated");
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
