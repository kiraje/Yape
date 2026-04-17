importScripts('js/storage.js');

const notify = function(title, message) {
    return chrome.notifications.create('', {
        type: 'basic',
        title: title || 'Yape',
        message: message || '',
        iconUrl: './images/icon.png',
    });
}

const loadToastr = function(tab, callback) {
    chrome.scripting.insertCSS({
        target: {tabId: tab.id},
        files: ['css/toastr.min.css']
    }, function() {
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['js/lib/jquery-3.5.1.min.js', 'js/lib/toastr.min.js']
        }, function() {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                func: () => {
                    toastr.options = {
                        closeButton: false,
                        newestOnTop: false,
                        progressBar: false,
                        positionClass: 'toastr-top-right',
                        containerId: 'toastr-container',
                        toastClass: 'toastr',
                        iconClasses: {
                            error: 'toastr-error',
                            info: 'toastr-info',
                            success: 'toastr-success',
                            warning: 'toastr-warning'
                        },
                        iconClass: 'toastr-info',
                        titleClass: 'toastr-title',
                        messageClass: 'toastr-message',
                        closeClass: 'toastr-close-button',
                        timeOut: 8000
                    };
                }
            }, function() {
                callback();
            });
        });
    });
}

const sendToast = function(tab, type, message) {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: (type, message) => {
            toastr.remove();
            toastr[type](message);
        },
        args: [type, message]
    });
}

const pyloadFetch = async function(path, body, signal) {
    const headers = { 'Content-Type': 'application/json' };
    const auth = authHeader();
    if (auth) headers['Authorization'] = auth;
    const response = await fetch(`${origin}${path}`, { method: 'POST', signal, headers, body: JSON.stringify(body) });
    if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid username or password — check extension options');
    }
    if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
    }
    const json = await response.json();
    if (json && json.hasOwnProperty('error')) {
        throw new Error(json.error);
    }
    return json;
}

const downloadLink = async function(info, tab) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
        await pyloadFetch('/api/check_urls', { urls: [info.linkUrl] }, controller.signal);
        const safeName = info.linkUrl.replace(/[^a-z0-9._\-]/gi, '_');
        await pyloadFetch('/api/add_package', { name: safeName, links: [info.linkUrl] }, controller.signal);
        sendToast(tab, 'success', 'Download added successfully');
    } catch (e) {
        const msg = e.name === 'AbortError' ? 'Server unreachable' : (e.message || 'Server unreachable');
        sendToast(tab, 'error', msg);
    } finally {
        clearTimeout(timeoutId);
    }
}

chrome.runtime.onInstalled.addListener( () => {
    chrome.contextMenus.create({
        id: 'yape',
        title: 'Download with Yape',
        contexts:['link']
    });
});

chrome.runtime.onMessage.addListener( data => {
    if (data.type === 'notification') {
        notify(data.title, data.message);
    }
});

chrome.contextMenus.onClicked.addListener( ( info, tab ) => {
    if ('yape' === info.menuItemId) {
        loadToastr(tab, function() {
            pullStoredData(function() {
                sendToast(tab, 'info', 'Requesting download...');
                downloadLink(info, tab);
            });
        });
    }
} );
