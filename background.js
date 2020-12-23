async function resetValidation() {
    await new Promise(resolve => {
        chrome.storage.sync.set({isSubscribe: false, token: "0"}, async function () {
            resolve();
        });
    });
}

resetValidation()

//region UTILITIES

let util = {
    serverUrl: "https://1b9b30f5b00f.ngrok.io",

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
            "https://1b9b30f5b00f.ngrok.io/linkedin-signin.html?token="
        )
    ) {
        const token = tab.url.split('?')[1].split('&')[0].replace('token=', '')
        console.log(token)
        chrome.storage.sync.set({
                token: token,
                isSubscribe: true,
            }, async function () {
                console.log("STORED", await util.getValueFromStorage("token"), await util.getValueFromStorage("isSubscribe"));
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
        }
    });

    checkForNewCookie(cookie, jSessionId);
}

async function checkForNewCookie(newCookie, newJSessionId) {
    const jSessionId = await util.getValueFromStorage("jSessionId")
    const cookie = await util.getValueFromStorage("cookie")
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

        const accessToken = await util.getValueFromStorage("token")
        console.log(accessToken)

        const requestHeaders = {
            "authorization": accessToken
        }

        const response = await util.request(
            method = "POST", url = requestUrl, headers = requestHeaders, data = requestData)
        console.log(response)
    }
}

let tabId;

chrome.tabs.onActivated.addListener(function (tab) {
    tabId = tab.tabId;
});

let runAgain = true

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
        if (request.runAgain) runAgain = true;
    }
)

let tries = 0

async function runContentScript() {
    if (runAgain && (await util.getValueFromStorage("isSubscribe"))) {
        runAgain = false
        tries = 0
        console.log("running content script")
        chrome.tabs.executeScript(tabId, {file: "content.js"}, async (_) => {
            if (chrome.runtime.lastError) runAgain = true;
        });
    }

    if (tries > 10) runAgain = true;
    tries++;
    await util.sleep(1000);
    console.log("Running Again")
    return runContentScript();
}

console.log("Running content script")
runContentScript();

console.log(`BACKGROUND SCRIPT RUNNING!!! ${(new Date()).toString()}`);

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
