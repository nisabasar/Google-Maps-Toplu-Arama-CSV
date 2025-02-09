
window.addEventListener("load", () => {
    if (!document.getElementById("customExtractorPanel")) {
        createControlPanel();
    }
});

const createControlPanel = () => {
    const controlPanel = document.createElement("div");
    controlPanel.style.position = "fixed";
    controlPanel.style.top = "10px";
    controlPanel.style.right = "10px";
    controlPanel.style.zIndex = "10000";
    controlPanel.style.backgroundColor = "#ffffff";
    controlPanel.style.border = "1px solid #ccc";
    controlPanel.style.borderRadius = "5px";
    controlPanel.style.padding = "10px";
    controlPanel.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    controlPanel.id = "customExtractorPanel";

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
    startButton.addEventListener("click", () => {
        startButton.innerText = "Yükleniyor...";
        extractData(startButton);
    });

    controlPanel.appendChild(startButton);
    document.body.appendChild(controlPanel);
};

const extractData = async (button) => {
    button.innerText = "Yükleniyor...";
    await scrollToEnd();
    
    let searchQuery = "isletme_bilgileri";
    const searchInput = document.getElementById('searchboxinput');
    if (searchInput && searchInput.value.trim()) {
        searchQuery = searchInput.value.trim();
    }

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
            results.push({ name, address: "Bilinmiyor", phone: "Bilinmiyor", website: "Bilinmiyor" });
        }
    }

    console.log("Extracted Data:", results);

    chrome.runtime.sendMessage({ 
        action: "exportData", 
        data: results,
        searchQuery: searchQuery 
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError.message);
            button.innerText = "Hata!";
            return;
        }
        setTimeout(() => {
            button.innerText = "Başlat";
        }, 2000);
    });
};

// İşletme detaylarını çekmek için açılan sayfadan bilgileri alır
const fetchBusinessDetails = async (link) => {
    try {
        const newWindow = window.open(link, '_blank', 'width=800,height=600');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Sayfanın yüklenmesini bekleyin

        const phone = newWindow.document.querySelector('button[aria-label*="Telefon"] .Io6YTe')?.innerText || "Bilinmiyor";
        const address = newWindow.document.querySelector('button[data-item-id="address"] .Io6YTe')?.innerText || "Bilinmiyor";
        const website = newWindow.document.querySelector('a[data-item-id="authority"]')?.href || "Bilinmiyor";
        
        newWindow.close();
        return { phone, address, website };
    } catch (error) {
        console.error("Detaylar alınamadı:", error);
        return { phone: "Bilinmiyor", address: "Bilinmiyor", website: "Bilinmiyor" };
    }
};

// Sayfanın sonuna kadar kaydırır
const scrollToEnd = async () => {
    const timestamp = new Date().getTime(); // Cache'i kırmak için zaman damgası

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
        console.log(`"${keyword}" anahtar kelimesi bulunamadı. Kaydırma yapılmayacak.`);
        return;
    }

    console.log(`"${keyword}" bulundu! Sayfa kaydırılıyor...`);

    // Scroll işlemi
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

        // Şu anki yükseklik ve scroll durumu
        const currentHeight = scrollContainer.scrollHeight;
        const startY = scrollContainer.scrollTop; // Mevcut scroll konumu
        const endY = currentHeight; // Gitmek istediği konum
        const duration = 1000; // Smooth kaydırma süresi (ms)

        await smoothScroll(scrollContainer, startY, endY, duration);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
    }

    console.log("Scrolled to the end of the results.");
};

// 🔹 **Smooth Scroll Fonksiyonu**
async function smoothScroll(element, start, end, duration) {
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1); // 0 ile 1 arasında bir ilerleme hesapla
        element.scrollTop = start + (end - start) * easeInOutQuad(progress); // Yumuşak kaydırma uygula

        if (elapsed < duration) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

// 🔹 **Ease In-Out Quad Fonksiyonu (Hızlı başla, yavaşla, hızlı bitir)**
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

