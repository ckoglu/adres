export const htmlData = `
<section>
  <h2>hakkında</h2>
  <p>Bu proje, Türkiye’nin resmi idari birimlerini (il, ilçe, mahalle, köy, belde, sokak) açık veri yaklaşımıyla sunan, tamamen istemci tarafında çalışan bir JSON API arayüzüdür. Veriler <a href="https://github.com/ckoglu/csv-tr-api" target="_blank" class="hreflink" rel="noopener noreferrer">GitHub</a>’daki <code>CSV</code> dosyalarından alınır ve JavaScript ile işlenir. Hızlı, sade, okunabilir bir yapıya sahiptir, arka uç gerektirmez. Kaynaklar TÜİK, NVI, OpenStreetMap, Wikipedia’dır. Açık kaynaklıdır ve MIT lisansı altındadır.</p>

  <h3 data-content="#" class="hover:content">Komutlar</h3>
  <div>
    <a href="${url.site}${url.repository}?cmd=il" data-ust-title="Tüm illeri JSON olarak döner"><code>il</code></a>
    <a href="${url.site}${url.repository}?cmd=il={adı,no}" data-ust-title="Belirli bir ili sorgular"><code>il={adı,no}</code></a>
    <a href="${url.site}${url.repository}?cmd=ilce" data-ust-title="Tüm ilçeleri listeler"><code>ilce</code></a>
    <a href="${url.site}${url.repository}?cmd=ilce={adı,no}" data-ust-title="Belirli bir ilçeyi sorgular"><code>ilce={adı,no}</code></a>
    <a href="${url.site}${url.repository}?cmd=mahalle={adı,no}" data-ust-title="Mahalle verisi"><code>mahalle={adı,no}</code></a>
    <a href="${url.site}${url.repository}?cmd=koy={adı,no}" data-ust-title="Köy verisi"><code>koy={adı,no}</code></a>
    <a href="${url.site}${url.repository}?cmd=sokak={adı,no}" data-ust-title="Sokak bilgisi"><code>sokak={adı,no}</code></a>
    <a href="${url.site}${url.repository}?cmd=ara={kelime}" data-ust-title="Tüm veri içinde arama"><code>ara={kelime}</code></a>
    <a href="${url.site}${url.repository}?cmd=filtre={il,ilce,mahalle,koy,sokak}" data-ust-title="Arama sonuçlarını filtrele"><code>filtre={il,ilce,mahalle,koy,sokak}</code></a>
    <a href="${url.site}${url.repository}?cmd=sirala={az,za}" data-ust-title="A-Z veya Z-A sıralama"><code>sirala={az,za}</code></a>
    <a href="${url.site}${url.repository}?cmd=sayfa={no}" data-ust-title="json sonuçları sayfalar"><code>sayfa={no}</code></a>
    <a href="${url.site}${url.repository}?cmd=sutun={sütunadı}" data-ust-title="Belirli sütunları göster"><code>sutun={sütunadı}</code></a>
    <a href="${url.site}${url.repository}?cmd=belediye={il adı,ilçe adı}" data-ust-title="Belediye bilgisi"><code>belediye={il adı,ilçe adı}</code></a>
    <a href="${url.site}${url.repository}?cmd=universite={il adı}" data-ust-title="Üniversite bilgisi"><code>universite={il adı}</code></a>
  </div>
  <h3 data-content="#" class="hover:content">örnekler</h3>
  <div>
    <a href="${url.site}${url.repository}?cmd=il=ankara" data-ust-title="ankara ilini getirir"><code>il=ankara</code></a>
    <a href="${url.site}${url.repository}?cmd=il=adana&ilce" data-ust-title="Adana'daki tüm ilçeleri döner"><code>il=adana&ilce</code></a>
    <a href="${url.site}${url.repository}?cmd=ilce=seyhan&mahalle" data-ust-title="Seyhan ilçesindeki mahalleleri döner"><code>ilce=seyhan&mahalle</code></a>
    <a href="${url.site}${url.repository}?cmd=il=adana&sutun=id,adi" data-ust-title="Sadece id ve ad bilgisi"><code>il=adana&sutun=id,adi</code></a>
    <a href="${url.site}${url.repository}?cmd=il=adana&ilce=çukurova&mahalle=beyazevler&sokak=80060" data-ust-title="Sokak verisiyle birlikte detaylı çıktı"><code>il=adana&ilce=çukurova&mahalle=beyazevler&sokak=80060</code></a>
    <a href="${url.site}${url.repository}?cmd=ara=adana" data-ust-title="Tüm veri kümesinde adana araması"><code>ara=adana</code></a>
    <a href="${url.site}${url.repository}?cmd=ara=adana&filtre=il" data-ust-title="Sadece illerde adana araması"><code>ara=adana&filtre=il</code></a>
    <a href="${url.site}${url.repository}?cmd=ara=ank&baslayan=il,mahalle" data-ust-title="'ank' ile başlayan il ve mahalleler"><code>ara=ank&baslayan=il,mahalle</code></a>
    <a href="${url.site}${url.repository}?cmd=il&bolge=akdeniz" data-ust-title="Akdeniz bölgesindeki iller"><code>il&bolge=akdeniz</code></a>
    <a href="${url.site}${url.repository}?cmd=il&buyuksehir=false" data-ust-title="Büyükşehir olmayan iller"><code>il&buyuksehir=false</code></a>
    <a href="${url.site}${url.repository}?cmd=il&nufus=1000000" data-ust-title="Nüfusu 1 milyonu geçen iller"><code>il&nufus=1000000</code></a>
    <a href="${url.site}${url.repository}?cmd=il&rakim=1000" data-ust-title="Rakımı 1000 m'den fazla olan iller"><code>il&rakim=1000</code></a>
    <a href="${url.site}${url.repository}?cmd=il&kiyi=true" data-ust-title="Denize kıyısı olan iller"><code>il&kiyi=true</code></a>
    <a href="${url.site}${url.repository}?cmd=ara=*ada&filtre=il" data-ust-title="Ada ile başlayan illeri filtrele"><code>ara=*ada&filtre=il</code></a>
    <a href="${url.site}${url.repository}?cmd=ara=*ada*&filtre=il" data-ust-title="Ada içeren illeri filtrele"><code>ara=*ada*&filtre=il</code></a>
    <a href="${url.site}${url.repository}?cmd=ara=ada*&filtre=il" data-ust-title="Ada ile biten illeri filtrele"><code>ara=ada*&filtre=il</code></a>
  </div>
  <h3 data-content="#" class="hover:content">kullanım</h3>
  <p>Sayfadaki komut kutusuna örneklerden birini yazarak veriye ulaşabilirsiniz. Örneğin: <a href="${url.site}${url.repository}?cmd=il=antalya&ilce=alanya" data-ust-title="Antalya ili ve Alanya İlçesi"><code>il=antalya&ilce=alanya</code></a></p>
  <h3 data-content="#" class="hover:content">API</h3>
  <div class="endpoint"><pre class="json-highlight"><span class="json-key">fetch</span>(<span class="json-string">"https://adres.ckoglu.workers.dev/?api=[CMD]&key=[KEY]"</span>)
.<span class="json-key">then</span>(<span class="json-number">res</span> <span class="json-equals">=></span> <span class="json-number">res</span>.<span class="json-key">text</span>())
.<span class="json-key">then</span>(<span class="json-number">data</span> <span class="json-equals">=></span> <span class="json-brace">{</span><span class="json-key">document</span>.<span class="json-key">body</span>.<span class="json-key">textContent</span> <span class="json-equals">=</span> <span class="json-number">data</span>;<span class="json-brace">}</span>)
.<span class="json-key">catch</span>(<span class="json-number">err</span> <span class="json-equals">=></span> <span class="json-key">console</span>.<span class="json-key">error</span>(<span class="json-string">"hata:"</span>, <span class="json-number">err</span>));</pre></div>
  </section>`;

export function gosterInfo(cmdInput) {
  if (!cmdInput) return;
  cmdInput.value = "info";
  const url = new URL(window.location.href);
  url.searchParams.set("cmd", "info");
  history.replaceState({}, "", url.toString());
  document.getElementById("header-text").innerHTML = htmlData;
}
