let searchQueue = [];
let currentIndex = 0;
let isBatchRunning = false;
let mapsTabId = null;
let lastIndexExtracted = -1;

// Eklentinin açtığı sekme dahi olsa kapanmayacak,
// fakat yine de hangi sekmeyi yarattığımızı hatırlayabiliriz (gerekirse).
let autoCreatedTab = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // (A) Toplu arama başlatma
  if (message.action === "startBatchSearch") {
    if (isBatchRunning) {
      sendResponse({ error: "Zaten bir batch arama devam ediyor." });
      return true;
    }
    // Gelen sorgu listesini al
    searchQueue = message.queries || [];
    currentIndex = 0;
    lastIndexExtracted = -1;
    isBatchRunning = true;

    // Her zaman yeni bir Google Maps sekmesi açalım (temiz olsun).
    autoCreatedTab = true; 
    chrome.tabs.create({ url: "https://www.google.com/maps" }, (tab) => {
      mapsTabId = tab.id;
      // Sekme açıldıktan biraz bekleyip (ör. 1 sn) ilk sorguya geçiyoruz
      setTimeout(() => {
        runNextSearch();
      }, 1000);
    });

    sendResponse({ success: true });
    return true;
  }

  // (B) Content Script'ten gelen "exportData"
  if (message.action === "exportData" && message.data) {
    handleExportData(message, sendResponse);
    return true; // async
  }
  return false;
});

function runNextSearch() {
  if (currentIndex >= searchQueue.length) {
    console.log("Tüm toplu aramalar tamamlandı!");
    isBatchRunning = false;
    
    // Önceden sekme kapatılıyordu, artık kapatmıyoruz.
    // Yalnızca content script'e "batchDone" mesajı göndererek
    // “Arama tamamlandı” bildirimi gösterebiliriz (opsiyonel).
    chrome.tabs.sendMessage(mapsTabId, { action: "batchDone" });
    return;
  }

  const query = searchQueue[currentIndex];
  console.log(`Arama (${currentIndex + 1}/${searchQueue.length}):`, query);

  lastIndexExtracted = -1;

  chrome.tabs.update(mapsTabId, {
    url: "https://www.google.com/maps/search/" + encodeURIComponent(query)
  });
}

// Google Maps yüklendiğinde content script'e "doExtract" gönder
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId !== mapsTabId) return;

  if (changeInfo.status === "complete") {
    if (isBatchRunning && currentIndex < searchQueue.length) {
      if (lastIndexExtracted === currentIndex) {
        console.log("Bu index için zaten doExtract gönderildi, tekrar gönderilmeyecek.");
        return;
      }

      const query = searchQueue[currentIndex];
      console.log(`Sayfa yüklendi, ${query} için doExtract (5s bekleme)...`);

      setTimeout(() => {
        if (isBatchRunning && currentIndex < searchQueue.length && lastIndexExtracted !== currentIndex) {
          lastIndexExtracted = currentIndex;
          chrome.tabs.sendMessage(tabId, {
            action: "doExtract",
            searchQuery: query
          });
        }
      }, 5000);
    }
  }
});

function handleExportData(message, sendResponse) {
  const { data, searchQuery } = message;

  try {
    const normalizeText = (text) => {
      if (!text) return "Bilinmiyor";
      const charMap = {
        "Ü": "U", "ü": "u",
        "Ö": "O", "ö": "o",
        "Ç": "C", "ç": "c",
        "Ş": "S", "ş": "s",
        "Ğ": "G", "ğ": "g",
        "İ": "I", "ı": "i"
      };
      let normalizedText = text;
      for (const [turkishChar, englishChar] of Object.entries(charMap)) {
        normalizedText = normalizedText.split(turkishChar).join(englishChar);
      }
      return normalizedText;
    };

    const headers = ["Isim", "Telefon", "Web Sitesi", "Adres"];
    const rows = data.map(row => [
      normalizeText(row.name),
      normalizeText(row.phone),
      normalizeText(row.website),
      normalizeText(row.address)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(v => `"${v}"`).join(","))
    ].join("\n");

    const csvContentBase64 = btoa(unescape(encodeURIComponent(csvContent)));
    const url = `data:text/csv;charset=utf-8;base64,${csvContentBase64}`;

    const fileName = normalizeText(searchQuery.replace(/\s+/g, "_")) + ".csv";

    chrome.downloads.download({
      url: url,
      filename: fileName,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Download API error:", chrome.runtime.lastError.message);
      } else {
        console.log(`CSV indirilmeye başlandı: ${fileName} (downloadId: ${downloadId})`);
      }

      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
          console.log("URL serbest bırakıldı.");
        } catch (error) {
          console.warn("URL.revokeObjectURL başarısız:", error);
        }
      }, 10000);

      currentIndex++;
      runNextSearch();
    });

    sendResponse({ success: true });
  } catch (err) {
    console.error("CSV oluştururken hata:", err);
    currentIndex++;
    runNextSearch();
    sendResponse({ success: false, message: err.message });
  }
}
