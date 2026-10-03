const mysql = require("mysql2/promise");

const banco = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "nutritech",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = banco;