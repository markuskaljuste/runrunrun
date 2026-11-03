# Runograph

An English running and travel journal with optional translations on individual stories. Static files, GitHub Pages and Pages CMS keep hosting and editing free. No translation service or paid API is required.

## Write and edit in Pages CMS

1. Open https://app.pagescms.org/ and select your repository.
2. Choose **Journal / Päevik**, create a post, and write its **English original**.
3. Select the countries and all catalog places covered by the run. Add extra town or village names under **Add other towns and places**.
4. Add a cover photograph, inline photographs and any PDF, TXT, CSV or ZIP attachments.
5. Use Draft while writing. Publish the English story when its title, introduction and body are complete.

### Add a translation later

Inside the same post, open **Add translations / Lisa tõlge**. Add an item, choose the language and leave its status as **Draft** while writing. Its translated title, introduction, body and SEO fields are independent of the English text. Change that translation to **Published** when all three main text fields are complete.

Only published, complete language versions appear on story cards, for example **EN · ES**. Each badge opens its own version. Translations remain separate from the site's English navigation and general pages. A draft translation does not create a public article URL, language badge, search result, alternate-language link or sitemap entry. Publishing the original is also required before a translation can appear publicly.

Cover images, media files, countries, places, attachments and scores belong to the shared post. A translated story automatically includes English-original photographs not already placed in its translated body, with their original captions and credits. Reuse a photograph's URL in translated text to control its placement without uploading a duplicate.

No translations are created automatically. The language choices prepare the editor; choosing a language does not translate the original for you. Each language can be added once, and each translation can be returned to Draft independently.

Source files, including drafts, are readable in a public GitHub repository. Draft visibility on the website does not make those source files private.

## Preview and edit on your computer

Use Node.js 22 or later. Double-click **Start preview.command** on a Mac, or run:

```sh
npm run dev
```

Open **http://localhost:4173/** to browse and **http://localhost:4173/admin/** to edit. The local editor has **Add translation**, language tabs and per-translation Draft/Published controls. It also supports bold text, links, inline photographs, file uploads and a live Markdown preview.

Saving changes updates local content and rebuilds the local preview. A local save does not update GitHub Pages or the owner-private Sites preview. Upload your changes to the chosen hosting copy to update it. The editing endpoints are local-only and protected by origin and editor-token checks.

## English website and old links

The homepage, country pages, place catalog, About, contact and privacy pages use English. There is no global English/Estonian switch. English pages live at the domain root, for example `/`, `/journal/`, `/countries/` and `/privacy/`. Existing `/en/` and `/et/` general-page addresses redirect to their English counterparts using static redirect pages with canonical links. A deliberately published Estonian story translation can still use its `/et/journal/<slug>/` address.

English originals use `/journal/<slug>/`; published translations use `/<language>/journal/<slug>/`. It has its own title, description, HTML language, canonical URL and Open Graph locale. Reciprocal language links and sitemap entries include only published versions.

For local/owner-private builds, `DRAFT_PREVIEW=1 PUBLIC_BUILD=0` enables noindex draft previews at `/preview/<slug>/` for English and `/<language>/preview/<slug>/` for translations. Public builds ignore that flag. Draft previews have no share or comment controls.

## Public Coming soon mode

`content/publication.json` controls the public website. With `PUBLIC_BUILD=1` and `mode: coming-soon`, the output contains only the English coming-soon page, root/legacy redirects and a small allowlist of assets. The selected homepage photograph is also the Coming soon background and is the only photograph included. Full stories, other photographs, admin files and draft previews are excluded. The Coming soon page includes privacy information and the shared consent controls; Analytics is loaded only after opt-in when enabled.

The owner-private Sites preview is a separate deployment and shows the full journal. Pages CMS saves to GitHub; subsequent CMS edits need a separate private-preview deployment to appear there.

To open the public blog, choose **Publishing** and switch the public mode to **Live**. Saving that change to GitHub publishes the full site after its workflow succeeds. Until then, Runograph.com remains Coming soon.

## Destinations and places

The catalog contains the author's 34 confirmed running places in 20 countries. Country cards with published stories appear first. Unwritten country and place cards have blurred cover images and Coming soon labels. Draft posts do not affect readiness or ordering.

Country pages show story cards only, avoiding duplicate city/place cards beside the same story. The Journal has combined country, city/place and text filters. A story covering several cities matches each one. Known catalog places can be selected together; manual place names appear on the story and exact catalog-name matches are linked automatically. New names remain labels and do not create separate destination pages.

A single post can appear under several countries without duplicating its content. Catalog place references must belong to one of its selected countries. Old single-place records remain readable.

## Scores

Open a post's **Runograph score / Runographi hinnang** section. Enter whole-number scores from 1 to 10 for safety, scenery, running surface, access and running experience. Add optional English notes, up to 240 characters, and enable **Show rating**. All five scores are required when enabled.

The score at the end of the story is their equally weighted average, rounded to one decimal. All language versions share those scores. Stories have independent scores rather than inheriting another place's ratings. The Nice-to-Monaco scores were assigned at the owner's request from his description and remain editable.

## Images, credits, logos and SEO

**Images** controls the homepage photograph, About photograph and favicon. **Logo & sponsors** controls header/footer logos, sponsor logos, their website links and visibility. The transparent Run favicon is supplied, and footer social links use Instagram and Strava icons.

**SEO** contains the English general-page title, description and sharing-image settings. Each story and translation also has its own optional SEO fields. Empty story SEO fields use its title, introduction and cover image.

Photographs should be your own or licensed for the intended use. A `Photo:` or `Foto:` paragraph directly after a Markdown image is rendered once in its small caption. Include author, source and license links. `content/photo-credits.json`, `CREDITS.md` and bundled license files record stock-photo and font sources. The homepage uses the edited photograph supplied by the author (IMG_0671_mirror copy.jpg).

## Contact, comments, Analytics and cookies

Social, contact, sharing and comment settings are in `content/engagement.json`. Formspree contact submission remains disabled until its real opaque form ID is added. Configure the private receiving address inside Formspree, not the public content files.

Remarkbox comments remain off until its real public embed key is supplied and moderation is enabled in the provider's Namespace Settings. Comment approval happens in Remarkbox. The website acknowledgement does not configure provider moderation automatically.

GA4 is configured in **Google & cookies** using the supplied measurement ID and approved privacy contact. It runs on the public Coming soon page and the future full site only after opt-in. Private Sites and local previews do not collect Analytics data. Search Console remains unconfigured. Cookie choices can be changed from the footer. The approved privacy email appears only on the privacy page. Contact-form recipients, API tokens and secrets stay outside public content files.

## Build and deploy

```sh
npm run build
npm run check
```

There is no dependency installation step. `BASE_PATH=/repository-name` supports GitHub Pages project subpaths, and `SITE_URL=https://example.com` supplies the origin for metadata and the sitemap. GitHub Actions supplies these values and sets `PUBLIC_BUILD=1`.

For GitHub, include `.pages.yml`, `.github/`, `.gitignore`, `content/`, `public/` and `scripts/`. The `.openai/` folder belongs to the separate private Sites hosting copy. Edit source files rather than generated `dist/` output.

Checks cover links and assets, English settings, optional story translations, published/draft isolation, language metadata, legacy redirects, shared media and scores, multiple countries and places, safe rendering, cookie consent, contact/comment prerequisites and the public Coming soon boundary.

GPX and KML exports are used privately to prepare stories. They are not uploaded to the website, linked in articles or included in builds. Interactive maps contain route lines without start or finish markers. Map files include latitude and longitude only, with no timestamps, heart rate or other sensor data. Original GPX/KML files remain unpublished. Story maps open automatically. In Pages CMS, paste the public Google My Maps sharing link under Story map to embed that map. Edit, viewer and embed links are accepted and normalized to a public viewer; the original edit URL is not exposed. Without a Google link, select a prepared OpenStreetMap map. My Maps sharing must allow public viewing. For Google maps, show route colors below the embed and keep route-source details in the route metadata; do not add an extra OpenStreetMap source line below the Google map.
