# Runographi kommentaarium

Kommentaar ilmub kohe loo alla. Sina saad teavituse ning saad privaatses tabelis vastata, peita või kustutada. Lugeja kontot ega e-posti ei küsita.

## Ühekordne ühendamine

1. Ava enda privaatne kommentaaritabel Google Drive’is. Ära muuda jagamist avalikuks.
2. Ava **Extensions → Apps Script** (Laiendused → Apps Script).
3. Asenda Code.gs sisu failis `integrations/google-comments/Code.gs` oleva koodiga ja salvesta.
4. Vali ülariba funktsioonide menüüst **setup** ja vajuta **Run**. Kinnita oma skripti õigused Google’is. Vaata tagasi tabelisse: teavituste e-posti dialoog avaneb seal. Sisesta **runograph01@gmail.com**.
5. Apps Scriptis vali **Deploy → New deployment → Web app**.
6. **Execute as: Me**, **Who has access: Anyone**. Vajuta **Deploy**.
7. Saada mulle **Web app URL**, mis lõpeb `/exec`. See peab olema uus kommentaaride aadress, mitte meililisti oma. Siis ühendan lehega ja saame teha päris kommentaari ning teavituse testi.

Tabelisse lisandub menüü **Runograph comments**. Kui seda ei näe, värskenda tabelit.

## Igapäevane kasutamine

- Märgi Comments-lehel üks kommentaaririda ja vali **Runograph comments → Reply to selected**. Sinu vastus ilmub kommentaari alla märgisega „Markus · Author”. Uus vastus asendab sama kommentaari senise autorivastuse.
- **Hide selected** peidab kommentaari ja selle vastuse. **Show selected** toob need tagasi.
- **Delete selected permanently** kustutab rea pärast sinu kinnitust.
- **Send pending notifications** proovib ootel teavitused uuesti saata. Seda tehakse automaatselt ka kord tunnis.
- Tabeli Status-veerus saab kasutada `visible` või `hidden`. Author reply veergu saab ka otse kirjutada. Veerupäiseid ja sisemisi ID-sid ära muuda.

Lehel on **Refresh comments** nupp; vastus või kustutamine kajastub lehe värskendamisel. Google Sheetsi tabelit ennast ei avaldata veebis.

## Piirangud ja andmed

- Maksimaalselt 200 uut kommentaari päevas ning üks kommentaar sama brauseritunnuse kohta minutis. Päevapiir kaitseb tasuta Google’i kvooti, mitte ei taga täielikku robotikaitset.
- Allkirjastatud kontrollküsimus, peidetud robotiväli, teksti pikkuse ja linkide arvu piirangud. Vajadusel saab hiljem lisada tugevama CAPTCHA.
- Kuni 40 teavituskirja päevas; suurema hulga korral saadetakse ootel kommentaarid koondkirjades. Google’i enda e-posti kvoodi lõppemisel jäävad kirjad ootele. Kommentaar ise jääb salvestatuks.
- Brauseris on kuni 30 päeva juhuslik tunnus korduvate saatmiste piiramiseks. Tabelisse salvestatakse selle räsi, mitte lugeja e-post ega pulsi-/treeningandmed.
- Avalik vastus sisaldab ainult nime, kommentaari, kuupäeva ja sinu vastust. Peidetud read, halduse e-post, sisemised tunnused ja saatmisolekud lugejani ei jõua.
- Kommentaare kuvatakse 30 kaupa, värskeim ees. 10 000 rea lähedal tuleb vanemad kirjed eraldi arhiivi tõsta.

Sisselülitamine Pages CMS-is: **Social & contact → Comments / Google Sheets**. Lisa eraldi kommentaaride `/exec` aadress ning lülita **Enable comments** sisse. Ilma ühenduseta kommentaarivormi lugude all ei kuvata.
