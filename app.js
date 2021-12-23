//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const _ = require("lodash");

var sess;

const app = express();

app.set('view engine','ejs');

app.use(express.static("public"));
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(bodyParser.urlencoded({
  extended:true
}));

mongoose.connect("mongodb://localhost:27017/votingDB");

const candidateSchema = {
    id: String,
    party : String,
    name : String,
    symbol: String,
    votes : Number
};

const Candidate = new mongoose.model("Candidate",candidateSchema);

const userSchema = {
  adhaar: String,
  password: String,
  name : String,
  vote: {
    id: String,
    party : String,
    name : String,
    symbol: String
  }
};

const User = new mongoose.model("User",userSchema);


app.get("/",function(req,res){
    res.render("login",{err:"no"});
  });

app.get("/login",function(req,res){
    res.render("login",{err:"no"});
});

app.post("/login", function(req,res){
  const adhaar = req.body.adhaar;
  const pwd = req.body.password;
  if(adhaar === "admin" && pwd === "admin")
  {
    res.render("admin-dashboard");
  }
  else{
    User.findOne({adhaar:adhaar, password: pwd}, function(err,foundUser){
      if(foundUser){
        sess = req.session;
        sess.user = foundUser;
        res.render("dashboard",{name:foundUser.name});
      }
      else{
        res.render("login",{err:"yes"});
      }
    });
  }
});

app.get("/dashboard",function(req,res){
    res.render("dashboard",{name:req.session.user.name});
});

app.get("/admin-dashboard",function(req,res){
    res.render("admin-dashboard");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register", function(req,res){
  const newUser = new User({
    name : req.body.name,
    adhaar: req.body.adhaar,
    password: req.body.password,
    vote : {}
  });

  newUser.save(function(err){
    if(err){
      res.send(err);
    }
    else{
      res.redirect("/");
    }
  });
});

app.get("/logout", function(req,res){
  res.redirect('/');
});

app.get("/add-candidate", function(req,res){
  res.render("add-candidate");
});

app.post("/add-candidate", function(req,res){
  const party = req.body.party;
  var symbol;
  if(party=='ABC') symbol='star';
  else if(party=='XYZ') symbol='eye';
  else if(party=='PQR') symbol='book';
  else if(party=='HIJ') symbol='bell';

  const newCandidate = new Candidate({
      name : req.body.name,
      id : req.body.id,
      party: req.body.party,
      symbol: symbol,
      votes : 0
  });
  newCandidate.save(function(err){
    if(err){
      res.send(err);
    }
    else{
      res.redirect("/add-candidate");
    }
  });
});

app.get("/vote", function(req,res){
    sess = req.session;
    const user = sess.user;
    console.log(user);
    User.findOne({adhaar:user.adhaar}, function(err,foundUser){
      console.log(foundUser.vote);
      if(foundUser.vote.id){
        res.render("voted");
      }
      else{
        Candidate.find({},function(err, foundCandidates){
            res.render("vote",{candidates: foundCandidates});
        });
      }
    });
});

app.post("/vote",function(req,res){
  sess = req.session;
  const user = sess.user;
  const id = req.body.id;
  Candidate.findOne({id: id}, function(err,foundCandidate){
    const vote = {
      id: foundCandidate.id,
      party : foundCandidate.party,
      name : foundCandidate.name,
      symbol: foundCandidate.symbol
    };
    sess.user.vote = vote;
    var votes = foundCandidate.votes + 1;
    User.updateOne({adhaar: user.adhaar},{vote: vote}).exec((err, posts) => {
      Candidate.updateOne({id: id},{votes: votes}).exec((err, posts) => {
        res.render("dashboard",{name:user.name});
      });
    });
  });
});

app.get("/view-vote", function(req,res){
  sess = req.session;
  const user = sess.user;
  const vote = user.vote;
  console.log(vote);
  if(vote && vote.id)
    res.render("view-vote",{vote:vote});
  else
    res.render("no-vote");
});

app.get("/view-results", function(req,res){
  Candidate.find({}, function(err,foundCandidates){
      res.render("view-results",{candidates:foundCandidates});
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.set("port",port);

app.listen(port,function(){
console.log("Server started successfully.");
});
