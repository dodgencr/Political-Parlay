import {readData} from '@/lib/storage';
export async function GET(){return Response.json(await readData(),{headers:{'Cache-Control':'no-store'}});}
