
var socket = io();

(function () {
    var autoLink, slice = [].slice;
    autoLink = function () {
        var callback, k, linkAttributes, option, options, pattern, v;
        options = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        pattern = /(^|[\s\n]|<[A-Za-z]*\/?>)((?:https?|ftp):\/\/[\-A-Z0-9+\u0026\u2019@#\/%?=()~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=~()_|])/gi;
        if (!(options.length > 0)) {
            return this.replace(pattern, "$1<a href='$2'>$2</a>");
        }
        option = options[0];
        callback = option["callback"];
        linkAttributes = ((function () {
            var results;
            results = [];
            for (k in option) {
                v = option[k];
                if (k !== 'callback') {
                    results.push(" " + k + "='" + v + "'");
                }
            }
            return results;
        })()).join('');
        return this.replace(pattern, function (match, space, url) {
            var link;
            link = (typeof callback === "function" ? callback(url) : void 0) || ("<a href='" + url + "'" + linkAttributes + ">" + url + "</a>");
            return "" + space + link;
        });
    };
    String.prototype['autoLink'] = autoLink;
}).call(this);

function show() {
    var users = document.querySelector(".users-section");
    if (users.style.transform === "none") {
        users.style.transform = "";
    } else {
        users.style.transform = "none";
    }
}

function uploaded() {
    if (document.getElementById("file").files[0]) {
        document.getElementById("file-to-upload").style.display = "";
        document.getElementById("file-name").innerHTML = document.getElementById("file").files[0].name;
    } else {
        document.getElementById("file-to-upload").style.display = "none";
    }
}

function remove() {
    document.getElementById("file-to-upload").style.display = "none";
    document.getElementById("file").value = '';
}

function add() {
    document.getElementById("file").click();
}

function login(e) {
    e.preventDefault();
    socket.emit("login", document.getElementById("username-input").value, document.getElementById("password-input").value);
}

function register(e) {
    e.preventDefault();
    if (document.getElementById("register-username-input").value !== "" && document.getElementById("register-password-input").value === document.getElementById("register-password2-input").value) {
        socket.emit("register", document.getElementById("register-username-input").value, document.getElementById("register-password-input").value, "/images/user.png");
    }
}

function checkPassword() {
    if (document.getElementById("register-password-input").value === document.getElementById("register-password2-input").value) {
        document.getElementById("register-password2-input").style.borderColor = "";
    } else {
        document.getElementById("register-password2-input").style.borderColor = "red";
    }
}

function send(e) {
    e.preventDefault();
    if (document.getElementById("message-input").value !== "") {
        socket.emit("send", document.getElementById("message-input").value, document.getElementById("file").files[0] ? "/files/" + document.getElementById("file").files[0].name : null);
        document.getElementById("message-input").value = "";
    }
    if (document.getElementById("file").files[0]) {
        var data = new FormData();
        data.append('file', document.getElementById("file").files[0]);
        var ajax = new XMLHttpRequest();
        ajax.upload.addEventListener("progress", (e) => {
            document.getElementById("upload-progress").value = Math.round((e.loaded / e.total) * 100);
        }, false);
        ajax.addEventListener("load", () => {
            document.getElementById("file-upload").style.display = "none";
        }, false);
        ajax.addEventListener("error", () => {
            document.getElementById("file-upload").style.backgroundColor = "red";
            document.getElementById("upload-name").innerHTML += " error";
            document.getElementById("upload-progress").value = "100";
        }, false);
        ajax.addEventListener("abort", () => {
            document.getElementById("file-upload").style.backgroundColor = "red";
            document.getElementById("upload-name").innerHTML += " abort";
            document.getElementById("upload-progress").value = "100";
        }, false);
        ajax.open("POST", "/upload");
        ajax.send(data);
        document.getElementById("file-upload").style.display = "";
        document.getElementById("upload-progress").value = "0";
        document.getElementById("upload-name").innerHTML = document.getElementById("file").files[0].name;
        document.getElementById("file-to-upload").style.display = "none";
        document.getElementById("file").value = '';
    }
}

window.addEventListener("resize", () => {
    document.getElementById("msgs").scrollTo(0, document.getElementById("msgs").scrollHeight);
});

socket.on("data", (users, messages, discordUsers) => {
    document.getElementById("users").innerHTML = "";
    document.getElementById("msgs").innerHTML = "";
    for (const id in users) {
        document.getElementById("users").innerHTML += `<div id="${users[id].id}"><img src="${users[id].avatar}"><span>${users[id].name}</span></div>`;
    }
    for (const message of messages) {
        var file = message.file ? `<a href=${encodeURI(message.file)}>${decodeURI(message.file).slice(message.file.lastIndexOf("/") + 1)}</a>` : "";
        document.getElementById("msgs").innerHTML += `<div><img src="${message.author.avatar}"><h2>${message.author.name} <span>${message.date}${message.discord ? " DISCORD" : ""}</span></h2><p>${message.text.autoLink()}</p>${file}</div>`;
    }
    for (const user of discordUsers) {
        document.getElementById("discord-users").innerHTML += `<div id="${user.id}"><img src="${user.avatar}"><span>${user.name}</span></div>`;
    }
    document.getElementById("login").style.transform = "translateX(-100%)";
    document.getElementById("msgs").scrollTo(0, document.getElementById("msgs").scrollHeight);
});
document.getElementById("msgs").scrollTo(0, document.getElementById("msgs").scrollHeight);

socket.on("error", (error) => {
    Array.from(document.getElementsByClassName("error")).forEach((e) => {
        e.innerHTML = error;
    });
});

socket.on("message", (message) => {
    var file = message.file ? `<a href=${encodeURI(message.file)}>${decodeURI(message.file).slice(message.file.lastIndexOf("/") + 1)}</a>` : "";
    document.getElementById("msgs").innerHTML += `<div><img src="${message.author.avatar}"><h2>${message.author.name} <span>${message.date}${message.discord ? " DISCORD" : ""}</span></h2><p>${message.text.autoLink()}</p>${file}</div>`;
    document.getElementById("msgs").scrollTo(0, document.getElementById("msgs").scrollHeight);
});

socket.on("user", (user) => {
    document.getElementById("users").innerHTML += `<div id="${user.id}"><img src="${user.avatar}"><span>${user.name}</span></div>`;
});

socket.on("deleteUser", (userID) => {
    document.getElementById(userID).remove();
});