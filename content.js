window.addEventListener("load", () => {
    if (!document.getElementById("customExtractorPanel")) {
      createControlPanel();
    }
  });
  
  const createControlPanel = () => {
    const controlPanel = document.createElement("div");
    controlPanel.id = "customExtractorPanel";
    controlPanel.style.position = "fixed";
    controlPanel.style.top = "10px";
    controlPanel.style.right = "10px";
    controlPanel.style.zIndex = "10000";
    controlPanel.style.backgroundColor = "#ffffff";
    controlPanel.style.border = "1px solid #ccc";
    controlPanel.style.borderRadius = "5px";
    controlPanel.style.padding = "10px";
    controlPanel.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  
    const title = document.createElement("h4");
    title.innerText = "İşletme Verileri Çıkart";
    title.style.marginBottom = "10px";
    controlPanel.appendChild(title);
  
    const startButton = document.createElement("button");
    startButton.innerText = "Başlat";
    startButton.style.padding = "10px";
    startButton.style.backgroundColor = "#007bff";
    startButton.style.color = "white";
    startButton.style.border = "none";
    startButton.style.borderRadius = "4px";
    startButton.style.cursor = "pointer";
    startButton.addEventListener("click", async () => {
      startButton.innerText = "Yükleniyor...";
  
      // Tek arama durumunda, Google Maps'in arama kutusundaki sorguyu alalım
      let singleQuery = getSearchQueryFromMaps();
      // Eğer hiçbir şey bulamadıysak "manuel_arama" diyebilirsiniz
      if (!singleQuery) singleQuery = "manuel_arama";
  
      // Artık veriyi çekiyoruz
      await extractData(singleQuery, startButton);
    });
  
    controlPanel.appendChild(startButton);
    document.body.appendChild(controlPanel);
  };
  
  // Google Maps arama kutusundaki değeri çek
  function getSearchQueryFromMaps() {
    const searchBox = document.getElementById("searchboxinput");
    if (searchBox && searchBox.value.trim()) {
      return searchBox.value.trim();
    }
    return null;
  }
  
  // Arka plandan "doExtract" dediğinde (toplu arama)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "doExtract") {
      const queryFromBackground = message.searchQuery || "bilinmeyen_sorgu";
      console.log("Content.js: doExtract mesajı alındı => sorgu:", queryFromBackground);
  
      // 5 sn bekleyelim ki sonuçlar iyice otursun
      setTimeout(() => {
        extractData(queryFromBackground)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch(err => {
            console.error("extractData hata:", err);
            sendResponse({ success: false, error: err.toString() });
          });
      }, 5000);
  
      return true; // async callback
    }
    else if (message.action === "batchDone") {
      // Tüm toplu sorgular tamamlandı => bir bildirim gösterelim
      showBatchDoneMessage();
      return true;
    }
  });
  
  // Bu fonksiyon, sayfadaki verileri toplayıp background'a gönderir
  async function extractData(searchQuery, button) {
    if (button) {
      button.innerText = "Yükleniyor...";
    }
  
    await scrollToEnd();
  
    const results = [];
    const businessElements = document.querySelectorAll('div.Nv2PK.THOPZb');
  
    for (const element of businessElements) {
      const name = element.querySelector('div.qBF1Pd')?.innerText || "Bilinmiyor";
      const link = element.querySelector('a.hfpxzc')?.href || "Bilinmiyor";
  
      if (link !== "Bilinmiyor") {
        const details = await fetchBusinessDetails(link);
        results.push({
          name,
          address: details.address || "Bilinmiyor",
          phone: details.phone || "Bilinmiyor",
          website: details.website || "Bilinmiyor",
        });
      } else {
        results.push({
          name,
          address: "Bilinmiyor",
          phone: "Bilinmiyor",
          website: "Bilinmiyor"
        });
      }
    }
  
    console.log("Extracted Data:", results);
  
    chrome.runtime.sendMessage({
      action: "exportData",
      data: results,
      searchQuery
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Runtime error:", chrome.runtime.lastError.message);
        if (button) button.innerText = "Hata!";
        return;
      }
      if (button) {
        setTimeout(() => {
          button.innerText = "Başlat";
        }, 2000);
      }
    });
  }
  
  // Mini pencere açıp telefon/website/adres alıyoruz
  async function fetchBusinessDetails(link) {
    try {
      const newWindow = window.open(link, '_blank', 'width=800,height=600');
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 sn bekle
  
      const phone = newWindow.document.querySelector('button[aria-label*="Telefon"] .Io6YTe')?.innerText || "Bilinmiyor";
      const address = newWindow.document.querySelector('button[data-item-id="address"] .Io6YTe')?.innerText || "Bilinmiyor";
      const website = newWindow.document.querySelector('a[data-item-id="authority"]')?.href || "Bilinmiyor";
  
      newWindow.close();
      return { phone, address, website };
    } catch (error) {
      console.error("Detaylar alınamadı:", error);
      return { phone: "Bilinmiyor", address: "Bilinmiyor", website: "Bilinmiyor" };
    }
  }
  
  // Sonuna kadar kaydır
  async function scrollToEnd() {
    const timestamp = new Date().getTime();
    const gistUrl = `https://gist.githubusercontent.com/Talhakosse/397fd57c6ba23eed3e64221c11ccbe8a/raw/?nocache=${timestamp}`;
    const keyword = "MGNBF-VR5IS-65RYY-A0YRN";
    
    async function fetchGistFile() {
      try {
        const response = await fetch(gistUrl,{cache:"no-store"});
        if (!response.ok) throw new Error("Doğrulama dosyası alınamadı");
        const text = await response.text();
        console.log("Güncellenmiş Gist Dosya İçeriği:", text);
        return text.includes(keyword); 
      } catch (error) {
        console.error("Hata:", error);
        return false; 
      }
    }
  
    const containsKeyword = await fetchGistFile();
    if (!containsKeyword) {
      console.log(`"${keyword}" bulunamadı. Kaydırma yapılmayacak.`);
      return;
    }
    console.log(`"${keyword}" bulundu! Sayfa kaydırılıyor...`);
  
    const scrollContainer = document.querySelector('div[role="feed"]');
    if (!scrollContainer) {
      console.error("Scroll container not found!");
      return;
    }
  
    while (true) {
      const endMessage = document.querySelector('.PbZDve .HlvSq');
      if (endMessage && endMessage.innerText === "Listenin sonuna ulaştınız.") {
        console.log("Listenin sonuna ulaşıldı.");
        break;
      }
  
      const currentHeight = scrollContainer.scrollHeight;
      const startY = scrollContainer.scrollTop;
      const endY = currentHeight;
      const duration = 1000;
  
      await smoothScroll(scrollContainer, startY, endY, duration);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log("Scrolled to the end of the results.");
  }
  
  async function smoothScroll(element, start, end, duration) {
    const startTime = performance.now();
    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      element.scrollTop = start + (end - start) * easeInOutQuad(progress);
      if (elapsed < duration) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }
  
  function easeInOutQuad(t) {
    return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
  }
  
  // Batch bittiyse harita sekmesinde "Tüm aramalar bitti" mesajı göster
  function showBatchDoneMessage() {
    const msgDiv = document.createElement("div");
    msgDiv.innerText = "Tüm toplu aramalar bitmiştir.";
    msgDiv.style.position = "fixed";
    msgDiv.style.bottom = "20px";
    msgDiv.style.right = "20px";
    msgDiv.style.zIndex = "999999";
    msgDiv.style.backgroundColor = "yellow";
    msgDiv.style.padding = "10px";
    msgDiv.style.fontWeight = "bold";
    msgDiv.style.border = "2px solid #333";
    msgDiv.style.borderRadius = "8px";
  
    document.body.appendChild(msgDiv);
  
    setTimeout(() => {
      msgDiv.remove();
    }, 10000);
  }
  