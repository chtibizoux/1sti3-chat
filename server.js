const express = require('express');
const http = require('http');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

var messages = [];
var users = [];

try {
    if (fs.existsSync(__dirname + "/public/files")) {
        const files = fs.readdirSync(__dirname + "/public/files");
        for (const file of files) {
            fs.unlinkSync(__dirname + '/public/files/' + file);
        }
    } else {
        fs.mkdirSync(__dirname + "/public/files");
    }
} catch (e) {
    console.log(e);
}

app.use(express.static(__dirname + '/public'));
app.use(fileUpload());

app.post("/upload", (req, res) => {
    if (!req.files.file) {
        console.log('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    req.files.file.mv(__dirname + '/public/files/' + req.files.file.name, function (err) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log('File uploaded and moved!');
        res.send('File uploaded!');
    });
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on("login", (username) => {
        var user = {
            id: socket.id,
            name: username
        };
        users.push(user);
        io.emit("user", user);
        socket.emit("data", socket.id, users, messages);
    });
    socket.on("send", (text, file) => {
        for (const user of users) {
            if (user.id === socket.id) {
                var date = new Date();
                date = (date.getDate() > 9 ? '' : '0') + date.getDate() + "/" + (date.getMonth() > 9 ? '' : '0') + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + (date.getHours() > 9 ? '' : '0') + date.getHours() + ":" + (date.getMinutes() > 9 ? '' : '0') + date.getMinutes()
                var message = {
                    author: user,
                    text: text,
                    date: date,
                    file: file
                };
                messages.push(message);
                io.emit("message", message);
                break;
            }
        }
    });
    socket.on('disconnect', () => {
        for (const i in users) {
            if (users[i].id === socket.id) {
                io.emit("deleteUser", users[i]);
                users.splice(i, 1);
                break;
            }
        }
        console.log('user disconnected');
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});