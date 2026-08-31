// /api/guestbook.js - V3.1 Anti-404 - memory + Supabase - table guestbook_entries + fallback guestbook
function clean(v,max=1200){return String(v||"").replace(/<[^>]*>/g,"").trim().slice(0,max)}
function cfg(){
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {url, key, hasSupabase:!!(url&&key), headers:{apikey:key, Authorization:`Bearer ${key}`, "Content-Type":"application/json"}}
}
let mem=[
  {id:"demo_1", name:"Furioz", title:"Datapad validé", message:"Holo-glass V3 incroyable ! Le nouveau setup PCB RGB déchire.", rating:5, created_at:new Date().toISOString()},
  {id:"demo_2", name:"Choom", title:"Black ICE esquivé", message:"404 stylée, on reste dans l'univers Netrunner. GG !", rating:5, created_at:new Date(Date.now()-86400000).toISOString()}
];

async function tryFetchTable(url, headers, table){
  try{
    const r=await fetch(`${url}/rest/v1/${table}?select=id,name,title,message,rating,created_at&order=created_at.desc&limit=100`,{headers});
    const text=await r.text();
    let items;
    try{ items=JSON.parse(text); }catch{ items=null; }
    if(Array.isArray(items)) return {ok:true, items, table};
    return {ok:false, raw:text, table};
  }catch(e){
    return {ok:false, error:e.message, table};
  }
}

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, Accept");
  if(req.method==="OPTIONS") return res.status(200).end();

  const {url, hasSupabase, headers} = cfg();

  if(!hasSupabase){
    if(req.method==="GET") return res.status(200).json({items:mem, source:"memory", message:"Supabase non configuré"});
    if(req.method==="POST"){
      try{
        const b=typeof req.body==="object"?req.body:JSON.parse(req.body||"{}");
        const name=clean(b.name,80); const title=clean(b.title,120); const message=clean(b.message,1200); const rating=Math.max(1,Math.min(5,Number(b.rating||5))); const website=clean(b.website,200);
        if(website) return res.status(200).json({ok:true, spam:true});
        if(!name||!message) return res.status(400).json({error:"Pseudo et message obligatoires"});
        const item={id:"mem_"+Date.now(), name, title, message, rating, created_at:new Date().toISOString()};
        mem.unshift(item);
        if(mem.length>200) mem=mem.slice(0,200);
        return res.status(200).json({ok:true, item, source:"memory"});
      }catch(e){ return res.status(200).json({ok:true, source:"memory_error", error:e.message, items:mem}); }
    }
    if(req.method==="DELETE"){
      const id=clean(req.query.id,200);

      if(!id){
        return res.status(400).json({
          ok:false,
          error:"id manquant"
        });
      }

      const before=mem.length;
      mem=mem.filter(i=>String(i.id)!==String(id));

      if(before===mem.length){
        return res.status(404).json({
          ok:false,
          error:"Avis introuvable",
          source:"memory"
        });
      }

      return res.status(200).json({
        ok:true,
        deleted:id,
        source:"memory"
      });
    }
    return res.status(405).json({error:"Method"});
  }

  try{
    if(req.method==="GET"){
      // try guestbook_entries then guestbook
      let result = await tryFetchTable(url, headers, "guestbook_entries");
      if(!result.ok){
        result = await tryFetchTable(url, headers, "guestbook");
      }
      if(result.ok) return res.status(200).json({items: result.items.length?result.items:mem, source:"supabase", table:result.table});
      return res.status(200).json({items:mem, source:"memory_fallback", warning:"Supabase fail, fallback mem", raw:result.raw});
    }
    if(req.method==="POST"){
      const b=typeof req.body==="object"?req.body:JSON.parse(req.body||"{}");
      const name=clean(b.name,80); const title=clean(b.title,120); const message=clean(b.message,1200); const rating=Math.max(1,Math.min(5,Number(b.rating||5))); const website=clean(b.website,200);
      if(website) return res.status(200).json({ok:true, spam:true});
      if(!name||!message) return res.status(400).json({error:"Pseudo et message obligatoires"});

      // try both tables
      let lastText="";
      for(const table of ["guestbook_entries","guestbook"]){
        const r=await fetch(`${url}/rest/v1/${table}`,{method:"POST", headers:{...headers, Prefer:"return=representation"}, body:JSON.stringify([{name,title,message,rating}])});
        const text=await r.text();
        lastText=text;
        let rows;
        try{ rows=JSON.parse(text); }catch{ rows=[]; }
        if(r.ok && rows[0]){
          return res.status(200).json({ok:true, item:rows[0], source:"supabase", table});
        }
      }
      // fallback mem
      const item={id:"mem_"+Date.now(), name, title, message, rating, created_at:new Date().toISOString(), supabase_error:lastText};
      mem.unshift(item);
      return res.status(200).json({ok:true, item, source:"memory_fallback", supabase_response:lastText});
    }
    if(req.method==="DELETE"){
      const id=clean(req.query.id,200);

      if(!id){
        return res.status(400).json({
          ok:false,
          error:"id manquant"
        });
      }

      let deleted=false;
      let lastError="";

      for(const table of ["guestbook_entries","guestbook"]){
        try{
          const r=await fetch(
            `${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
            {
              method:"DELETE",
              headers:{
                ...headers,
                Prefer:"return=representation"
              }
            }
          );

          const text=await r.text();

          let rows=[];
          try{
            rows=JSON.parse(text);
          }catch{}

          if(r.ok){
            if(Array.isArray(rows) && rows.length>0){
              deleted=true;
              break;
            }

            // Certains réglages Supabase renvoient 204 ou [] même si la ligne
            // a bien été supprimée. On vérifie donc si elle existe encore.
            const check=await fetch(
              `${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=id`,
              {headers}
            );

            const checkText=await check.text();

            let found=[];
            try{
              found=JSON.parse(checkText);
            }catch{}

            if(check.ok && Array.isArray(found) && found.length===0){
              deleted=true;
              break;
            }
          }else{
            lastError=text || `HTTP ${r.status}`;
          }
        }catch(error){
          lastError=error.message;
        }
      }

      const before=mem.length;
      mem=mem.filter(i=>String(i.id)!==String(id));

      if(before!==mem.length){
        deleted=true;
      }

      if(!deleted){
        return res.status(404).json({
          ok:false,
          error:"Avis introuvable ou suppression refusée",
          details:lastError
        });
      }

      return res.status(200).json({
        ok:true,
        deleted:id
      });
    }
    return res.status(405).json({error:"Method"});
  }catch(e){
    if(req.method==="GET") return res.status(200).json({items:mem, source:"memory_error_fallback", error:e.message});
    return res.status(200).json({ok:true, source:"memory_error_fallback", error:e.message, items:mem});
  }
}
