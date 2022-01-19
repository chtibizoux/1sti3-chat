const fs = require("fs");
const express = require("express");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const passport = require("passport");
const DiscordStrategy = require("passport-discord.js").Strategy;

if (!fs.existsSync("./config.json")) {
    throw "Please create config.json file config.json.exemple is an exemple";
}
if (!fs.existsSync("./messages.json")) {
    fs.writeFileSync("./messages.json", `[]`);
}
if (!fs.existsSync("./users.json")) {
    fs.writeFileSync("./users.json", `{}`);
}
if (!fs.existsSync("./guilds.json")) {
    fs.writeFileSync("./guilds.json", `{}`);
}
if (!fs.existsSync("./client/files")) {
    fs.mkdirSync("./client/files");
}

var config = require("./config.json");
var messages = require("./messages.json");
var users = require("./users.json");
var connectedUsers = {};
function saveUsers() {
    fs.writeFileSync("./users.json", JSON.stringify(users));
}

var DiscordBot = require("./discord.js");
var bot = new DiscordBot(config.token, send);

function send(user, text, file) {
    var date = new Date();
    date = (date.getDate() > 9 ? "" : "0") + date.getDate() + "/" + (date.getMonth() > 9 ? "" : "0") + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + (date.getHours() > 9 ? "" : "0") + date.getHours() + ":" + (date.getMinutes() > 9 ? "" : "0") + date.getMinutes()
    var message = {
        author: user,
        text: text,
        discord: true,
        date: date,
        file: file
    };
    messages.push(message);
    fs.writeFileSync("messages.json", JSON.stringify(messages));
    io.emit("message", message);
}

const app = express();
var port = process.env.PORT || 8080;
var server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
var io = require("socket.io")(server);

var sessionMiddleware = session({
    secret: "1sti3-chat",
    resave: true,
    saveUninitialized: true,
    cookie: {
        path: "/",
        secure: false
    },
});

io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(fileUpload());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
var subscriptions = [];
const publicVapidKey =
    "BFmbQp2AEC62owsB0l9XQmfHRgGclwrkywTpHYHyGT7y8-ucYu9vAeYnXwB93jB-Xd_51isZDCJoj0v5cdY-HOU";
const privateVapidKey = "0Hb8ooncdCvXnxvRY8LtppWIeitOQcyBflnYu8ZfLzM";
webpush.setVapidDetails(
    "mailto:5clemans585@gmail.com",
    publicVapidKey,
    privateVapidKey
);

app.post("/subscribe", (req, res) => {
    subscriptions.push(req.body);
    res.status(201).json({});
});

passport.serializeUser(function (u, d) {
    d(null, u);
});
passport.deserializeUser(function (u, d) {
    d(null, u);
});
passport.use(new DiscordStrategy({
    clientID: config.client_id,
    clientSecret: config.client_secret,
    callbackURL: config.redirect_uri,
    scope: ["identify"]
}, function (accessToken, refreshToken, profile, done) {
    return done(null, profile);
}));

app.use(express.static("./client"));
app.get("/", function (req, res) {
    if (req.session.user) {
        connectedUsers[req.session.user.id] = req.session.user;
        res.render("main", { connected: true, users: connectedUsers, messages: messages, discordUsers: bot.users });
    } else {
        res.render("main", { connected: false });
    }
});

app.post("/upload", (req, res) => {
    if (!req.files.file) {
        console.log("No files were uploaded.");
        return res.status(400).send("No files were uploaded.");
    }
    req.files.file.mv("./client/files/" + req.files.file.name, function (err) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log("File uploaded and moved!");
        res.send("File uploaded!");
    });
});

app.get("/redirect", passport.authenticate("discord.js", { failureRedirect: "/login" }), function (req, res) {
    var user = req.session.passport.user;
    if (!(user.id in users)) {
        users[user.id] = {
            id: user.id,
            name: user.username,
            discriminator: user.discriminator,
            avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
        };
    } else {
        users[user.id].name = user.username;
        users[user.id].discriminator = user.discriminator;
        users[user.id].avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }
    saveUsers();
    req.session.user = users[user.id];
    console.log(`user ${user.username}#${user.discriminator} is connected !`);
    res.redirect("/");
});

app.get("/login", passport.authenticate("discord.js"));

io.on("connection", (socket) => {
    console.log("a user connected");
    var req = socket.request;
    socket.on("register", (username, password, avatar) => {
        username = username.trim();
        for (const id in users) {
            if (users[id].username === username) {
                socket.emit("error", "Error: username already exist.");
                return;
            }
        }
        users[socket.id] = {
            id: socket.id,
            name: username,
            avatar: avatar,
            password: password,
        };
        saveUsers();
        req.session.user = { ...users[socket.id], password: undefined };
        req.session.save();
        connectedUsers[socket.id] = req.session.user;
        io.emit("user", req.session.user);
        socket.emit("data", connectedUsers, messages, bot.users);
    });
    socket.on("login", (username, password) => {
        username = username.trim();
        for (const id in users) {
            if (users[id].name === username) {
                if (users[id].password === password) {
                    req.session.user = { ...users[id], password: undefined };
                    req.session.save();
                    connectedUsers[id] = req.session.user;
                    io.emit("user", req.session.user);
                    socket.emit("data", connectedUsers, messages, bot.users);
                    return;
                }
                socket.emit("error", "Error: wrong password.");
                return;
            }
        }
        socket.emit("error", "Error: wrong username.");
    });
    socket.on("send", (text, file) => {
        text = text.trim();
        if (req.session.user) {
            var date = new Date();
            date = (date.getDate() > 9 ? "" : "0") + date.getDate() + "/" + (date.getMonth() > 9 ? "" : "0") + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + (date.getHours() > 9 ? "" : "0") + date.getHours() + ":" + (date.getMinutes() > 9 ? "" : "0") + date.getMinutes()
            var message = {
                author: req.session.user,
                text: text,
                date: date,
                file: file
            };
            messages.push(message);
            fs.writeFileSync("./messages.json", JSON.stringify(messages));
            io.emit("message", message);
            bot.send(message);
        }
        for (const subscription of subscriptions) {
            webpush.sendNotification(subscription, JSON.stringify({ title: "Nouveau message", icon: "/images/favicon.ico", body: text })).catch(err => console.error(err));
        }
    });
    socket.on("getMentions", (mentions) => {
        bot.getMentions(mentions, users).then((mentions) => {
            socket.emit("mentions", mentions);
        });
    });
    socket.on("disconnect", () => {
        if (req.session.user && connectedUsers[req.session.user.id]) {
            delete connectedUsers[req.session.user.id]
            io.emit("deleteUser", req.session.user.id);
        }
        console.log("user disconnected");
    });
});