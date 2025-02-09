// Tek seferlik Google Maps açma
document.getElementById("openMaps").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://www.google.com/maps" }, (tab) => {
      console.log("Google Maps opened in a new tab.");
  });
});

// Dosya seçildiğinde adı göstermek
const fileInput = document.getElementById("txtFile");
const fileNameSpan = document.getElementById("fileName");

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    fileNameSpan.textContent = fileInput.files[0].name;
  } else {
    fileNameSpan.textContent = "Seçili dosya yok";
  }
});

// Toplu arama butonu
document.getElementById("startBatchSearch").addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Lütfen bir .txt dosyası seçin!");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    // Dosya içeriğini satır satır al
    const lines = e.target.result
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0); // Boş satırları at

    if (lines.length === 0) {
      alert("TXT dosyasında geçerli satır yok!");
      return;
    }

    // Bu sorguları background.js'e gönder
    chrome.runtime.sendMessage({
      action: "startBatchSearch",
      queries: lines
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("startBatchSearch hatası:", chrome.runtime.lastError.message);
        return;
      }
      if (response && response.success) {
        console.log("Toplu arama başlatıldı:", lines);
      } else if (response && response.error) {
        alert("Bir hata oluştu veya zaten çalışıyor: " + response.error);
      }
    });
  };

  reader.readAsText(file);
});
