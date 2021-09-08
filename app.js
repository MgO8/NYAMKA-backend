const express = require('express');
const mysql = require('mysql');
const app = express();
const session = require('express-session');

app.use(
  session({
    secret: 'mur',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  if (req.session.userId === undefined) {
    res.locals.username = 'Guest';
    res.locals.isLoggedIn = false;
  } else {
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
  }
  next();
});

const getLocaleString = (date) => {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
  return (new Date(+date - tzoffset)).toISOString().slice(0, -1);
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'kitty',
  password: 'meow',
  database: 'nyamkaAPP'
});

app.get('/', (req, res) => {
  res.render('top.ejs')
});
// удалить это и все подобные 

app.get('/index', (req, res) => {
  connection.query(
    'SELECT * FROM items',
    (error, results) => {
      results.forEach(item => {
        if (item.date !== null) {
          item.date = getLocaleString(item.date).split('T')[0]
        }
      });
      console.log("Result: ", results);
      res.render('index.ejs', { items: results });
      // переписать 
      // сделать res.json(items) 
      // res.json ПОСМОТРЕТЬ
    }
  );
});

app.get('/new', (req, res) => {
  res.render('new.ejs');
});

app.get('/about', (req, res) => {
  res.render('about.ejs');
});

app.post('/create', (req, res) => {
  connection.query(
    'INSERT INTO items (name, price, date) VALUES (?,?,?)',
    [req.body.itemName, req.body.itemPrice, req.body.date],
    (error, results) => {
      res.redirect('/list');
    }
  );
});

app.post('/delete/:id', (req, res) => {
  connection.query(
    'DELETE FROM items WHERE id = ?',
    [req.params.id],
    (error, results) => {
      res.redirect('/list');
    }
  );
});

app.get('/edit/:id', (req, res) => {
  connection.query(
    'SELECT * FROM items WHERE id = ?',
    [req.params.id],
    (error, results) => {
      res.render('edit.ejs', { item: results[0] });
    }
  );
});

app.post('/update/:id', (req, res) => {
  console.log(`itemName : ${req.body.itemName} id: ${req.params.id}`)
  connection.query(
    'UPDATE items SET name = ? WHERE id = ?',
    [req.body.itemName, req.params.id],
    (error, results) => {
      console.log(error)
      res.redirect('/list');
    }
  );
});

app.get('/signup', (req, res) => {
  res.render('signup.ejs')
})

app.post('/signup', (req, res) => {
  const username = req.body.username; 
  const email = req.body.email; 
  const password = req.body.password; 
  connection.query(
    'INSERT INTO users(username, email, password) VALUES (?,?,?)',
    [username, email, password],
    (error, result) => {
      req.session.userId = results.insertId;
      req.session.username = username; 
      res.redirect('/list');
    }
  )
})

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      if (results.length > 0) {
        if (req.body.password === results[0].password){
          req.session.userId = results[0].id;
          req.session.username = results[0].username;
          res.redirect('/list');
        } else {
          res.redirect('/login');
        }    
      } else {
        res.redirect('/login');
      }
    }
  );
});

app.get('/logout', (req, res) => {
  req.session.destroy(error => {
    res.redirect('/');
  });
});


app.listen(3001);