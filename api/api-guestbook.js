
function clean(v,max=1200){return String(v||"").replace(/<[^>]*>/g,"").trim().slice(0,max)}
function cfg(){const url=process.env.SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY; return {url, headers:{apikey:key, Authorization:`Bearer ${key}`, "Content-Type":"application/json"}}}
export default async function handler(req,res){
  const {url,headers}=cfg();
  if(!url||!process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({error:"Supabase missing"});
  try{
    if(req.method==="GET"){
      const r=await fetch(`${url}/rest/v1/guestbook_entries?select=id,name,title,message,rating,created_at&order=created_at.desc`,{headers});
      const items=await r.json(); return res.status(200).json({items});
    }
    if(req.method==="POST"){
      const b=typeof req.body==="object"?req.body:JSON.parse(req.body||"{}");
      const name=clean(b.name,80); const title=clean(b.title,120); const message=clean(b.message,1200); const website=clean(b.website,200); const rating=Math.max(1,Math.min(5,Number(b.rating||5)));
      if(website) return res.status(200).json({ok:true});
      if(!name||!message) return res.status(400).json({error:"Pseudo et message obligatoires"});
      const r=await fetch(`${url}/rest/v1/guestbook_entries`,{method:"POST", headers:{...headers, Prefer:"return=representation"}, body:JSON.stringify([{name,title,message,rating}])});
      const rows=await r.json(); return res.status(200).json({ok:true, item:rows[0]});
    }
    if(req.method==="DELETE"){
      const id=req.query.id; if(!id) return res.status(400).json({error:"id manquant"});
      await fetch(`${url}/rest/v1/guestbook_entries?id=eq.${id}`,{method:"DELETE", headers});
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:"Method not allowed"});
  }catch(e){ return res.status(500).json({error:"Guestbook error"}); }
}
