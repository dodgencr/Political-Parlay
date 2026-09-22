import {readData} from '@/lib/storage';
export async function GET(req:Request){
 const id=new URL(req.url).searchParams.get('id');
 const {data}=await readData();const record=data.travel?.records.find((r:any)=>r.id===id);
 if(!record)return new Response('Unknown travel disclosure.',{status:404});
 // The Clerk index omits the MT/ST archive designation. Check both official paths.
 for(const kind of (record.memberTrip?['MT','ST']:['ST','MT'])){
  const url=`https://disclosures-clerk.house.gov/gtimages/${kind}/${data.travel.year}/${record.id}.pdf`;
  try{const response=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(10000)});if(response.ok&&response.headers.get('content-type')?.includes('pdf'))return Response.redirect(url,302);}catch{}
 }
 return new Response('This document could not be retrieved from the House archive. Search by member and document number at https://disclosures-clerk.house.gov/GiftTravelFilings',{status:503});
}
