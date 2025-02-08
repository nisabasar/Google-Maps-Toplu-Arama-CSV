


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "exportData" && message.data) {
        const data = message.data;

        try {
            const normalizeText = (text) => {
                if (!text) return "Bilinmiyor"; // Eğer boşsa "Bilinmiyor" yaz
            
                const charMap = {
                    "Ü": "U", "ü": "u",
                    "Ö": "O", "ö": "o",
                    "Ç": "C", "ç": "c",
                    "Ş": "S", "ş": "s",
                    "Ğ": "G", "ğ": "g",
                    "İ": "I", "ı": "i"
                };
            
                let normalizedText = text;
                
                // Tüm karakterleri döngü ile değiştir
                for (const [turkishChar, englishChar] of Object.entries(charMap)) {
                    normalizedText = normalizedText.split(turkishChar).join(englishChar);
                }
            
                return normalizedText;
            };
            


            // CSV başlıkları ve içerik
            const headers = ["Isim",  "Telefon", "Web Sitesi","Adres"];
            const rows = data.map(row => [
                normalizeText(row.name),
                normalizeText(row.phone),
                normalizeText(row.website),
                normalizeText(row.address)
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.map(value => `"${value}"`).join(","))
            ].join("\n");

            console.log("Generated CSV Content:");
            console.log(csvContent); // CSV içeriği doğru mu kontrol edin

            
            const csvContentBase64 = btoa(unescape(encodeURIComponent(csvContent)));
            const url = `data:text/csv;charset=utf-8;base64,${csvContentBase64}`;


            console.log("Generated Blob URL:", url); // URL kontrolü

            // İndirme işlemi
            chrome.downloads.download({
                url: url,
                filename: "isletme_bilgileri.csv",
                saveAs: true
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error("Download API error:", chrome.runtime.lastError.message);
                } else {
                    console.log("Dosya indirme işlemi başlatıldı. Download ID:", downloadId);
                }

                

    if (url) {
        setTimeout(() => {
            try {
                URL.revokeObjectURL(url);
                console.log("URL başarıyla serbest bırakıldı.");
            } catch (error) {
                console.warn("URL.revokeObjectURL başarısız:", error);
            }
        }, 10000);
    }
            });

            sendResponse({ success: true });
        } catch (error) {
            console.error("Veriler dışa aktarılırken bir hata oluştu:", error);
            sendResponse({ success: false, message: error.message });
        }
    }
    return true;
});
