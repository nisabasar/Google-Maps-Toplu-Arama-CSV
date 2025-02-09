# Google Maps Toplu Arama CSV Çıkarıcı

Chrome eklentisi şeklinde hazırladığımız bu proje, Google Maps üzerinde **tek seferde** veya **txt dosyası içindeki çok sayıda sorguyu** sırayla arayarak işletme bilgilerini CSV formatında indirmeye olanak tanır.

## Özellikler

- **Tek arama**: Google Maps sekmesi üzerinden manuel arama yaptıktan sonra, sayfada beliren paneldeki “Başlat” butonu ile işletme verilerini çekip CSV indirir.
- **Toplu arama**: Bir `.txt` dosyasında her satıra bir arama sorgusu yazmanız yeterli. Eklenti, sorguları sırayla arar ve her sorgu için ayrı bir CSV dosyası indirir.
- **Otomatik kaydırma**: Arama sonuçlarını “Listenin sonuna ulaştınız.” uyarısını görene kadar otomatik kaydırır.
- **Detay bilgisi**: Her işletme sonucuna gidip, varsa telefon, adres, web sitesi bilgilerini de çeker.
- **Dosya isimlendirme**: Her CSV dosyası, aranan metni temel alacak şekilde (örnek: `bilişim_otomasyon_ata.csv`) kaydedilir.
- **Sekme kapanmaması**: Toplu arama bittiğinde Google Haritalar sekmesi açık kalır (kapatılmaz).
- **Dosya seçimi**: “Dosya Seç” butonu şık bir tasarımla ortalanmıştır; seçilen `.txt` dosyasının adını da gösterir.

## Kurulum

1. Bu repoyu `git clone` veya ZIP olarak indirip açın.
2. Chrome tarayıcınızda `chrome://extensions` sayfasına gidin.
3. **Geliştirici Modu**nu etkinleştirin (sağ üst köşedeki düğmeyle).
4. “Paketlenmemiş öğe yükle” (Load Unpacked) seçeneğine tıklayın.
5. İndirdiğiniz proje klasörünü seçin.  
   > İçinde `manifest.json`, `popup.html`, `content.js`, `background.js` gibi dosyalar bulunmalı.

## Kullanım

### Tekli Arama

1. Eklenti yüklendikten sonra tarayıcının sağ üstünde gözükecektir.
2. Eklentinin simgesine tıklayıp açılan pencereden “Google Maps'i Aç” butonuna basın.
3. Açılan Google Maps sayfasında istediğiniz aramayı yapın (örneğin `restoran ata istanbul`).
4. **Sayfada sağ üstte** gözüken “İşletme Verileri Çıkart” panelindeki “Başlat” butonuna basın.
5. Eklenti, tüm sonuçları kaydırır, işletme bilgilerini toplar ve indirme işlemini otomatik başlatır.
6. Dosya adı, aranan sorgudan türetilmiş şekilde (`restoran_ata_istanbul.csv`) olur.

### Toplu Arama

1. Bir `.txt` dosyası oluşturun. Her satıra bir sorgu yazın. Örnek:
   ###restoran ata istanbul
   ###kuaför atakule
   ###bilişim otomasyon ata
   
2. Eklenti penceresini açın, “Dosya Seç” butonuna tıklayıp `.txt` dosyasını seçin. Seçtiğiniz dosyanın adı da hemen altında yazacaktır.
3. “Toplu Arama Yap” butonuna tıkladığınızda, eklenti yeni bir Google Maps sekmesi açar ve `.txt`’deki sorguları **sırayla** arar.
4. Her sorgu için ayrı bir CSV indirilir. Arama bittiğinde Google Maps sekmesi **kapatılmaz**, açık kalır.
5. (Opsiyonel) Eklenti, bittiğine dair ekranda bir uyarı da gösterebilir.

## Dikkat Edilmesi Gerekenler

- **Google reCAPTCHA**: Çok fazla sorgu arka arkaya yapıldığında veya çok sık kullanılan IP adreslerinden denendiğinde Google geçici engelleme veya reCAPTCHA sorabilir. Bu durumda manuel doğrulama yapmak gerekebilir.
- **Bekleme Süreleri**: Kod içinde çeşitli `setTimeout` ve `await` beklemeleri ayarlıdır (genelde 5 saniye). Eğer veri eksik toplanıyorsa, bu süreleri artırabilirsiniz.
- **Dil Ayarları**: `scrollToEnd` fonksiyonu “Listenin sonuna ulaştınız.” metnini kontrol eder. Google Maps’i İngilizce kullanıyorsanız bu metin değişebilir. Ona göre düzenlemeler yapmanız gerekebilir.
- **Aynı İşletmenin Birden Fazla Kopyası**: Google Maps bazen aynı işletmeyi farklı konum kaydıyla tekrar listeler. Eklenti, her satırı ayrı satır kabul eder.

## Katkıda Bulunma

- Projeye katkı sunmak için **Pull Request** veya **Issue** açabilirsiniz.  
- Hataları ve önerileri [Issues](../../issues) sekmesine bildirebilirsiniz.

## Lisans

- Bu proje MIT lisansı altındadır. Detaylar için [LICENSE](LICENSE) dosyasına bakabilirsiniz (örnek bir lisans ekleyebilirsiniz).

