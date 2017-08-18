const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const parseurl = require('parseurl');
const fs = require('fs');
let _ = require('lodash');
const words = fs.readFileSync('/usr/share/dict/words', 'utf-8').toLowerCase().split('\n');

const app = express();

app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');


// middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('combined'));


app.use(session({
  name: 'userSession',
  secret: 'spookykey',
  resave: false,
  saveUninitialized: true
}));


// function to choose word
let chooseWord= ((req) => {
  let chosenWord = _.sample(words);
  req.session.blanks = new Array(chosenWord.length).fill(' _ ').join(' ');
  console.log(req.session.blanks);

  req.session.solve = chosenWord;    
  console.log('request session', req.session);
});


// middleware performed on every request
app.use((req, res, next) => {
  if(req.session.solve) {
    next();
  } else {
    chooseWord(req);
    next();
  }
});

// initial root get request
app.get('/', (req, res) => {
  res.render('index', {word: req.session.solve, blanks: req.session.blanks});
});


// post when form is submitted
app.post('/guess', (req, res) => {
  let letterGuessed = req.body.letterGuessed;
  console.log('you guessed', letterGuessed);
  res.render('index', {letterGuessed: letterGuessed, word: req.session.solve, blanks: req.session.blanks});
});


// get to destroy session
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});


// port listener
app.listen(3020, (req, res) => {
  console.log('app is running on port 3020');
});
