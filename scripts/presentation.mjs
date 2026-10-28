import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
async function available(port){return new Promise(resolve=>{const server=createServer();server.once('error',()=>resolve(false));server.listen(port,'127.0.0.1',()=>server.close(()=>resolve(true)));});}
if(!await available(3040)||!await available(3041)){
 console.log('Presentation ports are already in use. If ClubPulse is already running, open http://localhost:3040/#try. Close that presentation window before starting a second copy.');
 process.exitCode=1;
}else{
 console.log('Starting the local ClubPulse presentation. Keep this window open.');
 console.log('No Render, Atlas, email, or paid service is used. Temporary data resets when this window closes.');
 console.log('Local administrator: admin@clubpulse.local / local-preview-only');
 const env={...process.env,PORT:'3040',ISSUER_PORT:'3041',PUBLIC_ORIGIN:'http://localhost:3040',ISSUER_URL:'',MONGODB_URI:'',ISSUER_MONGODB_URI:'',NODE_ENV:'development',DEMO_MODE:'true',LOCAL_PRESENTATION:'true',ADMIN_EMAIL:'admin@clubpulse.local',ADMIN_PASSWORD:'local-preview-only',SESSION_SECRET:'',ISSUER_ADMIN_SECRET:''};
 const child=spawn(process.execPath,['server/index.js'],{cwd:root,env,stdio:['inherit','pipe','inherit']});let opened=false;
 child.stdout.on('data',chunk=>{process.stdout.write(chunk);if(!opened&&chunk.toString().includes('ClubPulse collector:')){opened=true;console.log('Ready: http://localhost:3040/#try');if(process.platform==='win32')spawn('cmd.exe',['/c','start','','http://localhost:3040/#try'],{windowsHide:true,stdio:'ignore'});}});
 child.on('error',error=>{console.error('Could not start the local presentation:',error.message);process.exitCode=1;});
 child.on('exit',code=>{process.exitCode=code||0;});
 process.on('SIGINT',()=>{child.kill();});
}
