import os from 'node:os';
const original=os.userInfo;
os.userInfo=function(options){try{return original(options)}catch{return {uid:-1,gid:-1,username:process.env.USERNAME||'local',homedir:process.env.USERPROFILE||process.cwd(),shell:null}}};
await import('../node_modules/drizzle-kit/bin.cjs');
