import {esc} from './core.mjs';

export const shareStoryPath = '/share-your-story/';
const shareStoryEndpoint = 'https://script.google.com/macros/s/AKfycbzEHefCVPtJKzdaw1ugwrRp2gTuGC9Ltq-ir2AYewbGNu_EUflmeQxhVH8WxdMWMAEs6Q/exec';
const minPhotos = 3;
const maxPhotos = 8;
const maxRatingExplanation = 500;
const fields = {firstName: 100, lastName: 100, email: 254, destination: 180, route: 2500, story: 12000, clubs: 2500, map: 1000, instagram: 1000, facebook: 1000, website: 1000};
const ratingFields = {experience: 'Overall running experience', safety: 'Safety', views: 'Views', surface: 'Running surface'};
const submissionRules = 'A Runograph admin reviews each submission before publishing. If your story is published, your name will appear alongside it and any personal links you provide may also be shown. Your email is used to contact you about your submission.';

export function shareStoryLink(url, current = false) {
 return `<a class="share-story-nav" href="${url(shareStoryPath)}"${current?' aria-current="page"':''}>Share your Story</a>`;
}

export function shareStoryCta(url) {
 return `<section id="share-a-run" class="section share-story-section" aria-labelledby="share-a-run-title"><div class="share-story-panel"><div><div class="eyebrow">Stories by Friends</div><h2 id="share-a-run-title">Got a route worth sharing?</h2><p>Tell about a run you loved and share the route and a few photos.</p></div><a class="button button-green" href="${url(shareStoryPath)}">Share your Story</a></div></section>`;
}

export function renderShareStory({url, write, shell}) {
 const form = `<section class="section about-contact"><div class="about-contact-inner">
 <form id="friend-story-form" class="contact-form" method="post" data-share-story-endpoint="${esc(shareStoryEndpoint)}" data-clarity-mask="true">
 <label>First name <input name="firstName" autocomplete="given-name" maxlength="${fields.firstName}" required></label>
 <label>Last name <input name="lastName" autocomplete="family-name" maxlength="${fields.lastName}" required></label>
 <div class="friend-field"><label for="friend-email">Your email <input id="friend-email" name="email" type="email" autocomplete="email" maxlength="${fields.email}" aria-describedby="friend-email-privacy" required></label><small id="friend-email-privacy" class="friend-field-note">Your email stays private and is used to contact you about your submission.</small></div>
 <label>Destination (place and country) <input name="destination" maxlength="${fields.destination}" required></label>
 <label>Tell us about your run <textarea name="story" rows="7" maxlength="${fields.story}" required placeholder="What made this run worth sharing? Funny, awkward and unexpectedly lovely moments are welcome too."></textarea></label>
 <label>Route tips <textarea name="route" rows="4" maxlength="${fields.route}" required placeholder="Distance, surface, hills, safety or the best time to run"></textarea></label>
 <label>Know any local running clubs? (optional) <textarea name="clubs" rows="3" maxlength="${fields.clubs}" placeholder="Club names, when they meet, whether runs are free, and any useful links"></textarea></label>
 <div class="friend-field"><label for="friend-photos">Route photos (${minPhotos}–${maxPhotos}, up to 8 MB each) <input id="friend-photos" name="photos" type="file" multiple accept=".jpg,.jpeg,.png,.webp" aria-describedby="friend-photo-help" required></label><small id="friend-photo-help" class="friend-field-note">Choose photos that clearly show the running route or surface. Landscape photos work best. Please avoid selfies.</small></div>
 <fieldset aria-describedby="friend-route-help">
 <legend>How will you share your route? (required)</legend>
 <p class="contact-privacy" id="friend-route-help">If you already have a Google My Maps map, set sharing to “Anyone with the link” and paste the link below. If you don’t have a map, upload a GPX file. Runograph will use it to create a map under the Runograph name if your story is published.</p>
 <details class="contact-notice"><summary>How to import a GPX into Google My Maps</summary><ol>
 <li>On a computer, open <a href="https://mymaps.google.com/" target="_blank" rel="noopener noreferrer">Google My Maps</a> and create a new map.</li>
 <li>In the first layer, click <b>Import</b> and choose the GPX file.</li>
 <li>Click <b>Share</b> and allow anyone with the link to view it.</li>
 <li>Copy the sharing link into this form.</li>
 </ol></details>
 <label><input type="radio" name="routeSource" value="map" required style="display:inline-block;width:auto;margin:0 .5em 0 0">Share a Google My Maps link</label>
 <label><input type="radio" name="routeSource" value="gpx" style="display:inline-block;width:auto;margin:0 .5em 0 0">Upload a GPX file</label>
 <label>Google My Maps sharing link <input name="map" type="url" maxlength="${fields.map}" placeholder="https://www.google.com/maps/d/…"></label>
 <label>GPX file (up to 8 MB) <input name="gpx" type="file" accept=".gpx,application/gpx+xml"></label>
 <details class="contact-notice"><summary>Hide the exact start and finish of a loop (optional)</summary>
 <p>If the run started or ended at a private address, trim those access stretches first. Keep the public loop and move the GPX’s start and finish to a public point on it. You can ask AI to help and check the result on a map before sharing.</p>
 <blockquote>Keep the full public loop in this GPX. Trim any private approach and return stretches. Reorder the points so the loop starts and ends at a different public point on the recorded route. Remove timestamps and start or finish markers. Export a new GPX. If the remaining points can’t form a closed loop along the recorded route, flag the gap and leave it open.</blockquote>
 </details>
 </fieldset>
 <fieldset><legend>Links for your author credit (optional)</legend>
 <label>Instagram profile <input name="instagram" type="url" maxlength="${fields.instagram}" placeholder="https://www.instagram.com/yourname/"></label>
 <label>Facebook profile <input name="facebook" type="url" maxlength="${fields.facebook}" placeholder="https://www.facebook.com/yourname"></label>
 <label>Personal website <input name="website" type="url" maxlength="${fields.website}" placeholder="https://"></label>
 </fieldset>
 <fieldset aria-describedby="friend-ratings-help"><legend>Rate the run (1–10)</legend>
 <p class="contact-privacy" id="friend-ratings-help">Use a 10-point scale, where 1 is the lowest score and 10 is the highest. Add a short explanation for each of the four scores.</p>
 ${Object.entries(ratingFields).map(([key,label])=>`<div class="friend-rating"><label>${label} <input name="rating-${key}" type="number" min="1" max="10" step="1" inputmode="numeric" style="max-width:6rem" required></label><label>${label} explanation <input name="rating-${key}-explanation" maxlength="${maxRatingExplanation}" required pattern=".*\\S.*"></label></div>`).join('')}
 </fieldset>
 <p class="contact-privacy">Use photos you have permission to share. Check that your GPX file or map doesn’t show private locations.</p>
 <p class="contact-privacy" id="friend-submission-rules">${submissionRules}</p>
 <p class="contact-privacy" id="friend-advertising-rule">Advertising for companies, products or services requires a separate agreement. Contact <a href="mailto:runograph01@gmail.com">runograph01@gmail.com</a> about collaborations.</p>
 <label><input name="acceptedRules" type="checkbox" value="yes" required aria-describedby="friend-submission-rules friend-advertising-rule" style="display:inline-block;width:auto;margin:0 .5em 0 0;vertical-align:middle">I agree to the author credit and advertising rules.</label>
  <fieldset class="friend-quick-check"><legend>Quick check</legend><p id="friend-challenge-question" class="contact-privacy" aria-live="polite"></p><label for="friend-challenge-answer">Your answer <input id="friend-challenge-answer" name="quickAnswer" type="number" step="1" inputmode="numeric" required disabled aria-describedby="friend-challenge-question"></label><button type="button" class="button" id="friend-challenge-retry" hidden>Reload quick check</button></fieldset>
 <button class="button button-green" id="test-friend-form" type="submit" disabled>Send your story</button><p class="contact-status" id="friend-test-status" role="status"></p><p class="contact-privacy"><a href="${url('/privacy/')}">How we use your submission</a></p><noscript><p>Enable JavaScript to send your story and attachments.</p></noscript>
 </form></div></section>
 <script>
 const friendForm = document.getElementById('friend-story-form');
 function updateRouteFields() {
  const choice = friendForm.elements.routeSource.value;
  friendForm.elements.map.required = choice === 'map';
  friendForm.elements.gpx.required = choice === 'gpx';
 }
 friendForm.elements.routeSource.forEach(input => input.addEventListener('change', updateRouteFields));
 updateRouteFields();
 function updatePhotoValidity() {
  const photos = friendForm.elements.photos;
  const count = photos.files.length;
  photos.setCustomValidity(count < ${minPhotos} || count > ${maxPhotos} ? 'Choose ${minPhotos} to ${maxPhotos} photos of the route.' : '');
 }
 const tips = friendForm.elements.route;
 const updateRouteTips = () => tips.setCustomValidity(tips.value.trim() ? '' : 'Add your route tips.');
 tips.addEventListener('input', updateRouteTips);
 friendForm.elements.photos.addEventListener('change', updatePhotoValidity);
 updatePhotoValidity();
 </script>`;
 write(shareStoryPath, shell('en',shareStoryPath.slice(1),'Share your running story','Stories by Friends',
  `<section class="section page-heading"><div class="eyebrow">Stories by Friends</div><h1>Share your running story</h1></section>${form}`, {noindex:true}));
}
