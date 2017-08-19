const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const fs = require('fs');
const _ = require('lodash');
const words = fs.readFileSync('/usr/share/dict/words', 'utf-8').toLowerCase().split('\n');

const app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');


// middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
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
  if(req.session.chosenWord) {
    next();
  } else {
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


let incorrectGuess = ((req) => {
  if (req.session.turnsLeft === 0) {
    console.log('you lose');
    let loseMsg = 'Sorry, you lost!';
    req.session.loseMsg = loseMsg;
  } else {
    req.session.turnsLeft --;
  }
});


let correctGuess = ((req, letterGuessed) => {
  req.session.chosenWordArray.forEach((letter, index) => {
    if (letter === letterGuessed) {
      req.session.blanks[index] = req.session.chosenWordArray[index];
    }
  });

  if (req.session.chosenWordArray.join() === req.session.blanks.join()) {
    console.log('ya done won');
    let winMsg = 'ya done won son';
    req.session.winMsg = winMsg;
  }
});


// post when form is submitted
app.post('/guess', (req, res) => {
  // req.checkBody('letterGuessed', 'Guess must be 1 letter.').isAlpha().isLength({min:1, max:1});
  // let errors = req.validationErrors();

  let letterGuessed = req.body.letterGuessed;
  
  if (req.session.chosenWordArray.includes(letterGuessed)) {
    correctGuess(req, letterGuessed);
  } else {
    incorrectGuess(req);
  }

  res.render('index', {
    letterGuessed: letterGuessed, 
    word: req.session.chosenWord, 
    blanks: req.session.blanks.join(' '),
    turnsLeft: req.session.turnsLeft,
    loseMsg: req.session.loseMsg,
    winMsg: req.session.winMsg
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
