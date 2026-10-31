# Runograph: Google ja küpsiste seadistamine

Google’i koodid on praegu tühjad ning Analytics on välja lülitatud. Eesti- ja ingliskeelne privaatsusleht ning jaluse „Küpsiste seaded” on valmis. Kui Analytics on väljas, ei näidata esmakülastusel nõusolekubännerit: nõusolekut vajavat Google’i teenust ei laadita. Seadete vaate saab jalusest alati avada.

## 1. Google Analytics hiljem

1. Ava [Google Analytics](https://analytics.google.com/) ja loo konto ning GA4 property.
2. Lisa oma veebilehe jaoks **Web** andmevoog. Kasuta päriselt avaldatud aadressi. Praegune aadress on https://markuskaljuste.github.io/runrunrun/ ; runograph.com pole veel majutusega ühendatud.
3. Ava veebivoo seaded ja kopeeri **Measurement ID**, mis algab `G-`. Ära kopeeri property numbrit ega Google Tag Manageri `GTM-` koodi.
4. Lülita selle voo **Enhanced measurement** välja. Leht saadab ise ühe lehevaatamise puhastatud URL-iga. Vaata Google’is üle ka andmete säilitamise aeg ja konto andmejagamise valikud.
5. Ava [Pages CMS](https://app.pagescms.org/), vali repositoorium **markuskaljuste/runrunrun**, haru **main**, seejärel **Google ja küpsised / Google & cookies**.
6. Lisa mõõtmis-ID, veebilehe haldaja nimi ja privaatsuskontakti e-post. Need kontaktandmed avaldatakse privaatsuslehel. Vaata üle kuupäev. Lülita Analytics sisse ning salvesta.
7. Oota GitHub Actionsis viimase avaldamise rohelist tulemust. Ava avalik veebileht privaatses brauseriaknas. Enne valikut ega keeldumisel ei laadita Google Analyticsit. Luba analüütika ja kontrolli külastust Google Analyticsi **Realtime** vaates. Reklaamiblokeerija võib ka lubatud analüütika blokeerida.
8. Proovi jaluses **Küpsiste seaded → lülita Analytics välja → Salvesta valik**. Kui Analytics oli laaditud, värskendatakse lehte ja selle saidi Runographi analüütikaküpsised eemaldatakse.

Mõõtmis-ID puudumisel jäta Analytics välja. Privaatne Sitesi eelvaade ja kohalik eelvaade ei saada Analyticsi andmeid. Uute jälgimisteenuste või nõusoleku oluliste muudatuste korral uuenda privaatsusteavet ning suurenda seadetes nõusoleku versiooninumbrit.

## 2. Search Console

1. Ava [Google Search Console](https://search.google.com/search-console/) ja lisa veebileht.
2. Oma domeeni jaoks vali **Domain**, sisesta `runograph.com` ja lisa Google’i antud **TXT-kirje** domeenipakkuja DNS-seadetesse. Selle variandi jaoks ei täideta lehe HTML-kinnituskoodi välja. DNS-i omandiõiguse kinnitamine on eraldi domeeni veebimajutusega ühendamisest.
3. Praeguse GitHub Pagesi lehe jaoks võid valida **URL prefix** ja täpse aadressi `https://markuskaljuste.github.io/runrunrun/`. Vali omandiõiguse kinnituseks **HTML tag**. Kopeeri sildi `content="…"` väärtus Pages CMS-i **Search Console HTML-tag kinnituskood** väljale ning salvesta. Kohalik toimetus oskab ka tervest meta-sildist koodi eraldada; Pages CMS-is sisesta ainult kood.
4. Oota eduka avaldamise lõpuni ja vajuta Search Console’is **Verify**. Koodi lisamine faili üksi ei kinnita omandiõigust. Hoia kinnituskood või DNS-kirje alles.
5. Kui domeen on majutusega ühendatud, avaldab GitHub Pages ka õiged domeeni canonical-lingid ja saidikaardi. Lisa Search Console’i **Sitemaps** alla vastava avaliku lehe `sitemap.xml`: praegu `https://markuskaljuste.github.io/runrunrun/sitemap.xml`, pärast domeeni ühendamist `https://runograph.com/sitemap.xml`.

## 3. Mida uuendus teeb

- Lehe nimi ja toimetus kasutavad Runographi; projekti kaust on `runograph`.
- Blogipostitusi saab riikide alla jagada.
- Nõusoleku valik salvestatakse brauserisse kuni 180 päevaks. Keeldumine ja lubamine on võrdselt kättesaadavad. Jalusest saab valikut muuta.
- Privaatsusteave on aadressidel `/et/privacy/` ja `/en/privacy/`.
- Search Console’i kinnitussilt lisatakse pärast koodi salvestamist ka avalehe ümbersuunamise lehele.
- Google’i kontod, domeeni DNS ning GitHubi ja Pages CMS-i sisselogimised on sinu kontodega tehtavad sammud. Neid pole selle failiuuendusega ühendatud.
- Olemasoleva Sitesi eelvaate aadress jääb samaks. Selle tehnilise aadressi nimi ja GitHubi repositooriumi nimi ei määra lugejale nähtavat brändi.

Ametlikud juhendid: [Google’i nõusolekurežiim](https://developers.google.com/tag-platform/security/concepts/consent-mode), [Analyticsi seaded](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), [Search Console’i kinnitamine](https://support.google.com/webmasters/answer/9008080), [AKI selgitused](https://www.aki.ee/isikuandmed/kkk/interneti-ja-veebitegevused).
