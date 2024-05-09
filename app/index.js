const express = require("express");
require('dotenv').config();

const mongodbConnection = require('./helper/mongodb');
const dbConnection = require("./helper/mysql");
const redisConnection = require('./helper/redis');
const session = require('express-session');
const bodyParser = require('body-parser');
const connectRedis = require('connect-redis');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const RedisStore = require('connect-redis')(session);

app.get("/products/:id/comment", async (req, res) => {
  const { id } = req.params;
  console.log("Received request for product ID:", id); // Debug log
  try {
    // MySQL'den ilgili postu al
    const [postRows] = await dbConnection.execute(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );
    
    // Eğer ürün bulunamazsa hata gönder
    if (postRows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Ürün bulundu, product_id ile MongoDB'den yorumları al
    const product = postRows[0];
    const productId = product.id; // MySQL'den gelen post id'si
    let client = mongodbConnection.getClient();
    if (!client || !client.topology.isConnected()) {
      client = await mongodbConnection.connect();
    }
    const db = client.db('commentDB');
    const query = { product_id: productId };
    console.log("MongoDB Query:", query); // Debug log
    const results = await db.collection("comments").find(query).toArray();
    console.log("Fetched comments:", results); // Debug log
    // Tarihe göre artan düzende sırala
    results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    res.json({ product, comments: results });
  } catch (err) {
    console.error('Error fetching post and comments:', err);
    res.status(400).json({ message: 'Error fetching post and comments', error: err.toString() });
  }
});

// Use Redis for session storage
app.use(session({
  store: new RedisStore({ 
    client: redisConnection.redisClient,
  }),
  secret: 'secret$%^123',
  resave: false,
  saveUninitialized: false,
    cookie: { 
      secure: false,
      httpOnly: false,
      maxAge: 1000 * 60 * 60 * 24, // 1 hour in milliseconds
    },
}));

app.get("/", (req, res) => {
  res.send("Hello from the server side!");
});

app.get("/profile", (req, res) => {
  const session = req.session;
  console.log(session);
  if (session.username) {
    res.send(`Welcome ${session.username}!`);
    return;
  }
  res.sendStatus(401);
  // res.send("Profile Details");
});

app.post("/login", (req, res) => {
  // res.send("Login Page");
  const session = req.session;
  const { username, password } = req.body;
  // database control
  // mysql connection => user? password?

  if (username == 'seher_kumsar' && password == 'password') {
    session.username = username;
    session.password = password;
    res.send("Login Successful");
    return;
  }
  res.send("Login Failed");
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.send("Logout Failed");
      return;
    }
    res.send("Logout Successful");
  })
});

app.listen(3002, async () => {
  console.log(`Server is running on port 3002`);
  try {
    await mongodbConnection.connect();
    await mongodbConnection.createCommentsCollection();
  } catch (error) {
    console.error('Error setting up MongoDB:', error);
  }
});
