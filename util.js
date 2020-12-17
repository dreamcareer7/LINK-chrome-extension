/* globals chrome */

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