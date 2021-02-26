async function resetValidation() {
    await new Promise(resolve => {
        chrome.storage.sync.set({isSubscribe: false, token: "0"}, async function () {
            resolve();
        });
    });
}

// resetValidation()

//region UTILITIES

let util = {
    serverUrl: "https://jayla.linkfluencer.com/app",

    pageUrl: '',

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
                    resolve(this);
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
    }
}

//endregion

const redirects = {
    "logout": async function () {
        const requestUrl = util.serverUrl + '/client-auth/logout'
        const requestHeaders = {
            'authorization': await util.getValueFromStorage('token')
        }
        await util.request('POST', requestUrl, requestHeaders)
        chrome.storage.sync.set(
            {
                "token": null,
                "profilePicture": null,
                "profileName": null,
                "profileTitle": null,
                "lToken": null,
                'is': null
            }, function () {
                chrome.browserAction.setPopup({popup: "signin.html"});
                window.location.href = "signin.html";
            })
    },
}

async function init() {
    if (await util.getValueFromStorage('lToken')) {
        if((await util.getValueFromStorage('is'))=== '1') {
            const requestUrl = util.serverUrl + '/client-auth/get-login-status'
            const requestHeaders = {
                "authorization": await util.getValueFromStorage('token')
            }
            const response = await util.request('GET', requestUrl, requestHeaders);
            chrome.runtime.sendMessage({action: 'log', message: `Check login status: ${response.status.toString()}`})
            if (response.status !== 200) {
                redirects.logout();
            } else {
                chrome.browserAction.setPopup({popup: "loggedIn.html"});
                window.location.href = "loggedIn.html";
            }
        } else {
            chrome.browserAction.setPopup({popup: "signup.html"});
            window.location.href = "signup.html";
        }
    }
}
init()

async function fetchProfileUrlSalesNavigator() {
    // Create request url
    const urlParts = util.pageUrl.split("/");

    const searchData = urlParts[urlParts.indexOf("people") + 1]
        .split("?")[0]
        .split(",");

    const requestUrl =
        "https://www.linkedin.com/sales-api/salesApiProfiles/(" +
        `profileId:${searchData[0]},` +
        `authType:${searchData[1]},` +
        `authToken:${searchData[2]}` +
        ")?decoration=%28entityUrn%2CobjectUrn%2CpictureInfo%2CprofilePictureDisplayImage%2CfirstName%2C" +
        "lastName%2CfullName%2Ccolleague%2Cheadline%2CmemberBadges%2Cdegree%2CprofileUnlockInfo%2C" +
        "location%2ClistCount%2Cindustry%2CnumOfConnections%2CinmailRestriction%2CsavedLead%2C" +
        "defaultPosition%2CcontactInfo%2Csummary%2CcrmStatus%2CpendingInvitation%2Cunlocked%2C" +
        "relatedColleagueCompanyId%2CnumOfSharedConnections%2CshowTotalConnectionsPage%2CconnectedTime%2C" +
        "noteCount%2CflagshipProfileUrl%2Cmemorialized%2Cpositions*%2Ceducations*%29";

    // Create headers parameters
    const requestHeaders = {
        authority: "www.linkedin.com",
        "x-li-lang": "en_US",
        "x-li-identity": "dXJuOmxpOmVudGVycHJpc2VQcm9maWxlOih1cm46bGk6ZW50ZXJwcmlzZUFjY291bnQ6ODY0MjAwNTcsMTEyOTE1NDc3KQ",
        "x-li-page-instance": "urn:li:page:d_sales2_profile;ld3Dc2I3Q6O3Md395JswLg==",
        "x-restli-protocol-version": "2.0.0",
        "x-requested-with": "XMLHttpRequest",
        "accept-language": "en-US,en;q=0.9",
        "csrf-token": await util.getValueFromStorage("jSessionId"),
    };

    // Send request and return linkedin profile url
    const response = await util.request(method = "GET", url = requestUrl, headers = requestHeaders)
    return JSON.parse(response.responseText).flagshipProfileUrl;
}

async function checkForLinkedIn(tab) {
    if (
        tab.url.includes(
            "https://jayla.linkfluencer.com/app/linkedin-signin.html?token="
        )
    ) {
        const queryParts = tab.url.split('?')[1].split('&')
        let queryParams = {};

        for (const index in queryParts) {
            queryParams[queryParts[index].split('=')[0]] = queryParts[index].split('=')[1]
        }

        const requestUrl = util.serverUrl + '/client-auth/get-profile-for-extension'

        const requestHeaders = {
            "authorization": queryParams["lToken"]
        }

        let response = await util.request('GET', requestUrl, requestHeaders)

        if (response.status === 200)
            response = JSON.parse(response.responseText).data
        else {
            response = {}
        }

        // console.log(response)
        chrome.storage.sync.set({
                token: queryParams["token"],
                lToken: queryParams["lToken"],
                isSubscribe: true,
                profilePicture: response.profilePicture,
                profileName: response.profileName,
                profileTitle: response.profileTitle,
                is: queryParams["is"]
            }, async function () {
                // console.log("STORED", await util.getValueFromStorage("token"), await util.getValueFromStorage("isSubscribe"));
                if (queryParams["is"] === '1') {
                    chrome.browserAction.setPopup({popup: "loggedIn.html"});
                    window.location.href = "loggedIn.html";
                } else {
                    chrome.browserAction.setPopup({popup: "signup.html"});
                    window.location.href = "signup.html";
                }
            }
        );
    }
}

function processCookie(cookies, publicIdentifier) {
    let cookie = "";
    let jSessionId = null;
    cookies.forEach((cookie_part) => {
        cookie += `${cookie_part.name}=${cookie_part.value}; `;

        if (cookie_part.name === "JSESSIONID") {
            jSessionId = cookie_part.value.replace(/"/g, '');
        }
    });

    checkForNewCookie(cookie, jSessionId, publicIdentifier);
}

async function checkForNewCookie(newCookie, newJSessionId, publicIdentifier) {
    const jSessionId = await util.getValueFromStorage("jSessionId")
    const cookie = await util.getValueFromStorage("cookie")
    // if (jSessionId !== newJSessionId && newCookie) {
    if (cookie !== newCookie) {
        const accessToken = await util.getValueFromStorage("token")

        if (accessToken && accessToken.length > 0) {
            chrome.storage.sync.set(
                {
                    cookie: newCookie,
                    jSessionId: newJSessionId,
                    publicIdentifier: publicIdentifier
                },
                async function () {
                    // console.log(`${new Date()} New cookie found!!!`);
                }
            );
            const requestUrl = util.serverUrl + "/client-auth/get-cookie"

            const requestData = {
                "cookie": newCookie,
                "ajaxToken": newJSessionId,
                "publicIdentifier": publicIdentifier
            }
            // console.log(accessToken)

            const requestHeaders = {
                "authorization": accessToken
            }

            const response = await util.request(
                method = "POST", url = requestUrl, headers = requestHeaders, data = requestData)

            // console.log(response.status);
            if (response.status === 401) {
                chrome.storage.sync.set({"token": null}, function () {
                    chrome.browserAction.setPopup({popup: "signin.html"});
                    window.location.href = "signin.html";
                })
            }
        }

        // console.log(response.responseText)
    }
}

let tabId;

chrome.tabs.onActivated.addListener(function (tab) {
    tabId = tab.tabId;
});

let runAgain = true

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.action === 'run_again') {
        runAgain = true;
    } else if (request.action === 'check_new_cookie') {
        // console.log("Get cookie")
        let domain = "linkedin.com";
        // console.log(request.publicIdentifier)
        chrome.cookies.getAll({domain: domain}, function (cookies) {

            processCookie(cookies, request.publicIdentifier);
        });
    } else if (request.action === 'store_page_url') {
        util.pageUrl = request.pageUrl
    } else if (request.action === 'log') {
        console.log(request.message)
    }
});

let tries = 0

async function runContentScript() {
    if (runAgain && (await util.getValueFromStorage("isSubscribe"))) {
        runAgain = false
        tries = 0
        // console.log("running content script")
        chrome.tabs.executeScript(tabId, {file: "content.js"}, async (_) => {
            if (chrome.runtime.lastError) runAgain = true;
        });
    }

    if (tries > 10) {
        tries = 0;
        runAgain = true;
    }
    tries++;
    await util.sleep(1000);
    // console.log("Running Again")
    return runContentScript();
}

// console.log("Running content script")
runContentScript();

// console.log(`BACKGROUND SCRIPT RUNNING!!! ${(new Date()).toString()}`);

chrome.webRequest.onCompleted.addListener(async function (details) {
    let profileUrl;
    let action = false
    if (details.url.includes('https://www.linkedin.com/voyager/api/growth/normInvitations')) {
        profileUrl = util.pageUrl;
        action = true;

    } else if (details.url.includes('https://www.linkedin.com/sales-api/salesApiConnection?action=connect')) {
        profileUrl = await fetchProfileUrlSalesNavigator()
        action = true
    }

    if (action && (await util.getValueFromStorage('is') === '1')){
        const profileUrlParts = profileUrl.split('/')
        const publicIdentifier = profileUrlParts[profileUrlParts.indexOf("in") + 1];


        const requestUrl = util.serverUrl + '/invitee/add-user'
        const requestHeaders = {
            "authorization": await util.getValueFromStorage('token')
        }
        const requestData = {
            publicIdentifier: publicIdentifier
        }

        await util.request('PUT', requestUrl, requestHeaders, requestData)

    }
}, {
    urls: [
        "https://www.linkedin.com/voyager/api/growth/*",
        "https://www.linkedin.com/sales-api/*"
    ]
});

chrome.webNavigation.onCompleted.addListener(function () {
    chrome.tabs.get(tabId, async function (tab) {
        if (tab.url) {
            await checkForLinkedIn(tab);
            // checkForNetwork();
        }
    });
});
