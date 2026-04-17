function classifyStatusResponse(status, responseText) {
    let parsed = null;
    try { parsed = JSON.parse(responseText); } catch {}

    if (status === 200) {
        return { ok: true, unauthorized: false, error: null, parsed };
    }
    if (status === 401 || status === 403) {
        return { ok: false, unauthorized: true, error: 'Invalid username or password', parsed };
    }
    if (status === 404) {
        return { ok: false, unauthorized: false, error: 'Server path not found', parsed };
    }
    if (status === 0) {
        return { ok: false, unauthorized: false, error: 'Server unreachable', parsed };
    }
    const detail = (parsed && parsed.error) || `Server error (${status})`;
    return { ok: false, unauthorized: false, error: detail, parsed };
}

function pyloadXhr(method, path, opts) {
    const { body, timeout, onDone, onTimeout } = opts || {};
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${origin}${path}`, true);
    if (body !== undefined) xhr.setRequestHeader('Content-type', 'application/json');
    const auth = authHeader();
    if (auth) xhr.setRequestHeader('Authorization', auth);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && onDone) onDone(xhr);
    };
    if (timeout) {
        xhr.timeout = timeout;
        xhr.ontimeout = onTimeout || null;
    }
    xhr.send(body === undefined ? null : JSON.stringify(body));
    return xhr;
}

function getServerStatus(callback) {
    return pyloadXhr('GET', '/api/status_server', {
        timeout: 5000,
        onTimeout: () => callback && callback(false, false, 'Server unreachable'),
        onDone: (xhr) => {
            if (!callback) return;
            const r = classifyStatusResponse(xhr.status, xhr.responseText);
            callback(r.ok, r.unauthorized, r.error, r.parsed);
        }
    });
}

function getStatusDownloads(callback) {
    pyloadXhr('GET', '/api/status_downloads', {
        onDone: (xhr) => {
            let list = [];
            try {
                const parsed = JSON.parse(xhr.responseText);
                if (Array.isArray(parsed)) list = parsed;
            } catch {}
            if (callback) callback(list);
        }
    });
}

function getQueueData(callback) {
    pyloadXhr('GET', '/api/get_queue_data', {
        onDone: (xhr) => {
            const urls = [];
            try {
                const queueData = JSON.parse(xhr.responseText);
                if (Array.isArray(queueData)) {
                    queueData.forEach(pack => {
                        (pack.links || []).forEach(link => urls.push(link.url));
                    });
                }
            } catch {}
            if (callback) callback(urls);
        }
    });
}

function getLimitSpeedStatus(callback) {
    pyloadXhr('GET', '/api/get_config_value?category=download&option=limit_speed', {
        onDone: (xhr) => {
            let enabled = false;
            try {
                enabled = String(JSON.parse(xhr.responseText)).toLowerCase() === 'true';
            } catch {}
            if (callback) callback(enabled);
        }
    });
}

function setLimitSpeedStatus(limitSpeed, callback) {
    pyloadXhr('POST', '/api/set_config_value', {
        body: { category: 'download', option: 'limit_speed', value: limitSpeed, section: 'core' },
        onDone: (xhr) => callback && callback(xhr.status === 200)
    });
}

function addPackage(name, url, callback) {
    const safeName = name.replace(/[^a-z0-9._\-]/gi, '_');
    pyloadXhr('POST', '/api/add_package', {
        body: { name: safeName, links: [url] },
        onDone: (xhr) => {
            if (!callback) return;
            if (xhr.status === 200) return callback(true);
            let errorMsg = `HTTP ${xhr.status}`;
            try {
                const response = JSON.parse(xhr.responseText);
                if (response && response.error) errorMsg = response.error;
            } catch {}
            callback(false, errorMsg);
        }
    });
}

function checkURL(url, callback) {
    pyloadXhr('POST', '/api/check_urls', {
        body: { urls: [url] },
        onDone: (xhr) => {
            let supported = false;
            try {
                const response = JSON.parse(xhr.responseText);
                // pyload groups URLs by handling plugin name; DefaultPlugin/BasePlugin = no real handler
                const unsupported = response && (response.DefaultPlugin || response.BasePlugin);
                supported = xhr.status === 200 && response && !response.error && !unsupported;
            } catch {}
            if (callback) callback(supported);
        }
    });
}
