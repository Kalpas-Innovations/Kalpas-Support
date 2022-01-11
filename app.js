const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 9090;
const path = require("path");
const Discord = require("discord.js");
const client = new Discord.Client();
const discordButton = require('discord-buttons');
discordButton(client);

// Custom
const { makeUID } = require("./helpers/uniqueId");
const { webHook } = require("./events/webHook");

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.sendFile(path.resolve(path.join(__dirname, "./dist/index.html")));
});

app.listen(PORT, () => {
    console.log(`App Listening at http://localhost:${PORT}`)
});