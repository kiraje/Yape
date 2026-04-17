let serverPort, serverIp, serverProtocol, serverPath, origin, username, password;

const STORAGE_KEYS = ['serverIp', 'serverPort', 'serverPath', 'serverProtocol', 'username', 'password'];

function authHeader() {
    return username ? `Basic ${btoa(`${username}:${password}`)}` : null;
}

function buildOrigin() {
    let url = `${serverProtocol}://${serverIp}:${serverPort}${serverPath}`;
    if (url.endsWith('/')) url = url.slice(0, -1);
    return url;
}

function pullStoredData(callback) {
    chrome.storage.sync.get(STORAGE_KEYS, function(data) {
        serverIp = data.serverIp || '172.0.0.1';
        serverPort = data.serverPort || 8001;
        serverPath = data.serverPath || '/';
        serverProtocol = data.serverProtocol || 'http';
        username = data.username || '';
        password = data.password || '';
        origin = buildOrigin();
        if (callback) callback(data);
    });
}

function setOrigin(config, callback) {
    serverIp = config.ip;
    serverPort = config.port;
    serverProtocol = config.protocol;
    serverPath = config.path;
    username = config.username;
    password = config.password;
    origin = buildOrigin();
    chrome.storage.sync.set({
        serverIp, serverPort, serverProtocol, serverPath, username, password
    }, function () {
        if (callback) callback();
    });
}
