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
            method = "GET", url = requestUrl, headers = requestHeaders, data = requestData)

        // console.log(response)

        return JSON.parse(response.responseText)
    },

    /**
     * Function to get added opportunity conversation ids list
     * @param {object} requestData data to be send when doing request
     * @return {object[]} opportunity data
     */
    getOpportunityConversation: async function (requestData = {}) {
        const requestUrl = util.serverUrl + '/conversation/get-conversationIdArr'

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
        "x-li-identity":
            "dXJuOmxpOmVudGVycHJpc2VQcm9maWxlOih1cm46bGk6ZW50ZXJwcmlzZUFjY291bnQ6ODY0MjAwNTcsMTEyOTE1NDc3KQ",
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

            if (!opportunityButton) {
                // Get opportunity
                console.log("Fetching opportunity profile")
                let publicIdentifiers = await util.getOpportunity();
                publicIdentifiers = publicIdentifiers["data"]
                console.log(publicIdentifiers)

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

                const opportunityButton = document.querySelector(
                    "div.mt1.inline-flex.align-items-center.ember-view > #opportunity-button-profile" +
                    ", " +
                    "dl.profile-topcard-person-entity__content-text.vertical-align-top.pl4 > " +
                    "dt.flex.align-items-center > #opportunity-button-profile"
                );
                if (!opportunityButton) {
                    // Create "Opportunity" button to place
                    const button = document.createElement("button");
                    const textNode = document.createTextNode("Loading");
                    button.appendChild(textNode);
                    button.id = "opportunity-button-profile";

                    let text, color;
                    if (publicIdentifiers.includes(publicIdentifier)) {
                        text = "Update"
                        color = "#88E000"
                    } else {
                        text = "Add";
                        color = "#0a66c2"
                    }

                    button.textContent = text
                    button.style["background-color"] = color

                    // Add onClick event function for "Opportunity" button
                    button.onclick = async function onClickUpdateButton() {
                        button.disabled = true
                        button.textContent = "Loading";
                        button.style["background-color"] = '#d3d3d3';
                        console.log(publicIdentifier);

                        const result = await util.addOpportunity({publicIdentifier: publicIdentifier})

                        if (result) {
                            text = "Update"
                            color = "#88E000"
                        } else {
                            text = "Retry"
                            color = "#ff9900"
                        }

                        button.textContent = text
                        button.style["background-color"] = color
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

        if (opportunityButton == null) {

            if (!opportunityFetched) {
                // Get opportunity
                console.log("====> Fetching opportunity connections")
                publicIdentifiers = await util.getOpportunity();
                publicIdentifiers = publicIdentifiers["data"]
                console.log(publicIdentifiers)
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

            if (opportunityButton == null) {
                // Create "Opportunity" button to place
                const button = document.createElement("button");
                const textNode = document.createTextNode("Loading");
                button.appendChild(textNode);
                button.id = "opportunity-button-connection";

                let text, color;
                if (publicIdentifiers.includes(publicIdentifier)) {
                    text = "Update"
                    color = "#88E000"
                } else {
                    text = "Add";
                    color = "#0a66c2"
                }

                button.textContent = text
                button.style["background-color"] = color

                // Add onClick event function for "Opportunity" button
                button.onclick = async function onClickUpdateButton() {
                    button.disabled = true
                    button.textContent = "Loading";
                    button.style["background-color"] = '#d3d3d3';
                    console.log(publicIdentifier);

                    const result = await util.addOpportunity({publicIdentifier: publicIdentifier})

                    if (result) {
                        text = "Update"
                        color = "#88E000"
                    } else {
                        text = "Retry"
                        color = "#ff9900"
                    }

                    button.textContent = text
                    button.style["background-color"] = color
                    button.disabled = false
                };

                // Add button inside element
                element.insertBefore(button, element.firstChild);
            }
        }
    }
}

async function addOpportunityButtonInMessaging() {
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

        const textNode = document.createTextNode("Loading");
        button.appendChild(textNode);
        button.id = "opportunity-button-messaging";

        button.textContent = "-----";
        button.style["background-color"] = '#d3d3d3';
        button.disabled = true

        // Add onClick event function for "Opportunity" button
        button.onclick = async function onClickUpdateButton(event) {
            event.stopPropagation();
            event.preventDefault();
            button.disabled = true
            button.textContent = "Loading";
            button.style["background-color"] = '#d3d3d3';

            //Fetch public identifier
            // await util.sleep(100);
            // const publicUrl = document
            //     .querySelector('a[data-control-name="topcard"]')
            //     .getAttribute("href")
            //     .split("/");
            // const publicIdentifier = publicUrl[publicUrl.indexOf("in") + 1];
            // console.log(publicIdentifier);

            console.log(conversationId)

            const result = await util.addOpportunity({conversationId: conversationId})

            if (result) {
                text = "Update"
                color = "#88E000"
            } else {
                text = "Retry"
                color = "#ff9900"
            }

            button.textContent = text
            button.style["background-color"] = color
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
        console.log(conversationIdsFromPage)
        conversationIds = await util.getOpportunityConversation(requestData = {conversationIdArr: conversationIdsFromPage})
        conversationIds = conversationIds["data"]
        console.log(conversationIds)

        for (const index in conversationElementsFromPage) {
            let text, color;
            if (conversationIds.includes(conversationElementsFromPage[index]["conversationId"])) {
                text = "Update"
                color = "#88E000"
            } else {
                text = "Add"
                color = "#0a66c2"
            }

            conversationElementsFromPage[index]["opportunityButton"].textContent = text
            conversationElementsFromPage[index]["opportunityButton"].style["background-color"] = color
            conversationElementsFromPage[index]["opportunityButton"].disabled = false
        }
    }

}

/**
 * Function for removing button if it is not loaded in 10 seconds
 * @param buttonElement Handler of button element
 */
function deleteErrorLoadingButton(buttonElement) {
    setTimeout(() => {
        if (buttonElement.textContent === "-----") {
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
        await checkForLoginPage()
        const isSubscribe = await util.getValueFromStorage("isSubscribe")
        if (isSubscribe) {
            console.log(await fetchPublicIdentifierLinkedin())
            await addOpportunityButtonInProfile();
            await addOpportunityButtonInConnection();
            await addOpportunityButtonInMessaging();
        }
    }

    chrome.runtime.sendMessage({runAgain: true})
})();
