const express = require('express');
const mysql = require('mysql');
const app = express();
const session = require('express-session');
const cors = require('cors');

app.use(cors());
app.use(express.json());

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
  // console.log('DATE: ', date)
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

app.get('/list', (req, res) => {
  connection.query(
    'SELECT * FROM items',
    (error, results) => {
      console.log(error)
      results.forEach(item => {
        if (item.date !== null) {
          item.date = getLocaleString(item.date).split('T')[0]
        }
      });
      // console.log("Result: ", results);
      res.json({ items: results });
      // res.render('index.ejs', { items: results });
      // переписать 
      // сделать res.json(items) 
      // res.json ПОСМОТРЕТЬ
    }
  );
});

app.post('/create', (req, res) => {
  const isDateValid = req.body.date !== "";
  if (!isDateValid) {
    res.status(400).send({ message: 'Date is invalid' });
  } else {
    connection.query(
      'INSERT INTO items (name, price, date) VALUES (?,?,?)',
      [req.body.name, req.body.price, req.body.date],
      (error, results) => {
        connection.query(
          `SELECT * FROM items WHERE id = ${results.insertId}`,
          (error, results) => {
            res.json(results);
          }
        )
        // res.redirect('/list');
        // редирект не нужно делать. нужно разобраться с роутингом в реакте 

        // отдать обратно созданный айтем (как сделать?)
        // как сделать КРАСИВО ???
      }
    );
  }


});

app.delete('/delete/:id', (req, res) => {
  console.log('brrmeow')
  connection.query(
    'DELETE FROM items WHERE id = ?',
    [req.params.id],
    (error, results) => {
      console.log(results)
      res.json(req.params.id);
    }
  );
});

app.post('/update/:id', (req, res) => {
  console.log(`itemName : ${req.body.name} id: ${req.params.id}`)
  connection.query(
    'UPDATE items SET name = ? WHERE id = ?',
    [req.body.name, req.params.id],
    (error, results) => {
      connection.query(
        `SELECT * FROM items WHERE id = ${req.params.id}`,
        (error, results) => {
          res.json(results);
        }
      )
    }
  );
});

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
      res.json(results);
    }
  )
})

app.post('/login', (req, res) => {
  const email = req.body.email;
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      if (results.length > 0) {
        if (req.body.password === results[0].password) {
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

app.listen(3001);