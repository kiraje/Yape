let usernameInput = document.getElementById('username');
let passwordInput = document.getElementById('password');
let serverIpInput = document.getElementById('serverIp');
let serverPortInput = document.getElementById('serverPort');
let serverPathInput = document.getElementById('serverPath');
let useHTTPSInput = document.getElementById('useHTTPS');
let spinnerDiv = document.getElementById('spinnerDiv');
let loginStatusOKDiv = document.getElementById('loginStatusOK');
let loginStatusKODiv = document.getElementById('loginStatusKO');
let currentURL = document.getElementById('currentURL');

let saveButton = document.getElementById('saveButton');


function enableSpinner() {
    spinnerDiv.innerHTML = `
        <div class="spinner-border text-primary m-3"></div>
        <div>Checking status...</div>
    `;
}

function disableSpinner() {
    spinnerDiv.innerHTML = ``;
}

function getProtocol() {
    return useHTTPSInput.checked ? 'https' : 'http';
}

function setStatusMessage(div, iconClass, message) {
    div.textContent = '';
    const icon = document.createElement('i');
    icon.className = `fa ${iconClass} small mr-3`;
    div.appendChild(icon);
    div.appendChild(document.createTextNode(message));
}

let pendingStatusXhr = null;

function updateLoggedInStatus(callback) {
    saveButton.disabled = true;
    loginStatusOKDiv.hidden = true;
    loginStatusKODiv.hidden = true;
    enableSpinner();
    pendingStatusXhr = getServerStatus(function(loggedIn, unauthorized, error) {
        pendingStatusXhr = null;
        disableSpinner();
        loginStatusOKDiv.hidden = !loggedIn;
        loginStatusKODiv.hidden = loggedIn;
        if (!loggedIn) {
            const msg = unauthorized ? 'Invalid username or password' : (error || 'Not connected');
            setStatusMessage(loginStatusKODiv, 'fa-times', msg);
        }
        saveButton.disabled = false;
        if (callback) callback();
    });
}

function requestPermission(callback) {
    chrome.permissions.contains({
        origins: [`${origin}/`]
    }, function(result) {
        if (!result) {
            chrome.permissions.request({
                origins: [`${origin}/`]
            }, function(granted) {
                if (callback) {
                    if (!granted) {
                        alert('Not granting this permission will make the extension unusable.');
                    }
                    callback(granted);
                }
            });
        } else if (callback) {
            callback(true);
        }
    });
}

function validHost(str) {
    let pattern = new RegExp('^((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))$'); // OR ip (v4) address
    return !!pattern.test(str);
}

function applyValidity(input, isValid) {
    if (isValid) {
        input.classList.remove('is-invalid');
    } else {
        input.classList.add('is-invalid');
        saveButton.disabled = true;
    }
}

function validateForm() {
    const host = serverIpInput.value;
    applyValidity(serverIpInput, validHost(host) || host === 'localhost');
    applyValidity(serverPortInput, /\d+/.test(serverPortInput.value));
    applyValidity(serverPathInput, /^((\/[.\w-]+)*\/{0,1}|\/)$/.test(serverPathInput.value));
}

function requireSaving() {
    updateCurrentURL();
    if (pendingStatusXhr !== null) {
        pendingStatusXhr.abort();
        pendingStatusXhr = null;
    }
    if (serverIpInput.value === serverIp &&
        parseInt(serverPortInput.value) === parseInt(serverPort) &&
        useHTTPSInput.checked === (serverProtocol === 'https') &&
        serverPathInput.value === serverPath &&
        usernameInput.value === username &&
        passwordInput.value === password) {
        updateLoggedInStatus();
    } else {
        saveButton.disabled = false;
        loginStatusOKDiv.hidden = true;
        loginStatusKODiv.hidden = true;
    }
    validateForm();
}

function updateCurrentURL() {
    const protocol = useHTTPSInput.checked ? 'https' : 'http';
    const port = serverPortInput.value;
    const isDefaultPort = (useHTTPSInput.checked && port === '443') || (!useHTTPSInput.checked && port === '80');
    const portString = isDefaultPort ? '' : `:${port}`;
    currentURL.textContent = `${protocol}://${serverIpInput.value}${portString}${serverPathInput.value}`;
}

saveButton.onclick = function(ev) {
    setOrigin({
        ip: serverIpInput.value,
        port: serverPortInput.value,
        protocol: getProtocol(),
        path: serverPathInput.value,
        username: usernameInput.value,
        password: passwordInput.value
    }, function() {
        requestPermission(function(granted) {
            updateLoggedInStatus();
        });
    });
};

$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();
});

pullStoredData(function() {
    serverIpInput.value = serverIp;
    serverPortInput.value = serverPort;
    serverPathInput.value = serverPath;
    useHTTPSInput.checked = serverProtocol === 'https';
    usernameInput.value = username;
    passwordInput.value = password;

    updateCurrentURL();

    serverIpInput.oninput = requireSaving;
    serverPortInput.oninput = requireSaving;
    useHTTPSInput.oninput = requireSaving;
    serverPathInput.oninput = requireSaving;
    usernameInput.oninput = requireSaving;
    passwordInput.oninput = requireSaving;

    updateLoggedInStatus();
});
