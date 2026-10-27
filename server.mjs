import http from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
const root = import.meta.dirname;
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.mp4':'video/mp4'};
http.createServer(async (req,res)=>{
 try {
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname.startsWith('/assets/')?'/public'+pathname:pathname));
 if(!file.startsWith(root+path.sep)||pathname.split('/').some(p=>p.startsWith('.'))){res.writeHead(403).end();return;}
 const info=await stat(file);if(!info.isFile())throw Error();
 const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream'};
 const range=req.headers.range;
 if(range && file.endsWith('.mp4')){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m){res.writeHead(416).end();return;}const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),info.size-1):info.size-1;if(start>end){res.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();return;}res.writeHead(206,{...headers,'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${info.size}`,'Content-Length':end-start+1});createReadStream(file,{start,end}).pipe(res);}
 else {res.writeHead(200,{...headers,'Content-Length':info.size});res.end(await readFile(file));}
 }catch{res.writeHead(404).end('Not found');}
}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Keep the Horses Safe listening on port '+(process.env.PORT||3000)));
