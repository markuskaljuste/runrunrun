import {esc} from './core.mjs';

// Separate onboarding thread: story comments stay locked until provider moderation is confirmed.
export function commentsSetup({data}){
 const key=data.engagement.comments.remarkboxKey;
 if(!key)return '';
 return `<section class="section page-heading"><h1>Kommentaaride seadistamine</h1><div class="prose"><p>See leht ühendab Runographi sinu Remarkboxi kontoga. Lugude kommentaarid jäävad suletuks, kuni eelnev kinnitamine on Remarkboxis sisse lülitatud.</p><ol><li>Logi samas brauseris oma Remarkboxi kontole sisse.</li><li>Vajuta allpool „Laadi Remarkbox”.</li><li>Ava uuesti Remarkboxi seadistus ning lõpeta runograph.com ühendamine.</li><li>Lülita Namespace Settings all sisse „Enable Moderation” ja salvesta.</li></ol><p><a href="https://my.remarkbox.com/setup" target="_blank" rel="noopener noreferrer">Ava Remarkboxi seadistus</a></p><p>Kui eelnev kinnitamine on sisse lülitatud, anna sellest teada. Seejärel saab kommentaarid lugude all avada.</p><section class="comments-section" aria-labelledby="comments-setup-heading"><h2 id="comments-setup-heading">Remarkboxi ühendus</h2><button type="button" class="button button-green" data-load-comments data-comment-key="${esc(key)}" data-comment-url="${esc(data.engagement.publicOrigin+'/comment-setup/')}" data-comment-title="Runograph comment setup">Laadi Remarkbox</button><p class="comments-status" role="status" aria-live="polite"></p><div class="comments-mount"></div></section></div></section>`;
}
