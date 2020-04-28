const Discord = require("discord.js");
const client = new Discord.Client();

const https = require('https');
const fs = require('fs');

const Jimp = require("jimp");

const formatter = require("./formatter");

const layers=[784,100,30,10];
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
        if (!sunglasses.has(msg.author.id)) msg.channel.send(msg.author.toString()+" :sunglasses: on!");
        sunglasses.add(msg.author.id);
    } else if (message[0] === "off") {
        if (sunglasses.has(msg.author.id)) msg.channel.send(msg.author.toString()+" :sunglasses: off!");
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
            let url=(msg.attachments).array()[0].url;
            let ext=url.substr(url.lastIndexOf(".")+1);

            if (ext==="png" || ext==="jpg" || ext==="jpeg") {
                parse(url, msg.id).then(async function (ret) {
                    let value = ret[0], final_layer = ret[1];

                    await msg.channel.send("", {files: ["./mnist10/" + msg.id + ".jpg"]});

                    await msg.channel.send(msg.author.toString() + " This digit is " + value).then(sentEmbed => {
                        sentEmbed.react("🛠️");

                        let sent_logs = false;

                        const filter = (reaction, user) => reaction.emoji.name === '🛠️' && user.id === msg.author.id;
                        const collector = sentEmbed.createReactionCollector(filter, {time: 600000});
                        collector.on('collect', r => {
                            if (!sent_logs) msg.channel.send(final_layer);
                            sent_logs = true;
                        });
                    });
                });
            }
            else{
                msg.channel.send("Cannot parse image :|");
            }
        }
    }
});

client.login(require('./auth.json').token);

async function parse(url, id) {
    console.log(url);
    console.log(id);

    const image = await Jimp.read(url);
    await image.resize(100,Jimp.AUTO);

    let r=image.bitmap.width;
    let c=image.bitmap.height;

    let grid=new Array(r);
    for (let x=0;x<r;x++) grid[x]=new Array(c); //how do you initialize a 2d array tf

    for (let x=0;x<r;x++){
        for (let y=0;y<c;y++){
            grid[x][y]=Jimp.intToRGBA(image.getPixelColor(x,y)).b;
        }
    }

    grid=formatter(grid,r,c);

    const mnist=new Jimp(28, 28, (err, image) => {
        // this image is 28 x 28, every pixel is set to 0x00000000
    });

    let layer=new Array(784);

    for (let x=0;x<28;x++){
        for (let y=0;y<28;y++){
            const val_int=Math.floor(256*grid[x][y]);
            mnist.setPixelColor(Jimp.rgbaToInt(val_int, val_int, val_int, 255, undefined),x,y);
            layer[y*28+x]=[grid[x][y]];
        }
    }

    mnist.write("./mnist10/"+id+".jpg");

    //now we start the neural net
    for (let i=0;i<layers.length-1;i++){
        layer=add(mul(weights[i],layer),biases[i]);
        layer=sig(layer);
    }

    let best=-1;
    let best_index=-1;

    let final_layer="```\n";

    for (let i=0;i<layer.length;i++){
        final_layer+=i+" - "+Number.parseFloat(layer[i][0]).toFixed(8)+"\n";
        if (layer[i][0]>best){
            best=layer[i][0];
            best_index=i;
        }
    }

    final_layer+="```\n";

    return [best_index, final_layer];
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
