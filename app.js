const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const User = require("./db/userModel");

app.listen("3000", () => {
  console.log("Server is running on 3000");
});
app.get("/", (request, response, next) => {
  response.json({ message: "Hey! This is your server response!" });
  next();
});
// require database connection
const dbConnect = require("./db/dbConnect");
// execute database connection
dbConnect();
// Curb Cores Error by adding a header here
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// register endpoint

app.post("/register", (request, response) => {
  // hash the password
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      // create a new user instance and collect the data
      const user = new User({
        email: request.body.email,
        password: hashedPassword,
      });

      // save the new user
      user
        .save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          response.status(201).send({
            message: "User Created Successfully",
            result,
          });
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    // catch error if the password hash isn't successful
    .catch((e) => {
      response.status(500).send({
        message: "Password was not hashed successfully",
        e,
      });
    });
});
app.post("/login", async (request, response) => {
  try {
    const email = request.body.email;
    console.log("email: ", email);
    // check if email exists
    const user = await User.findOne({ email });
    console.log("user: ", user);

    if (!user) {
      return response.status(404).send({ message: "email not found" });
    }
    const checkpass = await bcrypt.compare(
      request.body.password,
      user.password
    );
    console.log("checkpass: ", checkpass);
    if (!checkpass) {
      return response.status(400).send({ message: "email or password wrong" });
    }
    const token = jwt.sign(
      { userID: user._id, userEmail: email },
      "TOKEN_JWT",
      {
        expiresIn: "24h",
      }
    );
    response.status(200).send({
      message: "Login successfull",
      email: email,
      token,
    });
  } catch (error) {
    return response.status(404).send({ message: "there is an error ", error });
  }
});
const auth = require("./auth");
// free endpoint
app.get("/free-endpoint", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

// authentication endpoint
app.get("/auth-endpoint", auth, (request, response) => {
  response.json({ message: "You are authorized to access me" });
});
module.exports = app;
