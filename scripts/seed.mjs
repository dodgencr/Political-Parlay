import fs from 'node:fs/promises';
import {getRoster,getCampaign,getFinancial,getTravel,getLobbying} from '../lib/sources.mjs';
const path=new URL('../app/data/seed.json',import.meta.url);
let data={};try{data=JSON.parse(await fs.readFile(path,'utf8'));}catch{}
async function save(key,fn){try{const d=await fn();data[key]=d;await fs.writeFile(path,JSON.stringify(data));console.log(key, 'OK',d.records?.length??d.members?.length);}catch(e){console.log(key,'ERROR',e.message);}}
const phase=process.argv[2]??'all';
if(phase==='all'||phase==='core'){
 await save('roster',()=>getRoster(data.roster?.members??[]));
 const members=data.roster.members;
 for(const [k,f] of [['campaign',getCampaign],['financial',getFinancial],['travel',getTravel]])await save(k,()=>f(members));
}
if(phase==='all'||phase==='lobbying')for(const m of data.roster.members){if(data['lda:'+m.id]&&!process.argv.includes('--force'))continue;await save('lda:'+m.id,()=>getLobbying(m));}

