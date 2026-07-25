
function clean(v,m=1000){return String(v||"").replace(/<[^>]*>/g,"").trim().slice(0,m)}
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const b=typeof req.body==="object"?req.body:JSON.parse(req.body||"{}");
    const name=clean(b.name,120); const email=clean(b.email,180); const subject=clean(b.subject,180); const message=clean(b.message,4000); const website=clean(b.website,200);
    if(website) return res.status(200).json({ok:true});
    if(!name||!email||!subject||!message) return res.status(400).json({error:"Tous les champs obligatoires"});
    const key=process.env.RESEND_API_KEY; const to=process.env.CONTACT_TO_EMAIL; const from=process.env.CONTACT_FROM_EMAIL||"onboarding@resend.dev";
    if(!key||!to) return res.status(500).json({error:"Mail config manquante"});
    const html=`<div style="font-family:Arial;line-height:1.6"><h2>Nouveau message Reddice HUB V2</h2><p><b>${name}</b> - ${email}</p><p><b>${subject}</b></p><hr><p>${message.replace(/\n/g,"<br>")}</p></div>`;
    const r=await fetch("https://api.resend.com/emails",{method:"POST", headers:{Authorization:`Bearer ${key}`, "Content-Type":"application/json"}, body:JSON.stringify({from, to:[to], reply_to:email, subject:`[HUB V2] ${subject}`, html})});
    if(!r.ok){ const t=await r.text(); return res.status(500).json({error:t}); }
    return res.status(200).json({ok:true});
  }catch(e){ return res.status(500).json({error:"Contact error"}); }
}
