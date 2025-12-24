const { Sequelize } = require('sequelize');

// Environment variables are loaded by server.js before this file is imported
// This line is kept as a fallback if database.js is imported directly
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT || 'postgres',
        logging: process.env.DB_LOGGING === 'true' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            ssl: process.env.DB_SSL === 'false' ? false : {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
);

module.exports = sequelize;
