
let cachedToken=null; let tokenExp=0;
async function getToken(id,secret){
  if(cachedToken && Date.now()<tokenExp) return cachedToken;
  const r=await fetch("https://id.twitch.tv/oauth2/token",{method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body:new URLSearchParams({client_id:id, client_secret:secret, grant_type:"client_credentials"})});
  const j=await r.json();
  cachedToken=j.access_token; tokenExp=Date.now()+(j.expires_in*1000)-60000; return cachedToken;
}
export default async function handler(req,res){
  try{
    const login=(req.query.login||"reddice_stream").trim();
    const clientId=process.env.TWITCH_CLIENT_ID;
    const secret=process.env.TWITCH_CLIENT_SECRET;
    if(!clientId||!secret) return res.status(500).json({error:"Missing env"});
    const token=await getToken(clientId,secret);
    const uRes=await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,{headers:{"Client-ID":clientId, Authorization:`Bearer ${token}`}});
    const uJ=await uRes.json();
    const user=uJ.data?.[0];
    if(!user) return res.status(404).json({error:"user not found"});
    // followers
    const fRes=await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`,{headers:{"Client-ID":clientId, Authorization:`Bearer ${token}`}});
    const fJ=await fRes.json();
    const followers=fJ.total||0;
    // subscribers needs broadcaster token - may fail, fallback
    let subscribers=0;
    try{
      const sRes=await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${user.id}`,{headers:{"Client-ID":clientId, Authorization:`Bearer ${token}`}});
      const sJ=await sRes.json();
      if(sJ.total!==undefined) subscribers=sJ.total;
    }catch{}
    res.setHeader("Cache-Control","s-maxage=120, stale-while-revalidate=300");
    return res.status(200).json({login, user_id:user.id, followers, subscribers, display_name:user.display_name});
  }catch(e){ return res.status(500).json({error:"stats failed", message:e.message}); }
}
