import {readData,saveData} from '@/lib/storage';
import {getRoster,getCampaign,getFinancial,getTravel,getLobbying} from '@/lib/sources.mjs';
export async function POST(req:Request){
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'Cross-site updates are not allowed.'},{status:403});
 let body:any;try{body=await req.json();}catch{return Response.json({error:'Invalid request.'},{status:400});}
 const {source,memberId}=body??{};
 if(!['roster','campaign','financial','travel','lobbying'].includes(source))return Response.json({error:'Unknown source.'},{status:400});
 const {data,persistent}=await readData();if(!persistent)return Response.json({error:'The saved-record database is unavailable. Existing records are preserved.'},{status:503});
 const members=data.roster.members,member=members.find((m:any)=>m.id===memberId);
 if(source==='lobbying'&&!member)return Response.json({error:'Select a current Florida member.'},{status:400});
 const key=source==='lobbying'?'lda:'+memberId:source;
 try{
  const value=source==='roster'?await getRoster(members):source==='campaign'?await getCampaign(members):source==='financial'?await getFinancial(members):source==='travel'?await getTravel(members):await getLobbying(member);
  await saveData(key,value);return Response.json({key,value});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Source could not be synchronized. Saved records are unchanged.'},{status:502});}
}

