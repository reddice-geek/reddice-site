// /api/twitch-status.js - V3.1 Anti-404 - toujours 200
let cachedToken=null; let tokenExp=0;
async function getToken(clientId, secret){
  if(cachedToken && Date.now()<tokenExp) return cachedToken;
  const r=await fetch("https://id.twitch.tv/oauth2/token",{method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body:new URLSearchParams({client_id:clientId, client_secret:secret, grant_type:"client_credentials"})});
  const j=await r.json();
  if(!j.access_token) throw new Error("no token");
  cachedToken=j.access_token; tokenExp=Date.now()+(j.expires_in*1000)-60000; return cachedToken;
}
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Cache-Control","s-maxage=30, stale-while-revalidate=60");
  try{
    const login=(req.query.login||"reddice_stream").trim();
    const clientId=process.env.TWITCH_CLIENT_ID;
    const secret=process.env.TWITCH_CLIENT_SECRET;
    if(!clientId||!secret){
      return res.status(200).json({live:false, viewer_count:0, title:null, game_name:null, source:"no_env", message:"TWITCH env manquant"});
    }
    const token=await getToken(clientId, secret);
    const r=await fetch(`https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(login)}`,{headers:{"Client-ID":clientId, Authorization:`Bearer ${token}`}});
    const j=await r.json();
    const stream=j.data?.[0]||null;
    return res.status(200).json({live:!!stream, title:stream?.title||null, game_name:stream?.game_name||null, viewer_count:stream?.viewer_count||0, source:"twitch"});
  }catch(e){
    return res.status(200).json({live:false, viewer_count:0, title:null, game_name:null, source:"error_fallback", error:e.message});
  }
}
