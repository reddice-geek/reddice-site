
function clean(v,max=1200){return String(v||"").replace(/<[^>]*>/g,"").trim().slice(0,max)}
function cfg(){const url=process.env.SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY; return {url, key, headers:{apikey:key, Authorization:`Bearer ${key}`, "Content-Type":"application/json"}}}
let memoryFallback=[]; // in-memory fallback if Supabase not configured (dev mode)

export default async function handler(req,res){
  const {url,key,headers}=cfg();
  const hasSupabase = !!(url && key);

  // If no Supabase, use in-memory + try to persist to /tmp (Vercel temp)
  if(!hasSupabase){
    if(req.method==="GET"){
      return res.status(200).json({items: memoryFallback});
    }
    if(req.method==="POST"){
      try{
        const b=typeof req.body==="object"?req.body:JSON.parse(req.body||"{}");
        const name=clean(b.name,80); const title=clean(b.title,120); const message=clean(b.message,1200); const website=clean(b.website,200); const rating=Math.max(1,Math.min(5,Number(b.rating||5)));
        if(website) return res.status(200).json({ok:true});
        if(!name||!message) return res.status(400).json({error:"Pseudo et message obligatoires"});
        const item={id:"mem_"+Date.now(), name, title, message, rating, created_at:new Date().toISOString()};
        memoryFallback.unshift(item);
        if(memoryFallback.length>100) memoryFallback=memoryFallback.slice(0,100);
        return res.status(200).json({ok:true, item});
      }catch(e){ return res.status(500).json({error:"Guestbook fallback error"}); }
    }
    if(req.method==="DELETE"){
      const id=req.query.id;
      memoryFallback=memoryFallback.filter(i=>i.id!==id);
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:"Method not allowed"});
  }

  try{
    if(req.method==="GET"){
      const r=await fetch(`${url}/rest/v1/guestbook_entries?select=id,name,title,message,rating,created_at&order=created_at.desc&limit=100`,{headers});
      const items=await r.json(); 
      if(!Array.isArray(items)) return res.status(200).json({items: memoryFallback});
      return res.status(200).json({items});
    }
    if(req.method==="POST"){
      const b=typeof req.body==="object"?req.body:JSON.parse(req.body||"{}");
      const name=clean(b.name,80); const title=clean(b.title,120); const message=clean(b.message,1200); const website=clean(b.website,200); const rating=Math.max(1,Math.min(5,Number(b.rating||5)));
      if(website) return res.status(200).json({ok:true});
      if(!name||!message) return res.status(400).json({error:"Pseudo et message obligatoires"});
      const r=await fetch(`${url}/rest/v1/guestbook_entries`,{method:"POST", headers:{...headers, Prefer:"return=representation"}, body:JSON.stringify([{name,title,message,rating}])});
      const rows=await r.json(); 
      if(!r.ok) throw new Error("Supabase insert failed");
      return res.status(200).json({ok:true, item:rows[0]});
    }
    if(req.method==="DELETE"){
      const id=req.query.id; if(!id) return res.status(400).json({error:"id manquant"});
      await fetch(`${url}/rest/v1/guestbook_entries?id=eq.${id}`,{method:"DELETE", headers});
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:"Method not allowed"});
  }catch(e){ 
    // fallback to memory on error
    if(req.method==="GET") return res.status(200).json({items: memoryFallback});
    return res.status(500).json({error:"Guestbook error"}); 
  }
}
