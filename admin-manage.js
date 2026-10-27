const clean = (v,n=2000)=>String(v??'').trim().slice(0,n);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const secret=process.env.ADMIN_PASSWORD;
 if(!secret) return res.status(503).json({error:'ADMIN_PASSWORD manquant dans Vercel'});
 if(req.headers.authorization!==`Bearer ${secret}`) return res.status(401).json({error:'Accès refusé'});
 const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) return res.status(503).json({error:'Configurer SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour un stockage permanent'});
 const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
 const type=clean(req.query.type,20);
 const tables={planning:'stream_planning',contacts:'contact_messages',avis:'guestbook_entries'};
 const table=tables[type];
 if(!table)return res.status(400).json({error:'Section inconnue'});
 try{
  if(req.method==='GET'){
   const r=await fetch(`${url}/rest/v1/${table}?select=*&order=created_at.desc&limit=200`,{headers});
   const data=await r.json();
   if(!r.ok) return res.status(r.status).json({error:JSON.stringify(data)});
   return res.json({items:data});
  }
  if(type==='planning' && ['POST','PATCH'].includes(req.method)){
   const b=req.body||{};
   const payload={title:clean(b.title,160),start_at:clean(b.start_at,40),game:clean(b.game,120),description:clean(b.description,2000)};
   if(!payload.title||!/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(payload.start_at))return res.status(400).json({error:'Titre et date obligatoires'});
   const id=clean(req.query.id,100);
   if(req.method==='PATCH'&&!id)return res.status(400).json({error:'ID manquant'});
   const r=await fetch(`${url}/rest/v1/${table}${req.method==='PATCH'?`?id=eq.${encodeURIComponent(id)}`:''}`,{method:req.method,headers:{...headers,Prefer:'return=representation'},body:JSON.stringify(req.method==='POST'?[payload]:payload)});
   const data=await r.json();return res.status(r.status).json(r.ok?{ok:true,items:data}:{error:JSON.stringify(data)});
  }
  if(req.method==='DELETE' && ['planning','avis','contacts'].includes(type)){
   const id=clean(req.query.id,100);if(!id)return res.status(400).json({error:'ID manquant'});
   const r=await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers});
   if(!r.ok)return res.status(r.status).json({error:await r.text()});return res.json({ok:true});
  }
  return res.status(405).json({error:'Méthode interdite'});
 }catch(e){return res.status(500).json({error:e.message});}
}
