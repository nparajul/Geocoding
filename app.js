const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const favicon = require('static-favicon');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const geo = require('mapbox-geocoding');
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

geo.setAccessToken('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
const app = express();
app.use(bodyParser.json());
app.set('view engine', 'pug');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(favicon());
app.use(bodyParser.urlencoded());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({secret: 'admin'}))
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());
app.use(passport.session());

var urlencodedParser = bodyParser.urlencoded({ 
    extended: true 
});

var Contact = mongoose.model('Contact', {
    prefix: String,
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    state: String, 
    zip: String,
    phone: String,
    email: String,
    contactByMail: String,
    contactByPhone: String,
    contactByEmail: String,
    lat: String,
    lng: String
});

mongoose.connect("mongodb://localhost:27017", {
     useNewUrlParser: true },
      (err) => {
    console.log('Connected to DB');
})

// Aunthentication
var username = "admin";
var password = "xxxxxxxxxx";

bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, function (err, hash) {
        password = hash;
        console.log("Hashed password = " + password);
    });
});


passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password'
    },

    function (user, pwd, done) {
        if (user != username) {
            return done(null, false);
        }

        bcrypt.compare(pwd, password, function (err, loggedIn) {
            if (err) return done(err);
            if (!loggedIn) {
                console.log("Wrong Password");
            }
            else {
                console.log("Successfully logged in!");
            }
            done(null, loggedIn);
        });
    }
));

passport.serializeUser(function (username, done) {
    // this is called when the user object associated with the session
    // needs to be turned into a string.  Since we are only storing the user
    // as a string - just return the username.
    done(null, username);
});

passport.deserializeUser(function (username, done) {
    // normally we would find the user in the database and
    // return an object representing the user (for example, an object
    // that also includes first and last name, email, etc)
    done(null, username);
});


app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/contacts',
        failureRedirect: '/login_fail',
    })
);

var ensureLoggedIn = function (req, res, next) {
    if (req.user) {
        next();
    }
    else {
        res.redirect("/login");
    }
}
app.get('/login', function (req, res) {
    res.render('login_success', {});
});

app.get('/login_fail', function (req, res) {
    res.render('login_fail', {});
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login');
});

app.get('/mailer', function (req, res) {
    res.sendFile(__dirname + "/public/index.html");
})

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/public/index.html");
})

app.post('/mailer', urlencodedParser, (req, res) => {
    let mail = "No";
    let phone = "No";
    let email = "No";

    if(req.body.any == "Any"){
        mail="Yes";
        phone=req.body.phoneNum;
        email=req.body.emailAdd;
    }

    else{
        if (req.body.mail == "Mail")  {
            mail = "Yes";
        }
        if (req.body.phone == "Phone")  {
            phone = req.body.phoneNum;
        }
        if (req.body.email == "Email"){
            isEmail = req.body.emailAdd;
        }
    }
    const address = req.body.street + " " + req.body.city + " " + req.body.state + " " + req.body.zip;
    console.log("Address to geocode is " + addressToGeoCode);

    geo.geocode('mapbox.places', addressToGeoCode, function (err, geoData) {
        const lng = geoData.features[0].center[0];
        const lat = geoData.features[0].center[1];
        console.log("Longitude is " + lng);
        console.log("Latitude  is " + lat);

        var document = {
            prefix: req.body.prefix,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            phone: req.body.phoneNum,
            email: req.body.emailAdd,
            contactByMail: mail,
            contactByPhone: phone,
            contactByEmail: email,
            lat: lat,
            lng: lng
        }
        var fullName = document.firstName + " " + document.lastName;
         
        if (typeof document.prefix == "undefined"){
            console.log("UNDEFINED PREFIX")
        }
        else {
            fullName = document.prefix + " " + fullName;
        }

        var toSend = {
            fullName: fullName,
            address: document.street + ", " + document.city + ", " + document.state + " " + document.zip,
            contactByPhone: isPhone,
            contactByMail: mailBool,
            contactByEmail: isEmail,
            lng: lng,
            lat: lat
        }

        Contact.insertMany(document);
        res.render('success.pug', { toSend: toSend });

    });
})

app.get("/contacts" , ensureLoggedIn, (req, res) => {
    Contact.find({}, (err, data) => {
        res.render('contacts.pug', { data: data });
    });
})


app.post('/contacts', ensureLoggedIn, function (req, res) {
    var fullAddress = req.body.street + " " + req.body.city + " " + req.body.state + " " + req.body.zip;
    let mail = "No";
    let phone = "No";
    let email = "No";

    if(req.body.any == "Any"){
        mail="Yes";
        phone=req.body.phoneNum;
        email=req.body.emailAdd;
    }

    else{
        if (req.body.mail == "Mail")  {
            mail = "Yes";
        }
        if (req.body.phone == "Phone")  {
            phone = req.body.phoneNum;
        }
        if (req.body.email == "Email"){
            isEmail = req.body.emailAdd;
        }
    }

    geo.geocode('mapbox.places', fullAddress, function (err, geoData) {
        const lng = geoData.features[0].center[0];
        const lat = geoData.features[0].center[1];
        req.body.lat = lat;
        req.body.lng = lng;

        Contact.updateOne(
            { "_id": req.body.custId },
            { 
                $set: {   
                        "prefix": req.body.prefix, 
                        "firstName": req.body.firstName, 
                        "lastName": req.body.lastName, 
                        "street": req.body.street, 
                        "city": req.body.city, 
                        "state": req.body.state, 
                        "zip": req.body.zip, 
                        "phone": req.body.phoneNum, 
                        "email": req.body.emailAdd,
                        "lat": req.body.lat, 
                        "lng": req.body.lng, 
                        "contactByMail": mailBool, 
                        "contactByPhone": isPhone, 
                        "contactByEmail": isEmail 
                    } 
            }
        )
            .then((obj) => {
                Contact.find({}, (err, data) => {
                    res.render('contacts.pug', { data: data });
                });
            })
    });
})

app.post('/delete', ensureLoggedIn, function (req, res) {
    Contact.deleteOne({ "_id": req.body.contactId }, function (err) {
        if (err) {
            throw err;
        }
        else {
            res.send("Success");
        }
    });
})

module.exports =app;
app.listen(4000);