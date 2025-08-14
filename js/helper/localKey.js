// helper/localKey.js
export async function exportUserHistory(uid) {
  try {
    const historyKey = `history-${uid}`;
    const historyData = localStorage.getItem(historyKey);
    
    if (!historyData) {
      throw new Error('Kullanıcı geçmişi bulunamadı!');
    }

    // Geçmiş verisini parse et
    const parsedHistory = JSON.parse(historyData);
    
    // JSON string oluştur
    const jsonStr = JSON.stringify(parsedHistory, null, 2);
    
    // Blob oluştur ve indir
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `history_${uid}_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Bellek temizleme
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    return { 
      success: true, 
      message: 'Geçmiş başarıyla dışa aktarıldı.',
      count: parsedHistory.length
    };
  } catch (error) {
    console.error('Geçmiş dışa aktarma hatası:', error);
    throw new Error(`Geçmiş dışa aktarılırken hata: ${error.message}`);
  }
}

export async function importUserHistory(uid) {
  if (!uid) throw new Error('Kullanıcı ID gereklidir!');
  
  return new Promise((resolve, reject) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return reject(new Error('Dosya seçilmedi'));
      
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        
        if (!Array.isArray(imported)) {
          throw new Error('Geçersiz geçmiş formatı - Dizi bekleniyordu');
        }
        
        const historyKey = `history-${uid}`;
        let currentHistory;
        
        try {
          // Mevcut geçmişi al veya boş dizi oluştur
          const storedData = localStorage.getItem(historyKey);
          currentHistory = storedData ? JSON.parse(storedData) : [];
          
          // currentHistory'yi diziye dönüştür
          if (!Array.isArray(currentHistory)) {
            console.warn('Mevcut geçmiş dizi değil, yeni dizi oluşturuluyor');
            currentHistory = [];
          }
        } catch (e) {
          console.error('Geçmiş parse hatası:', e);
          currentHistory = [];
        }
        
        // Benzersiz kayıtları filtrele
        const uniqueImports = imported.filter(newItem => 
          !currentHistory.some(existing => 
            existing.cmd === newItem.cmd && 
            new Date(existing.date).toDateString() === new Date(newItem.date).toDateString()
          )
        );
        
        // Yeni geçmişi oluştur (eski + yeni)
        const updatedHistory = [...uniqueImports, ...currentHistory]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 100); // Son 100 kaydı tut
        
        localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
        
        resolve({
          success: true,
          message: `${uniqueImports.length} yeni kayıt eklendi (Toplam: ${updatedHistory.length})`,
          added: uniqueImports.length,
          total: updatedHistory.length
        });
        setTimeout(() => {window.location.reload();}, 1000); //1sn sonra reload
      } catch (error) {
        reject(new Error(`Dosya işlenirken hata: ${error.message}`));
      }
    };
    
    fileInput.click();
  });
}