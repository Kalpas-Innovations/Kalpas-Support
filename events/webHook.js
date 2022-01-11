
const Discord = require("discord.js");



module.exports = webHook = (id, token) => {
    new Discord.WebhookClient(id, token);
};