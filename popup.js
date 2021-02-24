let util = {

     serverUrl: "https://link.dev.gradlesol.com/app",

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

const redirects = {
    "signin": function () {
        const url = "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=776gktki6ukrgj&redirect_uri=https://link.dev.gradlesol.com/app/client-auth/sign-up-extension&state=fooobar&scope=r_emailaddress,r_liteprofile"
        window.open(url, '_blank');
    },

    "dashboard": async function () {
        const url = "https://link.dev.gradlesol.com/auth-verify?token=" + await util.getValueFromStorage("token")
        window.open(url, '_blank');
    },

    "signup": function () {

        chrome.storage.sync.set(
            {
                "token": null,
                "profilePicture": null,
                "profileName": null,
                "profileTitle": null
            }, function () {
                chrome.browserAction.setPopup({popup: "signin.html"});
                window.location.href = "signin.html";
                const url = "https://linkfluencer.com/"
                window.open(url, '_blank');
            })
    },

    "logout": async function () {
        const requestUrl = util.serverUrl + '/client-auth/logout'
        const requestHeaders = {
            'authorisation': await util.getValueFromStorage('token')
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

    "close": function () {
        window.close();
    }
}

window.onload = async function() {
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
                chrome.runtime.sendMessage({action: 'log', message: 'Logout'})
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // console.log("INSIDE DOM");

    const names = [
        "signin", "dashboard", "signup", "logout", "close"
    ]

    names.forEach(name => {
        const nameElement = document.getElementsByName(name)[0]
        if (nameElement) {
            nameElement.addEventListener("click", function () {
                // console.log(`In ${nameElement}`);
                redirects[name]();
            });
        }
    })
})

/**
 * Dynamic profile content
 */
async function dynamicProfileContentFilling() {
    // console.log('here')
    const profilePictureHandler = document.getElementById("profilePicture")
    if (profilePictureHandler) {
        // console.log('In profile picture')
        const profilePicture = await util.getValueFromStorage('profilePicture');
        if (profilePicture) {
            profilePictureHandler.src = profilePicture
        }
    }
    const profileNameHandler = document.getElementById("profileName")
    if (profileNameHandler) {
        // console.log('In profile name')
        const profileName = await util.getValueFromStorage('profileName');
        if (profileName) {
            profileNameHandler.innerText = profileName
        }
    }
    const profileTitleHandler = document.getElementById("profileTitle")
    if (profileTitleHandler) {
        // console.log('In profile title')
        const profileTitle = await util.getValueFromStorage('profileTitle');
        if (profileTitle) {
            profileTitleHandler.innerText = profileTitle
        }
    }
}

dynamicProfileContentFilling()
