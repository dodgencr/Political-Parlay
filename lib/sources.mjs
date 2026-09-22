import { unzipSync, strFromU8 } from 'fflate';

export const YEAR=2026;
export const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const now=()=>new Date().toISOString();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function request(url,options={}){
 const r=await fetch(url,{...options,signal:AbortSignal.timeout(25000),headers:{Accept:'application/json',...options.headers}});
 if(!r.ok)throw new Error(r.status===429?'Source rate limit reached. Saved records are unchanged; retry later.':`Source returned HTTP ${r.status}. Saved records are unchanged.`);
 return r;
}
export async function getRoster(previous=[],key='DEMO_KEY'){
 const url=`https://api.congress.gov/v3/member/FL?api_key=${encodeURIComponent(key)}&currentMember=true&limit=250&format=json`;
 const data=await(await request(url)).json();
 if(!Array.isArray(data.members)||data.members.length<2||data.members.length>30)throw new Error('Unexpected congressional roster; previous roster preserved.');
 const cross=await(await request('https://unitedstates.github.io/congress-legislators/legislators-current.json')).json();
 const members=data.members.map(m=>{const c=cross.find(x=>x.id.bioguide===m.bioguideId),old=previous.find(x=>x.id===m.bioguideId),parts=m.name.split(', ');return {id:m.bioguideId,name:parts.length>1?parts.slice(1).join(' ')+' '+parts[0]:m.name,lastName:parts[0],party:m.partyName,chamber:m.terms.item.at(-1).chamber.includes('Senate')?'Senate':'House',district:m.district??null,fecIds:c?.id.fec??old?.fecIds??[],website:c?.terms.at(-1).url??null};}).sort((a,b)=>b.chamber.localeCompare(a.chamber)||(a.district??0)-(b.district??0));
 return {members,syncedAt:now(),source:'https://www.congress.gov/members?q=%7B%22member-state%22%3A%22Florida%22%7D',mappingSource:'https://github.com/unitedstates/congress-legislators',coverage:'Currently serving members; district numbers reflect current seats, not future election boundaries.'};
}
export function fecFor(m){return m.fecIds.filter(id=>id.startsWith(m.chamber==='Senate'?'S':'H'));}
export function normalizeFinance(r){return {candidateId:r.candidate_id,receipts:Number(r.receipts??0),spent:Number(r.disbursements??0),cash:Number(r.cash_on_hand_end_period??r.last_cash_on_hand_end_period??0),debt:Number(r.debts_owed_by_committee??r.last_debts_owed_by_committee??0),individualItemized:Number(r.individual_itemized_contributions??0),committee:Number(r.other_political_committee_contributions??0),transfers:Number(r.transfers_from_other_authorized_committee??0),coverageStart:r.coverage_start_date,coverageEnd:r.coverage_end_date,source:`https://www.fec.gov/data/candidate/${r.candidate_id}/?cycle=${YEAR}&election_full=false`};}
export async function getCampaign(members,key='DEMO_KEY'){
 const url=new URL('https://api.open.fec.gov/v1/candidates/totals/');url.searchParams.set('api_key',key);url.searchParams.set('cycle',String(YEAR));url.searchParams.set('per_page','100');
 const ids=[...new Set(members.flatMap(fecFor))];if(!ids.length)throw new Error('No verified candidate identifiers available.');ids.forEach(id=>url.searchParams.append('candidate_id',id));
 const j=await(await request(url)).json();if(!Array.isArray(j.results))throw new Error('Unexpected FEC response.');
 const records=j.results.filter(r=>ids.includes(r.candidate_id)).map(normalizeFinance);
 // Candidate-search totals can omit sitting senators who are not on this cycle's ballot.
 for(const m of members.filter(m=>m.chamber==='Senate'&&!records.some(r=>fecFor(m).includes(r.candidateId))))for(const id of fecFor(m)){
  const d=await(await request(`https://api.open.fec.gov/v1/candidate/${id}/totals/?api_key=${encodeURIComponent(key)}&cycle=${YEAR}&election_full=false`)).json();
  for(const r of d.results??[])records.push(normalizeFinance(r));
 }
 if(!records.length)throw new Error('FEC returned no usable financial reports.');
 return {records,syncedAt:now(),year:YEAR,source:'https://www.fec.gov/data/browse-data/'};
}
export function parseTSV(t){const lines=t.replace(/^\uFEFF/,'').trim().split(/\r?\n/),headers=lines.shift().split('\t');return lines.map(l=>Object.fromEntries(l.split('\t').map((v,i)=>[headers[i],v])));}
async function zipIndex(url,suffix){const r=await request(url);const b=new Uint8Array(await r.arrayBuffer());if(b.length>15000000)throw new Error('Disclosure index exceeds safe import size.');const files=unzipSync(b,{filter:f=>f.name.endsWith(suffix)&&f.originalSize<20000000});const name=Object.keys(files).find(n=>n.endsWith(suffix));if(!name)throw new Error('Disclosure index format changed. Previous records preserved.');return parseTSV(strFromU8(files[name]));}
export async function getFinancial(members){
 const url=`https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${YEAR}FD.zip`,rows=await zipIndex(url,`${YEAR}FD.txt`),records=[];
 if(!rows[0]?.DocID)throw new Error('Financial index format changed.');
 for(const row of rows){const m=members.find(m=>m.chamber==='House'&&norm(m.lastName)===norm(row.Last)&&row.StateDst?.startsWith('FL')&&norm(m.name).split(' ').includes(norm(row.First).split(' ')[0]));if(!m)continue;
  const type=row.FilingType;records.push({memberId:m.id,id:row.DocID,kind:type==='P'?'Stock transaction report':type==='A'?'Annual financial disclosure':type==='X'?'Extension request':type==='C'?'Candidate disclosure':type==='T'?'Termination disclosure':type==='W'?'Withdrawal':'Financial filing',type,date:row.FilingDate,year:Number(row.Year),source:`https://disclosures-clerk.house.gov/public_disc/${type==='P'?'ptr-pdfs':'financial-pdfs'}/${row.Year}/${row.DocID}.pdf`});
 }
 return {records,syncedAt:now(),year:YEAR,source:url,coverage:'House filing index only. Values remain in source documents. Senate disclosures require review in the Senate portal.'};
}
export function sameName(value,m){const n=' '+norm(value)+' ',last=norm(m.lastName);if(!n.includes(' '+last+' '))return false;const aliases={S001214:['greg','gregory'],D000628:['neal'],B001257:['gus'],G000593:['carlos'],W000808:['frederica'],M001199:['brian'],L000597:['laurel']};return (aliases[m.id]??[norm(m.name).split(' ')[0]]).some(f=>n.includes(' '+f+' '));}
export async function getTravel(members){
 const url=`https://disclosures-clerk.house.gov/public_disc/gift-pdfs/${YEAR}Travel.zip`,rows=await zipIndex(url,`${YEAR}Travel.txt`),records=[];
 if(!rows[0]?.MemberName)throw new Error('Travel index format changed.');
 for(const r of rows){const m=members.find(m=>m.chamber==='House'&&r.State==='FL'&&sameName(r.MemberName,m));if(!m)continue;records.push({memberId:m.id,id:r.DocID,traveler:r.FilerName,memberTrip:sameName(r.FilerName,m),sponsor:r.TravelSponsor,destination:r.Destination,start:r.DepartureDate,end:r.ReturnDate,kind:r.FilingType,source:`/api/travel?id=${r.DocID}`});}
 return {records,syncedAt:now(),year:YEAR,source:url,coverage:'House member and staff filings posted in 2026; travel may occur in an earlier year. Costs are not totaled. Amendments remain separate documents.'};
}
export function parseLobbying(reports,m){
 // Choose the latest original/amended filing for each filer and half-year.
 const latest=new Map();for(const f of reports){const k=[f.registrant?.id,f.lobbyist?.id??'org',f.filing_year,f.filing_period].join(':');const old=latest.get(k);if(!old||f.dt_posted>old.dt_posted)latest.set(k,f);}
 const records=[];
 for(const f of latest.values())for(const [i,c] of (f.contribution_items??[]).entries()){
  const honoree=sameName(c.honoree_name,m),payee=sameName(c.payee_name,m);if(!honoree&&!payee)continue;
  records.push({id:f.filing_uuid+':'+i,memberId:m.id,date:c.date,amount:Number(c.amount),contributor:c.contributor_name,payee:c.payee_name,honoree:c.honoree_name,kind:c.contribution_type_display,type:c.contribution_type,registrant:f.registrant?.name,registrantId:f.registrant?.id,lobbyist:f.lobbyist?[f.lobbyist.first_name,f.lobbyist.last_name].filter(Boolean).join(' '):null,posted:f.dt_posted,source:f.filing_document_url,match:honoree?'Named honoree':'Named payee',sources:[f.filing_document_url]});
 }
 // Identical disclosures from a lobbyist and their firm are one display record,
 // retaining all source links. Do not use these records for a grand money total.
 const dedup=new Map();for(const r of records){const k=[r.date,r.amount,norm(r.contributor),norm(r.payee),norm(r.honoree),r.type].join('|');const old=dedup.get(k);if(old){old.sources=[...new Set([...old.sources,...r.sources])];}else dedup.set(k,r);}
 return [...dedup.values()].sort((a,b)=>b.date.localeCompare(a.date)||b.amount-a.amount);
}
export async function getLobbying(member,{wait=4200,key=''}={}){
 const reports=new Map();let truncated=false,reportCount=0;
 for(const filter of ['contribution_honoree','contribution_payee']){
  let u=new URL('https://lda.gov/api/v1/contributions/');u.searchParams.set('filing_year',String(YEAR));u.searchParams.set(filter,({S001214:'Greg Steube',D000628:'Neal Dunn',B001257:'Gus Bilirakis',G000593:'Carlos Gimenez',W000808:'Frederica Wilson',M001199:'Brian Mast',L000597:'Laurel Lee'}[member.id]??(member.name.split(' ')[0]+' '+member.lastName)));u.searchParams.set('page_size','100');u.searchParams.set('ordering','-dt_posted');
  for(let page=0;u&&page<4;page++){
   if(wait)await delay(wait);
   const j=await(await request(u.toString(),{headers:key?{Authorization:`Token ${key}`}:{}})).json();
   if(!Array.isArray(j.results))throw new Error('Unexpected lobbying response.');
   reportCount+=j.results.length;j.results.forEach(f=>reports.set(f.filing_uuid,f));
   if(j.next&&new URL(j.next).origin!=='https://lda.gov')throw new Error('Unexpected pagination host.');
   u=j.next?new URL(j.next):null;if(u&&page===3)truncated=true;
  }
 }
 return {records:parseLobbying([...reports.values()],member),syncedAt:now(),year:YEAR,truncated,reportCount,source:`https://lda.gov/filings/public/contribution/search/?report_year=${YEAR}&contribution_honoree=${encodeURIComponent(member.lastName)}&search=search`,coverage:'Name-matched 2026 LD-203 honoree and payee records. Not a complete accounting of influence or personal income. Name matching can miss aliases; inspect the original filing.'};
}



