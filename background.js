(function () {
  try {
    let tabId;

    chrome.tabs.onActivated.addListener(function (tab) {
      tabId = tab.tabId;
    });

    setInterval(() => {
      chrome.tabs.executeScript(tabId, { file: "content.js" });
    }, 1000);
    console.log("BACKGROUND SCRIPT RUNNING!!!");

    chrome.webNavigation.onCommitted.addListener(function () {
      // chrome.tabs.executeScript(tabId, { file: "content.js" });
    });

    chrome.webNavigation.onCompleted.addListener(function () {
      // chrome.tabs.executeScript(tabId, { file: "content.js" });
      chrome.tabs.get(tabId, async function (tab) {
        if (tab.url) {
          await checkForLinkedIn(tab);
          // checkForNetwork();
        }
      });
    });

    async function checkForLinkedIn(tab) {
      if (tab.url.includes(".linkedin.com/")) {
        let domain = "linkedin.com";
        chrome.cookies.getAll({ domain: domain }, function (cookies) {
          processCookie(cookies);
        });
      }
    }

    function processCookie(cookies) {
      console.log("getting here");
      let cookie = "";
      let jSessionId = null;
      cookies.forEach((cookie_part) => {
        cookie += `${cookie_part.name}=${cookie_part.value}; `;

        if (cookie_part.name === "JSESSIONID") {
          jSessionId = cookie_part.value;
          console.log(jSessionId);
        }
      });

      checkForNewCookie(cookie, jSessionId);
    }

    async function checkForNewCookie(newCookie, newJSessionId) {
      chrome.storage.sync.get("jSessionId", function (data) {
        const jSessionId = data.jSessionId;

        localStorage.setItem("jSessionId", jSessionId);
        if (jSessionId !== newJSessionId && newCookie !== undefined) {
          chrome.storage.sync.set(
            {
              cookie: newCookie,
              jSessionId: newJSessionId,
            },
            function () {
              console.log(`${new Date()} New cookie found!!!`);
            }
          );
        }
      });
    }
  } catch (err) {}
})();
