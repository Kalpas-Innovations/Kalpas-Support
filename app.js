const express = require("express");
const cors = require("cors");
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const app = express();
const PORT = process.env.PORT || 9090;
const path = require("path");
const Discord = require("discord.js");
const client = new Discord.Client();
const discordButton = require('discord-buttons');
discordButton(client);
require("dotenv").config();

// Custom
const { makeUID } = require("./helpers/uniqueId");
const { webHook } = require("./events/webHook");

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.sendFile(path.resolve(path.join(__dirname, "./dist/index.html")));
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.DISCORD_BOT)

const database = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
database.connect(err => {
    console.log(`${!!err ? 'Database Connection Failed' : 'Database Connection Successful'}`);
    let db = database.db("KalpasBot");
    const adminsCollection = db.collection("admins");

    app.get("/admins", (req, res) => {
        let body = req.body;
        adminsCollection.find({})
            .toArray((err, data) => {
                console.log('Eita ami', data)
                res.send(data)
            })
    })

    app.post("/addAdmin", (req, res) => {
        let body = req.body;
        adminsCollection.insertOne(body)
            .then(result => {
                console.log(typeof(result.insertedId) == "object");
                res.send(JSON.stringify(result))
            })
    })
});

app.listen(PORT, () => {
    console.log(`App Listening at http://localhost:${PORT}`)
});