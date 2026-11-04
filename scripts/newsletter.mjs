import {esc} from './core.mjs';
import {signupConsentText,signupConsentVersion,validSignupEndpoint} from './newsletter-config.mjs';
export function renderSignup({data,preview=false}){
 const config=data.engagement.newsletter,ready=config.enabled&&validSignupEndpoint(config.appsScriptUrl);
 if(!ready&&!preview)return '';
 return `<section class="signup" aria-label="Join the Runograph waitlist"><form data-signup data-endpoint="${ready?esc(config.appsScriptUrl):''}" data-consent-version="${signupConsentVersion}"><fieldset${ready?'':' disabled'}><label class="signup-label" for="signup-email">Your email</label><div class="signup-fields"><input id="signup-email" name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" placeholder="Your email" required><button type="submit">Join the waitlist</button></div><label class="signup-consent"><input type="checkbox" name="consent" value="yes" required><span>${esc(signupConsentText)}</span></label><label class="signup-trap" aria-hidden="true">Leave this empty<input name="website" type="text" tabindex="-1" autocomplete="off"></label></fieldset><p class="signup-status" role="status" aria-live="polite"></p></form><noscript><p class="signup-status">Please enable JavaScript to join the waitlist.</p></noscript></section>`;
}
