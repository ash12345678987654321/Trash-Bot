const Discord = require("discord.js");
const client = new Discord.Client();

const https = require('https');
const fs = require('fs');

const Jimp = require("jimp");

client.on("ready", () => {
    console.log("Bot is online!");
});

const sunglasses = new Set();

client.on("message", msg => {
    if (msg.author.id === client.user.id) return;

    if (sunglasses.has(msg.author.id) && Math.random() < 0.5) {
        msg.react("😎");
    }

    let message = msg.content;

    if (message.length < 2 || message.substring(0, 2) !== "t!") return;
    message = message.substring(2).split(" ");

    console.log(message);

    if (message[0] === "ping") {
        msg.channel.send("ping: " + (Date.now() - msg.createdTimestamp) + " ms");
    } else if (message[0] === "on") {
        sunglasses.add(msg.author.id);
    } else if (message[0] === "off") {
        sunglasses.delete(msg.author.id);
    } else if (message[0] === "help") {
        msg.channel.send("t!ping - ping the bot\n" +
            "t!on - bot will check if your message is cool using machine learning and will react to it with :sunglasses:\n" +
            "t!off - bot will stop reacting to your message\n");
    } else if (message[0] === "parse") {
        if (msg.attachments.array().length==0) msg.channel.send("no image attached >.<");
        else msg.channel.send(parse((msg.attachments).array()[0].url, msg.id));
    }
});

client.login(require('./auth.json').token);

async function parse(url, id) {
    console.log(url);
    console.log(id);

    const image = await Jimp.read(url);

    await image.resize(20, 20);
    await image.greyscale();

    image.write("./mnist10/"+id+".jpg");

    return "nice";
}
