const express = require("express");

const session = require("express-session");
const bodyParser = require("body-parser");
const TWO_HOURS = 1000 * 60 * 60 * 2;
const {
  PORT = 8000,
  SESS_LIFETIME = TWO_HOURS,
  SESS_NAME = "sid",
  NODE_ENV = "development",
  SESS_SECRET = "itsaSecret://",
} = process.env;
const app = express();
const users = [
  {
    id: 1,
    name: "alex",
    email: "alex@gmail.com",
    password: "secret",
  },
  {
    id: 2,
    name: "john",
    email: "john@gmail.com",
    password: "secret",
  },
  {
    id: 3,
    name: "ben",
    email: "ben@gmail.com",
    password: "secret",
  },
];
const IN_PROD = NODE_ENV === "production";
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secure: true,
    secret: SESS_SECRET,
    cookie: {
      maxAge: SESS_LIFETIME,
      samSite: true,
      secure: IN_PROD,
    },
  })
);
const redirectMiddlewarelogin = (req, res, next) => {
  if (!req.session.userID) {
    res.redirect("/login");
  } else {
    next();
  }
};
const redirectMiddlewarehome = (req, res, next) => {
  if (req.session.userID) {
    res.redirect("/home");
  } else {
    next();
  }
};
app.use((req, res, next) => {
  const userID = req.session.userID;
  if (userID) {
    res.locals.user = users.find((user) => user.id === userID);
  }
  next();
});
app.get("/", (req, res) => {
  const { userID } = req.session;

  res.send(` <h1>Session-Authentication with Express<h1/>
  ${
    userID
      ? ``
      : `<a href='/login'> Login </a>
    <br/>
    <a href="/register"> Register </a><br/>`
  }
  <a href="/home"> Home </a>
  <form action='/logout' method='post' > <button>Logout</button> </form>
    `);
});
app.get("/home", redirectMiddlewarelogin, (req, res) => {
  const { user } = res.locals;
  res.send(`
  <div>Home page</div>
  <h1>Welcome ${user.name}</h1>
  <h2>Email:${user.email} </h2>
  <br/>
  <a href='/'>home<a/>
  `);
});
app.get("/login", redirectMiddlewarehome, (req, res) => {
  res.send(`
  <h1>Login Page</h1>
  <form action='/login' method ='post' >
  <input type='email' name='email' placeholder='Email' required/>
<input type='password' name='password' placeholder='Password' required />
  <input type='submit' />
  </form>
  <div>Create a new account?<span> <a href='/register'>Register</a>  </span>here</div>
  <br/>
  <a href='/'>Back to home<a/>
  `);
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    const user = users.find(
      (user) => user.email === email && user.password === password
    );
    if (user) {
      req.session.userID = user.id;
      return res.redirect("/home");
    }
  }
  res.redirect("/login");
});
app.get("/register", (req, res) => {
  res.send(`
  <div>Register</div>
  <form action='/register' method ='post' >
  <input type='text' name='name' placeholder='Name' required/>
  <input type='email' name='email' placeholder='Email' required/>
  <input type='password' name='password' placeholder = 'Password' required />
  <input type='submit' />
  </form>
  <div>Already have an account?<span> <a href='/login'>Login</a>  </span>here</div>
  <br/>
  <a href='/'>Back to home<a/>
  `);
});
app.post("/register", redirectMiddlewarehome, (req, res) => {
  const { name, email, password } = req.body;
  if (name && email && password) {
    const ifExists = users.some((user) => user.email === email);
    if (!ifExists) {
      const user = {
        id: users.length + 1,
        name,
        email,
        password,
      };
      users.push(user);
      req.session.userID = user.id;
      return res.redirect("/home");
    }
    res.redirect("/login");
  }
  res.redirect("/register");
});

app.post("/logout", redirectMiddlewarelogin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.redirect("/home");
    }
    res.clearCookie(SESS_NAME);
    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
