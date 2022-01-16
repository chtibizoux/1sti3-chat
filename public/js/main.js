
var socket = io();

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

if (document.cookie.includes("username=")) {
    var cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        if (cookie.startsWith("username=")) {
            document.getElementById("login").style.display = "none";
            socket.emit("login", decodeURIComponent(cookie.replace("username=", "")));
            break;
        }
    }
}

function login(e) {
    e.preventDefault();
    if (document.getElementById("username-input").value !== "") {
        document.cookie = "username=" + encodeURIComponent(document.getElementById("username-input").value)
        socket.emit("login", document.getElementById("username-input").value);
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

socket.on("data", (socketID, users, messages) => {
    document.getElementById("users").innerHTML = "";
    document.getElementById("msgs").innerHTML = "";
    for (const user of users) {
        document.getElementById("users").innerHTML += `<div id="${user.id}"><svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 448 512"><path fill="currentColor" d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg><span>${user.name}</span></div>`;
    }
    for (const message of messages) {
        var file = message.file ? `<a href=${encodeURI(message.file)}>${message.file.replace("/files/", "")}</a>` : "";
        document.getElementById("msgs").innerHTML += `<div><h2>${message.author.name} <span>${message.date}</span></h2><p>${message.text}</p>${file}</div>`;
    }
    document.getElementById("login").style.transform = "translateX(-100%)";
    document.getElementById("msgs").scrollTo(0, document.getElementById("msgs").scrollHeight);
});

socket.on("message", (message) => {
    var file = message.file ? `<a href=${encodeURI(message.file)}>${message.file.replace("/files/", "")}</a>` : "";
    document.getElementById("msgs").innerHTML += `<div><h2>${message.author.name} <span>${message.date}</span></h2><p>${message.text}</p>${file}</div>`;
    document.getElementById("msgs").scrollTo(0, document.getElementById("msgs").scrollHeight);
});

socket.on("user", (user) => {
    document.getElementById("users").innerHTML += `<div id="${user.id}"><svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 448 512"><path fill="currentColor" d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg><span>${user.name}</span></div>`;
});

socket.on("deleteUser", (user) => {
    document.getElementById(user.id).remove();
});