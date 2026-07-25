let cachedToken=null; let tokenExp=0;
async function getToken(id,secret){
  if(cachedToken && Date.now()<tokenExp) return cachedToken;
  const r=await fetch("https://id.twitch.tv/oauth2/token",{method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body:new URLSearchParams({client_id:id, client_secret:secret, grant_type:"client_credentials"})});
  const j=await r.json();
  if(!j.access_token) throw new Error("No token: "+JSON.stringify(j));
  cachedToken=j.access_token; 
  tokenExp=Date.now() + (j.expires_in*1000) - 60000;
  return cachedToken;
}

export default async function handler(req,res){
  try{
    const login=(req.query.login||"reddice_stream").trim();
    const clientId=process.env.TWITCH_CLIENT_ID;
    const secret=process.env.TWITCH_CLIENT_SECRET;
    if(!clientId||!secret) return res.status(500).json({error:"Missing TWITCH_CLIENT_ID / SECRET in Vercel env"});

    const token=await getToken(clientId,secret);

    // 1. get user
    const uRes=await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,{
      headers:{"Client-ID":clientId, Authorization:`Bearer ${token}`}
    });
    const uJ=await uRes.json();
    if(!uRes.ok) return res.status(500).json({error:"Twitch users API fail", details:uJ});
    const user=uJ.data?.[0];
    if(!user) return res.status(404).json({error:`User ${login} not found`});

    // 2. get archives
    const vRes=await fetch(`https://api.twitch.tv/helix/videos?user_id=${user.id}&type=archive&first=20&sort=time`,{
      headers:{"Client-ID":clientId, Authorization:`Bearer ${token}`}
    });
    const vJ=await vRes.json();
    if(!vRes.ok) return res.status(500).json({error:"Twitch videos API fail", details:vJ});

    const items=(vJ.data||[]).map(v=>({
      id:v.id,
      title:v.title||"Stream",
      created_at:v.created_at,
      url:v.url,
      thumbnail_url:(v.thumbnail_url||"").replace("%{width}","640").replace("%{height}","360"),
      duration:v.duration,
      view_count:v.view_count||0
    }));

    res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({
      user_id:user.id,
      login,
      count:items.length,
      debug: items.length===0 ? "Aucune VOD retournée. Vérifie sur Twitch Dashboard > Paramètres > Diffusion > Conserver les diffusions passées (activé) + Twitch supprime les VOD après 7j (affilié) / 60j (partner) si non mises en avant." : "OK",
      items
    });

  }catch(e){
    console.error("twitch-history error", e);
    return res.status(500).json({error:"history failed", message:e.message});
  }
}
