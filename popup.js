var util = {
    serverUrl: "https://link.dev.gradlesol.com/app",

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
                    console.log(this.status)
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
    },

    /**
     * Function for add opportunity
     * @param {object} opportunityData details of opportunity
     */
    addOpportunity: async function (opportunityData) {
        const requestUrl = util.serverUrl + '/opportunity/add-opportunity'

        const requestHeaders = {
            "Authorization": await util.getValueFromStorage("token")
        }

        const response = await util.request(
            method = "POST",
            url = requestUrl,
            headers = requestHeaders,
            data = opportunityData
        )

        return response.status === 200;
    },

    /**
     * Function to get added opportunity data
     * @param {object} requestData data to be send when doing request
     * @return {object[]} opportunity data
     */
    getOpportunity: async function (requestData = {}) {
        const requestUrl = util.serverUrl + '/opportunity/get-opportunity'

        const requestHeaders = {
            "Authorization": await util.getValueFromStorage("token")
        }

        const response = await util.request(
            method = "PUT", url = requestUrl, headers = requestHeaders, data = requestData)

        // console.log(response)

        return JSON.parse(response.responseText)
    },

    /**
     * Function to get added opportunity conversation ids list
     * @param {object} requestData data to be send when doing request
     * @return {object[]} opportunity data
     */
    getOpportunityConversation: async function (requestData = {}) {
        const requestUrl = util.serverUrl + '/conversation/get-conversation-id-arr'

        const requestHeaders = {
            "Authorization": await util.getValueFromStorage("token")
        }

        const response = await util.request(
            method = "POST", url = requestUrl, headers = requestHeaders, data = requestData)

        // console.log(response)

        return JSON.parse(response.responseText)
    },
}

console.log('Extension pop up page opened');

document.addEventListener('DOMContentLoaded', function () {
    console.log("INSIDE DOM");

    // check for signup element and add event listener
    const signupElement = document.getElementsByName('signup')[0]
    if (signupElement) {
        signupElement.addEventListener("click", function () {
            console.log("In Signup");
            signup()
        });
    }

    // check for login element and add event listener
    const loginElement = document.getElementsByName('login')[0]
    if (loginElement) {
        loginElement.addEventListener("click", function () {
            console.log("In Login");
            login()
        });
    }

    // check for logout element and add event listener
    const logoutElement = document.getElementsByName('logout')[0]
    if (logoutElement) {
        logoutElement.addEventListener("click", function () {
            console.log("In Logout");
            logout()
        });
    }
})

function signup() {
    const url = "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=776gktki6ukrgj&redirect_uri=https://link.dev.gradlesol.com/app/client-auth/sign-up&state=fooobar&scope=r_emailaddress,r_liteprofile"
    window.open(url, '_blank');
}

async function login() {
    const token = await util.getValueFromStorage("token");
    console.log(token)
    let url;
    if (token != null) {
        chrome.browserAction.setPopup({popup: "loggedIn.html"});
        window.location.href = "loggedIn.html";
    } else {
        const url = "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=776gktki6ukrgj&redirect_uri=https://link.dev.gradlesol.com/app/client-auth/sign-up-extension&state=fooobar&scope=r_emailaddress,r_liteprofile"
        window.open(url, '_blank');
    }
}


function logout() {
    chrome.storage.sync.set({"token": null}, function () {
        chrome.browserAction.setPopup({popup: "popup.html"});
        window.location.href = "popup.html";
    })
}