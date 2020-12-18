//region UTILITIES

let util = {
    serverUrl: "https://6290d32faa39.ngrok.io",

    /**
     * Function for putting static delay
     * @param {int} milliseconds Time duration in milliseconds
     */
    sleep: function (milliseconds) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    },

    /**
     * Function to make XHL Http Request
     * @param {string} method Method of request
     * @param {string} url url of request
     * @param {object} data Data of request
     * @param {object} headers headers of request
     */
    request: async function (method, url, headers = {}, data = {}) {
        return await new Promise(async (resolve) => {
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
            xhr.setRequestHeader("authorization", await util.getValueFromStorage("token"));
            xhr.setRequestHeader("Content-Type", "application/json");
            for (const header_key in headers) {
                xhr.setRequestHeader(header_key, headers[header_key]);
            }

            // Send request and wait for response
            xhr.send(JSON.stringify(data));
        });
    },

    /**
     * Function to fetch value from chrome storage
     * @param {string} keyName name of key
     */
    getValueFromStorage: async function (keyName = null) {
        return await new Promise(resolve => {
            chrome.storage.sync.get(keyName, (data) => {
                if (keyName) {
                    resolve(data[keyName])
                } else {
                    resolve(data)
                }
            })
        })
    },
    /**
     * Function for add opportunity
     * @param {object} opportunityData details of opportunity
     */
    addOpportunity: async function (opportunityData) {
        const requestUrl = util.serverUrl + '/opportunity/add-opportunity'

        const requestData = {
            "publicIdentifier": await util.getValueFromStorage("publicIdentifier"),
            "opportunityPublicIdentifier": opportunityData["publicIdentifier"]
        }

        await util.request(method = "POST", url = requestUrl, data = requestData)
    }

}

//endregion

async function checkForLinkedIn(tab) {
    if (tab.url.includes(".linkedin.com/")) {
        let domain = "linkedin.com";
        chrome.cookies.getAll({domain: domain}, function (cookies) {
            processCookie(cookies);
        });
    } else if (
        tab.url.includes(
            "https://6290d32faa39.ngrok.io/linkedin-signin.html?token="
        )
    ) {
        const token = tab.url.split('?')[1].split('&')[0].replace('token=', '')

        chrome.storage.sync.set(
            {
                token: token,
            }, async function () {
                console.log(token);
            }
        );
    }
}

function processCookie(cookies) {
    let cookie = "";
    let jSessionId = null;
    cookies.forEach((cookie_part) => {
        cookie += `${cookie_part.name}=${cookie_part.value}; `;

        if (cookie_part.name === "JSESSIONID") {
            jSessionId = cookie_part.value.replace(/"/g, '');
            console.log(jSessionId);
        }
    });

    checkForNewCookie(cookie, jSessionId);
}

async function checkForNewCookie(newCookie, newJSessionId) {
    const jSessionId = await util.getValueFromStorage("jSessionId")
    const cookie = await util.getValueFromStorage("cookie")
    console.log(newJSessionId)
    // if (jSessionId !== newJSessionId && newCookie) {
    if (cookie !== newCookie) {
        chrome.storage.sync.set(
            {
                cookie: newCookie,
                jSessionId: newJSessionId,
            },
            async function () {
                console.log(`${new Date()} New cookie found!!!`);
            }
        );

        // TODO: Update new cookie and ajax-token in database
        const requestUrl = util.serverUrl + "/client-auth/get-cookie" // TODO: Add route for update cookie
        const requestData = {
            "cookie": newCookie,
            "ajaxToken": newJSessionId
        }

        const response = await util.request(method = "POST", url = requestUrl, headers = {}, data = requestData)
        console.log(response)
    }
}

let tabId;

chrome.tabs.onActivated.addListener(function (tab) {
    tabId = tab.tabId;
});

async function runContentScript() {
    chrome.tabs.executeScript(tabId, {file: "content.js"}, async (_) => {
        chrome.runtime.lastError;
        await util.sleep(1000);
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
