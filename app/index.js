const express = require("express");
require("dotenv").config();

const mongodbConnection = require("./helper/mongodb");
const dbConnection = require("./helper/mysql");
const redisConnection = require("./helper/redis");
const session = require("express-session");
const bodyParser = require("body-parser");
const rabbitmqConnection = require("./helper/rabbitmq");

const app = express();
app.use(express.static("styles"));
app.use(express.static(__dirname));
app.use(express.static(__dirname + "/views"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const RedisStore = require("connect-redis")(session);

(async () => {
  try {
    const channel = await rabbitmqConnection();
    await channel.close();
    await channel.connection.close();
  } catch (error) {
    console.error("Error with RabbitMQ connection:", error);
  }
})();

// Use Redis for session storage
app.use(
  session({
    store: new RedisStore({
      client: redisConnection.redisClient,
    }),
    secret: "secret$%^123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: false,
      maxAge: 1000 * 60 * 60 * 24, // 1 hour in milliseconds
    },
  })
);

// Oturum kontrolü middleware'i
const sessionChecker = (req, res, next) => {
  if (req.session && req.session.user) {
    // Oturum geçerli ise, bir sonraki middleware veya endpoint'e devam edin
    next();
  } else {
    // Oturum geçerli değilse, HTTP 401 hatası döndürün
    res.sendStatus(401);
  }
};

// ENDPOINT
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/home.html");
});

app.get("/products", (req, res) => {
  res.sendFile(__dirname + "/views/product.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/views/login.html");
});

// POST request for handling login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // MySQL veritabanından kullanıcı bilgilerini alın
    const [userRows] = await dbConnection.execute(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    if (userRows.length > 0) {
      // Kullanıcı bulundu, oturum bilgilerini ayarla
      req.session.user = userRows[0]; // Kullanıcının tüm bilgilerini oturumda sakla

      // Profil sayfasına yönlendir
      res.redirect("/profile");
    } else {
      // Kullanıcı bulunamadı, hata mesajı gönder
      res.status(401).send("Invalid username or password");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Error during login");
  }
});

// `/profile` endpoint'ine oturum kontrolü middleware'ini uygulayın
app.get("/profile", sessionChecker, (req, res) => {
  // If the session is valid, send the profile page
  res.sendFile(__dirname + "/views/profile.html");
});

app.get("/user", sessionChecker, (req, res) => {
  // If the session is valid, send the user data
  res.json({ username: req.session.user.username });
});

app.get("/orders", sessionChecker, (req, res) => {
  res.sendFile(__dirname + "/views/order.html");
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.send("Logout Failed");
      return;
    }
    // Redirect to the home page after logout with 'logout=success' query parameter
    res.redirect("/?logout=success");
  });
});

// GET request for fetching all products
app.get("/api/products", async (req, res) => {
  try {
    // MySQL veritabanından tüm ürünleri alın
    const [productRows] = await dbConnection.execute("SELECT * FROM products");

    // Ürünleri JSON formatında döndürün
    res.json(productRows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Error fetching products");
  }
});

// POST request for creating a new order
app.post("/orders", sessionChecker, async (req, res) => {
  const { product_id, quantity } = req.body;

  const user_id = req.session.user.id; // Get user_id from session

  try {
    // Insert the new order into the MySQL database
    const result = await dbConnection.execute(
      "INSERT INTO orders (user_id, product_id, quantity) VALUES (?, ?, ?)",
      [user_id, product_id, quantity]
    );

    // When the order is successfully saved, send it to the processing queue via RabbitMQ
    await rabbitmqConnection.sendOrderMessage({
      user_id,
      product_id,
      quantity,
      order_id: result.insertId, // Also send the ID of the new order
    });

    res
      .status(201)
      .json({
        message: "Order created successfully",
        order_id: result.insertId,
      });
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ message: "Error creating order", error: error.toString() });
  }
});

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
    const db = client.db("commentDB");
    const query = { product_id: productId.toString() }; // Convert productId to string
    console.log("MongoDB Query:", query); // Debug log
    const results = await db.collection("comments").find(query).toArray();
    console.log("Fetched comments:", results); // Debug log
    // Tarihe göre artan düzende sırala
    results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.json({ product, comments: results });
  } catch (err) {
    console.error("Error fetching post and comments:", err);
    res
      .status(400)
      .json({
        message: "Error fetching post and comments",
        error: err.toString(),
      });
  }
});

app.listen(3002, async () => {
  console.log(`Server is running on port 3002`);
  try {
    await mongodbConnection.connect();
    await mongodbConnection.createCommentsCollection();
  } catch (error) {
    console.error("Error setting up MongoDB:", error);
  }
});
