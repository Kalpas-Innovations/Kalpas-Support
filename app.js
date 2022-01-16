const express = require("express");
const cors = require("cors");
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const app = express();
const PORT = process.env.PORT || 9090;
const path = require("path");
const { capText } = require('uptext');

require("dotenv").config();


const Discord = require("discord.js");
const client = new Discord.Client();
const message = new Discord.Message();
const discordButton = require('discord-buttons');
discordButton(client);

// Custom
const { patternOne, patternTwo } = require("./helpers/uniqueId");
const { webHook } = require("./events/webHook");
const { formattedDate } = require("./helpers/getDate");

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.sendFile(path.resolve(path.join(__dirname, "./dist/index.html")));
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// 824320666563379262
// const database = new MongoClient(PORT === 9090 ? process.env.MONGODB_LOCAL_URI : process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const database = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
database.connect(err => {
    console.log(`${!!err ? 'Database Connection Failed' : 'Database Connection Successful'}`);
    let db = database.db("KalpasBot");
    const adminsCollection = db.collection("admins");
    const usersCollection = db.collection("users");
    const leavesCollection = db.collection("leaves");
    const leavesBasket = db.collection("leavesBasket");

    app.get("/admins", (req, res) => {
        let body = req.body;
        adminsCollection.find({})
            .toArray((err, data) => {
                console.log('Eita ami', data)
                res.send(data)
            })
    });

    app.post("/addAdmin", (req, res) => {
        let body = req.body;
        adminsCollection.insertOne(body)
            .then(result => {
                console.log(typeof (result.insertedId) == "object");
                res.send(JSON.stringify(result))
            })
    });

    app.post("/addUser", (req, res) => {
        let body = req.body;

    })

    client.on("message", async inbox => {
        // console.log(inbox)
        // console.log(inbox.guild)
        if (inbox.content === "Hi") {
            inbox.reply("Hello")
        }
        // inbox.mentions.users.map(data => console.log("Send By:", data))
    })
    var session = [];

    client.on("message", async msg => {
        console.log(msg);
        let mes = await msg.channel.messages.fetch()

        if (msg.content.toLowerCase().startsWith("#leave")) {
            let split = msg.content.split("#");
            let date = split[3].replace("@", " to ");
            let dateCutter = split[3].split("@");
            if (dateCutter.length === 2) {
                var monthCountOne = dateCutter[0].substr(3, 4).replace("/", "");
                var monthCountTwo = dateCutter[1].substr(3, 4).replace("/", "");
                var dataCount = dateCutter[1].substr(0, 2) - dateCutter[0].substr(0, 2);
            }
            const returnDate = () => {
                if (dataCount <= 0) {
                    return 1;
                } else {
                    return dataCount;
                }
            }

            let requestId = "KPB-" + patternTwo(8);
            let buttonIdOne = "OK_" + patternOne(20);
            let buttonIdTwo = "NO_" + patternOne(20);
            console.log("requestId", requestId, "buttonIdOne", buttonIdOne, "buttonIdTwo", buttonIdTwo)

            let collectedData = `ID: ${requestId}\nName: ${capText(msg.author.username)}\nProjects: Simulice, Focus-On.\nMobile Number: ${"||" + "+123456789" + "||"}\nType: ${capText(split[2])} Leave\n${monthCountOne === monthCountTwo && !!returnDate() ? ("Number of Days: " + returnDate() + " days\n") : ""}Date: ${split[3].includes("@") ? date : split[3]}\nNote: ${split[4] ? capText(split[4]) : "No Special Note."}\n\n<@${msg.author.id}> Is this correct?`;

            let adminChannelData = `ID: ${requestId}\nName: <@${msg.author.id}>\nProjects: Simulice, Focus-On.\nMobile Number: ${"||" + "+123456789" + "||"}\nType: ${capText(split[2])} Leave\n${monthCountOne === monthCountTwo && !!returnDate() ? ("Number of Days: " + returnDate() + " days\n") : ""}Date: ${split[3].includes("@") ? date : split[3]}\nNote: ${split[4] ? capText(split[4]) : "No Special Note."}`;

            leavesBasket.insertOne({
                userId: msg.author.id,
                buttonIdOne,
                buttonIdTwo,
                requestId,
                createdAt: new Date(),
                userMessage: collectedData,
                adminMessage: adminChannelData
            })
            if (msg.channel.type === "dm") {
                msg.reply(collectedData, {
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    style: 3,
                                    label: "Correct",
                                    custom_id: buttonIdOne,
                                    disabled: false
                                },
                                {
                                    type: 2,
                                    style: 4,
                                    label: "Cancel",
                                    custom_id: buttonIdTwo,
                                    disabled: false
                                }
                            ]
                        }
                    ]
                });
            } else {
                msg.channel.send(collectedData, {
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    style: 3,
                                    label: "Correct",
                                    custom_id: buttonIdOne,
                                    disabled: false
                                },
                                {
                                    type: 2,
                                    style: 4,
                                    label: "Cancel",
                                    custom_id: buttonIdTwo,
                                    disabled: false
                                }
                            ]
                        }
                    ]
                });
            }
        } else if (msg.content.toLowerCase().startsWith("#addme")) {
            let split = msg.content.split("#");
            if (split.length === 7) {
                let parsedData = {
                    userId: split[2],
                    name: split[3],
                    phone: split[4],
                    current_project: split[5],
                    position: split[6]
                }
                console.log(parsedData);
            } else {
                msg.channel.send("You've missed some fields, please fill them correctly & use the proper format.\nFor help: #help")
            }

        }
    });


    // New Action Start From Here
    client.on("clickButton", async btn => {
        let mes = await btn.channel.messages.fetch();
        let filter = await mes.filter(prev => prev.content === btn.message.content)
        let clickers = await btn.clicker.fetch()
        console.log("SANYSSS", btn);

        if (btn.id.startsWith("ADMIN_")) {
            console.log(btn.id)
            leavesCollection.find().sort({ $natural: -1 })
                .toArray((err, data) => {
                    if (data.length > 0) {
                        for (let index = 0; index < data.length; index++) {
                            const leave = data[index];
                            if (btn.id === leave.buttonIdOne || btn.id === leave.buttonIdTwo) {
                                if (btn.id.startsWith("ADMIN_OK_")) {
                                    btn.channel.send(`:thumbsup:  Request ID#${leave.requestId} has been approved by <@${btn.clicker.user.id}> successfully.`);
                                    btn.channel.messages.fetch(btn.message.id).then(message => {
                                        message.edit(btn.message.content, {
                                            components: [
                                                {
                                                    type: 1,
                                                    components: [
                                                        {
                                                            type: 2,
                                                            style: 3,
                                                            label: "Approved",
                                                            custom_id: leave.buttonIdOne,
                                                            disabled: true
                                                        },
                                                        {
                                                            type: 2,
                                                            style: 4,
                                                            label: "Reject",
                                                            custom_id: leave.buttonIdTwo,
                                                            disabled: true
                                                        }
                                                    ]
                                                }
                                            ]
                                        });
                                    })
                                } else if (btn.id.startsWith("ADMIN_NO_")) {
                                    btn.channel.send(`:thumbsdown:  Request ID#${leave.requestId} has been rejected by <@${btn.clicker.user.id}> successfully.`);
                                    btn.channel.messages.fetch(btn.message.id).then(message => {
                                        message.edit(btn.message.content, {
                                            components: [
                                                {
                                                    type: 1,
                                                    components: [
                                                        {
                                                            type: 2,
                                                            style: 3,
                                                            label: "Approve",
                                                            custom_id: leave.buttonIdOne,
                                                            disabled: true
                                                        },
                                                        {
                                                            type: 2,
                                                            style: 4,
                                                            label: "Rejected",
                                                            custom_id: leave.buttonIdTwo,
                                                            disabled: true
                                                        }
                                                    ]
                                                }
                                            ]
                                        });
                                    })
                                }
                                break;
                            }
                        }
                    }
                })

        } else if (btn.id.startsWith("OK_") || btn.id.startsWith("NO_")) {
            leavesBasket.find({}).sort({ $natural: -1 })
                .toArray((err, data) => {
                    if (data.length > 0) {
                        for (let index = 0; index < data.length; index++) {
                            const element = data[index];
                            if (btn.id === element.buttonIdOne || btn.id === element.buttonIdTwo) {
                                if (btn.id.startsWith("OK_") && btn.clicker.user.id === element.userId) {
                                    let storeInLeave = {
                                        userId: element.userId,
                                        buttonIdOne: "ADMIN_" + element.buttonIdOne,
                                        buttonIdTwo: "ADMIN_" + element.buttonIdTwo,
                                        requestId: element.requestId,
                                        userMessage: element.userMessage,
                                        ManagerApproval: false,
                                        HigherAuthorityApproval: false,
                                        createdAt: new Date()
                                    };
                                    leavesCollection.insertOne(storeInLeave)

                                    btn.channel.send(`\n\nHey, <@${btn.clicker.user.id}>,\nYour request has been received and successfully stored.`);
                                    btn.channel.messages.fetch(btn.message.id).then(message => {
                                        message.edit(btn.message.content, {
                                            components: [
                                                {
                                                    type: 1,
                                                    components: [
                                                        {
                                                            type: 2,
                                                            style: 3,
                                                            label: "Correct",
                                                            custom_id: element.buttonIdOne,
                                                            disabled: true
                                                        },
                                                        {
                                                            type: 2,
                                                            style: 4,
                                                            label: "Cancel",
                                                            custom_id: element.buttonIdTwo,
                                                            disabled: true
                                                        }
                                                    ]
                                                }
                                            ]
                                        });
                                    }).catch(err => {
                                        console.error(err);
                                    });

                                    client.channels.fetch('931576620353998960')
                                        .then(channel => channel.send(element.adminMessage, {
                                            components: [
                                                {
                                                    type: 1,
                                                    components: [
                                                        {
                                                            type: 2,
                                                            style: 3,
                                                            label: "Approve",
                                                            custom_id: "ADMIN_" + element.buttonIdOne,
                                                            disabled: false
                                                        },
                                                        {
                                                            type: 2,
                                                            style: 4,
                                                            label: "Reject",
                                                            custom_id: "ADMIN_" + element.buttonIdTwo,
                                                            disabled: false
                                                        }
                                                    ]
                                                }
                                            ]
                                        }));
                                } else if (btn.id.startsWith("NO_") && btn.clicker.user.id === element.userId) {
                                    leavesBasket.deleteOne({ _id: ObjectID(element._id) }).then(data => {
                                        if (data.deletedCount > 0) {
                                            if (btn.message.channel.type === "dm") {
                                                btn.message.delete(filter)
                                            } else {
                                                btn.channel.bulkDelete(filter)
                                            }
                                            btn.defer();
                                        } else {
                                            if (btn.message.channel.type === "dm") {
                                                btn.message.delete(filter)
                                            } else {
                                                btn.channel.bulkDelete(filter)
                                            }
                                            btn.defer();
                                        }
                                    })
                                } else {
                                    btn.channel.send(`\n\nHey, <@${btn.clicker.user.id}>,\nYou're Clicking on another user request. Check the request Id correctly.`);
                                }
                                break;
                            }
                        }
                    } else {
                        console.log("From 2", err);
                        btn.channel.send(`Oops! No record found for ${"ID: " + btn.message.content.slice(4, 16)}  :cold_sweat:`);
                    }
                })
        }

        btn.defer();
    })

});


client.login(process.env.DISCORD_BOT)

app.listen(PORT, () => {
    console.log(`App Listening at http://localhost:${PORT}`)
});