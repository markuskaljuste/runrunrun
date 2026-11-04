export const signupConsentVersion='2026-11-04-v1';
export const signupConsentText='I agree to receive occasional Runograph emails about new stories and updates. I can unsubscribe at any time.';
export const validSignupEndpoint=value=>typeof value==='string'&&/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,200}\/exec$/.test(value);
export function validateNewsletter(value){
 if(!value||typeof value.enabled!=='boolean'||typeof value.appsScriptUrl!=='string')throw new Error('Check the email signup settings.');
 if(value.appsScriptUrl&&!validSignupEndpoint(value.appsScriptUrl))throw new Error('Use the deployed Google Apps Script web app URL ending in /exec.');
 if(value.enabled&&!value.appsScriptUrl)throw new Error('Connect the Google Sheets web app before enabling signups.');
}
