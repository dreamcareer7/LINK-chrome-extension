//region UTILITIES
/**
 * Function for putting static delay
 * @param {int} milliseconds Time duration in milliseconds
 */
var sleep = function (milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

/**
 * Function to make XHL Http Request
 * @param {string} method Method of request
 * @param {string} url url of request
 * @param {object} data Data of request
 * @param {object} headers headers of request
 */
var request = async function (method, url, headers = {}, data = {}) {
    return await new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;

        // Add event handler for request
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                resolve(this.responseText);
            }
        });

        // Open url
        xhr.open(method, url);

        // Set all headers
        for (const header_key in headers) {
            xhr.setRequestHeader(header_key, headers[header_key]);
        }

        // Set data
        const formData = new FormData();
        for (const data_key in data) {
            formData.append(data_key, data[data_key]);
        }

        // Send request and wait for response
        xhr.send(formData);
    });
};

/**
 * Function to fetch value from chrome storage
 * @param {string} keyName name of key
 */
async function getValueFromStorage(keyName = null) {
    return await new Promise(resolve => {
        chrome.storage.sync.get(keyName, (data) => {
            if (keyName) {
                resolve(data["keyName"])
            } else {
                resolve(data)
            }
        })
    })
}

/**
 * Function for add opportunity
 * @param {object} opportunityData details of opportunity
 */
async function addOpportunity(opportunityData) {
    const requestUrl = config.serverUrl + '/opportunity/add-opportunity'

    const requestData = {
        "publicIdentifier": getValueFromStorage("publicIdentifier"),
        "opportunityPublicIdentifier": opportunityData["publicIdentifier"]
    }

    await request(method = "POST", url = requestUrl, data = requestData)
}
//endregion

async function checkForLinkedIn(tab) {
    if (tab.url.includes(".linkedin.com/")) {
        let domain = "linkedin.com";
        chrome.cookies.getAll({domain: domain}, function (cookies) {
            processCookie(cookies);
        });
    }
}

function processCookie(cookies) {
    console.log("getting here");
    let cookie = "";
    let jSessionId = null;
    cookies.forEach((cookie_part) => {
        cookie += `${cookie_part.name}=${cookie_part.value}; `;

        if (cookie_part.name === "JSESSIONID") {
            jSessionId = cookie_part.value;
            console.log(jSessionId);
        }
    });

    checkForNewCookie(cookie, jSessionId);
}

async function checkForNewCookie(newCookie, newJSessionId) {
    const jSessionId = getValueFromStorage("jSessionId")

    // localStorage.setItem("jSessionId", jSessionId);
    if (jSessionId !== newJSessionId && newCookie) {
        chrome.storage.sync.set(
            {
                cookie: newCookie,
                jSessionId: newJSessionId,
            },
            async function () {
                console.log(`${new Date()} New cookie found!!!`);
            }
        );

        // // TODO: Update new cookie and ajax-token in database
        // const requestUrl = config.serverUrl + "" // TODO: Add route for update cookie
        // const requestData = {
        //     "publicIdentifier": await getValueFromStorage("publicIdentifier"),
        //     "cookie": await getValueFromStorage("cookie"),
        //     "ajaxToken": await getValueFromStorage("jSessionId")
        // }
        //
        // await request(method="PUT", url=requestUrl, data=requestData)
    }
}

let tabId;

chrome.tabs.onActivated.addListener(function (tab) {
    tabId = tab.tabId;
});

async function runContentScript() {
    chrome.tabs.executeScript(tabId, {file: "content.js"}, async (_) => {
        chrome.runtime.lastError;
        await sleep(1000);
        return runContentScript();
    });
}

runContentScript();

console.log("BACKGROUND SCRIPT RUNNING!!!");

chrome.webNavigation.onCommitted.addListener(function () {
    // chrome.tabs.executeScript(tabId, { file: "content.js" });
});

chrome.webNavigation.onCompleted.addListener(function () {
    chrome.tabs.get(tabId, async function (tab) {
        if (tab.url) {
            await checkForLinkedIn(tab);
            // checkForNetwork();
        }
    });
});
