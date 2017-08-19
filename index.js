const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
// const parseurl = require('parseurl');
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
  let chosenWordArray = chosenWord.split('');
  req.session.blanks = new Array(chosenWordArray.length).fill(' _ ');
  console.log(req.session.blanks);

  req.session.chosenWord = chosenWord;
  req.session.chosenWordArray = chosenWordArray;    
  console.log('request session', req.session);
  req.session.turnsLeft = 8;
});


// middleware performed on every request
app.use((req, res, next) => {
  // if(letterGuessed.length > 1)
  if(req.session.chosenWord) {
    next();
  } else {
    // function to run for first time
    chooseWord(req);
    next();
  }
});


// initial root get request
app.get('/', (req, res) => {
  res.render('index', {
    word: req.session.chosenWord,
    blanks: req.session.blanks.join(' '),
    turnsLeft: req.session.turnsLeft
  });
});


// post when form is submitted
app.post('/guess', (req, res) => {
  // todo: add validation on form with express-validtor isLength
  let letterGuessed = req.body.letterGuessed;

  if (req.session.chosenWordArray.includes(letterGuessed)) {

    req.session.chosenWordArray.forEach((letter, index) => {
      if (letter === letterGuessed) {
        req.session.blanks[index] = req.session.chosenWordArray[index];
      }
    });

  } else {
    if (req.session.turnsLeft === 0) {
      console.log('you lose');
    } else {
      req.session.turnsLeft --;
    }
  }

  res.render('index', {
    letterGuessed: letterGuessed, 
    word: req.session.chosenWord, 
    blanks: req.session.blanks.join(' '),
    turnsLeft: req.session.turnsLeft
  });
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
