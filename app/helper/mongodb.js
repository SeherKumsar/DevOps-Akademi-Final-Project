const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection
const username = encodeURIComponent("seher");
const password = encodeURIComponent("password");
// const url = `mongodb://${username}:${password}@mongo-db-service:27017`;
const url = `mongodb://${username}:${password}@localhost:27017`;
let client;
let db;

async function connect() {
    client = new MongoClient(url);

    try {
        await client.connect();
        db = client.db('commentDB'); // replace 'your_database_name' with the name of your database
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        if (error.message.includes('Authentication failed.')) {
            console.error('Check your username and password');
        }
        process.exit(1); // Exit the process if MongoDB connection fails
    }

    return client;
}

async function createCommentsCollection() {
    if (!db) {
        console.error('Database is not connected. Cannot create collection.');
        return;
    }

    try {
        await db.createCollection('comments');
        console.log('Comments collection created');
    } catch (error) {
        console.error('Error creating comments collection:', error);
    }
}

module.exports = { connect, getClient: () => client, createCommentsCollection };