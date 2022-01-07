// Current user to register 
let currReg = {};
//Get request to log out of the system  
function logout() {
    let req = new XMLHttpRequest();
    req.open("GET", "/logout")
    req.send();
    window.location.href = "/home"
}

//Post request to log in to the system 
function login() {
    let user = {};
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (username === "" || password === "") {
        alert("Missing field make sure to enter a valid username and a password!");
        return;
    }

    user.username = username;
    user.password = password;

    let req = new XMLHttpRequest();
    req.open("POST", "/login");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(user));
    console.log("got here still")
    getStatus();
}

// Get request to see if user credentials were correct 
function getStatus() {
    let req = new XMLHttpRequest();

    req.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            let response = req.responseText;
            console.log(response);
            if (response === "false") {
                document.getElementById("password").value = "";
                alert("Either the Username or the Password is inncorrect!");
            }
            else {
                window.location.href = "/home"
            }
        }
    }
    req.open("GET", "/getStatus");
    req.send();
}

// Post request to register the user 
function registerUser() {
    let user = {};
    let username = document.getElementById("usernameR").value;
    let password = document.getElementById("passwordR").value;

    if (username === "" || password === "") {
        alert("Missing field make sure to enter a valid username and a password!");
    }

    user.username = username;
    user.password = password;
    currReg = user

    let req = new XMLHttpRequest();
    req.open("POST", "/addUser");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(user));
    getregStatus();
}

function getregStatus() {
    let req = new XMLHttpRequest();

    req.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            let response = req.responseText;
            console.log(response);
            if (response === "false") {
                document.getElementById("passwordR").value = "";
                document.getElementById("usernameR").value = "";
                alert("Username already exists please try another name!");
            }
            else {
                let req = new XMLHttpRequest();
                req.open("POST", "/login");
                req.setRequestHeader("Content-Type", "application/json");
                req.send(JSON.stringify(currReg));
                window.location.href = "/home"
                currReg = undefined;
            }
        }
    }
    req.open("GET", "/registerStatus");
    req.send();
}