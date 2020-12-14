function addOpportunityInProfile() {
  const element = document.querySelector(
    "div.mt1.inline-flex.align-items-center.ember-view"
  );

  if (element) {
    const connectionType = document.querySelector(
      "ul.pv-top-card--list.inline-flex.align-items-center > li.pv-top-card__distance-badge.inline-block.v-align-text-bottom.t-16.t-black--light.t-normal > span > span.dist-value"
    );

    if (connectionType.textContent.includes("1st")) {
      const opportunityButton = document.querySelector(
        "div.mt1.inline-flex.align-items-center.ember-view > #opportunity-button-profile"
      );
      if (opportunityButton == null) {
        // Fetch public identifire of particular user
        const profileUrl = document
          .querySelector('a[data-control-name="contact_see_more"]')
          .getAttribute("href");

        const profileUrlParts = profileUrl.split("/");
        const publicIdentifire =
          profileUrlParts[profileUrlParts.indexOf("in") + 1];

        // Create "Opportunity" button to place
        const button = document.createElement("button");
        const text = document.createTextNode("Opportunity");
        button.appendChild(text);
        button.id = "opportunity-button-profile";

        // Add onClick event function for "Opportunity" button
        button.onclick = async function onClickUpdateButton() {
          // console.log("getting here");
          // const data = await localStorage.getItem("jSessionId");
          // console.log(window.location);
          // console.log(JSON.stringify(document.cookie));
          console.log(publicIdentifire);
        };

        // Add button inside element
        element.appendChild(button);
      }
    } else if (opportunityButton) {
      opportunityButton.parentElement.removeChild(opportunityButton);
    }
  }
}

function addOpportunityInConnection() {
  // Fetch total connection count to loop through
  const liClass = "li.mn-connection-card.artdeco-list.ember-view";
  const totalConnections = document.querySelectorAll(liClass).length;

  for (let i = 1; i <= totalConnections; i++) {
    // Check if Opportunity button already exists
    opportunityButton = document.querySelector(
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
      const publicIdentifire =
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
        // console.log("getting here");
        // const data = await localStorage.getItem("jSessionId");
        // console.log(window.location);
        // console.log(JSON.stringify(document.cookie));
        console.log(publicIdentifire);
      };

      // Add button inside element
      element.insertBefore(button, element.firstChild);
    }
  }
}

function addOpportunityInMessaging() {
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
    if (groupChatElement) continue;

    // Fetch element where button will be added
    const element = document.querySelector(
      elementTemplate.replace("{{index}}", i.toString())
    );

    if (element) {
      // Change element style
      element.style["height"] = "112px";
      element.style["padding"] = "12px 8px 35px 12px";

      const opportunityButton = document.querySelector(
        elementTemplate.replace("{{index}}", i.toString()) +
          " > #opportunity-button-messaging"
      );

      // Check if Opportunity button already exists
      if (opportunityButton == null) {
        // Fetch conversation id
        const chatElement = document
          .querySelector(
            "li.msg-conversation-listitem.msg-conversations-container__convo-item" +
              `.msg-conversations-container__pillar.ember-view:nth-of-type(${i.toString()}) > ` +
              "div.msg-conversation-card.msg-conversations-container__pillar.ember-view > " +
              "a.ember-view.msg-conversation-listitem__link." +
              "msg-conversations-container__convo-item-link.pl3"
          )
          .getAttribute("href");

        const chatElementParts = chatElement.split("/");
        const conversationId =
          chatElementParts[chatElementParts.indexOf("thread") + 1];

        // Create "Opportunity" button to place
        const button = document.createElement("button");
        const text = document.createTextNode("Opportunity");
        button.appendChild(text);
        button.id = "opportunity-button-messaging";

        // Add onClick event function for "Opportunity" button
        button.onclick = async function onClickUpdateButton() {
          // console.log("getting here");
          // const data = await localStorage.getItem("jSessionId");
          // console.log(window.location);
          // console.log(JSON.stringify(document.cookie));
          console.log(conversationId);
        };

        // Add button inside element
        element.appendChild(button);
      }
    }
  }
}

function fetchPublicIdentifier() {
  const elements = document.querySelectorAll('code[style="display: none"]');
  for (let i = 0; i < elements.length; i++) {
    const content = JSON.parse(elements[i].textContent);
    if (content.included) {
      const includedContent = content.included;
      for (let i = 0; i < includedContent.length; i++) {
        if (includedContent[i].publicIdentifier) {
          return includedContent[i].publicIdentifier;
        }
      }
    }
  }
}

(function () {
  pageLink = document.URL;
  if (pageLink.includes(".linkedin.com/")) {
    console.log("RUNNING SCRIPT!!!");
    addOpportunityInProfile();
    addOpportunityInConnection();
    addOpportunityInMessaging();
    chrome.storage.sync.get("linkedInId", function (data) {
      if ("linkedInId" in data) {
        const publicIdentifier = fetchPublicIdentifier();
        chrome.storage.sync.set(
          { publicIdentifier: publicIdentifier },
          function () {
            console.log(publicIdentifier);
            chrome.storage.sync.remove("linkedInId", function (data) {
              console.log("Id removed");
            });
          }
        );
      }
    });
  } else if (
    pageLink.includes(
      "https://ec31b11c5d51.ngrok.io/linkedin-signin.html?linkedInId="
    )
  ) {
    queryParams = pageLink.split("?")[1].split("&");
    for (let i = 0; i < queryParams.length; i++) {
      if (queryParams[i].includes("linkedInId")) {
        linkedInId = queryParams[i].split("=")[1];
        chrome.storage.sync.set({ linkedInId: linkedInId });
        console.log(linkedInId);
      }
    }
  }
})();
