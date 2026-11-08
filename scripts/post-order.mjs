// The calendar date controls publication order; time resolves stories from the same day.
export function validPublicationTime(value){
 return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&Number.isFinite(Date.parse(value));
}
export function comparePostDates(a,b){
 const time=post=>validPublicationTime(post.publishedAt)?Date.parse(post.publishedAt):0;
 return b.date.localeCompare(a.date)||time(b)-time(a)||a.slug.localeCompare(b.slug);
}
