const Discord = require("discord.js");
const client = new Discord.Client();

const https = require('https');
const fs = require('fs');

const Jimp = require("jimp");

const layers=[784,30,10];
const biases=[];
const weights=[];

client.on("ready", () => {
    fs.readFile('weights.txt', function(err, data) {
        if(err) throw err;
        var array = data.toString().split("\r\n");
        var array_index=0;

        var layer_index=1;

        var temp;
        while (layer_index<layers.length){
            temp=array[array_index++].split(" ");
            temp.pop();
            for (let x=0;x<temp.length;x++) temp[x]=[parseFloat(temp[x])];

            biases.push(temp);

            weights.push([]);
            for (var i=0;i<layers[layer_index];i++){
                temp=array[array_index++].split(" ");
                temp.pop();
                for (let x=0;x<temp.length;x++) temp[x]=parseFloat(temp[x]);

                weights[layer_index-1].push(temp);
            }
            layer_index++;
        }
    });

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
            "t!off - bot will stop reacting to your message\n" +
            "t!parse - bot will parse handwritten digits\n");
    } else if (message[0] === "parse") {
        if (msg.attachments.array().length==0){
            msg.channel.send("no image attached >.<");
        }
        else {
            parse((msg.attachments).array()[0].url, msg.id).then(async function(value) {
                await msg.channel.send("", {files: ["./mnist10/"+msg.id+".jpg"]});
                await msg.channel.send(msg.author.toString()+" This digit is "+value);
            });
        }
    }
});

client.login(require('./auth.json').token);

async function parse(url, id) {
    console.log(url);
    console.log(id);

    const image = await Jimp.read(url);

    await image.resize(28, 28);
    await image.greyscale();

    let layer = new Array(784);
    for (let i=0;i<784;i++) layer[i]=new Array(1);

    for (let x = 0; x < 28; x++) {
        for (let y = 0; y < 28; y++) {
            const val = scale(Jimp.intToRGBA(image.getPixelColor(x,y)).r);
            const val_int=Math.floor(256*val);
            image.setPixelColor(Jimp.rgbaToInt(val_int, val_int, val_int, 255, undefined),x,y);

            layer[y*28+x][0]=val;
        }
    }

    image.write("./mnist10/"+id+".jpg");

    //now we start the neural net
    for (let i=0;i<layers.length-1;i++){
        layer=add(mul(weights[i],layer),biases[i]);
        layer=sig(layer);
    }

    let best=-1;
    let best_index=-1;

    for (let i=0;i<layer.length;i++){
        if (layer[i][0]>best){
            best=layer[i][0];
            best_index=i;
        }
    }

    console.log(layer);

    return best_index;
}

function scale(intensity){ //this should return an integer
    const temp=sigmoid((128-intensity)/20);
    if (temp<0.4) return 0; //try to reduce some noise
    else return temp;
}

function sigmoid(i){
    return 1.0/(1.0+Math.exp(-i));
}

//functions for matrix shit
function mul(a, b) {
    const result = [];
    for (let i = 0; i < a.length; i++) {
        result.push([]);
        for (let j = 0; j < b[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < a[0].length; k++) {
                sum += a[i][k] * b[k][j];
            }
            result[i].push(sum);
        }
    }
    return result;
}

function add(a,b){
    for (let i=0;i<a.length;i++){
        for (let j=0;j<a[i].length;j++){
            a[i][j]+=b[i][j];
        }
    }
    return a;
}

function sig(a){
    for (let i=0;i<a.length;i++){
        for (let j=0;j<a[i].length;j++){
            a[i][j]=sigmoid(a[i][j]);
        }
    }
    return a;
}
