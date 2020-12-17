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

    let jSessionId = null;
    // Fetch required parameter from chrome storage
    await new Promise((resolveJSessionId) => {
        jSessionId = chrome.storage.sync.get("jSessionId", (data) => {
            resolveJSessionId(data.jSessionId.replace(/"/g, ""));
        });
    });

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
        "csrf-token": jSessionId,
    };

    // Send request and return linkedin profile url
    return JSON.parse(await request(method = "GET", url = requestUrl, headers = requestHeaders));
}

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
                // Fetch public identifire of particular user
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
                    const text = document.createTextNode("Opportunity");
                    button.appendChild(text);
                    button.id = "opportunity-button-profile";

                    // Add onClick event function for "Opportunity" button
                    button.onclick = async function onClickUpdateButton() {
                        button.disabled = true
                        button.textContent = "Loading";
                        const oldBGColor = button.style["background-color"]
                        button.style["background-color"] = '#d3d3d3';
                        await sleep(300)
                        console.log(publicIdentifier);
                        button.textContent = "Update";
                        button.disabled = false
                        button.style["background-color"] = oldBGColor
                    };

                    // Add button inside element
                    element.appendChild(button);
                }
            }
        } else if (opportunityButton) {
            opportunityButton.parentElement.removeChild(opportunityButton);
        }
    }
}

function addOpportunityButtonInConnection() {
    // Fetch total connection count to loop through
    const liClass = "li.mn-connection-card.artdeco-list.ember-view";
    const totalConnections = document.querySelectorAll(liClass).length;

    for (let i = 1; i <= totalConnections; i++) {
        // Check if Opportunity button already exists
        const opportunityButton = document.querySelector(
            `${liClass}:nth-of-type(${i.toString()}) > div.mn-connection-card__action-container > #opportunity-button-connection`
        );

        if (opportunityButton == null) {
            // Fetch public identifire of particular user
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

            // Create "Opportunity" button to place
            const button = document.createElement("button");
            const text = document.createTextNode("Opportunity");
            button.appendChild(text);
            button.id = "opportunity-button-connection";

            // Add onClick event function for "Opportunity" button
            button.onclick = async function onClickUpdateButton() {
                button.disabled = true
                button.textContent = "Loading";
                const oldBGColor = button.style["background-color"]
                button.style["background-color"] = '#d3d3d3';
                await sleep(300)
                console.log(publicIdentifier);
                button.textContent = "Update";
                button.disabled = false
                button.style["background-color"] = oldBGColor
            };

            // Add button inside element
            element.insertBefore(button, element.firstChild);
        }
    }
}

function addOpportunityButtonInMessaging() {
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

        // Change element style
        element.style["height"] = "112px";
        element.style["padding"] = "12px 8px 35px 12px";

        const opportunityButton = document.querySelector(
            elementTemplate.replace("{{index}}", i.toString()) +
            " > #opportunity-button-messaging"
        );

        // Skip if opportunity button already exists
        if (opportunityButton) continue;

        // // Fetch conversation id
        // const chatElement = document
        //   .querySelector(
        //     "li.msg-conversation-listitem.msg-conversations-container__convo-item" +
        //       `.msg-conversations-container__pillar.ember-view:nth-of-type(${i.toString()}) > ` +
        //       "div.msg-conversation-card.msg-conversations-container__pillar.ember-view > " +
        //       "a.ember-view.msg-conversation-listitem__link." +
        //       "msg-conversations-container__convo-item-link.pl3"
        //   )
        //   .getAttribute("href");

        // const chatElementParts = chatElement.split("/");
        // const conversationId =
        //   chatElementParts[chatElementParts.indexOf("thread") + 1];

        // Create "Opportunity" button to place
        const button = document.createElement("button");
        const text = document.createTextNode("Opportunity");
        button.appendChild(text);
        button.id = "opportunity-button-messaging";

        // Add onClick event function for "Opportunity" button
        button.onclick = async function onClickUpdateButton() {
            button.disabled = true
            button.textContent = "Loading";
            const oldBGColor = button.style["background-color"]
            button.style["background-color"] = '#d3d3d3';
            await sleep(300);

            //Fetch public identifier
            const publicUrl = document
                .querySelector('a[data-control-name="topcard"]')
                .getAttribute("href")
                .split("/");
            const publicIdentifier = publicUrl[publicUrl.indexOf("in") + 1];

            console.log(publicIdentifier);
            button.textContent = "Update";
            button.disabled = false
            button.style["background-color"] = oldBGColor

        };

        // Add button inside element
        element.appendChild(button);
    }
}

(async function () {
    const pageLink = document.URL;
    if (pageLink.includes(".linkedin.com/")) {
        addOpportunityButtonInProfile();
        addOpportunityButtonInConnection();
        addOpportunityButtonInMessaging();
        // chrome.storage.sync.get(null, function (data) {
        //     if ("linkedInId" in data) {
        //         const publicIdentifier = fetchPublicIdentifierLinkedin();
        //         chrome.storage.sync.set({publicIdentifier: publicIdentifier}, () => {
        //             console.log(data);
        //
        //             // TODO: Add registering public identifier with app depend linkedin id
        //
        //             chrome.storage.sync.remove("linkedInId", function () {
        //                 console.log("Id removed");
        //             });
        //         });
        //     }
        // });
    } else if (
        pageLink.includes(
            "https://www.linkedin.com/?token"
        )
    ) {
        const token = pageLink.split('?')[1].split('&').replace('token=', '')

        chrome.storage.sync.set({token: token}, function () {
                console.log(token)
            }
        )
    }
})();
