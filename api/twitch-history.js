// /api/twitch-history.js - V3.1 Anti-404 - toujours 200
let cachedToken=null; let tokenExp=0;
async function getToken(id,secret){
  if(cachedToken && Date.now()<tokenExp) return cachedToken;
  const r=await fetch("https://id.twitch.tv/oauth2/token",{method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body:new URLSearchParams({client_id:id, client_secret:secret, grant_type:"client_credentials"})});
  const j=await r.json();
  if(!j.access_token) throw new Error("No token: "+JSON.stringify(j));
  cachedToken=j.access_token; tokenExp=Date.now()+(j.expires_in*1000)-60000; return cachedToken;
}
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=300");
  try{
    const login=(req.query.login||"reddice_stream").trim();
    const clientId=process.env.TWITCH_CLIENT_ID;
    const secret=process.env.TWITCH_CLIENT_SECRET;
    if(!clientId||!secret){
      return res.status(200).json({items:[], count:0, login, source:"no_env", message:"TWITCH_CLIENT_ID/SECRET manquant dans Vercel ENV - active la conservation des VOD dans Twitch Dashboard > Diffusion"});
    }
    const token=await getToken(clientId,secret);
    const uRes=await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,{headers:{"Client-ID":clientId, Authorization:`Bearer ${token}`}});
    const uJ=await uRes.json();
    const user=uJ.data?.[0];
    if(!user) return res.status(200).json({items:[], count:0, login, source:"user_not_found", error:`User ${login} not found`});

    const vRes=await fetch(`https://api.twitch.tv/helix/videos?user_id=${user.id}&type=archive&first=20&sort=time`,{headers:{"Client-ID":clientId, Authorization:`Bearer ${token}`}});
    const vJ=await vRes.json();
    if(!vRes.ok){
      return res.status(200).json({items:[], count:0, login, source:"twitch_error", error:"Twitch videos API fail", details:vJ});
    }
    const items=(vJ.data||[]).map(v=>({
      id:v.id, title:v.title||"Stream", created_at:v.created_at, url:v.url,
      thumbnail_url:(v.thumbnail_url||"").replace("%{width}","640").replace("%{height}","360"),
      duration:v.duration, view_count:v.view_count||0
    }));
    return res.status(200).json({
      user_id:user.id, login, count:items.length, items, source:"twitch",
      debug: items.length===0 ? "Aucune VOD retournée. Vérifie Dashboard > Paramètres > Diffusion > Conserver les diffusions passées (activé) + VOD supprimées après 7j (affilié) / 60j (partner)." : "OK"
    });
  }catch(e){
    return res.status(200).json({items:[], count:0, source:"error_fallback", error:e.message});
  }
}
