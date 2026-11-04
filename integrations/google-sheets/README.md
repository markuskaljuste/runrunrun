# Runograph email collection

This small Google Apps Script saves new signups to a private Google Sheets tab. It sends no emails and has no endpoint for reading subscribers. It uses the owner's Google account and is subject to Apps Script's free usage limits.

1. Open the destination spreadsheet, then **Extensions > Apps Script**.
2. Replace the sample code in **Code.gs** with this folder's **Code.gs** and save.
3. Select **setup** and click **Run**. Authorize your own script to access Google Sheets. This creates a separate **Runograph subscribers** tab and remembers this spreadsheet. Existing tabs are left alone. If a tab with that name already has different headers, setup stops without changing it.
4. Choose **Deploy > New deployment > Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Deploy and finish Google's authorization prompts. Keep the spreadsheet itself **Restricted**.
5. Copy the deployed URL ending in **/exec**. The **/dev** testing URL cannot accept public signups.
6. Add the /exec URL under **Social & contact > Email signup > Google Apps Script URL** in Pages CMS, then enable signup. Alternatively, send the /exec URL to the site maintainer. This address is a public submission endpoint, not a password or OAuth token.
7. Submit your own email through the website and check for the new row. Check the site's success message too. A blocked or misconfigured deployment must time out rather than claim a signup was saved.

The sheet stores the UTC time, email, full consent text and version, source, collected status and an ID. It does not collect IP addresses, locations, training information, or cookies. `collected` is not proof of ownership of an email address. Confirm your mailing service's import/verification process before sending newsletters later.

The endpoint validates email and consent, checks a honeypot and submission timing, prevents duplicate rows under a script lock, escapes spreadsheet formulas, and has a daily cap. These are basic protections for a small site, not a guarantee against automated abuse. No OAuth credentials or spreadsheet contents are included in website files.

If you update Code.gs later, use **Deploy > Manage deployments > Edit > New version > Deploy**, retaining the same /exec URL.

Official docs: [Apps Script web apps](https://developers.google.com/apps-script/guides/web), [usage limits](https://developers.google.com/apps-script/guides/services/quotas).
