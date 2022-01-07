// Omar Abdelhadi 
// 101182132
// omarabdelhadi@cmail.carleton.ca

//*************************************   Middle ware for setting up the server  ****************************************** */

//Requiring all files
const express = require('express');
const pug = require("pug");
const path = require("path")
const session = require("express-session");
const { create } = require('domain');
const { response } = require('express');
const MongoDBStore = require("connect-mongodb-session")(session);
const mongo = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const PORT = 3000

//Setting up monogdb
let MongoClient = mongo.MongoClient;


//Getting all the static files and json 
let app = express()
app.use(express.static(path.join(__dirname, "views")));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Importing template engine
app.set("view engine", "pug");

// Mongodb session set up 
let mongoUsers = new MongoDBStore({
    uri: "mongodb://localhost:27017/sessiontest",
    collect: "sessiondata"
});

// Session initialization 
app.use(session({ secret: "some secret", store: mongoUsers }));


// Midleware for all requests 
app.use(function (request, response, next) {
    console.log("____________________________________");
    console.log("Methode: " + request.method);
    console.log("URL: " + request.url);
    console.log("Request type: " + request.get('Accept'));
    console.log("____________________________________");
    next();

});

// User registration variable 
let registered = false;

//******************************************* Express router functions **************************************************** */
app.get(["/home", "/"], homepage);
app.post("/login", login, homepage);
app.get("/logout", logout);
app.get("/getStatus", sendStat);
app.get("/register", register);
app.post("/addUser", addUser);
app.get("/registerStatus", registerStat)
app.get("/users", loguser);
app.get("/users/:id", displayProfile);
app.post("/updatePriv", updatePriv);
app.post("/orders", proccessOrder)
app.get("/orders/:id", displayOrder);

//****************************************************************************************************************** */

// Get request for logging out 
function logout(req, res, next) {
    req.session.logedin = false;
    req.session.username = null;
    req.session.password = null;
    res.render("homepage", { session: req.session });
}

// Post request for logging in 
function login(req, res, next) {
    db.collection("users").find(req.body).toArray((err, results) => {
        if (results.length === 1) {
            req.session.username = req.body.username;
            req.session.password = req.body.password;
            req.session.usrid = results[0]["_id"].toString();
            req.session.privacy = results[0].privacy;
            req.session.logedin = true;
            next()

        }
        else {
            res.status(401).render("error");
        }
    });

}
// Get request to render the homepage
function homepage(req, res, next) {
    res.render("homepage", { session: req.session });
}

// Get request to send status of log in operation 
function sendStat(req, res, next) {
    res.send(req.session.logedin);
}

// Get request for registeration page 
function register(req, res, next) {
    res.render("registration");
}


// Post request to add user into the system
function addUser(req, res, next) {
    console.log(req.body);
    let toSearch = { username: req.body.username };
    db.collection("users").find(toSearch).toArray((err, results) => {
        if (results.length >= 1) {
            console.log("exists");
            res.status(404).send("User already exists");
            registered = false;
        }
        else {
            db.collection("users").insertOne({
                username: req.body.username,
                password: req.body.password,
                privacy: false,
                orders: []
            });

            registered = true;
            res.status(201).send("Registration successful");
        }
    });

}

// Get request to send a status of registration to the client 
function registerStat(req, res, next) {
    res.send(registered);
}

// Get request to display users  
function loguser(req, res, next) {
    let toFind = req.query.name;
    let toDisplay = [];
    db.collection("users").find().toArray((err, results) => {
        console.log(results);
        if (toFind === undefined) {
            for (usr in results) {
                if (results[usr].privacy === false) {
                    toDisplay.push(results[usr]);
                }
            }
        }
        else {
            for (usr in results) {
                if (results[usr].username.toUpperCase().includes(toFind.toUpperCase()) && results[usr].privacy === false) {
                    toDisplay.push(results[usr]);
                }
            }
        }

        res.render("users", { session: req.session, arr: toDisplay });
    });

}

// Get request for displaying a users profile page
function displayProfile(req, res, next) {
    let toSearch = { _id: new ObjectId(req.params.id) };
    db.collection("users").find(toSearch).toArray((err, results) => {
        if (results.length === 1) {
            if (results[0].privacy === true && req.session.usrid != req.params.id) {
                res.statusCode = 404;
                res.end("Error: The user you are trying to access is private");
            } else {
                res.render("user", {
                    session: req.session,
                    id: results[0]._id.toString(),
                    user: results[0].username,
                    order: results[0].orders
                });
            }
        }
        else {
            res.statusCode = 404;
            res.end("User not found");

        }
    });
}

// Post request to update a users privacy settings
function updatePriv(req, res, next) {
    let option = false;
    if (req.body.choice === "true") { option = true; }
    db.collection("users").updateOne(
        { _id: new ObjectId(req.session.usrid), username: req.session.username, password: req.session.password },
        { $set: { "privacy": option } }
    );
    // Updating the current session privacy 
    db.collection("users").find({ username: req.session.username, }).toArray((err, results) => {
        req.session.privacy = results[0].privacy;
        res.render("saved");
    })
}

// Post request to proccess the orders 
function proccessOrder(req, res, next) {
    let order = req.body;
    order.id = new ObjectId()
    console.log(order);
    db.collection("users").updateOne(
        { _id: new ObjectId(req.session.usrid), username: req.session.username, password: req.session.password },
        { $push: { orders: order } }
    );

    res.status(200).send("Order proccessed successfully");
}

function displayOrder(req, res, next) {
    let orderId = req.params.id;
    let procced = false;
    db.collection("users").find().toArray((err, results) => {
        for (item in results) {
            for (ord in results[item].orders) {
                if (results[item].orders[ord].id.toString() === orderId && (results[item].privacy === false || results[item].username === req.session.username)) {
                    procced = true;
                    res.render("order",
                        {
                            order: results[item].orders[ord],
                            user: results[item].username


                        });

                }


            }
        }

        if (!procced) { res.status(403).send("ERROR 403: \nUnauthorized access") }

    });

}
//*********************************************** Helper functions ****************************************************************** */

//************************************************Starting server and connecting to mongo****************************************************************** */

// Starting server on port
MongoClient.connect("mongodb://localhost:27017/", function (err, client) {
    if (err) throw err;

    //Get the database
    db = client.db('a4');

    // Start server once Mongo is initialized
    app.listen(3000);
    console.log("Listening on port 3000");
});