import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode,     setMode]     = useState("login");   // "login" | "signup" | "forgot"
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState(null);      // { type: "success"|"error", text }
  const [showPass, setShowPass] = useState(false);

  const reset = () => { setMessage(null); };

  /* ── CONNEXION ── */
  const handleLogin = async () => {
    if (!email || !password) return setMessage({ type:"error", text:"Remplis tous les champs." });
    setLoading(true); reset();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMessage({ type:"error", text: friendlyError(error.message) });
    // si succès → le listener dans App.jsx détecte automatiquement la session
  };

  /* ── INSCRIPTION ── */
  const handleSignup = async () => {
    if (!email || !password) return setMessage({ type:"error", text:"Remplis tous les champs." });
    if (password.length < 6)  return setMessage({ type:"error", text:"Mot de passe trop court (6 caractères min)." });
    setLoading(true); reset();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setMessage({ type:"error", text: friendlyError(error.message) });
    else setMessage({ type:"success", text:"✅ Compte créé ! Vérifie ta boîte mail pour confirmer." });
  };

  /* ── MOT DE PASSE OUBLIÉ ── */
  const handleForgot = async () => {
    if (!email) return setMessage({ type:"error", text:"Entre ton email d'abord." });
    setLoading(true); reset();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) setMessage({ type:"error", text: friendlyError(error.message) });
    else setMessage({ type:"success", text:"📧 Email de réinitialisation envoyé !" });
  };

  const submit = mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot;

  return (
    <div style={{
      minHeight:"100svh", maxWidth:430, margin:"0 auto",
      background:"linear-gradient(160deg,#0D1F14,#1A1035)",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"32px 24px", position:"relative", overflow:"hidden",
    }}>
      {/* Orbes décoratifs */}
      <div style={{position:"absolute",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:"rgba(42,122,90,0.15)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-60,left:-60,width:200,height:200,borderRadius:"50%",background:"rgba(124,106,232,0.12)",pointerEvents:"none"}}/>

      {/* Logo */}
      <div style={{marginBottom:32,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div style={{
          width:80,height:80,borderRadius:24,
          background:"linear-gradient(135deg,#2A7A5A,#3DAA7F)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:40,boxShadow:"0 12px 40px rgba(42,122,90,0.4)",
        }}>☽</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:"#fff",textAlign:"center",lineHeight:1.2}}>
          Hassanates
        </h1>
        <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",textAlign:"center",lineHeight:1.6}}>
          Ton compagnon de progression spirituelle
        </p>
      </div>

      {/* Carte formulaire */}
      <div style={{
        width:"100%",background:"rgba(255,255,255,0.06)",
        borderRadius:24,border:"1px solid rgba(255,255,255,0.1)",
        padding:"28px 24px",backdropFilter:"blur(20px)",
      }}>
        {/* Onglets connexion / inscription */}
        {mode !== "forgot" && (
          <div style={{display:"flex",background:"rgba(0,0,0,0.2)",borderRadius:12,padding:3,gap:3,marginBottom:24}}>
            {[["login","Connexion"],["signup","Inscription"]].map(([m,label])=>(
              <button key={m} onClick={()=>{setMode(m);reset();}}
                style={{
                  flex:1,padding:"9px",borderRadius:9,border:"none",cursor:"pointer",
                  fontSize:14,fontWeight:700,transition:"all 0.2s",
                  background:mode===m?"rgba(42,122,90,0.9)":"transparent",
                  color:mode===m?"#fff":"rgba(255,255,255,0.5)",
                }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {mode === "forgot" && (
          <div style={{marginBottom:20}}>
            <button onClick={()=>{setMode("login");reset();}}
              style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.6)",fontSize:14,display:"flex",alignItems:"center",gap:6}}>
              ← Retour
            </button>
            <h2 style={{fontSize:18,fontWeight:800,color:"#fff",marginTop:12}}>Mot de passe oublié</h2>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:4}}>On t'envoie un lien de réinitialisation.</p>
          </div>
        )}

        {/* Message erreur / succès */}
        {message && (
          <div style={{
            padding:"12px 14px",borderRadius:12,marginBottom:16,
            background:message.type==="error"?"rgba(239,68,68,0.15)":"rgba(42,122,90,0.2)",
            border:`1px solid ${message.type==="error"?"rgba(239,68,68,0.3)":"rgba(61,170,127,0.3)"}`,
          }}>
            <p style={{fontSize:13,fontWeight:600,color:message.type==="error"?"#FCA5A5":"#6EE7B7",lineHeight:1.5}}>
              {message.text}
            </p>
          </div>
        )}

        {/* Email */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.6)",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6}}>
            Email
          </label>
          <input
            type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="ton@email.com"
            onKeyDown={e=>e.key==="Enter"&&submit()}
            style={{
              width:"100%",padding:"13px 14px",borderRadius:12,
              border:"1px solid rgba(255,255,255,0.12)",
              background:"rgba(255,255,255,0.08)",color:"#fff",
              fontSize:15,outline:"none",fontFamily:"'Nunito',sans-serif",
              userSelect:"text",
            }}
          />
        </div>

        {/* Mot de passe (caché en mode forgot) */}
        {mode !== "forgot" && (
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.6)",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6}}>
              Mot de passe
            </label>
            <div style={{position:"relative"}}>
              <input
                type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                placeholder={mode==="signup"?"6 caractères minimum":"••••••••"}
                onKeyDown={e=>e.key==="Enter"&&submit()}
                style={{
                  width:"100%",padding:"13px 44px 13px 14px",borderRadius:12,
                  border:"1px solid rgba(255,255,255,0.12)",
                  background:"rgba(255,255,255,0.08)",color:"#fff",
                  fontSize:15,outline:"none",fontFamily:"'Nunito',sans-serif",
                  userSelect:"text",
                }}
              />
              <button onClick={()=>setShowPass(s=>!s)}
                style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:18,color:"rgba(255,255,255,0.4)"}}>
                {showPass?"🙈":"👁️"}
              </button>
            </div>
            {mode==="login"&&(
              <button onClick={()=>{setMode("forgot");reset();}}
                style={{background:"none",border:"none",cursor:"pointer",color:"rgba(61,170,127,0.8)",fontSize:12,fontWeight:600,marginTop:8,padding:0,textAlign:"right",width:"100%"}}>
                Mot de passe oublié ?
              </button>
            )}
          </div>
        )}

        {/* Bouton principal */}
        <button onClick={submit} disabled={loading}
          style={{
            width:"100%",padding:"15px",borderRadius:14,border:"none",cursor:loading?"default":"pointer",
            background:loading?"rgba(42,122,90,0.5)":"linear-gradient(135deg,#2A7A5A,#3DAA7F)",
            color:"#fff",fontSize:15,fontWeight:800,
            boxShadow:loading?"none":"0 4px 20px rgba(42,122,90,0.45)",
            transition:"all 0.2s",fontFamily:"'Nunito',sans-serif",
          }}>
          {loading
            ? "⏳ Chargement..."
            : mode==="login" ? "Se connecter"
            : mode==="signup" ? "Créer mon compte"
            : "Envoyer le lien"}
        </button>

        {/* Séparateur + connexion Google (optionnel) */}
        <div style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0 0"}}>
          <div style={{flex:1,height:1,background:"rgba(255,255,255,0.1)"}}/>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>ou</span>
          <div style={{flex:1,height:1,background:"rgba(255,255,255,0.1)"}}/>
        </div>

        <button
          onClick={async()=>{
            await supabase.auth.signInWithOAuth({
              provider:"google",
              options:{ redirectTo: window.location.origin }
            });
          }}
          style={{
            width:"100%",marginTop:14,padding:"13px",borderRadius:14,
            border:"1px solid rgba(255,255,255,0.15)",
            background:"rgba(255,255,255,0.06)",
            color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:10,
            fontFamily:"'Nunito',sans-serif",
          }}>
          <span style={{fontSize:20}}>🇬</span> Continuer avec Google
        </button>
      </div>

      {/* Verset bas de page */}
      <p style={{marginTop:32,fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",lineHeight:1.8,fontStyle:"italic"}}>
        « Et quiconque craint Allah, Il lui facilite sa situation. »
        <br/>— At-Talaq 65:4
      </p>
    </div>
  );
}

/* ── Traduit les messages d'erreur Supabase en français ── */
function friendlyError(msg) {
  if (msg.includes("Invalid login")) return "Email ou mot de passe incorrect.";
  if (msg.includes("Email not confirmed")) return "Confirme ton email avant de te connecter.";
  if (msg.includes("already registered")) return "Cet email est déjà utilisé. Connecte-toi.";
  if (msg.includes("Password should be")) return "Mot de passe trop court (6 caractères minimum).";
  if (msg.includes("rate limit")) return "Trop de tentatives. Attends quelques minutes.";
  return "Une erreur est survenue. Réessaie.";
}
