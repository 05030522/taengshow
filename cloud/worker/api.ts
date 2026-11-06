const json=(v:any,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function api(req:Request,env:any){
 if(!req.headers.get('oai-authenticated-user-id'))return json({error:'로그인이 필요합니다'},401);
 const u=new URL(req.url),db=env.DB;
 if(req.method!=='GET'&&req.headers.get('Origin')!==u.origin)return json({error:'요청 출처 오류'},403);
 try{
 if(u.pathname==='/api/archive'){
 if(req.method==='GET'){const row=await db.prepare('SELECT * FROM archive WHERE id=1').first();return json(row?{revision:row.revision,data:JSON.parse(row.body)}:{revision:0,data:null})}
 if(req.method==='POST'){
 if(Number(req.headers.get('Content-Length')||0)>1000000)return json({error:'기록이 너무 큽니다'},413);
 const raw=await req.text();if(raw.length>1000000)return json({error:'기록이 너무 큽니다'},413);
 const {revision,data}=JSON.parse(raw);if(!Number.isInteger(revision)||!data||!Array.isArray(data.items)||!Array.isArray(data.tastes)||data.items.length>3000||data.tastes.length>1000)return json({error:'기록 형식 오류'},400);
 const body=JSON.stringify(data),now=new Date().toISOString();
 const r=await db.prepare('INSERT INTO archive(id,revision,body,updated) VALUES(1,1,?,?) ON CONFLICT(id) DO UPDATE SET revision=archive.revision+1,body=excluded.body,updated=excluded.updated WHERE archive.revision=? RETURNING revision').bind(body,now,revision).first();
 if(!r)return json({error:'다른 기기에서 수정했습니다. 최신 기록을 확인해 주세요.'},409);
 const row=r;
 await db.batch([db.prepare('INSERT INTO backups(revision,body,created) VALUES(?,?,?)').bind(row.revision,body,now),db.prepare('DELETE FROM backups WHERE id NOT IN (SELECT id FROM backups ORDER BY id DESC LIMIT 50)')]);return json({revision:row.revision})}
 }
 if(u.pathname==='/api/backups'&&req.method==='GET')return json((await db.prepare('SELECT id,revision,created FROM backups ORDER BY id DESC LIMIT 50').all()).results);
 if(/^\/api\/backups\/\d+$/.test(u.pathname)&&req.method==='GET'){const row=await db.prepare('SELECT body FROM backups WHERE id=?').bind(Number(u.pathname.split('/').pop())).first();return row?json(JSON.parse(row.body)):json({},404)}
 if(u.pathname==='/api/photos'&&req.method==='POST'){
 const type=req.headers.get('Content-Type')||'';if(!['image/jpeg','image/png','image/webp'].includes(type))return json({error:'JPG·PNG·WebP만 지원해요'},400);
 const bytes=await req.arrayBuffer();if(bytes.byteLength>1500000)return json({error:'사진은 1.5MB 이하로 올려주세요'},413);
 const total=await db.prepare('SELECT COALESCE(SUM(size),0) AS size,COUNT(*) AS count FROM photos').first();if(total.size+bytes.byteLength>250000000||total.count>=1000)return json({error:'무료 운영용 사진 보관 한도에 도달했어요'},413);
 const id=crypto.randomUUID();await env.BUCKET.put(id,bytes,{httpMetadata:{contentType:type}});await db.prepare('INSERT INTO photos(id,size,type) VALUES(?,?,?)').bind(id,bytes.byteLength,type).run();return json({id})}
 if(/^\/api\/photos\/[a-f0-9-]+$/.test(u.pathname)&&req.method==='GET'){const obj=await env.BUCKET.get(u.pathname.split('/').pop());if(!obj)return json({},404);return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata.contentType,'Cache-Control':'private,max-age=3600','X-Content-Type-Options':'nosniff'}})}
 return json({},404);
 }catch(e){console.error(e);return json({error:'저장소 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.'},500)}
}
