
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
    var format = function () {
        return this.autoLink({
            callback: function (url) {
                return /\.(webp|svg|gif|png|jpe?g)$/i.test(url) ? '<a href="' + url + '"><img src="' + url + '"></a>' : null;
            }
        })
            .replace(/```(.*\n)?([^```][^```]*)```/g, "<pre><code>$2</code></pre>")
            .replace(/`([^`][^`]*)`/g, "<code>$1</code>")
            .replace(/\n/g, "<br>")
            .replace(/~~([^~~][^~~]*)~~/g, "<s>$1</s>")
            .replace(/<@!?&?([0-9]{18})>/g, "<span class='mention'>@$1</span>")
            .replace(/<#([0-9]{18})>/g, "<span class='mention'>#$1</span>")
            .replace(/\|\|([^\|\|][^\|\|]*)\|\|/g, "<span onclick=\"this.classList.toggle('show')\" class='spoiler'>$1</span>")
            .replace(/\*\*([^\*\*][^\*\*]*)\*\*/g, "<strong>$1</strong>")
            .replace("@everyone", "<span class='mention'>@everyone</span>")
            .replace("@here", "<span class='mention'>@here</span>")
            .replace(/__([^__][^__]*)__/g, "<u>$1</u>")
            .replace(/[\*_]([^\*_][^\*_]*)[\*_]/g, "<em>$1</em>");
    }
    String.prototype['discordFormat'] = format;
    var sendFormat = function () {
        return this.autoLink({
            callback: function (url) {
                return /\.(webp|svg|gif|png|jpe?g)$/i.test(url) ? '<a href="' + url + '"><img src="' + url + '"></a>' : null;
            }
        })
            .replace(/```(.*\n)?([^```][^```]*)```/g, "<span style='color: #72767d'>```</span><span style='color: #4CC029'>$1</span>$2<span style='color: #72767d'>```</span>")
            .replace(/`([^`][^`]*)`/g, "<code>`$1`</code>")
            .replace(/\n/g, "<br>")
            .replace(/~~([^~~][^~~]*)~~/g, "<s>~~$1~~</s>")
            // .replace(/<@!?&?([0-9]{18})>/g, "<span class='mention'>@$1</span>")
            // .replace(/<#([0-9]{18})>/g, "<span class='mention'>#$1</span>")
            .replace(/\|\|([^\|\|][^\|\|]*)\|\|/g, "<span class='spoiler show'>||$1||</span>")
            .replace(/\*\*([^\*\*][^\*\*]*)\*\*/g, "<strong>**$1**</strong>")
            .replace("@everyone", "<span class='mention'>@everyone</span>")
            .replace("@here", "<span class='mention'>@here</span>")
            .replace(/__([^__][^__]*)__/g, "<u>__$1__</u>")
            .replace(/\*([^\*][^\*]*)\*/g, "<em>*$1*</em>")
            .replace(/_([^_][^_]*)_/g, "<em>_$1_</em>");
    }
    String.prototype['sendFormat'] = sendFormat;
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

function avatarUploaded() {
    if (document.getElementById("avatar-file").files[0]) {
        var reader = new FileReader();
        reader.readAsDataURL(document.getElementById("avatar-file").files[0]);
        reader.onload = function () {
            document.getElementById("avatar").src = reader.result;
        };
        reader.onerror = function (error) {
            document.getElementById("avatar-file").value = "";
        };
    } else {
        document.getElementById("avatar").src = "/images/user.png";
    }
}

function remove() {
    document.getElementById("file-to-upload").style.display = "none";
    document.getElementById("file").value = '';
}

function login(e) {
    e.preventDefault();
    socket.emit("login", document.getElementById("username-input").value, document.getElementById("password-input").value);
}

function register(e) {
    e.preventDefault();
    if (document.getElementById("register-username-input").value !== "" && document.getElementById("register-password-input").value === document.getElementById("register-password2-input").value) {
        if (document.getElementById("avatar-file").files[0]) {
            var data = new FormData();
            data.append('file', document.getElementById("avatar-file").files[0]);
            var ajax = new XMLHttpRequest();
            ajax.upload.addEventListener("progress", (e) => {
                document.getElementById("avatar-upload-progress").value = Math.round((e.loaded / e.total) * 100);
            }, false);
            ajax.addEventListener("load", () => {
                socket.emit("register", document.getElementById("register-username-input").value, document.getElementById("register-password-input").value, "/files/" + document.getElementById("avatar-file").files[0].name);
            }, false);
            ajax.addEventListener("error", () => {
                socket.emit("register", document.getElementById("register-username-input").value, document.getElementById("register-password-input").value, "/images/user.png");
            }, false);
            ajax.addEventListener("abort", () => {
                socket.emit("register", document.getElementById("register-username-input").value, document.getElementById("register-password-input").value, "/images/user.png");
            }, false);
            ajax.open("POST", "/upload");
            ajax.send(data);
            document.getElementById("avatar-upload-progress").style.display = "";
            document.getElementById("avatar-upload-progress").value = "0";
            document.getElementById("register-form").style.pointerEvents = "none";
            document.getElementById("submit").innerHTML = "...";
            document.getElementById("submit").style.backgroundColor = "#353d4f";
        } else {
            socket.emit("register", document.getElementById("register-username-input").value, document.getElementById("register-password-input").value, "/images/user.png");
        }
    }
}

function checkPassword() {
    if (document.getElementById("register-password-input").value === document.getElementById("register-password2-input").value) {
        document.getElementById("register-password2-input").style.borderColor = "";
    } else {
        document.getElementById("register-password2-input").style.borderColor = "red";
    }
}

function message(e) {
    // document.getElementById("message-input").innerHTML = document.getElementById("message-input").innerText.sendFormat();
    if (e.code === "Enter" && !e.shiftKey) {
        var message = document.getElementById("message-input").innerText;
        if (message !== "") {
            if (document.getElementById("file").files[0]) {
                var data = new FormData();
                var name = document.getElementById("file").files[0].name;
                data.append('file', document.getElementById("file").files[0]);
                var ajax = new XMLHttpRequest();
                ajax.upload.addEventListener("progress", (e) => {
                    document.getElementById("upload-progress").value = Math.round((e.loaded / e.total) * 100);
                }, false);
                ajax.addEventListener("load", () => {
                    document.getElementById("file-upload").style.display = "none";
                    socket.emit("send", message, "/files/" + name);
                }, false);
                ajax.addEventListener("error", () => {
                    document.getElementById("file-upload").style.backgroundColor = "red";
                    document.getElementById("upload-name").innerHTML += " error";
                    document.getElementById("upload-progress").value = "100";
                    socket.emit("send", message, null);
                }, false);
                ajax.addEventListener("abort", () => {
                    document.getElementById("file-upload").style.backgroundColor = "red";
                    document.getElementById("upload-name").innerHTML += " abort";
                    document.getElementById("upload-progress").value = "100";
                    socket.emit("send", message, null);
                }, false);
                ajax.open("POST", "/upload");
                ajax.send(data);
                document.getElementById("file-upload").style.display = "";
                document.getElementById("upload-progress").value = "0";
                document.getElementById("upload-name").innerHTML = name;
                document.getElementById("file-to-upload").style.display = "none";
                document.getElementById("file").value = '';
            } else {
                socket.emit("send", message, null);
            }
            document.getElementById("message-input").innerHTML = "";
        }
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
        var file = message.file ? `<a href="${encodeURI(message.file)}">${decodeURI(message.file).slice(message.file.lastIndexOf("/") + 1)}</a>` : "";
        document.getElementById("msgs").innerHTML += `<div><img src="${message.author.avatar}"><h2>${message.author.name} <span>${message.date}${message.discord ? " DISCORD" : ""}</span></h2><p>${message.text.discordFormat()}</p>${file}</div>`;
    }
    for (const user of discordUsers) {
        document.getElementById("discord-users").innerHTML += `<div id="${user.id}"><img src="${user.avatar}"><span>${user.name}</span></div>`;
    }
    document.getElementById("login").style.transform = "translateX(-100%)";
    document.getElementById("msgs").scrollTo(0, document.getElementById("msgs").scrollHeight);
    getMentions();
});
getMentions();
document.getElementById("msgs").scrollTo(0, document.getElementById("msgs").scrollHeight);

socket.on("error", (error) => {
    Array.from(document.getElementsByClassName("error")).forEach((e) => {
        e.innerHTML = error;
    });
});
socket.on("message", (message) => {
    var file = message.file ? (/\.(webp|svg|gif|png|jpe?g)$/i.test(message.file) ? `<a href="${encodeURI(message.file)}"><img src="${encodeURI(message.file)}"></a>` : `<a href="${encodeURI(message.file)}">${decodeURI(message.file).slice(message.file.lastIndexOf("/") + 1)}</a>`) : "";
    document.getElementById("msgs").innerHTML += `<div><img src="${message.author.avatar}"><h2>${message.author.name} <span>${message.date}${message.discord ? " DISCORD" : ""}</span></h2><p>${message.text.discordFormat()}</p>${file}</div>`;
    document.getElementById("msgs").scrollTo(0, document.getElementById("msgs").scrollHeight);
    getMentions();
});

socket.on("user", (user) => {
    document.getElementById("users").innerHTML += `<div id="${user.id}"><img src="${user.avatar}"><span>${user.name}</span></div>`;
});

socket.on("deleteUser", (userID) => {
    document.getElementById(userID).remove();
});
socket.on("mentions", (mentions) => {
    for (const span of Array.from(document.getElementsByClassName("mention"))) {
        if (mentions[span.innerHTML]) {
            span.innerHTML = mentions[span.innerHTML];
            span.classList.add("parsed");
        }
    }
});
function getMentions() {
    var mentions = [];
    for (const span of Array.from(document.getElementsByClassName("mention"))) {
        if (!span.classList.contains("parsed")) {
            mentions.push(span.innerHTML);
        }
    }
    socket.emit("getMentions", mentions);
}
const publicVapidKey = "BFmbQp2AEC62owsB0l9XQmfHRgGclwrkywTpHYHyGT7y8-ucYu9vAeYnXwB93jB-Xd_51isZDCJoj0v5cdY-HOU";
if ("serviceWorker" in navigator) {
    sendWorker().catch(err => console.error(err));
}
async function sendWorker() {
    console.log("Registering service worker...");
    const register = await navigator.serviceWorker.register("/worker.js", {
        scope: "/"
    });
    console.log("Service Worker Registered...");
    console.log("Registering Push...");
    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });
    console.log("Push Registered...");
    console.log("Sending Push...");
    await fetch("/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
            "content-type": "application/json"
        }
    });
    console.log("Push Sent...");
}

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}