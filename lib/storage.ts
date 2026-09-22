import {env} from 'cloudflare:workers';
import seed from '@/app/data/seed.json';
export async function readData(){
 const data:Record<string,any>={...seed};
 try{const result=await env.DB!.prepare("SELECT key, payload FROM snapshots WHERE key NOT LIKE 'votes:%'").all<{key:string,payload:string}>();for(const row of result.results)data[row.key]=JSON.parse(row.payload);return {data,persistent:true};}catch{return {data,persistent:false};}
}
export async function saveData(key:string,value:unknown){await env.DB!.prepare('INSERT INTO snapshots (key,payload,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind(key,JSON.stringify(value),new Date().toISOString()).run();}

