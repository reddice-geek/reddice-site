
function clean(v,max=2000){return String(v||"").replace(/<[^>]*>/g,"").trim().slice(0,max)}
function cfg(){const url=process.env.SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY; return {url, key, headers:{apikey:key, Authorization:`Bearer ${key}`, "Content-Type":"application/json"}}}
let mem=[];

export default async function handler(req,res){
  const {url,key,headers}=cfg();
  const hasSupabase=!!(url&&key);
  if(!hasSupabase){
    if(req.method==="GET") return res.status(200).json({items:mem});
    if(req.method==="POST"){
      try{
        const b=typeof req.body==="object"?req.body:JSON.parse(req.body||"{}");
        const name=clean(b.name,80); const email=clean(b.email,120); const subject=clean(b.subject,140); const message=clean(b.message,2000); const website=clean(b.website,200);
        if(website) return res.status(200).json({ok:true});
        if(!name||!email||!message) return res.status(400).json({error:"Champs requis"});
        const item={id:"mem_"+Date.now(), name, email, subject, message, created_at:new Date().toISOString()};
        mem.unshift(item);
        return res.status(200).json({ok:true, item});
      }catch{return res.status(500).json({error:"error"})}
    }
    return res.status(405).json({error:"Method"});
  }
  try{
    if(req.method==="GET"){
      const r=await fetch(`${url}/rest/v1/contact_messages?select=id,name,email,subject,message,created_at&order=created_at.desc&limit=100`,{headers});
      const items=await r.json();
      if(!Array.isArray(items)) return res.status(200).json({items:mem});
      return res.status(200).json({items});
    }
    if(req.method==="POST"){
      const b=typeof req.body==="object"?req.body:JSON.parse(req.body||"{}");
      const name=clean(b.name,80); const email=clean(b.email,120); const subject=clean(b.subject,140); const message=clean(b.message,2000); const website=clean(b.website,200);
      if(website) return res.status(200).json({ok:true});
      if(!name||!email||!message) return res.status(400).json({error:"Champs requis"});
      const r=await fetch(`${url}/rest/v1/contact_messages`,{method:"POST", headers:{...headers, Prefer:"return=representation"}, body:JSON.stringify([{name,email,subject,message}])});
      const rows=await r.json();
      if(!r.ok) throw new Error("insert fail");
      return res.status(200).json({ok:true, item:rows[0]});
    }
    return res.status(405).json({error:"Method"});
  }catch(e){ if(req.method==="GET") return res.status(200).json({items:mem}); return res.status(500).json({error:"contact error"}); }
}
