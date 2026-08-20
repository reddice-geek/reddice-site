// /api/twitch-stats.js - V3.1 Anti-404 - ne renvoie jamais 500
let cachedToken=null; let tokenExp=0;
async function getToken(id,secret){
  if(cachedToken && Date.now()<tokenExp) return cachedToken;
  const r=await fetch("https://id.twitch.tv/oauth2/token",{method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body:new URLSearchParams({client_id:id, client_secret:secret, grant_type:"client_credentials"})});
  const j=await r.json();
  if(!j.access_token) throw new Error("no token "+JSON.stringify(j));
  cachedToken=j.access_token; tokenExp=Date.now()+(j.expires_in*1000)-60000; return cachedToken;
}
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Cache-Control","s-maxage=120, stale-while-revalidate=300");
  try{
    const login=(req.query.login||"reddice_stream").trim();
    const clientId=process.env.TWITCH_CLIENT_ID;
    const secret=process.env.TWITCH_CLIENT_SECRET;
    if(!clientId||!secret){
      return res.status(200).json({login, followers:0, subscribers:0, display_name:login, live:false, source:"no_env", message:"TWITCH env manquant"});
    }
    const token=await getToken(clientId,secret);
    const uRes=await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,{headers:{"Client-ID":clientId, Authorization:`Bearer ${token}`}});
    const uJ=await uRes.json();
    const user=uJ.data?.[0];
    if(!user) return res.status(200).json({login, followers:0, subscribers:0, error:"user not found", source:"not_found"});

    let followers=0;
    try{
      const fRes=await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`,{headers:{"Client-ID":clientId, Authorization:`Bearer ${token}`}});
      const fJ=await fRes.json();
      followers=fJ.total ?? 0;
    }catch{}

    let subscribers=0;
    try{
      const sRes=await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${user.id}`,{headers:{"Client-ID":clientId, Authorization:`Bearer ${token}`}});
      const sJ=await sRes.json();
      if(sJ.total!==undefined) subscribers=sJ.total;
    }catch{}

    return res.status(200).json({login, user_id:user.id, followers, subscribers, display_name:user.display_name, source:"twitch"});
  }catch(e){
    return res.status(200).json({login:"reddice_stream", followers:0, subscribers:0, error:e.message, source:"error_fallback"});
  }
}
