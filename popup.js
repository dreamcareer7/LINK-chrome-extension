let util = {

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

const redirects = {
    "signin": function () {
        const url = "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=776gktki6ukrgj&redirect_uri=https://link.dev.gradlesol.com/app/client-auth/sign-up-extension&state=fooobar&scope=r_emailaddress,r_liteprofile"
        window.open(url, '_blank');
    },

    "dashboard": async function () {
        const url = "http://link.dev.gradlesol.com/auth-verify?token=" + await util.getValueFromStorage("token")
        window.open(url, '_blank');
    },

    "signup": function () {
        const url = "https://linkfluencer.com/"
        window.open(url, '_blank');
        chrome.browserAction.setPopup({popup: "signin.html"});
    },

    "logout": function () {
        chrome.storage.sync.set(
            {
                "token": null,
                "profilePicture": null,
                "profileName": null,
                "profileTitle": null
            }, function () {
            chrome.browserAction.setPopup({popup: "signin.html"});
            window.location.href = "signin.html";
        })
    },

    "close": function () {
        window.close();
    }
}

/**
 * Dynamic profile content
 */
async function dynamicProfileContentFilling() {
    console.log('here')
    const profilePictureHandler = document.getElementById("profilePicture")
    if (profilePictureHandler) {
        console.log('In profile picture')
        const profilePicture = await util.getValueFromStorage('profilePicture');
        if (profilePicture) {
            profilePictureHandler.src = profilePicture
        }
    }
    const profileNameHandler = document.getElementById("profileName")
    if (profileNameHandler) {
        console.log('In profile name')
        const profileName = await util.getValueFromStorage('profileName');
        if (profileName) {
            profileNameHandler.innerText = profileName
        }
    }
    const profileTitleHandler = document.getElementById("profileTitle")
    if (profileTitleHandler) {
        console.log('In profile title')
        const profileTitle = await util.getValueFromStorage('profileTitle');
        if (profileTitle) {
            profileTitleHandler.innerText = profileTitle
        }
    }
}
dynamicProfileContentFilling()