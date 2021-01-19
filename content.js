//region UTILITIES
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

//endregion

function fetchPublicIdentifierLinkedin() {
    const elements = document.querySelectorAll('code[style="display: none"]');
    for (let i = 0; i < elements.length; i++) {
        const content = JSON.parse(elements[i].textContent);
        if (!content.included) continue;
        const includedContent = content.included;
        for (let i = 0; i < includedContent.length; i++) {
            if (!includedContent[i].publicIdentifier) continue;
            return includedContent[i].publicIdentifier;
        }
    }
}

async function fetchProfileUrlSalesNavigator() {
    // Create request url
    const urlParts = document.URL.split("/");

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
        accept: "application/json, */*; q=0.01",
        "x-li-lang": "en_US",
        "x-li-identity": "dXJuOmxpOmVudGVycHJpc2VQcm9maWxlOih1cm46bGk6ZW50ZXJwcmlzZUFjY291bnQ6ODY0MjAwNTcsMTEyOTE1NDc3KQ",
        "x-li-page-instance": "urn:li:page:d_sales2_profile;ld3Dc2I3Q6O3Md395JswLg==",
        "content-type": "application/json",
        "x-restli-protocol-version": "2.0.0",
        "x-requested-with": "XMLHttpRequest",
        "accept-language": "en-US,en;q=0.9",
        "csrf-token": await util.getValueFromStorage("jSessionId"),
    };

    // Send request and return linkedin profile url
    return JSON.parse(
        await util.request(method = "GET", url = requestUrl, headers = requestHeaders)
    ).flagshipProfileUrl;
}

async function addOpportunityButtonInProfile() {
    const element = document.querySelector(
        "div.mt1.inline-flex.align-items-center.ember-view" +
        ", " +
        "dl.profile-topcard-person-entity__content-text.vertical-align-top.pl4 > dt.flex.align-items-center"
    );

    if (element) {
        const connectionType = document.querySelector(
            "ul.pv-top-card--list.inline-flex.align-items-center > " +
            "li.pv-top-card__distance-badge.inline-block.v-align-text-bottom.t-16.t-black--light.t-normal > " +
            "span > span.dist-value" +
            ", " +
            "dl.profile-topcard-person-entity__content-text.vertical-align-top.pl4 > " +
            "dt.flex.align-items-center > ul > li > span.label-16dp.block"
        );

        const opportunityButton = document.querySelector(
            "div.mt1.inline-flex.align-items-center.ember-view > #opportunity-button-profile" +
            ", " +
            "dl.profile-topcard-person-entity__content-text.vertical-align-top.pl4 > dt.flex.align-items-center > " +
            "#opportunity-button-profile"
        );

        if (connectionType.textContent.trim().includes("1st")) {

            // Fetch public identifier of particular user
            let profileUrl = document.querySelector(
                'a[data-control-name="contact_see_more"]'
            );

            if (profileUrl) {
                profileUrl = profileUrl.getAttribute("href");
            } else {
                profileUrl = await fetchProfileUrlSalesNavigator();
            }

            const profileUrlParts = profileUrl.split("/");
            const publicIdentifier =
                profileUrlParts[profileUrlParts.indexOf("in") + 1];

            if (!opportunityButton) {
                // Get opportunity
                console.log("Fetching opportunity profile")
                let publicIdentifiers = await util.getOpportunity({publicIdentifierArr: [publicIdentifier]});
                publicIdentifiers = publicIdentifiers["data"]
                console.log(publicIdentifiers)

                const opportunityButton = document.querySelector(
                    "div.mt1.inline-flex.align-items-center.ember-view > #opportunity-button-profile" +
                    ", " +
                    "dl.profile-topcard-person-entity__content-text.vertical-align-top.pl4 > " +
                    "dt.flex.align-items-center > #opportunity-button-profile"
                );
                if (!opportunityButton) {
                    // Create "Opportunity" button to place
                    const button = document.createElement("button");
                    // const buttonIcon = document.createElement("img")
                    // buttonIcon.src = "https://ibb.co/tmCyJDC";
                    button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Loading</span>`
                    button.id = "opportunity-button-profile";

                    if (publicIdentifiers.includes(publicIdentifier)) {
                        button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Update</span>`
                    } else {
                        button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Add</span>`
                    }

                    // Add onClick event function for "Opportunity" button
                    button.onclick = async function onClickUpdateButton() {
                        button.disabled = true
                        button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Loading</span>`
                        console.log(publicIdentifier);

                        const result = await util.addOpportunity({publicIdentifier: publicIdentifier})

                        if (result) {
                            button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Update</span>`
                        } else {
                            button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Retry</span>`
                        }

                        button.disabled = false
                    };

                    // Add button inside element
                    element.insertBefore(button, element.firstChild);
                }
            }
        } else if (opportunityButton) {
            opportunityButton.parentElement.removeChild(opportunityButton);
        }
    }
}

async function addOpportunityButtonInConnection() {
    // Fetch total connection count to loop through
    const liClass = "li.mn-connection-card.artdeco-list.ember-view";
    const totalConnections = document.querySelectorAll(liClass).length;

    let opportunityFetched = false
    let publicIdentifiers;

    for (let i = 1; i <= totalConnections; i++) {
        // Check if Opportunity button already exists
        const opportunityButton = document.querySelector(
            `${liClass}:nth-of-type(${i.toString()}) > div.mn-connection-card__action-container > #opportunity-button-connection`
        );

        if (!opportunityButton) {

            if (!opportunityFetched) {
                // Collect all public identifiers from page
                publicIdentifiers = []
                for (let j = 1; j <= totalConnections; j++) {
                    const opportunityButton = document.querySelector(
                        `${liClass}:nth-of-type(${j.toString()}) > div.mn-connection-card__action-container > #opportunity-button-connection`
                    );

                    if (!opportunityButton) {
                        const profileUrl = document
                            .querySelector(
                                `${liClass}:nth-of-type(${j.toString()}) > a.mn-connection-card__picture.ember-view`
                            )
                            .getAttribute("href");
                        const profileUrlParts = profileUrl.split("/");
                        publicIdentifiers.push(profileUrlParts[profileUrlParts.indexOf("in") + 1])
                    }
                }

                // Get opportunity
                console.log("====> Fetching opportunity connections")
                console.log("Found public identifiers from page: ", publicIdentifiers)
                publicIdentifiers = await util.getOpportunity({publicIdentifierArr: publicIdentifiers});
                publicIdentifiers = publicIdentifiers["data"]
                console.log("Public identifiers with opportunity", publicIdentifiers)
                opportunityFetched = true
            }

            // Fetch public identifier of particular user
            const profileUrl = document
                .querySelector(
                    `${liClass}:nth-of-type(${i.toString()}) > a.mn-connection-card__picture.ember-view`
                )
                .getAttribute("href");
            const profileUrlParts = profileUrl.split("/");
            const publicIdentifier =
                profileUrlParts[profileUrlParts.indexOf("in") + 1];

            // Fetch element where button will be added
            const element = document.querySelector(
                `${liClass}:nth-of-type(${i.toString()}) > div.mn-connection-card__action-container`
            );

            // Check if Opportunity button already exists
            const opportunityButton = document.querySelector(
                `${liClass}:nth-of-type(${i.toString()}) > div.mn-connection-card__action-container > #opportunity-button-connection`
            );

            if (!opportunityButton) {
                // Create "Opportunity" button to place
                const button = document.createElement("button");
                button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Loading</span>`
                button.id = "opportunity-button-connection";

                if (publicIdentifiers.includes(publicIdentifier)) {
                    button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Update</span>`
                } else {
                    button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Add</span>`
                }

                // Add onClick event function for "Opportunity" button
                button.onclick = async function onClickUpdateButton() {
                    button.disabled = true
                    button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Loading</span>`
                    console.log(publicIdentifier);

                    const result = await util.addOpportunity({publicIdentifier: publicIdentifier})

                    if (result) {
                        button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Update</span>`;
                    } else {
                        button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Retry</span>`;
                    }

                    button.disabled = false
                };

                // Add button inside element
                element.insertBefore(button, element.firstChild);
            }
        }
    }
}

async function addOpportunityButtonInMessaging(location = 1) {
    if (location === 1) {
        await addOpportunityButtonInChatSection();
    } else if (location === 2) {
        await addOpportunityButtonUnderChat();
    } else {
        console.error(`No Location ${location.toString()} exists`)
    }
}

async function addOpportunityButtonInChatSection() {
    const element = document.querySelector('div.shared-title-bar__title.msg-title-bar__title-bar-title')

    const chatElement = document.querySelector('a[data-control-name="topcard"]')
    if (chatElement) {
        const opportunityButton = document.querySelector(
            'div.shared-title-bar__title.msg-title-bar__title-bar-title > #opportunity-button-messaging')

        // Fetch public identifier
        const publicUrl = document
            .querySelector('a[data-control-name="topcard"]')
            .getAttribute("href")
            .split("/");
        const publicIdentifier = publicUrl[publicUrl.indexOf("in") + 1];

        console.log(publicIdentifier);

        const previousPublicIdentifier = await util.getValueFromStorage('previousPublicIdentifier');

        if (previousPublicIdentifier !== publicIdentifier) {
            chrome.storage.sync.set({previousPublicIdentifier: publicIdentifier})

            if (opportunityButton) {
                opportunityButton.parentElement.removeChild(opportunityButton);
            }
        }

        if (!opportunityButton) {
            // Get opportunity
            console.log("Fetching opportunity profile")
            let publicIdentifiers = await util.getOpportunity({publicIdentifierArr: [publicIdentifier]});
            publicIdentifiers = publicIdentifiers["data"]
            console.log(publicIdentifiers)

            // Create "Opportunity" button to place
            const button = document.createElement("button");
            // const buttonIcon = document.createElement("img")
            // buttonIcon.src = "https://ibb.co/tmCyJDC";
            button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Loading</span>`
            button.id = "opportunity-button-messaging";

            if (publicIdentifiers.includes(publicIdentifier)) {
                button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Update</span>`
            } else {
                button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Add</span>`
            }

            // Add onClick event function for "Opportunity" button
            button.onclick = async function onClickUpdateButton() {
                button.disabled = true
                button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Loading</span>`
                console.log(publicIdentifier);

                const result = await util.addOpportunity({publicIdentifier: publicIdentifier})

                if (result) {
                    button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Update</span>`
                } else {
                    button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Retry</span>`
                }

                button.disabled = false
            };

            // Add button inside element
            element.insertBefore(button, element.lastElementChild);
        }
    }
}

async function addOpportunityButtonUnderChat() {
    // Fetch total chats count to loop through
    const totalChats = document.getElementsByClassName(
        "msg-conversation-listitem msg-conversations-container__convo-item msg-conversations-container__pillar ember-view"
    ).length;

    const elementTemplate =
        "li.msg-conversation-listitem.msg-conversations-container__convo-item" +
        ".msg-conversations-container__pillar.ember-view:nth-of-type({{index}}) > " +
        "div.msg-conversation-card.msg-conversations-container__pillar.ember-view > " +
        "a.ember-view.msg-conversation-listitem__link." +
        "msg-conversations-container__convo-item-link.pl3 > " +
        "div.msg-conversation-card__content--selectable";

    const groupChatTemplate =
        "li.msg-conversation-listitem.msg-conversations-container__convo-item" +
        ".msg-conversations-container__pillar.ember-view:nth-of-type({{index}}) > " +
        "div.msg-conversation-card.msg-conversations-container__pillar.ember-view > " +
        "a.ember-view.msg-conversation-listitem__link.msg-conversations-container__convo-item-link.pl3 > " +
        "div.msg-selectable-entity.msg-selectable-entity--4 > " +
        "div.msg-facepile-grid.msg-facepile-grid--group-size-2.msg-facepile-grid--4.msg-selectable-entity__entity";

    const featuredTemplate =
        "li.msg-conversation-listitem.msg-conversations-container__convo-item" +
        ".msg-conversations-container__pillar.ember-view:nth-of-type({{index}}) > " +
        "div.msg-conversation-card.msg-conversations-container__pillar.ember-view > " +
        "a.ember-view.msg-conversation-listitem__link." +
        "msg-conversations-container__convo-item-link.pl3 > div.msg-conversation-card__content--selectable > " +
        "div > div.msg-conversation-card__row.msg-conversation-card__body-row > " +
        "div.msg-conversation-card__message-snippet-container.flex-grow-1 > p > span > " +
        "span.msg-conversation-card__pill.t-14.t-black.t-bold.pr1"

    const chatElementTemplate =
        "li.msg-conversation-listitem.msg-conversations-container__convo-item" +
        `.msg-conversations-container__pillar.ember-view:nth-of-type({{index}}) > ` +
        "div.msg-conversation-card.msg-conversations-container__pillar.ember-view > " +
        "a.ember-view.msg-conversation-listitem__link." +
        "msg-conversations-container__convo-item-link.pl3"

    let conversationIds;
    let conversationIdsFromPage = [];
    let conversationElementsFromPage = [];

    for (let i = 1; i <= totalChats; i++) {
        // Check if element is group chat
        const groupChatElement = document.querySelector(
            groupChatTemplate.replace("{{index}}", i.toString())
        );

        // Skip element if it is group chat
        if (groupChatElement) continue;

        // Fetch element where button will be added
        const element = document.querySelector(
            elementTemplate.replace("{{index}}", i.toString())
        );

        // Skip if element not found
        if (!element) continue;

        const opportunityButton = document.querySelector(
            elementTemplate.replace("{{index}}", i.toString()) +
            " > #opportunity-button-messaging"
        );

        // Skip if opportunity button already exists
        if (opportunityButton) continue;

        const featuredElement = document.querySelector(featuredTemplate.replace("{{index}}", i.toString()));
        if (featuredElement) {
            const featuredText = featuredElement.textContent.toLowerCase()
            if (
                featuredText.includes('linkedin offer') ||
                featuredText.includes('sponsored') ||
                featuredText.includes('in mail')
            ) continue;
        }

        // Change element style
        element.style["height"] = "112px";
        element.style["padding"] = "12px 8px 35px 12px";

        // Fetch conversation id
        const chatElement = document.querySelector(
            chatElementTemplate.replace('{{index}}', i.toString())).getAttribute("href");

        const chatElementParts = chatElement.split("/");
        const conversationId =
            chatElementParts[chatElementParts.indexOf("thread") + 1];

        conversationIdsFromPage.push(conversationId)

        // Create "Opportunity" button to place
        const button = document.createElement("button");

        conversationElementsFromPage.push(
            {
                opportunityButton: button,
                conversationId: conversationId
            }
        )

        button.id = "opportunity-button-messaging";

        button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>-----</span>`;
        button.disabled = true

        // Add onClick event function for "Opportunity" button
        button.onclick = async function onClickUpdateButton(event) {
            event.stopPropagation();
            event.preventDefault();
            button.disabled = true
            button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Loading</span>`;
            console.log(conversationId)

            const result = await util.addOpportunity({conversationId: conversationId})

            if (result) {
                button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Update</span>`;
            } else {
                button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Retry</span>`;
            }
            button.disabled = false
        };

        // Add button inside element
        element.appendChild(button);

        // Wait and delete button if it's not loaded in 10 seconds
        deleteErrorLoadingButton(button);
    }

    if (conversationIdsFromPage.length > 0) {
        // Get opportunity
        console.log("====> Fetching opportunity messaging")
        console.log(conversationIdsFromPage);
        conversationIds = await util.getOpportunityConversation({conversationIdArr: conversationIdsFromPage})
        conversationIds = conversationIds["data"]
        console.log(conversationIds)

        for (const index in conversationElementsFromPage) {
            if (conversationIds.includes(conversationElementsFromPage[index]["conversationId"])) {
                conversationElementsFromPage[index]["opportunityButton"].innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Update</span>`;
            } else {
                conversationElementsFromPage[index]["opportunityButton"].innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Add</span>`;
            }

            conversationElementsFromPage[index]["opportunityButton"].disabled = false
        }
    }

}

async function addOpportunityButtonInChatWindow() {
    const chatElements = document.querySelectorAll(
        'div.msg-overlay-conversation-bubble--is-active, div.msg-overlay-conversation-bubble--default-inactive');

    if (chatElements.length > 0) {
        for (const index in chatElements) {
            const chatElement = chatElements[index];

            const opportunityButton = chatElement.querySelector(
                'section.msg-overlay-bubble-header__controls.display-flex.align-items-center > ' +
                '#opportunity-button-chat')

            if (!opportunityButton) {

                const publicUrl = chatElement.querySelector(
                    'a.profile-card-one-to-one__profile-link.ember-view')
                    .getAttribute("href")
                    .split("/");

                const publicIdentifier = publicUrl[publicUrl.indexOf("in") + 1];
                console.log(publicIdentifier)

                // Get opportunity
                console.log("Fetching opportunity profile")
                let publicIdentifiers = await util.getOpportunity({publicIdentifierArr: [publicIdentifier]});
                publicIdentifiers = publicIdentifiers["data"]
                console.log(publicIdentifiers)

                const element = chatElement.querySelector(
                    'section.msg-overlay-bubble-header__controls.display-flex.align-items-center')

                // Create "Opportunity" button to place
                const button = document.createElement("button");
                button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Loading</span>`
                button.id = "opportunity-button-chat";

                if (publicIdentifiers.includes(publicIdentifier)) {
                    button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Update</span>`
                } else {
                    button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Add</span>`
                }

                // Add onClick event function for "Opportunity" button
                button.onclick = async function onClickUpdateButton(event) {
                    event.stopPropagation();
                    event.preventDefault();
                    button.disabled = true
                    button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Loading</span>`
                    console.log(publicIdentifier);

                    const result = await util.addOpportunity({publicIdentifier: publicIdentifier})

                    if (result) {
                        button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Update</span>`
                    } else {
                        button.innerHTML = `<img src="${chrome.extension.getURL('img/opportunityButtonIcon.svg')}"/><span>Retry</span>`
                    }

                    button.disabled = false
                };

                // Add button inside element
                element.insertBefore(button, element.firstElementChild);

            }
        }
    }
}

/**
 * Function for removing button if it is not loaded in 10 seconds
 * @param buttonElement Handler of button element
 */
function deleteErrorLoadingButton(buttonElement) {
    setTimeout(() => {
        if (buttonElement.querySelector("span").textContent === "-----") {
            buttonElement.remove()
        }
    }, 10000)
}

async function checkForLoginPage() {
    const signinButton = document.querySelector('button[data-litms-control-urn="login-submit"]')
    if (signinButton) {
        await new Promise(resolve => {
            chrome.storage.sync.set({isSubscribe: false, token: "0"}, async function () {
                resolve();
            });
        });
    }
}

(async function () {
    const pageLink = document.URL;
    if (pageLink.includes(".linkedin.com/")) {
        // await checkForLoginPage()
        const isSubscribe = await util.getValueFromStorage("isSubscribe")
        if (isSubscribe) {
            // console.log("Sending command check cookie")
            chrome.runtime.sendMessage({checkNewCookie: true, publicIdentifier: await fetchPublicIdentifierLinkedin()})
            // console.log(await fetchPublicIdentifierLinkedin())
            await addOpportunityButtonInProfile();
            await addOpportunityButtonInConnection();
            await addOpportunityButtonInMessaging(1);
            await addOpportunityButtonInChatWindow();
        }
    }

    chrome.runtime.sendMessage({runAgain: true})
})();
