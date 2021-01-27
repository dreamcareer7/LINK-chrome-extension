console.log('Extension pop up page opened');

document.addEventListener('DOMContentLoaded', function () {
    console.log("INSIDE DOM");

    const names = [
        "signin", "dashboard", "signup", "logout",
    ]

    names.forEach(name => {
        const nameElement = document.getElementsByName(name)[0]
        if (nameElement) {
            nameElement.addEventListener("click", function () {
                console.log(`In ${nameElement}`);
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
    "dashboard": function () {
        const url = "https://link.dev.gradlesol.com/home"
        window.open(url, '_blank');
    },

    "signup": function () {
        const url = "https://linkfluencer.com/"
        window.open(url, '_blank');
        chrome.browserAction.setPopup({popup: "signin.html"});
    },

    "logout": function () {
        chrome.storage.sync.set({"token": null}, function () {
            chrome.browserAction.setPopup({popup: "signin.html"});
            window.location.href = "signin.html";
        })
    }
}
