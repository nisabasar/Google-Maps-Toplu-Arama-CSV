document.getElementById("openMaps").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://www.google.com/maps" }, (tab) => {
        console.log("Google Maps opened in a new tab.");
    });
});
