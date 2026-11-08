import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {root} from './core.mjs';

const config=JSON.parse(readFileSync(resolve(root,'.pages.yml'),'utf8'));
const choices=field=>(field.options?.values??[]).map(option=>String(typeof option==='object'?(option.value??option.name??''):option));

function validateFields(fields,record,path){
 for(const field of fields??[]){
  const value=record?.[field.name],key=path+'.'+field.name;
  if(value==null||value==='')continue;
  const values=field.list?(assert(Array.isArray(value),'CMS list must be an array: '+key),value):[value];
  for(const [index,item] of values.entries()){
   const itemPath=field.list?key+'['+index+']':key;
   if(field.type==='object')validateFields(field.fields,item,itemPath);
   else if(field.type==='select'){
    const selected=field.options?.multiple?(assert(Array.isArray(item),'CMS select must be an array: '+itemPath),item):[item];
    for(const selection of selected)assert(choices(field).includes(String(selection)),'Invalid CMS option at '+itemPath+': '+selection);
   }
  }
 }
}

for(const group of config.content){
 const paths=group.type==='collection'
  ?readdirSync(resolve(root,group.path)).filter(name=>name.endsWith('.json')).map(name=>resolve(root,group.path,name))
  :[resolve(root,group.path)];
 for(const path of paths)validateFields(group.fields,JSON.parse(readFileSync(path,'utf8')),path.slice(root.length+1));
}

const posts=config.content.find(group=>group.name==='posts');
const mapField=posts.fields.find(field=>field.name==='routeMap').fields.find(field=>field.name==='mapId');
const mapIds=readdirSync(resolve(root,'public/assets/maps')).filter(name=>name.endsWith('.json')).map(name=>name.slice(0,-5));
function validateMapChoices(field){
 const ids=choices(field);
 assert.equal(ids.length,new Set(ids).size,'Duplicate CMS map choices.');
 for(const id of mapIds)assert(ids.includes(id),'Prepared map is missing from CMS choices: '+id);
 for(const id of ids)assert(mapIds.includes(id),'CMS map choice has no prepared map: '+id);
}
validateMapChoices(mapField);

// A missing nested option caused Pages CMS to refuse Save without a useful message.
const incomplete=structuredClone(mapField);
incomplete.options.values=incomplete.options.values.slice(1);
assert.throws(()=>validateMapChoices(incomplete),/missing from CMS choices/);
assert.throws(()=>validateFields(posts.fields,{routeMap:{mapId:'unknown-map'}},'test'),/Invalid CMS option at test.routeMap.mapId/);
const translations=posts.fields.find(field=>field.name==='translations');
assert.throws(()=>validateFields([translations],{translations:[{language:'unknown-language'}]},'test'),/Invalid CMS option at test.translations\[0\].language/);
console.log('Passed CMS choices: all content select values and '+mapIds.length+' prepared maps match the editing form; nested invalid choices are caught before publishing.');

