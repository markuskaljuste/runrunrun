# Runograph

A complete English / Estonian running travel journal. The project belongs to you: no database, paid CMS, subscription, build dependencies or API key is required.

## Open and edit on your computer

On a Mac, double-click **Start preview.command**. Or use Node.js 22 or later:

```sh
npm run dev
```

Open **http://localhost:4173/en/** for English, **http://localhost:4173/et/** for Estonian, and **http://localhost:4173/admin/** to write.

1. Choose Journal, Routes, Site & my story, Logo & sponsors, Pildid / Images, SEO, Riigid / Countries, Kohad / Places, or Google & küpsised.
2. Edit the English and Eesti tabs. Upload JPG, PNG or WebP photographs if needed.
3. Save as a draft while writing. Both languages need a title, introduction and body before an entry can be published.
4. Choose **Published** and **Save changes** to include an entry in your local site.
5. Publish your updated project to update the online site. A local save does not change a hosted copy.

The editor writes to your `content/` files and rebuilds the preview. It runs on your own computer only. A hosted `/admin/` page explains how to open Pages CMS; it does not pretend to provide public write access.

### Change your logo and add sponsors

In the local editor, choose **Logo & sponsors** (direct address: **http://localhost:4173/admin/?section=branding**).

- Upload a header logo. Transparent PNG or WebP works well; JPG is also supported.
- Optionally upload a light footer logo for the dark background. Without one, the main logo appears on a light tile in the footer.
- Adjust the logo width and add a text description for accessibility. Clear the header image to return to the site-name wordmark.
- Click **Add sponsor**, enter the sponsor name, upload its logo and optionally add its full `https://` website address.
- Use the arrow buttons to change the order. Uncheck **Visible** to hide a sponsor, or remove it from the list. Uploaded files are kept, so removing a sponsor does not delete its image.
- Edit the English and Estonian section headings, or switch the whole section off.
- **Save changes** updates the local site. Publish the project to update the hosted site.

These same fields are configured in Pages CMS under **Logo & sponsors / Logo ja toetajad**. The homepage only shows the section when it contains at least one visible sponsor with a name and logo. No example sponsors or endorsements are published.

### Running places and country categories

The destination catalog lives at `/en/countries/` and `/et/countries/`, with an all-places view at `/en/places/` and `/et/places/`. It starts with the 34 places supplied by the author, grouped into 20 countries. Monaco has its own country page. Place pages have local destination photos and **Info coming soon / Info varsti** text, with no invented route descriptions, distances, dates of visits or recorded runs.

In Pages CMS or the local editor, choose **Kohad / Places** to edit a photograph, country and English/Estonian name, introduction and body. **Info varsti / Coming soon** keeps a placeholder page noindex and outside the sitemap while keeping it visible in the destination catalog. Turn that switch off when the page is ready. Draft places stay out of public output. Photos are illustrative Wikimedia Commons images, with authors and licenses linked on each place page and the photo credits page. El Río uses an explicitly regional Tenerife image.

Use **Riigid / Countries** to add a country and its bilingual name/description. A country appears when it has at least one published place or story. Published country stories remain visible on their country page. Country counts and place counts are separate from the General journal category. A new country without published content stays hidden.

Journal entries can optionally select **Riik / Country** and **Jooksukoht / Running place**. Create/publish the place first and choose the matching country; the build rejects mismatched or unpublished place references. Leave the place blank for a country-wide story, or both fields blank for General / Üldine. Existing personal stories keep their previous categories. Place placeholders do not take over the homepage's latest-journal section.

Keep existing country and place URL slugs stable. Pages CMS disables file renaming and the local editor locks saved slugs. To remove a place used by a story, first unlink or move that story. Published content, bilingual links, search by country/place, image files and relationships are validated by `npm run check`.

Eesti: vali **Kohad / Places**, muuda foto ja tekstid ning salvesta. Kui sisu on valmis, võta **Info varsti** märge maha. Postituse juures saad valida sama riigi ning täpse jooksukoha. Riigi üldine lugu võib jääda konkreetse kohata.

### Change homepage and About photographs

Choose **Pildid / Images** in the editor. Replace the homepage hero photograph, the homepage story photograph, the About-page image or the browser icon. Upload JPG, PNG or WebP images, up to 8 MB. Add English and Estonian alt descriptions and optionally change or remove captions. A square PNG works well for the browser icon. Save and publish to apply changes online.

Post and route cover images remain editable inside each entry. Each language now has image-description and caption fields as well. If you use your own photographs, update the captions and the photo credits accordingly.

### Change SEO settings

Choose **SEO**, select Home, Journal, Routes or About, then English or Eesti. Set an optional SEO title, meta description and sharing image for that page. An entered SEO title is the complete browser/search title; add the site name yourself if wanted. Empty values use the page headline and introduction. The search preview is illustrative; search engines may display different text.

You can upload a default sharing image and control whether the generated pages include `index,follow` or `noindex,follow`. This indexing setting does not change the site's access permissions. Canonical URLs, EN/ET alternate-language links, Open Graph/Twitter metadata and the sitemap are generated at publication, using the hosting address supplied by GitHub Actions. Do not block the entire site in robots.txt when relying on noindex, because crawlers need to read the page's noindex instruction.

Each post and route has optional **SEO ja jagamine / SEO & sharing** fields under its language content. These override its usual title, introduction and cover image. No SEO keywords field or ranking guarantee is provided.

Pages CMS contains the same **Pildid / Images** and **SEO** collections. If you already uploaded an older edition of the project, replace its files with the updated project, including `.pages.yml`, so these fields become available.

## Google Analytics, Search Console and cookies

Choose **Google & küpsised** in the local editor or **Google ja küpsised / Google & cookies** in Pages CMS. All Google codes start empty and Analytics starts **off**. Read **GOOGLE-SEADISTUS.md** for the setup steps. `runograph.com` is owned but has not been connected to hosting; no CNAME is added by this update.

Add your real GA4 measurement ID, website operator name and privacy contact before switching Analytics on. The site uses basic consent gating: it makes no Google Analytics request until the visitor allows analytics. Accept and reject have equal prominence. The EN/ET footer links to a privacy notice and Cookie settings; withdrawal disables Analytics, clears only Runograph analytics cookies and reloads an already tracked page. The preference is stored in localStorage for up to 180 days; expiry or a changed consent version asks again. Essential preference storage is separate from optional analytics.

Private `.chatgpt.site` previews and local builds keep Analytics disabled, even if the setting is on. HTTPS production builds use the supplied `SITE_URL`. A valid Search Console HTML-tag token is included in the root and translated pages independently of Analytics consent. Domain-property verification instead uses a DNS TXT record and leaves this token empty. Saving a token does not verify Google ownership automatically.

Google advertising and signals options are disabled, no custom user ID is set, and the one explicit page view uses URLs without query strings or fragments. Turn off **Enhanced measurement** in the Google web-stream settings to keep collection aligned with this setup. No server-side consent log, Google account, retention setting or ownership verification is created for you. Review the privacy information when adding third-party services or changing their settings.

The automated checks exercise consent gating, returning visits, rejection, expiration, version changes, withdrawal, storage failures and cross-tab preference changes. They do not confirm a live Google connection or replace testing with your eventual measurement ID in your Google account.

## Publish for free with GitHub Pages

GitHub Pages is free for public repositories on GitHub Free. The supplied workflow builds and publishes the website, including repository subpaths. You do not need to buy a domain: GitHub provides an address.

1. Create a **public** GitHub repository, using `main` as its default branch.
2. Put **the contents of this project folder at the root of the repository**. Include hidden files: `.pages.yml`, `.github/`, and `.gitignore`. GitHub's website upload may miss dotfiles; GitHub Desktop is an easier option for adding the complete folder. The `.openai/` folder belongs to the private Sites preview and is not needed for GitHub Pages; omit it from a separate GitHub copy.
3. Open the repository's **Settings → Pages → Build and deployment**, and select **GitHub Actions** as the source.
4. Open **Actions → Publish Runograph → Run workflow**, or push a change to `main`.
5. When the workflow succeeds, its deployment link is the live website.

Publishing to your GitHub repository requires your GitHub connection. The private Sites preview and GitHub Pages are separate copies. Private GitHub repositories may require a paid GitHub plan for Pages. Keep the repository public for the free setup described here. Drafts are excluded from generated pages, but their source files remain visible in a public repository.

Official guide: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Edit online with free Pages CMS

The project includes `.pages.yml`, already configured for bilingual posts, route guides, photographs and the homepage/About copy. It uses a plain text Markdown body field for predictable formatting.

1. Visit **https://app.pagescms.org/** and sign in with GitHub.
2. Install its GitHub App for the repository containing this project.
3. Open that repository and the `main` branch.
4. Edit an entry, or create one using a short URL slug such as `first-run-in-a-new-city`.
5. Save your content. Pages CMS commits to GitHub, and the included GitHub Actions workflow republishes the site.

Pages CMS is free and open source: https://pagescms.org/
Setup instructions: https://pagescms.org/docs/quick-start/

To remove an entry, use Pages CMS or remove its JSON file, then rebuild. Local editing intentionally provides no delete button. Keep an existing slug when editing to preserve its URL.

## Eesti: alustamine

Macis ava **Start preview.command**. Teine võimalus on käivitada projekti kaustas `npm run dev` (vajalik Node.js 22 või uuem).

- Avaleht: **http://localhost:4173/et/**.
- Toimetus: **http://localhost:4173/admin/**.
- Vali sissekanne ja muuda **English** ning **Eesti** välju.
- **Draft** on mustand, **Published** lisab sissekande loodavale lehele.
- Salvesta muudatused. Kohalik salvestus uuendab sinu arvutis olevaid faile ja eelvaadet.
- Tasuta avaldamiseks lisa kogu projekt avalikku GitHubi repositooriumi, vali **Settings → Pages → GitHub Actions** ja käivita kaasasolev töövoog.
- Veebis muutmiseks ava **https://app.pagescms.org/**, ühenda sama repositoorium ja salvesta seal. GitHubi töövoog avaldab muudatused.

GitHubi ja Pages CMS-i ühendamiseks logi sisse enda kontoga. Privaatne Sitesi eelvaade ja GitHub Pagesi leht on eraldi koopiad. Tasuta GitHub Pagesi lahenduses on lähtefailid, sealhulgas mustandid, avalikus repositooriumis nähtavad.

## Pages and content

- `content/site.json`: brand, homepage headlines and introduction, About story in both languages.
- `content/branding.json`: header/footer logo, logo size, sponsor headings, visibility, sponsor logos and links.
- `content/images.json`: homepage/About photographs, captions, bilingual alt text and favicon.
- `content/seo.json`: main-page SEO titles, descriptions, sharing images and indexing preference.
- `content/integrations.json`: Analytics opt-in setting, GA4 measurement ID, Search Console verification token, privacy contact and consent version.
- `content/countries/*.json`: editable bilingual country categories and introductions.
- `content/places/*.json`: published/draft running places, country references, local photos and bilingual placeholder or finished text.
- `content/photo-credits.json`: Wikimedia Commons authors, source pages and individual photo licenses.
- `content/posts/*.json`: three initial personal stories, based only on the supplied outline.
- `content/routes/*.json`: two sourced destination research notes. These are **not first-hand tested running routes**.
- `public/assets/`: local photographs, fonts and styles. No external font or image request is needed to view the site.
- `public/admin/`: local editor and hosted CMS handoff.
- `dist/`: generated, ready-to-host static website.

The About page covers Estonian cross-country skiing, snowboarding and injuries, a weight of about 100 kg in 2018–2019, the goal of losing 20–25 kg for karting/motorsport, nine marathon **attempts**, the later 10 km focus, founding Rocca Sörk, remote digital marketing work and running while travelling. No weight-loss result, finish count, race time, route details, exact injury or private contact detail has been added. The destination catalog uses only places the user explicitly confirmed having run in.

All initial post publication dates are 26 October 2026, when this edition of the website was created; they are not dates of the life events. Replace the initial editorial copy and illustrative photographs with your own material as you develop the journal. Runograph is the selected site name.

## Route accuracy

Routes require an official source URL, source label and checked date to publish. The Tallinn entry uses Visit Tallinn; the Madeira entry uses Visit Madeira. Madeira's 2.2 km figure describes the promenade in the source, **not** a recorded run or loop. The site supplies no invented GPX, elevation, water points, accessibility, opening-hours or safety data. Date checked: 26 October 2026.

Sources:

- https://web.visittallinn.ee/eng/visitor/see-do/things-to-do/urban-nature/177339/pirita-promenade-and-reidi-road
- https://visitmadeira.com/en/where-to-go/madeira/south-coast/camara-de-lobos/camara-de-lobos-promenade/

## Formatting

Use blank lines between paragraphs; `## Heading`, `### Subheading`, `**bold**`, `*italic*`, `- bullet`, numbered lists, `> quote`, `[text](https://example.com)`, and an image alone in a paragraph: `![alt text](/assets/uploads/photo.jpg)`. Raw HTML is displayed as text. This is a deliberately small Markdown subset; tables and embedded scripts are not supported.

## Build and check

```sh
npm run build
npm run check
```

`dist/` can be uploaded to any static host. For a project subpath, set `BASE_PATH=/repository-name` at build time. Optionally set `SITE_URL=https://example.com` (origin only) to generate canonical links, alternate language metadata and a sitemap. GitHub Actions sets both values automatically from Pages settings. Build output is regenerated; edit `content/` and `public/`, rather than `dist/`.

The checker validates the content, both-language counterpart links, internal links/assets, drafts, route-source requirements, safe text rendering and the CMS structure. There is no dependency installation step. The development server binds to the local computer, checks the origin and an editor token before writes, and does not publish editing endpoints in static output.

## Photography and fonts

The photographs include Unsplash editorial images and Wikimedia Commons destination images, stored locally. They are not the author's own photographs. The visited-place catalog is based on the user's list, independently of the stock photographs. Named route cards are explicitly labelled as illustrative. The website has a photo credits page; original download URLs and font licences are in `CREDITS.md` and `public/assets/LICENSE-*.txt`. DM Sans and Manrope are bundled under the SIL Open Font License.
