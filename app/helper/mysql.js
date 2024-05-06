const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  // host: "mysql-service",
  host: "localhost",
  user: "seher",
  password: "password",
  database: "adalovelaceakademi",
  port: 3310,
  connectTimeout: 100,
});

pool.getConnection()
    .then(connection => {
        console.log('MySQL bağlantısı başarılı');
        connection.release();
    })
    .catch(error => {
        console.error('MySQL bağlantısı başarısız:', error);
        if (error.code === 'ETIMEDOUT') {
            console.error('Connection attempt was timed out. Check your MySQL server and network.');
        }
    });

module.exports = pool;