import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─────────────────────────────────────────
   SUPABASE — connexion à la base de données
───────────────────────────────────────── */
const SUPA_URL  = import.meta.env.VITE_SUPABASE_URL  || "";
const SUPA_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase  = createClient(SUPA_URL, SUPA_ANON);
const SUPA_OK   = !!(SUPA_URL && SUPA_ANON);

/* ─────────────────────────────────────────
   GESTION DU LIEN D'INVITATION
   Quand quelqu'un ouvre ?invite=CODE dans l'URL,
   on sauvegarde le code et on nettoie l'URL
───────────────────────────────────────── */
const pendingInvite = (() => {
  try {
    const p = new URLSearchParams(window.location.search).get("invite");
    if (p) {
      localStorage.setItem("hass_pending_invite", p);
      window.history.replaceState({}, "", window.location.pathname);
    }
    return localStorage.getItem("hass_pending_invite");
  } catch { return null; }
})();

/* ─────────────────────────────────────────
   FONCTIONS BASE DE DONNÉES
───────────────────────────────────────── */

// Charge le profil d'un utilisateur
async function dbGetProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) console.error("Erreur profil:", error.message);
  return data || null;
}

// Sauvegarde les données d'un utilisateur
async function dbSaveProfile(userId, updates) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) console.error("Erreur sauvegarde:", error.message);
}

// Met à jour le streak (jours consécutifs)
async function dbUpdateStreak(userId) {
  const { data } = await supabase
    .from("profiles")
    .select("streak, last_active")
    .eq("id", userId)
    .single();

  if (!data) return 0;

  const today     = new Date().toISOString().split("T")[0];          // "2024-01-15"
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]; // "2024-01-14"

  if (data.last_active === today) return data.streak || 1; // déjà compté aujourd'hui

  let newStreak = 1;
  if (data.last_active === yesterday) newStreak = (data.streak || 0) + 1; // jour consécutif

  await supabase
    .from("profiles")
    .update({ streak: newStreak, last_active: today })
    .eq("id", userId);

  return newStreak;
}

// Charge le cercle d'un utilisateur + ses membres
async function dbGetMyCircle(userId) {
  // 1. Est-ce que cet utilisateur appartient à un cercle ?
  const { data: membership } = await supabase
    .from("circle_members")
    .select("circle_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership) return { circle: null, members: [] };

  const circleId = membership.circle_id;

  // 2. Charge les infos du cercle
  const { data: circle } = await supabase
    .from("circles")
    .select("*")
    .eq("id", circleId)
    .single();

  // 3. Charge tous les membres avec leurs profils
  const { data: members } = await supabase
    .from("circle_members")
    .select("user_id, profiles(id, username, avatar, hassanates)")
    .eq("circle_id", circleId);

  return {
    circle: circle || null,
    members: members || [],
  };
}

// Crée un nouveau cercle et y ajoute le créateur
async function dbCreateCircle(userId) {
  const { data: circle, error } = await supabase
    .from("circles")
    .insert({ created_by: userId })
    .select()
    .single();

  if (error || !circle) {
    console.error("Erreur création cercle:", error?.message);
    return null;
  }

  await supabase
    .from("circle_members")
    .insert({ circle_id: circle.id, user_id: userId });

  return circle;
}

// Rejoint un cercle avec un code d'invitation
async function dbJoinCircleByCode(userId, code) {
  const cleanCode = code.trim().toUpperCase();

  // Cherche le cercle avec ce code
  const { data: circle } = await supabase
    .from("circles")
    .select("id, name")
    .eq("invite_code", cleanCode)
    .maybeSingle();

  if (!circle) return { ok: false, error: "Code invalide. Vérifie le code et réessaie." };

  // Vérifie si déjà membre
  const { data: existing } = await supabase
    .from("circle_members")
    .select("user_id")
    .eq("circle_id", circle.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return { ok: true, circleName: circle.name }; // déjà dedans

  // Rejoint le cercle
  const { error } = await supabase
    .from("circle_members")
    .insert({ circle_id: circle.id, user_id: userId });

  if (error) return { ok: false, error: "Erreur en rejoignant le cercle." };

  return { ok: true, circleName: circle.name };
}

// Quitte un cercle
async function dbLeaveCircle(userId, circleId) {
  await supabase
    .from("circle_members")
    .delete()
    .eq("circle_id", circleId)
    .eq("user_id", userId);
}

// Charge le tafsir depuis Supabase
async function dbGetTafsir(surahId, verseId) {
  try {
    const { data } = await supabase
      .from("tafsirs")
      .select("text")
      .eq("surah_number", surahId)
      .eq("ayah_number", verseId)
      .maybeSingle();
    return data?.text || null;
  } catch { return null; }
}

/* ─────────────────────────────────────────
   PROGRESSION LOCALE (localStorage)
   Sauvegarde où l'utilisateur en est dans la lecture
───────────────────────────────────────── */
function saveReadingProgress(surahId, surahName, surahArabic, verseId) {
  try {
    localStorage.setItem("hass_reading", JSON.stringify({
      surahId, surahName, surahArabic, verseId
    }));
  } catch {}
}

function loadReadingProgress() {
  try {
    const raw = localStorage.getItem("hass_reading");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Nunito:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap');

    :root {
      --bg-from: #EEE9FF;
      --bg-to: #E0EDFF;
      --glass-b: rgba(255,255,255,0.9);
      --border: rgba(255,255,255,0.6);
      --border-s: rgba(0,0,0,0.07);
      --emerald: #2A7A5A;
      --emerald-l: #3DAA7F;
      --emerald-glow: rgba(42,122,90,0.13);
      --gold: #C49A3C;
      --heart: #E06B8B;
      --ink: #1C1C2E;
      --ink-s: #4A4A6A;
      --ink-m: #9090B0;
      --card: rgba(255,255,255,0.72);
      --shadow: 0 4px 24px rgba(80,60,180,0.10);
    }
    .dark {
      --bg-from: #0D0E1C;
      --bg-to: #121828;
      --glass-b: rgba(28,32,52,0.95);
      --border: rgba(255,255,255,0.08);
      --border-s: rgba(255,255,255,0.06);
      --emerald: #3DAA7F;
      --emerald-l: #5BCCA0;
      --emerald-glow: rgba(61,170,127,0.12);
      --gold: #D4AA62;
      --heart: #F08CA8;
      --ink: #E8E4F8;
      --ink-s: #A8A4C8;
      --ink-m: #6A6888;
      --card: rgba(28,32,52,0.82);
      --shadow: 0 4px 24px rgba(0,0,0,0.30);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; user-select: none; }
    body { font-family: 'Nunito', sans-serif; overflow: hidden; background: var(--bg-from); }
    .app { max-width: 430px; margin: 0 auto; height: 100svh; background: linear-gradient(160deg, var(--bg-from), var(--bg-to)); display: flex; flex-direction: column; overflow: hidden; }
    ::-webkit-scrollbar { width: 0; }
    .arabic { font-family: 'Amiri', serif; direction: rtl; }
    .card { background: var(--card); border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow); backdrop-filter: blur(16px); }
    .pill { display: inline-flex; align-items: center; gap: 5px; background: var(--emerald-glow); color: var(--emerald); border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 700; border: 1px solid rgba(61,170,127,0.2); }
    .nav-bar { background: var(--glass-b); border-top: 1px solid var(--border-s); display: flex; justify-content: space-around; align-items: center; padding: 8px 0 20px; flex-shrink: 0; backdrop-filter: blur(20px); }
    .nav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; padding: 6px 12px; border-radius: 14px; transition: all 0.2s; }
    .nav-item.active { background: var(--emerald-glow); }
    .nav-lbl { font-size: 10px; font-weight: 700; color: var(--ink-m); }
    .nav-item.active .nav-lbl { color: var(--emerald); }
    .status-bar { margin: 8px 16px 0; padding: 8px 16px; background: var(--card); border-radius: 99px; border: 1px solid var(--border); box-shadow: var(--shadow); display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(16px); flex-shrink: 0; }
    .stat-chip { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--ink-s); }

    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .fu { animation: fadeUp 0.35s ease both; }
    @keyframes flicker { 0%,100% { transform: scale(1) rotate(-2deg); } 50% { transform: scale(1.1) rotate(2deg); } }
    .fire { animation: flicker 1.4s ease-in-out infinite; display: inline-block; }
    @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    .toast { position: fixed; bottom: 88px; left: 50%; transform: translateX(-50%); background: var(--emerald); color: #fff; padding: 9px 18px; border-radius: 999px; font-size: 13px; font-weight: 700; animation: toastIn 0.25s ease; z-index: 300; white-space: nowrap; box-shadow: 0 4px 18px rgba(42,122,90,0.4); }
    @keyframes heartPop { 0% { opacity: 0; transform: scale(0.5); } 20% { opacity: 1; transform: scale(1.2); } 80% { opacity: 1; } 100% { opacity: 0; transform: scale(0.8) translateY(-8px); } }
    .hpop { position: absolute; top: 12px; right: 16px; font-size: 15px; font-weight: 800; color: var(--heart); animation: heartPop 1s ease forwards; pointer-events: none; z-index: 50; }
    @keyframes bump { 0%,100% { transform: scale(1); } 50% { transform: scale(1.18); } }
    .bump { animation: bump 0.18s ease; }
    @keyframes sheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .sheet-ov { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; backdrop-filter: blur(4px); }
    .sheet { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; background: var(--glass-b); border-radius: 24px 24px 0 0; padding: 18px 20px 44px; z-index: 201; animation: sheetIn 0.26s cubic-bezier(0.4,0,0.2,1); border-top: 1px solid var(--border); max-height: 88vh; overflow-y: auto; }
    .sheet-handle { width: 40px; height: 4px; background: var(--border-s); border-radius: 999px; margin: 0 auto 16px; }

    .vslide { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 16px 24px; transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease; overflow-y: auto; }
    .vs-in { transform: translateX(0); opacity: 1; }
    .vs-out-l { transform: translateX(-100%); opacity: 0; }
    .vs-out-r { transform: translateX(100%); opacity: 0; }
    .dot { width: 6px; height: 6px; border-radius: 50%; transition: all 0.25s; cursor: pointer; }

    .tab-bar { display: flex; background: rgba(0,0,0,0.05); border-radius: 12px; padding: 3px; gap: 3px; }
    .tab { flex: 1; padding: 7px; border-radius: 9px; border: none; cursor: pointer; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 700; transition: all 0.2s; background: transparent; color: var(--ink-m); }
    .tab.active { background: var(--card); color: var(--emerald); box-shadow: var(--shadow); }

    textarea { font-family: 'Nunito', sans-serif; font-size: 14px; line-height: 1.6; background: rgba(0,0,0,0.04); border: 1px solid var(--border-s); border-radius: 12px; padding: 11px; width: 100%; color: var(--ink); resize: none; outline: none; user-select: text; }
    textarea:focus { border-color: var(--emerald); }
    button { font-family: 'Nunito', sans-serif; }

    .reader { position: fixed; inset: 0; z-index: 200; max-width: 430px; margin: 0 auto; display: flex; flex-direction: column; background: linear-gradient(160deg, var(--bg-from), var(--bg-to)); }
    @keyframes loadBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }

    .goal-card { border-radius: 22px; padding: 22px; background: linear-gradient(135deg, #2A7A5A, #3DAA7F); color: #fff; position: relative; overflow: hidden; }
    .goal-card::before { content: ''; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; background: rgba(255,255,255,0.1); }
    .stat-card { background: var(--card); border-radius: 16px; padding: 14px; border: 1px solid var(--border); }

    .dhikr-cat { border-radius: 20px; overflow: hidden; cursor: pointer; position: relative; min-height: 130px; display: flex; flex-direction: column; justify-content: flex-end; padding: 14px; transition: transform 0.18s; }
    .dhikr-cat:active { transform: scale(0.97); }
    .dhikr-cat-bg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 64px; opacity: 0.18; }
    .list-item { display: flex; align-items: center; gap: 14px; padding: 16px; border-bottom: 1px solid var(--border-s); cursor: pointer; transition: background 0.15s; }
    .list-item:active { background: var(--emerald-glow); }
    .list-item:last-child { border-bottom: none; }

    .emotion-card { border-radius: 18px; padding: 20px 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; min-height: 90px; transition: transform 0.18s; border: none; }
    .emotion-card:active { transform: scale(0.96); }

    .fullscreen { position: fixed; inset: 0; z-index: 210; max-width: 430px; margin: 0 auto; display: flex; flex-direction: column; }

    .member-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--border-s); }
    .member-row:last-child { border-bottom: none; }

    input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 999px; background: rgba(0,0,0,0.1); outline: none; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--emerald); cursor: pointer; box-shadow: 0 2px 8px rgba(42,122,90,0.4); }

    /* Input texte dans les sheets */
    .text-input { width: 100%; padding: 13px 14px; border-radius: 12px; border: 1.5px solid var(--border-s); background: rgba(0,0,0,0.04); color: var(--ink); font-size: 15px; outline: none; font-family: 'Nunito', sans-serif; user-select: text; transition: border 0.2s; }
    .text-input:focus { border-color: var(--emerald); }
  `}</style>
);

/* ─────────────────────────────────────────
   DATA — AVATARS DISPONIBLES
───────────────────────────────────────── */
const AVATARS = ["🌿","🌙","🌸","⭐","🌊","🦋","🌺","🌟","🕊️","🌴","🌻","🦅","🌈","🔮","🌙","🍃"];

/* ─────────────────────────────────────────
   DATA — ÉMOTIONS & DOUAS
───────────────────────────────────────── */
const EMOTIONS = [
  { id:"colere",        label:"Colère",        color:"#FADADD", tc:"#7A3040", icon:"😤", douas:[
    { id:"c1", title:"Protection contre la colère",      arabic:"أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",       phonetic:"A'ûdhu billâhi mina sh-shaytâni r-rajîm",       fr:"Je cherche la protection d'Allah contre le Shaytan maudit. Le Prophète ﷺ a dit : si l'un d'entre vous ressent de la colère, qu'il dise cette parole.", source:"Bukhari & Mouslim", count:3 },
    { id:"c2", title:"Faire disparaître la colère",      arabic:"اللَّهُمَّ اغْفِرْ لِي ذَنْبِي وَأَذْهِبْ غَيْظَ قَلْبِي", phonetic:"Allâhumma ghfir lî dhanbî wa adhhib ghayza qalbî", fr:"Ô Allah, pardonne-moi mon péché et fais disparaître la colère de mon cœur.", source:"Ibn Sunni", count:1 },
  ]},
  { id:"anxiete",       label:"Anxiété",        color:"#C8E6C9", tc:"#2E5935", icon:"😰", douas:[
    { id:"a1", title:"Doua contre l'anxiété",            arabic:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحُزْنِ", phonetic:"Allâhumma innî a'ûdhu bika mina l-hammi wa l-huzn", fr:"Ô Allah, je cherche Ta protection contre l'anxiété, la tristesse, la faiblesse et la paresse.", source:"Bukhari", count:3 },
    { id:"a2", title:"La confiance en Allah",             arabic:"حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",                  phonetic:"Hasbunallâhu wa ni'ma l-wakîl",                   fr:"Allah nous suffit et Il est le meilleur des garants. C'est ce qu'Ibrahim ﷺ disait quand on le jetait dans le feu.", source:"Bukhari", count:7 },
  ]},
  { id:"tentations",    label:"Tentations",     color:"#BBDEFB", tc:"#1A3A5C", icon:"😈", douas:[
    { id:"t1", title:"Protection contre le Shaytan",     arabic:"أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ",               phonetic:"A'ûdhu bi kalimâtillâhi t-tâmmâti min sharri mâ khalaq", fr:"Je cherche refuge dans les paroles parfaites d'Allah contre tout ce qu'Il a créé.", source:"Mouslim", count:3 },
    { id:"t2", title:"Demander la chasteté",              arabic:"اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ", phonetic:"Allâhumma innî as'aluka l-hudâ wa t-tuqâ wa l-'afâfa", fr:"Ô Allah, je Te demande la guidance, la piété, la chasteté et l'aisance.", source:"Mouslim", count:1 },
  ]},
  { id:"confiance",     label:"Confiance",      color:"#FFF9C4", tc:"#5D4A00", icon:"🌟", douas:[
    { id:"cf1", title:"Tawakkul — Confiance totale",     arabic:"تَوَكَّلْتُ عَلَى اللَّهِ",                               phonetic:"Tawakkaltu 'ala llâhi wa lâ hawla wa lâ quwwata illâ billâh", fr:"Je m'en remets à Allah, il n'y a de force ni de puissance qu'en Allah.", source:"Abou Dawoud", count:1 },
  ]},
  { id:"contentement",  label:"Contentement",   color:"#FFCCBC", tc:"#7A2E00", icon:"🤲", douas:[
    { id:"co1", title:"Gratitude envers Allah",           arabic:"اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ فَمِنْكَ",       phonetic:"Allâhumma mâ amsâ bî min ni'matin fa-minka wahdaka", fr:"Ô Allah, tous les bienfaits dont je jouis ce soir viennent de Toi seul. À Toi toute la louange.", source:"Abou Dawoud", count:1 },
    { id:"co2", title:"Remercier Allah",                  arabic:"الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ", phonetic:"Al-hamdu lillâhi lladhî bi-ni'matihi tatimmu s-sâlihât", fr:"Louange à Allah, par la grâce duquel les bonnes œuvres s'accomplissent.", source:"Ibn Maja", count:3 },
  ]},
  { id:"confusion",     label:"Confusion",      color:"#B2DFDB", tc:"#1A4A44", icon:"🌀", douas:[
    { id:"cn1", title:"Istikhara — Demander la guidance", arabic:"اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ",              phonetic:"Allâhumma innî astakhîruka bi-'ilmik",             fr:"Ô Allah, je Te demande de choisir pour moi grâce à Ton savoir et Ta puissance.", source:"Bukhari", count:1 },
    { id:"cn2", title:"Pour la clarté d'esprit",          arabic:"رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",        phonetic:"Rabbi shrah lî sadrî wa yassir lî amrî",           fr:"Seigneur, ouvre ma poitrine et facilite mes affaires. (Coran 20:25)", source:"Coran 20:25", count:3 },
  ]},
  { id:"depression",    label:"Dépression",     color:"#CFD8DC", tc:"#37474F", icon:"🌧️", douas:[
    { id:"d1", title:"Doua contre la tristesse",          arabic:"لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ",         phonetic:"Lâ ilâha illallâhu l-'azîmu l-halîm",            fr:"Il n'y a de dieu qu'Allah, l'Immense, le Doux. Seigneur du Trône immense.", source:"Bukhari, Mouslim", count:3 },
    { id:"d2", title:"Doua de Younous ﷺ",                 arabic:"لَا إِلَهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ", phonetic:"Lâ ilâha illâ anta subhânaka innî kuntu mina z-zâlimîn", fr:"Il n'y a de dieu que Toi, Gloire à Toi ! J'étais parmi les injustes. (Coran 21:87)", source:"Coran 21:87", count:3 },
  ]},
  { id:"incertitude",   label:"Incertitude",    color:"#D1C4E9", tc:"#4A148C", icon:"❓", douas:[
    { id:"i1", title:"Confier ses affaires à Allah",       arabic:"فَوَّضْتُ أَمْرِي إِلَى اللَّهِ",                        phonetic:"Fawwadtu amrî ilallâh",                           fr:"Je confie mes affaires à Allah. Allah voit très bien Ses serviteurs. (Coran 40:44)", source:"Coran 40:44", count:3 },
  ]},
  { id:"reconnaissance",label:"Reconnaissance", color:"#F8BBD0", tc:"#7A1432", icon:"🙏", douas:[
    { id:"r1", title:"Gratitude parfaite",                 arabic:"اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ",           phonetic:"Allâhumma a'innî 'alâ dhikrika wa shukrika",      fr:"Ô Allah, aide-moi à T'invoquer, à T'être reconnaissant et à T'adorer de la meilleure façon.", source:"Abou Dawoud", count:3 },
  ]},
  { id:"espoir",        label:"Espoir",         color:"#E0F2F1", tc:"#00695C", icon:"🌅", douas:[
    { id:"e1", title:"Ne jamais désespérer",               arabic:"لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",                   phonetic:"Lâ taqnatû min rahmati llâh",                    fr:"Ne désespérez pas de la miséricorde d'Allah. Allah pardonne tous les péchés. (Coran 39:53)", source:"Coran 39:53", count:1 },
  ]},
  { id:"solitude",      label:"Solitude",       color:"#E8EAF6", tc:"#283593", icon:"🕊️", douas:[
    { id:"s1", title:"Allah est suffisant",                arabic:"يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ",        phonetic:"Yâ hayyu yâ qayyûmu bi-rahmatika astaghîth",     fr:"Ô Toi le Vivant, Toi qui subsistes par Toi-même, c'est par Ta miséricorde que j'implore Ton secours.", source:"Tirmizi", count:3 },
  ]},
  { id:"avarice",       label:"Avarice",        color:"#F5F5DC", tc:"#5D4A00", icon:"💰", douas:[
    { id:"av1", title:"Se protéger de l'avarice",          arabic:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبُخْلِ",           phonetic:"Allâhumma innî a'ûdhu bika mina l-bukhl",        fr:"Ô Allah, je cherche Ta protection contre l'avarice, la lâcheté et le poids des dettes.", source:"Bukhari", count:3 },
  ]},
];

/* ─────────────────────────────────────────
   DATA — DHIKR & DOUA QUOTIDIENS
───────────────────────────────────────── */
const DHIKR_CATS = [
  { id:"matin",      label:"Adhkar du Matin",        icon:"🌅", bg:"linear-gradient(135deg,#F6A623,#F7C948)", grad:["#F6A623","#F7C948"], items:[
    { id:101, title:"À l'entrée du matin",       arabic:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",  phonetic:"Asbahna wa asbaha l-mulku lillah",   fr:"Nous entrons au matin et le Royaume appartient à Allah.",             source:"Abou Dawoud", count:1,   h:10  },
    { id:102, title:"Tasbih du matin",           arabic:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",           phonetic:"Subhana llahi wa bihamdih",          fr:"Gloire à Allah et louange à Lui.",                                    source:"Mouslim",     count:100, h:100 },
    { id:103, title:"Invocation du matin",       arabic:"اللَّهُمَّ بِكَ أَصْبَحْنَا",               phonetic:"Allahumma bika asbahna",             fr:"Ô Allah, c'est grâce à Toi que nous entrons dans le matin.",          source:"Abou Dawoud", count:1,   h:10  },
  ]},
  { id:"soir",       label:"Adhkar du Soir",          icon:"🌙", bg:"linear-gradient(135deg,#553C9A,#2D3748)", grad:["#553C9A","#2D3748"], items:[
    { id:201, title:"À l'entrée du soir",        arabic:"أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",  phonetic:"Amsayna wa amsa l-mulku lillah",     fr:"Nous entrons dans le soir et le Royaume appartient à Allah.",         source:"Abou Dawoud", count:1,  h:10  },
    { id:202, title:"Hisboun Allah",             arabic:"حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ", phonetic:"Hasbiya llahu la ilaha illa hu",     fr:"Allah me suffit, il n'y a de divinité que Lui.",                      source:"Abou Dawoud", count:7,  h:70  },
    { id:203, title:"Istighfar du soir",         arabic:"أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", phonetic:"Astaghfiru llaha wa atubu ilayh",   fr:"Je demande le pardon d'Allah et je me repens à Lui.",                source:"Bukhari",     count:100,h:100 },
  ]},
  { id:"protection", label:"Protection & Rouqya",    icon:"🛡️", bg:"linear-gradient(135deg,#F56565,#9B2335)", grad:["#F56565","#9B2335"], items:[
    { id:501, title:"Protection par le Nom d'Allah", arabic:"بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ", phonetic:"Bismi llahi lladhi la yadurru", fr:"Au nom d'Allah avec lequel rien ne peut nuire.", source:"Abou Dawoud", count:3, h:30 },
    { id:502, title:"Ayat al-Kursi",             arabic:"اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ", phonetic:"Allahu la ilaha illa huwa l-hayyu l-qayyum", fr:"Récite Ayat al-Kursi chaque matin et soir.", source:"Bukhari", count:1, h:50 },
  ]},
  { id:"priere",     label:"Invocations de la Prière",icon:"🕌", bg:"linear-gradient(135deg,#4299E1,#1A365D)", grad:["#4299E1","#1A365D"], items:[
    { id:601, title:"Pardon pour soi et ses parents", arabic:"رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ", phonetic:"Rabbi ghfir li wa liwaalidayya", fr:"Seigneur, pardonne-moi ainsi qu'à mes parents.", source:"Coran 71:28", count:3, h:30 },
    { id:602, title:"Doua du monde et de l'au-delà", arabic:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً", phonetic:"Rabbana atina fi d-dunya hasanatan", fr:"Seigneur, accorde-nous ce qui est bon en ce monde et dans l'au-delà.", source:"Coran 2:201", count:1, h:10 },
  ]},
  { id:"reveil",     label:"Se Réveiller",            icon:"⏰", bg:"linear-gradient(135deg,#48BB78,#276749)", grad:["#48BB78","#276749"], items:[
    { id:301, title:"Après le réveil",           arabic:"الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا", phonetic:"Al-hamdu lillahi lladhi ahyana ba'da ma amatana", fr:"Louange à Allah qui nous a redonné la vie après nous avoir fait mourir.", source:"Bukhari", count:1, h:10 },
  ]},
  { id:"sommeil",    label:"Avant de Dormir",         icon:"😴", bg:"linear-gradient(135deg,#667EEA,#764BA2)", grad:["#667EEA","#764BA2"], items:[
    { id:401, title:"Bismika amutu",             arabic:"بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",  phonetic:"Bismika llahumma amutu wa ahya",    fr:"En Ton nom, ô Allah, je meurs et je vis.",                            source:"Bukhari",     count:1, h:10  },
    { id:402, title:"Tasbih de Fatima",          arabic:"سُبْحَانَ اللَّهِ ×33 الْحَمْدُ لِلَّهِ ×33 اللَّهُ أَكْبَرُ ×34", phonetic:"Subhanallah 33x · Alhamdulillah 33x · Allahu Akbar 34x", fr:"Le Tasbih de Fatima — récite avant de dormir.", source:"Bukhari, Mouslim", count:1, h:100 },
  ]},
  { id:"istighfar",  label:"Istighfar & Repentir",    icon:"🔄", bg:"linear-gradient(135deg,#9F7AEA,#44337A)", grad:["#9F7AEA","#44337A"], items:[
    { id:1101, title:"Sayid al-Istighfar",       arabic:"اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ", phonetic:"Allahumma anta rabbi la ilaha illa anta", fr:"Ô Allah, Tu es mon Seigneur, il n'y a de dieu que Toi.", source:"Bukhari", count:1, h:100 },
    { id:1102, title:"Istighfar court",          arabic:"أَسْتَغْفِرُ اللَّهَ",                      phonetic:"Astaghfiru llah",                    fr:"Je demande le pardon d'Allah.",                                       source:"Bukhari",     count:100, h:100 },
  ]},
  { id:"woudhou",    label:"Woudhou & Purification",  icon:"🚿", bg:"linear-gradient(135deg,#4FD1C5,#285E61)", grad:["#4FD1C5","#285E61"], items:[
    { id:701, title:"En entrant aux toilettes",  arabic:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ", phonetic:"Allahumma inni a'udhu bika mina l-khubuthi", fr:"Ô Allah, je cherche Ta protection contre les démons.", source:"Bukhari", count:1, h:10 },
    { id:702, title:"Après le woudhou",          arabic:"أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ",   phonetic:"Ashhadu an la ilaha illa llahu wa ashhadu anna muhammadan rasuluh", fr:"J'atteste qu'il n'y a de dieu qu'Allah et que Muhammad est Son messager.", source:"Mouslim", count:1, h:20 },
  ]},
  { id:"voyage",     label:"Voyage & Déplacement",    icon:"✈️", bg:"linear-gradient(135deg,#76E4F7,#065666)", grad:["#76E4F7","#065666"], items:[
    { id:1001, title:"En montant dans un véhicule", arabic:"سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا", phonetic:"Subhana lladhi sakhkhara lana hadha", fr:"Gloire à Celui qui nous a soumis cela. (Coran 43:13)", source:"Coran 43:13", count:1, h:20 },
  ]},
  { id:"nourriture", label:"Nourriture & Boisson",    icon:"🍽️", bg:"linear-gradient(135deg,#F6AD55,#9C4221)", grad:["#F6AD55","#9C4221"], items:[
    { id:801, title:"Avant de manger",           arabic:"بِسْمِ اللَّهِ",                            phonetic:"Bismillah",                          fr:"Au nom d'Allah.",                                                     source:"Abou Dawoud", count:1, h:5  },
    { id:802, title:"Après avoir mangé",         arabic:"الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا",   phonetic:"Al-hamdu lillahi lladhi at'amana",   fr:"Louange à Allah qui nous a nourris.",                                 source:"Abou Dawoud", count:1, h:10 },
  ]},
  { id:"maison",     label:"Maison & Famille",        icon:"🏠", bg:"linear-gradient(135deg,#68D391,#1C4532)", grad:["#68D391","#1C4532"], items:[
    { id:901, title:"En entrant chez soi",       arabic:"بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا", phonetic:"Bismillahi walajna wa bismillahi kharajna", fr:"Au nom d'Allah nous entrons et au nom d'Allah nous sortons.", source:"Abou Dawoud", count:1, h:10 },
  ]},
  { id:"mariage",    label:"Mariage & Enfants",       icon:"💍", bg:"linear-gradient(135deg,#F687B3,#702459)", grad:["#F687B3","#702459"], items:[
    { id:1201, title:"La nuit des noces",        arabic:"بِسْمِ اللَّهِ اللَّهُمَّ جَنِّبْنَا الشَّيْطَانَ", phonetic:"Bismillah, allahumma jannibna sh-shaytana", fr:"Au nom d'Allah. Ô Allah, éloigne de nous le Shaytan.", source:"Bukhari", count:1, h:20 },
  ]},
];

const AYAH = { arabic:"وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا", fr:"Celui qui craint Allah, Il lui accordera une issue favorable.", ref:"At-Talaq 65:2" };
const BASMALA = { arabic:"بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", fr:"Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux", audio:"https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3" };

/* ─────────────────────────────────────────
   API CORAN
───────────────────────────────────────── */
const API = "https://api.alquran.cloud/v1";
const RECITER = "ar.alafasy";
const TRANS   = "fr.hamidullah";

function useSurahs() {
  const [surahs,setSurahs]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  useEffect(()=>{fetch(`${API}/surah`).then(r=>r.json()).then(d=>{setSurahs(d.data.map(s=>({id:s.number,name:s.englishName,arabic:s.name,verses:s.numberOfAyahs,rev:s.revelationType==="Meccan"?"Mecquoise":"Medinoise"})));setLoading(false);}).catch(e=>{setError(e);setLoading(false);});},[]);
  return {surahs,loading,error};
}

function useSurahVerses(surahId) {
  const [verses,setVerses]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  useEffect(()=>{if(!surahId)return;setLoading(true);setVerses([]);setError(null);Promise.all([fetch(`${API}/surah/${surahId}/${RECITER}`).then(r=>{if(!r.ok)throw new Error();return r.json();}),fetch(`${API}/surah/${surahId}/${TRANS}`).then(r=>{if(!r.ok)throw new Error();return r.json();})]).then(([ar,fr])=>{if(!ar.data?.ayahs?.length)throw new Error();setVerses(ar.data.ayahs.map((a,i)=>({id:a.numberInSurah,arabic:a.text,audioUrl:a.audio,fr:fr.data?.ayahs?.[i]?.text||""})));setLoading(false);}).catch(e=>{setError(e);setLoading(false);});},[surahId]);
  return {verses,loading,error};
}

/* ─────────────────────────────────────────
   COMPOSANTS HELPERS
───────────────────────────────────────── */
function Sheet({ onClose, children }) {
  return (
    <>
      <div className="sheet-ov" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        {children}
      </div>
    </>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width:44,height:26,borderRadius:999,background:on?"var(--emerald)":"rgba(0,0,0,0.12)",position:"relative",cursor:"pointer",transition:"background 0.25s",flexShrink:0 }}>
      <div style={{ position:"absolute",top:3,left:on?20:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left 0.25s" }} />
    </div>
  );
}

function fmtTime(s) {
  const m = Math.floor(s/60), sec = s%60;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

/* ─────────────────────────────────────────
   AUTH SCREEN
───────────────────────────────────────── */
function AuthScreen() {
  const [mode,setMode]       = useState("login"); // "login" | "signup" | "forgot"
  const [email,setEmail]     = useState("");
  const [password,setPassword] = useState("");
  const [loading,setLoading] = useState(false);
  const [msg,setMsg]         = useState(null);    // { type:"ok"|"err", text }
  const [showPw,setShowPw]   = useState(false);

  function translateError(m) {
    if (m.includes("Invalid login"))      return "Email ou mot de passe incorrect.";
    if (m.includes("Email not confirmed"))return "Confirme ton email avant de te connecter.";
    if (m.includes("already registered"))return "Cet email a déjà un compte. Connecte-toi.";
    if (m.includes("Password should"))    return "Mot de passe trop court (6 caractères min).";
    return "Une erreur est survenue. Réessaie.";
  }

  async function submit() {
    if (!email) return setMsg({ type:"err", text:"Entre ton email." });
    if (mode !== "forgot" && !password) return setMsg({ type:"err", text:"Entre ton mot de passe." });
    setLoading(true); setMsg(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) setMsg({ type:"err", text:translateError(error.message) });
      // Si succès → l'app détecte la session automatiquement

    } else if (mode === "signup") {
      if (password.length < 6) { setLoading(false); return setMsg({ type:"err", text:"Mot de passe trop court (6 car. min)." }); }
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) setMsg({ type:"err", text:translateError(error.message) });
      else setMsg({ type:"ok", text:"✅ Compte créé ! Vérifie ta boîte mail pour confirmer." });

    } else { // forgot
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      setLoading(false);
      if (error) setMsg({ type:"err", text:translateError(error.message) });
      else setMsg({ type:"ok", text:"📧 Email envoyé ! Vérifie ta boîte mail." });
    }
  }

  return (
    <div style={{ minHeight:"100svh",maxWidth:430,margin:"0 auto",background:"linear-gradient(160deg,#0D1F14,#1A1035)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",position:"relative",overflow:"hidden" }}>
      {/* Décorations */}
      <div style={{ position:"absolute",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:"rgba(42,122,90,0.15)",pointerEvents:"none" }} />
      <div style={{ position:"absolute",bottom:-60,left:-60,width:200,height:200,borderRadius:"50%",background:"rgba(124,106,232,0.12)",pointerEvents:"none" }} />

      {/* Logo */}
      <div style={{ marginBottom:32,textAlign:"center" }}>
        <div style={{ width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#2A7A5A,#3DAA7F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,margin:"0 auto 12px",boxShadow:"0 12px 40px rgba(42,122,90,0.4)" }}>☽</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:"#fff" }}>Hassanates</h1>
        <p style={{ fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:6 }}>Ton compagnon de progression spirituelle</p>
      </div>

      {/* Formulaire */}
      <div style={{ width:"100%",background:"rgba(255,255,255,0.06)",borderRadius:24,border:"1px solid rgba(255,255,255,0.1)",padding:"28px 24px",backdropFilter:"blur(20px)" }}>

        {/* Onglets Connexion / Inscription */}
        {mode !== "forgot" && (
          <div style={{ display:"flex",background:"rgba(0,0,0,0.2)",borderRadius:12,padding:3,gap:3,marginBottom:24 }}>
            {[["login","Connexion"],["signup","Inscription"]].map(([m,lbl]) => (
              <button key={m} onClick={() => { setMode(m); setMsg(null); }}
                style={{ flex:1,padding:"9px",borderRadius:9,border:"none",cursor:"pointer",fontSize:14,fontWeight:700,background:mode===m?"rgba(42,122,90,0.9)":"transparent",color:mode===m?"#fff":"rgba(255,255,255,0.5)",transition:"all 0.2s" }}>
                {lbl}
              </button>
            ))}
          </div>
        )}

        {/* Retour si mode "forgot" */}
        {mode === "forgot" && (
          <div style={{ marginBottom:20 }}>
            <button onClick={() => { setMode("login"); setMsg(null); }} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.6)",fontSize:14 }}>← Retour</button>
            <h2 style={{ fontSize:18,fontWeight:800,color:"#fff",marginTop:12 }}>Mot de passe oublié</h2>
            <p style={{ fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:4 }}>On t'envoie un lien de réinitialisation.</p>
          </div>
        )}

        {/* Message succès / erreur */}
        {msg && (
          <div style={{ padding:"12px 14px",borderRadius:12,marginBottom:16,background:msg.type==="err"?"rgba(239,68,68,0.15)":"rgba(42,122,90,0.2)",border:`1px solid ${msg.type==="err"?"rgba(239,68,68,0.3)":"rgba(61,170,127,0.3)"}` }}>
            <p style={{ fontSize:13,fontWeight:600,color:msg.type==="err"?"#FCA5A5":"#6EE7B7",lineHeight:1.5 }}>{msg.text}</p>
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.6)",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com"
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{ width:"100%",padding:"13px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:15,outline:"none",fontFamily:"'Nunito',sans-serif",userSelect:"text" }} />
        </div>

        {/* Mot de passe (masqué en mode forgot) */}
        {mode !== "forgot" && (
          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.6)",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6 }}>Mot de passe</label>
            <div style={{ position:"relative" }}>
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "6 caractères minimum" : "••••••••"}
                onKeyDown={e => e.key === "Enter" && submit()}
                style={{ width:"100%",padding:"13px 44px 13px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:15,outline:"none",fontFamily:"'Nunito',sans-serif",userSelect:"text" }} />
              <button onClick={() => setShowPw(s => !s)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:18,color:"rgba(255,255,255,0.4)" }}>
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
            {mode === "login" && (
              <button onClick={() => { setMode("forgot"); setMsg(null); }} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(61,170,127,0.8)",fontSize:12,fontWeight:600,marginTop:8,padding:0,float:"right" }}>
                Mot de passe oublié ?
              </button>
            )}
          </div>
        )}

        {/* Bouton principal */}
        <button onClick={submit} disabled={loading}
          style={{ width:"100%",padding:"15px",borderRadius:14,border:"none",cursor:loading ? "default" : "pointer",background:loading ? "rgba(42,122,90,0.5)" : "linear-gradient(135deg,#2A7A5A,#3DAA7F)",color:"#fff",fontSize:15,fontWeight:800,boxShadow:loading ? "none" : "0 4px 20px rgba(42,122,90,0.45)",transition:"all 0.2s" }}>
          {loading ? "⏳ Chargement..." : mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}
        </button>
      </div>

      <p style={{ marginTop:28,fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",lineHeight:1.8,fontStyle:"italic" }}>
        « Et quiconque craint Allah, Il lui facilite sa situation. »<br/>— At-Talaq 65:4
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────
   ONBOARDING (3 écrans de présentation)
───────────────────────────────────────── */
const OB_SLIDES = [
  { bg:["#1A2E1A","#0D1F0D"], icon:"☽", iconBg:"linear-gradient(135deg,#2A7A5A,#3DAA7F)", accent:"#3DAA7F", title:"Bienvenue sur\nHassanates", sub:"Ton compagnon de progression spirituelle. Lis, invoque et grandis chaque jour.", cta:null },
  { bg:["#1A1A2E","#0D0D1F"], icon:"🤝", iconBg:"linear-gradient(135deg,#7C6AE8,#A08CF5)", accent:"#A08CF5", title:"Progresse en\nCommunauté",  sub:"Crée un cercle avec tes amis, partage ta progression et inspirez-vous mutuellement.", cta:null },
  { bg:["#1F1A0D","#2E2410"], icon:"💚", iconBg:"linear-gradient(135deg,#C49A3C,#E8C060)", accent:"#E8C060", title:"Trouve ta\nSérénité",      sub:"Des douas pour chaque émotion. Ton cœur trouvera sa paix, in sha Allah.",          cta:"Commencer" },
];

function Onboarding({ onDone }) {
  const [idx, setIdx] = useState(0);
  const s = OB_SLIDES[idx];
  const goTo = n => { if (n >= 0 && n < OB_SLIDES.length) setIdx(n); };
  const touchX = useRef(null);
  const onTS = e => { touchX.current = e.touches[0].clientX; };
  const onTE = e => {
    if (!touchX.current) return;
    const dx = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 44) { dx > 0 ? goTo(idx+1) : goTo(idx-1); }
    touchX.current = null;
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:500,maxWidth:430,margin:"0 auto",overflow:"hidden",background:`linear-gradient(160deg,${s.bg[0]},${s.bg[1]})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",transition:"background 0.4s" }}
      onTouchStart={onTS} onTouchEnd={onTE}>
      {idx < OB_SLIDES.length - 1 && (
        <button onClick={onDone} style={{ position:"absolute",top:52,right:20,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:999,padding:"6px 14px",cursor:"pointer",fontSize:13,color:"rgba(255,255,255,0.6)",zIndex:10 }}>Passer</button>
      )}
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"0 32px" }}>
        <div style={{ width:100,height:100,borderRadius:28,background:s.iconBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:46,marginBottom:36 }}>{s.icon}</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,color:"#fff",textAlign:"center",lineHeight:1.25,marginBottom:20,whiteSpace:"pre-line" }}>
          {s.title.split("\n").map((l,i) => (
            <span key={i}>{i===1 ? <span style={{ background:`linear-gradient(90deg,${s.accent},#fff)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>{l}</span> : l}{i===0 && <br/>}</span>
          ))}
        </h1>
        <p style={{ fontSize:15,color:"rgba(255,255,255,0.65)",textAlign:"center",lineHeight:1.8 }}>{s.sub}</p>
      </div>
      <div style={{ position:"absolute",bottom:52,left:0,right:0,display:"flex",flexDirection:"column",alignItems:"center",gap:24,padding:"0 32px" }}>
        <div style={{ display:"flex",gap:8 }}>
          {OB_SLIDES.map((_,i) => <div key={i} onClick={() => goTo(i)} style={{ height:6,width:i===idx?24:6,borderRadius:999,background:i===idx?"#fff":"rgba(255,255,255,0.25)",transition:"all 0.3s",cursor:"pointer" }} />)}
        </div>
        {s.cta
          ? <button onClick={onDone} style={{ width:"100%",padding:"16px",borderRadius:16,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${s.accent},#fff)`,color:"#1A1A2E",fontSize:16,fontWeight:800 }}>{s.cta} →</button>
          : <button onClick={() => goTo(idx+1)} style={{ width:"100%",padding:"16px",borderRadius:16,border:"1px solid rgba(255,255,255,0.2)",cursor:"pointer",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:15,fontWeight:700 }}>Suivant →</button>
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   HOME SCREEN
───────────────────────────────────────── */
const DAYS = ["L","M","M","J","V","S","D"];
const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

function HomeScreen({ hassanates, streak, readingMins, onStart, userName, circle, circleMembers, circleLoading, onCreateCircle, onRefreshCircle, showToast, onJoinCircle }) {
  const [selDay,    setSelDay]    = useState(todayIdx);
  const [joinSheet, setJoinSheet] = useState(false);
  const [joinCode,  setJoinCode]  = useState("");
  const [joinLoad,  setJoinLoad]  = useState(false);
  const [joinErr,   setJoinErr]   = useState("");
  const progress = loadReadingProgress();

  const totalH  = circleMembers.reduce((a,m) => a + (m.profiles?.hassanates || 0), 0);
  const goalH   = circle?.goal_h || 10000;

  // Partager le lien d'invitation
  const shareInviteLink = () => {
    const link = `${window.location.origin}/?invite=${circle.invite_code}`;
    if (navigator.share) {
      navigator.share({ title:"Rejoins mon cercle Hassanates !", text:"On progresse ensemble 🌿", url:link });
    } else {
      navigator.clipboard?.writeText(link);
      showToast("🔗 Lien copié ! Partage-le à tes amis.");
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoinLoad(true); setJoinErr("");
    const result = await onJoinCircle(joinCode.trim());
    setJoinLoad(false);
    if (result.ok) {
      setJoinSheet(false); setJoinCode("");
      showToast(`🤝 Bienvenue dans "${result.circleName}" !`);
    } else {
      setJoinErr(result.error || "Code invalide.");
    }
  };

  const statsGrid = [
    { icon:"♥",  label:"Hassanates",  val:hassanates.toLocaleString(), color:"var(--heart)"   },
    { icon:"🔥", label:"Jours suite", val:streak,                      color:"var(--gold)"    },
    { icon:"⏱️", label:"Mins lues",   val:readingMins,                 color:"#7C6AE8"        },
    { icon:"📖", label:"Sourates",    val:"—",                         color:"var(--emerald)" },
  ];

  return (
    <div style={{ flex:1,overflowY:"auto",padding:"10px 16px 16px" }}>

      {/* En-tête */}
      <div className="fu" style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <div>
          <p style={{ fontSize:14,color:"var(--ink-m)",fontWeight:600 }}>Assalam Alaykum 🤍</p>
          <p style={{ fontSize:24,fontWeight:800,color:"var(--ink)",fontFamily:"'Playfair Display',serif",textTransform:"capitalize" }}>{userName}</p>
          {streak > 0 && <div className="pill" style={{ marginTop:5 }}>🔥 {streak} jour{streak > 1 ? "s" : ""} de suite</div>}
        </div>
        <div style={{ width:54,height:54,borderRadius:"50%",background:"linear-gradient(135deg,var(--emerald),var(--emerald-l))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:"0 4px 16px rgba(42,122,90,0.3)" }}>🌿</div>
      </div>

      {/* Jours de la semaine */}
      <div className="fu card" style={{ padding:"12px 14px",marginBottom:14,animationDelay:"0.04s" }}>
        <p style={{ fontSize:12,fontWeight:700,color:"var(--ink-m)",marginBottom:10 }}>Cette semaine</p>
        <div style={{ display:"flex",justifyContent:"space-between" }}>
          {DAYS.map((d,i) => {
            const isSel = i === selDay, isT = i === todayIdx, isFut = i > todayIdx;
            return (
              <div key={i} onClick={() => { if (!isFut) setSelDay(i); }}
                style={{ cursor:isFut?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                <div style={{ width:36,height:36,borderRadius:"50%",background:isSel?"var(--emerald)":isT?"var(--emerald-glow)":"transparent",border:isT&&!isSel?"2px solid var(--emerald)":"2px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",opacity:isFut?0.35:1,transition:"all 0.2s" }}>
                  <span style={{ fontSize:12,fontWeight:800,color:isSel?"#fff":isT?"var(--emerald)":"var(--ink-m)" }}>{d}</span>
                </div>
                <div style={{ width:5,height:5,borderRadius:"50%",background:isT&&hassanates>0?"var(--gold)":"transparent" }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Carte lecture — reprend là où on s'est arrêté */}
      <div className="fu goal-card" style={{ marginBottom:14,animationDelay:"0.07s" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
          <div>
            <p style={{ fontSize:12,opacity:0.8,fontWeight:600,marginBottom:4 }}>
              {progress ? "Reprendre la lecture" : "Commencer la lecture"}
            </p>
            <p style={{ fontSize:20,fontWeight:800,fontFamily:"'Playfair Display',serif" }}>
              {progress ? progress.surahName : "Al-Fatiha"}
            </p>
            {progress && <p style={{ fontSize:12,opacity:0.8,marginTop:2 }}>Verset {progress.verseId}</p>}
          </div>
          <p className="arabic" style={{ fontSize:28,opacity:0.85 }}>
            {progress ? progress.surahArabic : "الفاتحة"}
          </p>
        </div>
        <button onClick={onStart} style={{ background:"rgba(255,255,255,0.92)",color:"var(--emerald)",border:"none",borderRadius:13,padding:"13px 0",width:"100%",cursor:"pointer",fontSize:15,fontWeight:800 }}>
          {progress ? `Reprendre — Verset ${progress.verseId} →` : "Commencer →"}
        </button>
      </div>

      {/* Stats */}
      <div className="fu" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14,animationDelay:"0.09s" }}>
        {statsGrid.map((s,i) => (
          <div key={i} className="stat-card" style={{ backdropFilter:"blur(12px)" }}>
            <span style={{ fontSize:22,color:s.color }}>{s.icon}</span>
            <p style={{ fontSize:24,fontWeight:800,color:"var(--ink)",fontFamily:"'Playfair Display',serif",marginTop:6 }}>{s.val}</p>
            <p style={{ fontSize:12,color:"var(--ink-m)",marginTop:2,fontWeight:600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─── CERCLE ─── */}
      <div className="fu card" style={{ padding:"18px",marginBottom:14,animationDelay:"0.11s" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <p style={{ fontSize:15,fontWeight:800,color:"var(--ink)" }}>🤝 Mon Cercle</p>
          {circle && (
            <button onClick={onRefreshCircle} style={{ background:"none",border:"none",cursor:"pointer",fontSize:18,color:"var(--ink-m)",padding:4 }}>↻</button>
          )}
        </div>

        {circleLoading && (
          <p style={{ fontSize:13,color:"var(--ink-m)",textAlign:"center",padding:"16px 0" }}>Chargement...</p>
        )}

        {/* Pas encore de cercle */}
        {!circleLoading && !circle && (
          <div>
            <p style={{ fontSize:13,color:"var(--ink-m)",lineHeight:1.7,marginBottom:16 }}>
              Progresse avec tes amis ! Crée un cercle ou rejoins-en un avec un code d'invitation.
            </p>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={onCreateCircle}
                style={{ flex:1,background:"linear-gradient(135deg,var(--emerald),var(--emerald-l))",color:"#fff",border:"none",borderRadius:13,padding:"12px 0",cursor:"pointer",fontSize:13,fontWeight:700,boxShadow:"0 4px 14px rgba(42,122,90,0.35)" }}>
                ✨ Créer un cercle
              </button>
              <button onClick={() => setJoinSheet(true)}
                style={{ flex:1,background:"var(--emerald-glow)",color:"var(--emerald)",border:"1px solid rgba(42,122,90,0.25)",borderRadius:13,padding:"12px 0",cursor:"pointer",fontSize:13,fontWeight:700 }}>
                🔗 Rejoindre
              </button>
            </div>
          </div>
        )}

        {/* Cercle existant */}
        {!circleLoading && circle && (
          <>
            {/* Barre de progression collective */}
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ fontSize:13,color:"var(--ink-s)",fontWeight:600 }}>{circle.name}</span>
              <span style={{ fontSize:13,fontWeight:800,color:"var(--heart)" }}>{totalH.toLocaleString()} / {goalH.toLocaleString()} ♥</span>
            </div>
            <div style={{ background:"rgba(0,0,0,0.06)",borderRadius:999,height:8,overflow:"hidden",marginBottom:16 }}>
              <div style={{ width:`${Math.min(100,(totalH/goalH)*100)}%`,height:"100%",background:"linear-gradient(90deg,var(--heart),#F09AAF)",borderRadius:999,transition:"width 0.8s" }} />
            </div>

            {/* Liste des membres triée par hassanates */}
            {circleMembers
              .sort((a,b) => (b.profiles?.hassanates || 0) - (a.profiles?.hassanates || 0))
              .map((m, i) => {
                const p    = m.profiles || {};
                const name = p.username || "Ami";
                const av   = p.avatar   || "🌿";
                const h    = p.hassanates || 0;
                const medals = ["🥇","🥈","🥉"];
                return (
                  <div key={m.user_id} className="member-row">
                    <span style={{ fontSize:16,width:24,flexShrink:0,textAlign:"center" }}>{i < 3 ? medals[i] : i + 1}</span>
                    <div style={{ width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${i*55},55%,72%),hsl(${i*55+30},55%,62%))`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{av}</div>
                    <p style={{ flex:1,fontSize:14,fontWeight:700,color:"var(--ink)",textTransform:"capitalize" }}>{name}</p>
                    <span style={{ fontSize:13,fontWeight:800,color:"var(--heart)" }}>{h.toLocaleString()} ♥</span>
                  </div>
                );
              })}

            {/* Boutons actions */}
            <div style={{ display:"flex",gap:8,marginTop:14 }}>
              <button onClick={shareInviteLink}
                style={{ flex:1,background:"linear-gradient(135deg,var(--emerald),var(--emerald-l))",color:"#fff",border:"none",borderRadius:13,padding:"12px 0",cursor:"pointer",fontSize:13,fontWeight:700,boxShadow:"0 4px 14px rgba(42,122,90,0.35)" }}>
                📤 Inviter des amis
              </button>
            </div>

            {/* Affiche le code */}
            <p style={{ fontSize:12,color:"var(--ink-m)",textAlign:"center",marginTop:10 }}>
              Code d'invitation : <strong style={{ color:"var(--emerald)",fontSize:14,letterSpacing:2 }}>{circle.invite_code}</strong>
            </p>
          </>
        )}
      </div>

      {/* Ayah du jour */}
      <div className="fu card" style={{ padding:"16px",marginBottom:12,animationDelay:"0.13s" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <p style={{ fontSize:14,fontWeight:800,color:"var(--ink)" }}>✨ Ayah du jour</p>
          <span style={{ fontSize:11,color:"var(--ink-m)",fontWeight:600 }}>{AYAH.ref}</span>
        </div>
        <p className="arabic" style={{ fontSize:22,textAlign:"right",lineHeight:2,color:"var(--emerald)",marginBottom:10 }}>{AYAH.arabic}</p>
        <p style={{ fontSize:14,color:"var(--ink-s)",lineHeight:1.7,fontStyle:"italic" }}>« {AYAH.fr} »</p>
      </div>

      {/* Sheet — Rejoindre par code */}
      {joinSheet && (
        <Sheet onClose={() => { setJoinSheet(false); setJoinCode(""); setJoinErr(""); }}>
          <h3 style={{ fontSize:17,fontWeight:800,color:"var(--ink)",marginBottom:6 }}>Rejoindre un cercle</h3>
          <p style={{ fontSize:13,color:"var(--ink-m)",marginBottom:16,lineHeight:1.6 }}>
            Entre le code d'invitation que ton ami t'a partagé.<br/>
            <strong>Le code est en majuscules</strong>, ex : AB3F9C
          </p>
          <input
            className="text-input"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Ex: AB3F9C"
            maxLength={10}
            style={{ marginBottom:8,textAlign:"center",fontSize:20,fontWeight:800,letterSpacing:4 }}
          />
          {joinErr && <p style={{ fontSize:13,color:"#EF4444",marginBottom:8,textAlign:"center" }}>{joinErr}</p>}
          <button onClick={handleJoin} disabled={joinLoad || !joinCode.trim()}
            style={{ width:"100%",background:"linear-gradient(135deg,var(--emerald),var(--emerald-l))",color:"#fff",border:"none",borderRadius:13,padding:"13px",cursor:"pointer",fontSize:14,fontWeight:700,opacity:joinCode.trim()?1:0.6,marginTop:4 }}>
            {joinLoad ? "⏳ Vérification..." : "Rejoindre 🤝"}
          </button>
        </Sheet>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   CORAN SCREEN
───────────────────────────────────────── */
function QuranScreen({ onOpen }) {
  const { surahs, loading, error } = useSurahs();
  const [search, setSearch] = useState("");
  const filtered = search
    ? surahs.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.arabic.includes(search) || String(s.id).includes(search))
    : surahs;

  return (
    <div style={{ flex:1,overflowY:"auto",padding:"10px 16px 16px" }}>
      <h2 style={{ fontSize:26,marginBottom:4,color:"var(--ink)",fontWeight:800 }}>Le Saint Coran</h2>
      <p style={{ fontSize:14,color:"var(--ink-m)",marginBottom:12 }}>114 sourates</p>
      <div style={{ position:"relative",marginBottom:14 }}>
        <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,color:"var(--ink-m)" }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une sourate..."
          style={{ width:"100%",padding:"11px 12px 11px 36px",borderRadius:12,border:"1px solid var(--border-s)",background:"var(--card)",color:"var(--ink)",fontSize:14,outline:"none",fontFamily:"'Nunito',sans-serif" }} />
      </div>
      {loading && (
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {Array.from({length:8}).map((_,i) => (
            <div key={i} className="card" style={{ padding:"14px",height:70,opacity:0.5 }}>
              <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:"var(--emerald-glow)" }} />
                <div style={{ flex:1,display:"flex",flexDirection:"column",gap:6 }}>
                  <div style={{ width:"40%",height:13,borderRadius:6,background:"var(--border-s)" }} />
                  <div style={{ width:"60%",height:11,borderRadius:6,background:"var(--border-s)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div style={{ textAlign:"center",padding:"40px 0",color:"var(--ink-m)" }}><p style={{ fontSize:28 }}>⚠️</p><p style={{ fontSize:14,marginTop:8 }}>Impossible de charger</p></div>}
      {!loading && !error && (
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {filtered.map((s,i) => (
            <div key={s.id} className="card fu" onClick={() => onOpen(s)}
              style={{ padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",animationDelay:`${Math.min(i,12)*0.03}s` }}>
              <div style={{ width:44,height:44,borderRadius:12,background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <span style={{ fontSize:14,fontWeight:700,color:"var(--emerald)" }}>{s.id}</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700,fontSize:16,color:"var(--ink)" }}>{s.name}</p>
                <p style={{ fontSize:12,color:"var(--ink-m)",marginTop:2 }}>{s.verses} versets · {s.rev}</p>
              </div>
              <p className="arabic" style={{ fontSize:22,color:"var(--gold)" }}>{s.arabic}</p>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign:"center",padding:"40px 0",color:"var(--ink-m)" }}><p style={{ fontSize:28 }}>🔍</p><p style={{ fontSize:14,marginTop:8 }}>Aucun résultat</p></div>}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   VERSE READER
───────────────────────────────────────── */
function VerseReader({ surah, initialVerseId, onClose, onGoHome, onAddH, notes, setNotes, goalSecs, onTimeSpent, savedVerses, setSavedVerses, fontSizes }) {
  const { verses, loading, error } = useSurahVerses(surah.id);
  const startIdx = initialVerseId ? Math.max(0, initialVerseId - 1) : 0;

  const [idx,    setIdx]    = useState(startIdx);
  const [cls,    setCls]    = useState("vs-in");
  const [readSet,setReadSet]= useState(new Set());
  const [showPop,setShowPop]= useState(false);
  const [hCount, setHCount] = useState(0);
  const [sheet,  setSheet]  = useState(null);
  const [noteText,setNoteText]=useState("");
  const [phonetic,setPhonetic]=useState(false);
  const [elapsed, setElapsed]=useState(0);
  const [audioPlaying,setAudioPlaying]=useState(false);
  const [audioLoading,setAudioLoading]=useState(false);
  const [saveBump,setSaveBump]=useState(false);
  const [tafsirText,setTafsirText]=useState(null);
  const [tafsirLoad,setTafsirLoad]=useState(false);
  const [tafsirErr,setTafsirErr]=useState(false);

  const audioRef = useRef(null);
  const anim     = useRef(false);
  const touchX   = useRef(null);
  const timerRef = useRef(null);

  const total = verses.length;
  const v     = verses[idx];
  const remaining = Math.max(0, goalSecs - elapsed);
  const pct       = Math.min(1, elapsed / goalSecs);
  const vk        = v ? `${surah.id}-${v.id}` : null;
  const isSaved   = vk ? !!savedVerses[vk] : false;

  // Sauvegarde la progression à chaque verset
  useEffect(() => { if (v) saveReadingProgress(surah.id, surah.name, surah.arabic, v.id); }, [idx, v]);

  // Timer de session
  useEffect(() => {
    if (!loading && verses.length > 0)
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, verses.length]);

  // Réinitialise à chaque changement de verset
  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setAudioPlaying(false); }
    if (v) setNoteText(notes[`${surah.id}-${v.id}`] || "");
    setSheet(null); setTafsirText(null); setTafsirErr(false);
  }, [idx]);

  // Charge le tafsir depuis Supabase quand on ouvre le sheet
  useEffect(() => {
    if (sheet !== "tafsir" || !v) return;
    setTafsirText(null); setTafsirErr(false); setTafsirLoad(true);
    dbGetTafsir(surah.id, v.id).then(text => {
      setTafsirLoad(false);
      if (text) setTafsirText(text);
      else setTafsirErr(true);
    });
  }, [sheet]);

  const toggleAudio = () => {
    if (!v?.audioUrl) return;
    if (audioRef.current) {
      if (audioPlaying) { audioRef.current.pause(); setAudioPlaying(false); }
      else              { audioRef.current.play();  setAudioPlaying(true);  }
      return;
    }
    setAudioLoading(true);
    const playVerse = () => {
      const a = new Audio(v.audioUrl); audioRef.current = a;
      a.oncanplay = () => { setAudioLoading(false); a.play(); setAudioPlaying(true); };
      a.onended   = () => setAudioPlaying(false);
      a.onerror   = () => { setAudioLoading(false); setAudioPlaying(false); };
    };
    if (idx === 0) {
      const bas = new Audio(BASMALA.audio); audioRef.current = bas;
      bas.oncanplay = () => { setAudioLoading(false); bas.play(); setAudioPlaying(true); };
      bas.onended   = () => { audioRef.current = null; playVerse(); };
      bas.onerror   = () => playVerse();
    } else playVerse();
  };

  const goTo = (next, dir) => {
    if (anim.current || next < 0 || next >= total) return;
    anim.current = true;
    if (navigator.vibrate) navigator.vibrate(40);
    setCls(dir === "l" ? "vs-out-l" : "vs-out-r");
    setTimeout(() => {
      setIdx(next);
      setCls(dir === "l" ? "vs-out-r" : "vs-out-l");
      requestAnimationFrame(() => requestAnimationFrame(() => { setCls("vs-in"); anim.current = false; }));
      if (dir === "l" && !readSet.has(idx)) {
        setReadSet(p => new Set([...p, idx]));
        onAddH(10); setHCount(c => c + 10);
        setShowPop(true); setTimeout(() => setShowPop(false), 900);
      }
    }, 280);
  };

  const markDone = () => {
    if (!readSet.has(idx)) { onAddH(10); setHCount(c => c + 10); }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    clearInterval(timerRef.current);
    onTimeSpent(elapsed);
    onClose(); onGoHome();
  };

  const toggleSave = () => {
    if (!v) return;
    setSavedVerses(p => {
      const n = { ...p };
      if (n[vk]) delete n[vk];
      else n[vk] = { surahId:surah.id, surahName:surah.name, verseId:v.id, arabic:v.arabic, fr:v.fr, savedAt:Date.now() };
      return n;
    });
    setSaveBump(true); setTimeout(() => setSaveBump(false), 200);
  };

  const saveNote = () => { setNotes(p => ({ ...p, [`${surah.id}-${v.id}`]: noteText })); setSheet(null); };

  const shareText = v ? `${v.arabic}\n\n${v.fr}\n\n— ${surah.name} ${surah.id}:${v.id}\n\nHassanates` : "";
  const share = () => {
    if (navigator.share) navigator.share({ title:`${surah.name} — Verset ${v.id}`, text:shareText });
    else navigator.clipboard?.writeText(shareText);
    setSheet(null);
  };

  const onTS = e => { touchX.current = e.touches[0].clientX; };
  const onTE = e => {
    if (!touchX.current) return;
    const dx = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 44) dx > 0 ? goTo(idx + 1, "l") : goTo(idx - 1, "r");
    touchX.current = null;
  };

  if (loading) return (
    <div className="reader" style={{ alignItems:"center",justifyContent:"center",gap:16 }}>
      <div style={{ width:56,height:56,borderRadius:"50%",background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28 }}>📖</div>
      <p style={{ fontSize:15,color:"var(--ink-m)",fontWeight:600 }}>Chargement de {surah.name}...</p>
      <div style={{ width:200,height:4,borderRadius:999,background:"var(--border-s)",overflow:"hidden" }}>
        <div style={{ width:"60%",height:"100%",background:"var(--emerald)",borderRadius:999,animation:"loadBar 1.2s ease-in-out infinite" }} />
      </div>
      <button onClick={() => { clearInterval(timerRef.current); onClose(); onGoHome(); }}
        style={{ background:"none",border:"none",cursor:"pointer",color:"var(--ink-m)",fontSize:14,fontWeight:600 }}>← Retour</button>
    </div>
  );

  if (error || !v) return (
    <div className="reader" style={{ alignItems:"center",justifyContent:"center",gap:12 }}>
      <p style={{ fontSize:28 }}>⚠️</p>
      <p style={{ fontSize:14,color:"var(--ink-m)" }}>Erreur de chargement</p>
      <button onClick={() => { clearInterval(timerRef.current); onClose(); onGoHome(); }}
        style={{ background:"var(--emerald)",color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",cursor:"pointer",fontWeight:700 }}>← Retour</button>
    </div>
  );

  return (
    <div className="reader" onTouchStart={onTS} onTouchEnd={onTE}>
      {/* Header */}
      <div style={{ padding:"44px 16px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:8 }}>
        <button onClick={markDone} style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"var(--ink-s)",flexShrink:0 }}>←</button>
        <div style={{ flex:1,textAlign:"center" }}>
          <p style={{ fontSize:15,fontWeight:800,color:"var(--emerald)" }}>{surah.name}</p>
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,marginTop:3 }}>
            <div style={{ background:"var(--emerald)",borderRadius:999,padding:"2px 12px",boxShadow:"0 2px 8px rgba(42,122,90,0.35)" }}>
              <span style={{ fontSize:12,fontWeight:800,color:"#fff" }}>{v.id} / {total}</span>
            </div>
            {hCount > 0 && (
              <div style={{ background:"rgba(224,107,139,0.12)",border:"1px solid rgba(224,107,139,0.25)",borderRadius:999,padding:"2px 9px" }}>
                <span style={{ fontSize:11,fontWeight:800,color:"var(--heart)" }}>+{hCount} ♥</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display:"flex",gap:6,flexShrink:0 }}>
          <button onClick={() => setPhonetic(!phonetic)}
            style={{ background:phonetic?"var(--emerald-glow)":"rgba(0,0,0,0.05)",border:"1px solid "+(phonetic?"rgba(61,170,127,0.3)":"var(--border-s)"),color:phonetic?"var(--emerald)":"var(--ink-m)",borderRadius:8,padding:"4px 9px",cursor:"pointer",fontSize:12,fontWeight:700 }}>Ph</button>
          <button onClick={toggleSave} className={saveBump ? "bump" : ""}
            style={{ background:isSaved?"rgba(196,154,60,0.15)":"rgba(0,0,0,0.05)",border:`1px solid ${isSaved?"rgba(196,154,60,0.4)":"var(--border-s)"}`,borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16 }}>🔖</button>
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ margin:"0 16px 10px",flexShrink:0 }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
          <span style={{ fontSize:12,color:"var(--ink-m)",fontWeight:600 }}>Objectif session</span>
          <span style={{ fontSize:12,color:remaining===0?"var(--gold)":"var(--emerald)",fontWeight:700 }}>{remaining===0?"✓ Atteint !":fmtTime(remaining)}</span>
        </div>
        <div style={{ background:"rgba(0,0,0,0.06)",borderRadius:999,height:5,overflow:"hidden" }}>
          <div style={{ width:`${pct*100}%`,height:"100%",background:pct>=1?"var(--gold)":"linear-gradient(90deg,var(--emerald),var(--emerald-l))",borderRadius:999,transition:"width 1s linear" }} />
        </div>
      </div>

      {/* Zone verset */}
      <div style={{ flex:1,position:"relative",overflow:"hidden" }}>
        <div className={`vslide ${cls}`} style={{ paddingTop:12 }}>
          {idx === 0 && (
            <div style={{ width:"100%",marginBottom:16,padding:"10px 14px",background:"var(--emerald-glow)",borderRadius:14,border:"1px solid rgba(42,122,90,0.2)",textAlign:"center" }}>
              <p className="arabic" style={{ fontSize:Math.round(fontSizes.arabic * 0.85),color:"var(--emerald)",lineHeight:2 }}>{BASMALA.arabic}</p>
              <p style={{ fontSize:fontSizes.fr-2,color:"var(--ink-m)",fontStyle:"italic",marginTop:4 }}>{BASMALA.fr}</p>
            </div>
          )}
          <p className="arabic" style={{ fontSize:fontSizes.arabic,lineHeight:2.4,textAlign:"center",color:"var(--ink)",marginBottom:20,width:"100%" }}>{v.arabic}</p>
          <div style={{ display:"flex",alignItems:"center",gap:12,width:"100%",marginBottom:16 }}>
            <div style={{ flex:1,height:1,background:"var(--border-s)" }} />
            <span style={{ color:"var(--gold)",fontSize:14 }}>✦</span>
            <div style={{ flex:1,height:1,background:"var(--border-s)" }} />
          </div>
          {phonetic && <p style={{ fontSize:fontSizes.phonetic,color:"var(--ink-m)",fontStyle:"italic",textAlign:"center",lineHeight:1.8,marginBottom:12,width:"100%" }}></p>}
          <p style={{ fontSize:fontSizes.fr,color:"var(--ink-s)",lineHeight:1.9,textAlign:"center",width:"100%" }}>{v.fr}</p>
          {notes[`${surah.id}-${v.id}`] && (
            <div style={{ marginTop:16,background:"var(--emerald-glow)",borderRadius:12,padding:"9px 14px",border:"1px solid rgba(61,170,127,0.2)",width:"100%" }}>
              <p style={{ fontSize:12,color:"var(--emerald)",fontWeight:600 }}>📝 {notes[`${surah.id}-${v.id}`]}</p>
            </div>
          )}
        </div>
        {showPop && <div className="hpop">+10 ♥</div>}
      </div>

      {/* Dots */}
      <div style={{ display:"flex",gap:5,justifyContent:"center",padding:"6px 0",flexShrink:0,overflowX:"auto" }}>
        {verses.slice(0,20).map((_,i) => (
          <div key={i} className="dot" onClick={() => goTo(i, i > idx ? "l" : "r")}
            style={{ background:i===idx?"var(--emerald)":readSet.has(i)?"var(--emerald-l)":"rgba(0,0,0,0.12)",width:i===idx?20:6 }} />
        ))}
        {verses.length > 20 && <span style={{ fontSize:10,color:"var(--ink-m)",alignSelf:"center" }}>+{verses.length-20}</span>}
      </div>

      {/* Boutons action */}
      <div style={{ padding:"4px 12px",display:"flex",gap:6,flexShrink:0 }}>
        <button onClick={toggleAudio} style={{ flex:1,background:audioPlaying?"var(--emerald-glow)":"var(--card)",border:`1px solid ${audioPlaying?"rgba(42,122,90,0.4)":"var(--border)"}`,borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:audioPlaying?"var(--emerald)":"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>{audioLoading?"⏳":audioPlaying?"⏸ Stop":"▶ Écouter"}</button>
        <button onClick={() => setSheet("note")} style={{ flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>✏️ Note</button>
        <button onClick={() => setSheet("tafsir")} style={{ flex:1,background:"linear-gradient(135deg,rgba(196,154,60,0.15),rgba(196,154,60,0.08))",border:"1px solid rgba(196,154,60,0.35)",borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>📖 Tafsir</button>
        <button onClick={() => setSheet("share")} style={{ flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center" }}>🔗</button>
      </div>

      {/* Navigation */}
      <div style={{ padding:"6px 16px 32px",display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
        <button onClick={() => goTo(idx-1,"r")} disabled={idx===0} style={{ width:48,height:48,borderRadius:"50%",border:"1px solid var(--border)",background:"var(--card)",cursor:idx===0?"default":"pointer",opacity:idx===0?0.3:1,fontSize:18,color:"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
        <button onClick={markDone} style={{ flex:1,height:48,borderRadius:14,border:"none",background:"linear-gradient(135deg,#2A7A5A,#3DAA7F)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 18px rgba(42,122,90,0.4)" }}>J'ai fini ✓</button>
        <button onClick={() => goTo(idx+1,"l")} disabled={idx===total-1} style={{ width:48,height:48,borderRadius:"50%",border:"none",background:idx===total-1?"rgba(0,0,0,0.06)":"var(--emerald)",cursor:idx===total-1?"default":"pointer",opacity:idx===total-1?0.3:1,fontSize:18,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>→</button>
      </div>

      {/* Sheet Tafsir */}
      {sheet==="tafsir" && (
        <Sheet onClose={() => setSheet(null)}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#C49A3C,#E8C060)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>📖</div>
            <div><p style={{ fontSize:15,fontWeight:800,color:"var(--ink)" }}>Tafsir</p><p style={{ fontSize:11,color:"var(--ink-m)" }}>{surah.name} — Verset {v.id}</p></div>
          </div>
          <p className="arabic" style={{ fontSize:20,textAlign:"right",lineHeight:2,color:"var(--emerald)",marginBottom:14 }}>{v.arabic}</p>
          <div style={{ background:"rgba(0,0,0,0.03)",borderRadius:14,padding:"14px",border:"1px solid var(--border-s)",minHeight:80 }}>
            {tafsirLoad && <p style={{ fontSize:13,color:"var(--ink-m)",textAlign:"center",padding:"20px 0" }}>⏳ Chargement...</p>}
            {tafsirErr && !tafsirLoad && (
              <div style={{ textAlign:"center",padding:"12px 0" }}>
                <p style={{ fontSize:20 }}>📭</p>
                <p style={{ fontSize:13,color:"var(--ink-m)",marginTop:8,fontWeight:600 }}>Tafsir non disponible</p>
                <p style={{ fontSize:12,color:"var(--ink-m)",marginTop:4,lineHeight:1.6 }}>
                  Tu peux ajouter du contenu dans Supabase<br/>via l'éditeur SQL → table <code>tafsirs</code>
                </p>
              </div>
            )}
            {tafsirText && !tafsirLoad && <p style={{ fontSize:14,color:"var(--ink-s)",lineHeight:1.9 }}>{tafsirText}</p>}
          </div>
        </Sheet>
      )}

      {/* Sheet Note */}
      {sheet==="note" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3 style={{ fontSize:17,marginBottom:4,color:"var(--ink)" }}>Note privée</h3>
          <p style={{ fontSize:12,color:"var(--ink-m)",marginBottom:12 }}>{surah.name} — Verset {v.id}</p>
          <p className="arabic" style={{ fontSize:20,textAlign:"right",lineHeight:2,marginBottom:12,color:"var(--emerald)" }}>{v.arabic}</p>
          <textarea rows={4} placeholder="Réflexion, mémorisation..." value={noteText} onChange={e => setNoteText(e.target.value)} />
          <button onClick={saveNote} style={{ marginTop:10,width:"100%",background:"var(--emerald)",color:"#fff",border:"none",borderRadius:13,padding:"13px",cursor:"pointer",fontSize:14,fontWeight:700 }}>Sauvegarder ✓</button>
        </Sheet>
      )}

      {/* Sheet Partage */}
      {sheet==="share" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3 style={{ fontSize:17,marginBottom:12,color:"var(--ink)" }}>Partager ce verset</h3>
          <div style={{ background:"rgba(0,0,0,0.04)",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid var(--border-s)" }}>
            <p className="arabic" style={{ fontSize:20,textAlign:"right",lineHeight:2,marginBottom:10,color:"var(--ink)" }}>{v.arabic}</p>
            <div style={{ height:1,background:"var(--border-s)",marginBottom:10 }} />
            <p style={{ fontSize:13,color:"var(--ink-s)",lineHeight:1.7,fontStyle:"italic" }}>{v.fr}</p>
            <p style={{ fontSize:11,color:"var(--ink-m)",marginTop:8,textAlign:"right" }}>— {surah.name} {surah.id}:{v.id}</p>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={share} style={{ flex:1,background:"var(--emerald)",color:"#fff",border:"none",borderRadius:13,padding:"13px",cursor:"pointer",fontSize:13,fontWeight:700 }}>📤 Partager</button>
            <button onClick={() => { navigator.clipboard?.writeText(shareText); setSheet(null); }} style={{ flex:1,background:"rgba(0,0,0,0.05)",color:"var(--ink-s)",border:"1px solid var(--border-s)",borderRadius:13,padding:"13px",cursor:"pointer",fontSize:13,fontWeight:700 }}>📋 Copier</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   DHIKR SCREEN
───────────────────────────────────────── */
function DhikrScreen({ onAddH, toast }) {
  const [sel,    setSel]    = useState(null);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [ctrs,   setCtrs]   = useState({});
  const [bump,   setBump]   = useState(null);
  const [tab,    setTab]    = useState("p");

  const cats = tab === "p" ? DHIKR_CATS.slice(0,6) : DHIKR_CATS.slice(6);
  const tap  = d => {
    const cur = ctrs[d.id] || 0;
    if (cur >= d.count) return;
    const next = cur + 1;
    setCtrs(p => ({ ...p, [d.id]:next }));
    setBump(d.id); setTimeout(() => setBump(null), 180);
    if (next === d.count) { onAddH(d.h); toast(`+${d.h} ♥`); }
  };

  if (detail && sel) {
    const d = detail, cur = ctrs[d.id]||0, done = cur >= d.count;
    return (
      <div style={{ flex:1,overflowY:"auto",padding:"10px 16px 24px" }}>
        <button onClick={() => setDetail(null)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:22,color:"var(--ink-s)",marginBottom:16 }}>←</button>
        <div className="card" style={{ padding:"20px" }}>
          <p style={{ fontSize:12,color:"var(--ink-m)",marginBottom:8,fontWeight:600 }}>{sel.label}</p>
          <p style={{ fontSize:18,fontWeight:800,color:"var(--ink)",marginBottom:16,lineHeight:1.4 }}>{d.title}</p>
          <p className="arabic" style={{ fontSize:30,textAlign:"right",lineHeight:2.4,color:"var(--ink)",marginBottom:16 }}>{d.arabic}</p>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
            <div style={{ flex:1,height:1,background:"var(--border-s)" }} /><span style={{ color:"var(--gold)" }}>✦</span><div style={{ flex:1,height:1,background:"var(--border-s)" }} />
          </div>
          <p style={{ fontSize:14,color:"var(--ink-m)",fontStyle:"italic",lineHeight:1.8,marginBottom:12 }}>{d.phonetic}</p>
          <p style={{ fontSize:15,color:"var(--ink-s)",lineHeight:1.9,marginBottom:20 }}>{d.fr}</p>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
            <span style={{ fontSize:13,fontWeight:700,color:done?"var(--gold)":"var(--emerald)" }}>+{d.h} ♥ · {d.count}×</span>
            <button className={bump===d.id?"bump":""} onClick={() => tap(d)} disabled={done}
              style={{ width:72,height:72,borderRadius:"50%",border:"none",cursor:done?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:done?"rgba(0,0,0,0.05)":`linear-gradient(135deg,${sel.grad[0]},${sel.grad[1]})`,color:done?"var(--ink-m)":"#fff",boxShadow:done?"none":`0 4px 18px ${sel.grad[0]}55` }}>
              {done ? <span style={{ fontSize:28 }}>✓</span> : <><span style={{ fontSize:22,fontWeight:800,lineHeight:1 }}>{cur}</span><span style={{ fontSize:11 }}>/{d.count}</span></>}
            </button>
          </div>
          <div style={{ background:"rgba(0,0,0,0.05)",borderRadius:999,height:6,overflow:"hidden" }}>
            <div style={{ width:`${Math.round((cur/d.count)*100)}%`,height:"100%",background:done?"var(--gold)":`linear-gradient(90deg,${sel.grad[0]},${sel.grad[1]})`,borderRadius:999,transition:"width 0.25s" }} />
          </div>
        </div>
      </div>
    );
  }

  if (sel) {
    const items = search ? sel.items.filter(d => d.title.toLowerCase().includes(search.toLowerCase())) : sel.items;
    return (
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ padding:"44px 16px 14px",flexShrink:0,background:sel.bg }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <button onClick={() => { setSel(null); setSearch(""); }} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"#fff" }}>←</button>
            <div><p style={{ fontSize:20,fontWeight:800,color:"#fff" }}>{sel.label}</p><p style={{ fontSize:12,color:"rgba(255,255,255,0.7)" }}>{sel.items.length} invocations</p></div>
          </div>
        </div>
        <div style={{ padding:"12px 16px 0",flexShrink:0 }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,color:"var(--ink-m)" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ width:"100%",padding:"10px 12px 10px 36px",borderRadius:12,border:"1px solid var(--border-s)",background:"var(--card)",color:"var(--ink)",fontSize:14,outline:"none",fontFamily:"'Nunito',sans-serif" }} />
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto" }}>
          <div className="card" style={{ margin:"12px 16px",overflow:"hidden" }}>
            {items.map((d,i) => {
              const cur = ctrs[d.id]||0, done = cur >= d.count;
              return (
                <div key={d.id} className="list-item" style={{ opacity:done?0.6:1 }} onClick={() => setDetail(d)}>
                  <div style={{ width:38,height:38,borderRadius:"50%",background:done?"var(--gold)":"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:done?"#fff":"var(--emerald)",flexShrink:0 }}>{done?"✓":i+1}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:15,fontWeight:700,color:"var(--ink)",lineHeight:1.3 }}>{d.title}</p>
                    <p style={{ fontSize:12,color:"var(--ink-m)",marginTop:2 }}>{done?`Complété · +${d.h} ♥`:`${d.count}× · +${d.h} ♥`}</p>
                  </div>
                  <span style={{ color:"var(--ink-m)",fontSize:18 }}>›</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1,overflowY:"auto",padding:"10px 16px 16px" }}>
      <h2 style={{ fontSize:24,fontWeight:800,color:"var(--ink)",marginBottom:14 }}>Dhikr & Doua</h2>
      <div className="tab-bar" style={{ marginBottom:16 }}>
        <button className={`tab${tab==="p"?" active":""}`} onClick={() => setTab("p")}>⭐ Principal</button>
        <button className={`tab${tab==="a"?" active":""}`} onClick={() => setTab("a")}>🗂️ Autre</button>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        {cats.map((cat,i) => (
          <div key={cat.id} className="dhikr-cat fu" onClick={() => setSel(cat)}
            style={{ background:cat.bg,animationDelay:`${i*0.05}s`,boxShadow:`0 6px 24px ${cat.grad[0]}55` }}>
            <div className="dhikr-cat-bg">{cat.icon}</div>
            <p style={{ position:"relative",fontSize:15,fontWeight:800,color:"#fff",lineHeight:1.3,textShadow:"0 1px 6px rgba(0,0,0,0.35)" }}>{cat.label}</p>
            <p style={{ position:"relative",fontSize:11,color:"rgba(255,255,255,0.75)",marginTop:3,fontWeight:600 }}>{cat.items.length} invocations →</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop:20,padding:"16px",background:"var(--emerald-glow)",borderRadius:18,border:"1px solid rgba(42,122,90,0.15)",textAlign:"center" }}>
        <p className="arabic" style={{ fontSize:20,color:"var(--emerald)",lineHeight:2,marginBottom:6 }}>وَاذْكُر رَّبَّكَ كَثِيرًا</p>
        <p style={{ fontSize:13,color:"var(--ink-s)",fontStyle:"italic" }}>« Invoque ton Seigneur beaucoup. » — Al-Imran 3:41</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ÉMOTIONS SCREEN
───────────────────────────────────────── */
function EmotionsScreen({ onAddH, toast }) {
  const [sel,  setSel]  = useState(null);
  const [doua, setDoua] = useState(null);
  const [ctr,  setCtr]  = useState({});

  if (doua && sel) {
    const cur = ctr[doua.id]||0, done = cur >= doua.count;
    const idx = sel.douas.indexOf(doua), total = sel.douas.length;
    return (
      <div className="fullscreen" style={{ background:sel.color }}>
        {/* Header */}
        <div style={{ padding:"44px 16px 20px",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
            <button onClick={() => setDoua(null)} style={{ background:"rgba(0,0,0,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:sel.tc }}>←</button>
            <span style={{ fontSize:13,fontWeight:700,color:sel.tc,background:"rgba(0,0,0,0.08)",borderRadius:999,padding:"4px 12px" }}>{idx+1} / {total}</span>
            <div style={{ width:36 }} />
          </div>
          <h2 style={{ fontSize:18,fontWeight:800,color:sel.tc,lineHeight:1.4 }}>{doua.title}</h2>
        </div>
        {/* Contenu */}
        <div style={{ flex:1,overflowY:"auto",background:"var(--bg-from)",padding:"24px 20px" }}>
          <p className="arabic" style={{ fontSize:32,lineHeight:2.4,textAlign:"center",color:"var(--ink)",marginBottom:28 }}>{doua.arabic}</p>
          <p style={{ fontSize:15,color:"var(--ink-m)",fontStyle:"italic",lineHeight:1.9,textAlign:"center",marginBottom:20 }}>{doua.phonetic}</p>
          <div style={{ height:1,background:"var(--border-s)",marginBottom:20 }} />
          <p style={{ fontSize:16,color:"var(--ink-s)",lineHeight:1.9,fontWeight:500,marginBottom:24 }}>{doua.fr}</p>
          <p style={{ fontSize:12,color:"var(--ink-m)",textAlign:"right",marginBottom:16 }}>📚 {doua.source}</p>
          {doua.count > 1 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ background:"rgba(0,0,0,0.08)",borderRadius:999,height:6,overflow:"hidden" }}>
                <div style={{ width:`${Math.round((cur/doua.count)*100)}%`,height:"100%",background:sel.tc,borderRadius:999,transition:"width 0.25s" }} />
              </div>
              <p style={{ fontSize:12,color:"var(--ink-m)",textAlign:"center",marginTop:8 }}>{cur} / {doua.count}</p>
            </div>
          )}
        </div>
        {/* Boutons bas */}
        <div style={{ padding:"12px 20px 36px",flexShrink:0,background:"var(--bg-from)",borderTop:"1px solid var(--border-s)" }}>
          <button onClick={() => {
            if (done) return;
            const next = (ctr[doua.id]||0) + 1;
            setCtr(p => ({ ...p, [doua.id]:next }));
            if (next >= doua.count) { onAddH(20); toast("+20 ♥"); }
          }} disabled={done}
            style={{ width:"100%",height:56,borderRadius:16,border:"none",cursor:done?"default":"pointer",background:done?"var(--emerald-glow)":sel.color,color:done?"var(--emerald)":sel.tc,fontSize:done?15:22,fontWeight:800,boxShadow:done?"none":`0 4px 18px ${sel.color}AA`,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10 }}>
            {done ? "✓ Récité" : doua.count===1 ? "Récité ✓" : <><span style={{ fontSize:26,fontWeight:800,lineHeight:1 }}>{cur}</span><span style={{ fontSize:14 }}>/{doua.count}</span></>}
          </button>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={() => setDoua(sel.douas[idx-1])} disabled={idx===0} style={{ flex:1,height:44,borderRadius:12,border:"1px solid var(--border-s)",background:"var(--card)",cursor:idx===0?"default":"pointer",opacity:idx===0?0.3:1,fontSize:14,fontWeight:700,color:"var(--ink-s)" }}>← Précédent</button>
            <button onClick={() => setDoua(sel.douas[idx+1])} disabled={idx===total-1} style={{ flex:1,height:44,borderRadius:12,border:"none",background:idx===total-1?"rgba(0,0,0,0.06)":"var(--emerald)",cursor:idx===total-1?"default":"pointer",opacity:idx===total-1?0.3:1,fontSize:14,fontWeight:700,color:"#fff" }}>Suivant →</button>
          </div>
        </div>
      </div>
    );
  }

  if (sel) {
    return (
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ background:sel.color,padding:"44px 16px 20px",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
            <button onClick={() => setSel(null)} style={{ background:"rgba(0,0,0,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:sel.tc }}>←</button>
            <div><h2 style={{ fontSize:20,fontWeight:800,color:sel.tc }}>{sel.label}</h2><p style={{ fontSize:12,color:sel.tc,opacity:0.7 }}>{sel.douas.length} invocations</p></div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.35)",borderRadius:14,padding:"12px 14px" }}>
            <p style={{ fontSize:13,color:sel.tc,fontWeight:600,lineHeight:1.5 }}>Sélectionne une supplication à réciter.</p>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto" }}>
          <div className="card" style={{ margin:"12px 16px",overflow:"hidden" }}>
            {sel.douas.map((d,i) => {
              const done = (ctr[d.id]||0) >= d.count;
              return (
                <div key={d.id} className="list-item" style={{ opacity:done?0.6:1,padding:"18px 16px" }} onClick={() => setDoua(d)}>
                  <div style={{ width:38,height:38,borderRadius:"50%",background:done?sel.color:"rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:done?sel.tc:"var(--ink-m)",flexShrink:0 }}>{done?"✓":i+1}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:15,fontWeight:700,color:"var(--ink)",lineHeight:1.4 }}>{d.title}</p>
                    {done && <p style={{ fontSize:11,color:"var(--emerald)",fontWeight:700,marginTop:3 }}>✓ Complété</p>}
                  </div>
                  <span style={{ color:"var(--ink-m)",fontSize:20 }}>›</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1,overflowY:"auto",padding:"10px 16px 16px" }}>
      <h2 style={{ fontSize:26,fontWeight:800,color:"var(--ink)",marginBottom:4 }}>Émotions</h2>
      <p style={{ fontSize:15,color:"var(--ink-m)",marginBottom:20 }}>Que <strong style={{ color:"var(--ink)" }}>ressens-tu</strong> ?</p>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        {EMOTIONS.map((em,i) => (
          <button key={em.id} className="emotion-card fu" onClick={() => setSel(em)}
            style={{ background:em.color,animationDelay:`${i*0.04}s`,boxShadow:`0 4px 16px ${em.color}88` }}>
            <div style={{ textAlign:"center" }}>
              <span style={{ fontSize:28,display:"block",marginBottom:8 }}>{em.icon}</span>
              <p style={{ fontSize:16,fontWeight:700,color:em.tc }}>{em.label}</p>
            </div>
          </button>
        ))}
      </div>
      <div style={{ marginTop:20,padding:"14px 16px",background:"var(--emerald-glow)",borderRadius:16,border:"1px solid rgba(42,122,90,0.15)",textAlign:"center" }}>
        <p style={{ fontSize:13,color:"var(--ink-s)",fontStyle:"italic" }}>« Allah est avec ceux qui se maîtrisent. » — An-Nahl 16:128</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PROFIL SCREEN
───────────────────────────────────────── */
const BADGES = [
  { id:"hafidh",   icon:"🌙", name:"Hafidh",    cond:()=>true,              color:"#3DAA7F" },
  { id:"mukhlis",  icon:"♥",  name:"Mukhlis",   cond:(_,h)=>h>=1000,        color:"#E06B8B" },
  { id:"sabir",    icon:"⭐", name:"Sabir",     cond:(_,h)=>h>=5000,        color:"#E8C060" },
  { id:"fajr",     icon:"🌅", name:"Lève-tôt",  cond:(s)=>s>=7,             color:"#C49A3C" },
  { id:"murabit",  icon:"🛡️", name:"Murabit",   cond:(s)=>s>=30,            color:"#7C6AE8" },
  { id:"tadabbur", icon:"📖", name:"Tadabbur",  cond:()=>false,             color:"#2A7A5A" },
  { id:"dhakir",   icon:"📿", name:"Dhakir",    cond:()=>false,             color:"#4A90D9" },
  { id:"gold",     icon:"★",  name:"Gold",      cond:(_,__,p)=>p,           color:"#C49A3C" },
];

function ProfilScreen({ hassanates, streak, readingMins, goalMins, setGoalMins, onOpenPremium, isPremium, fontSizes, setFontSizes, savedVerses, setSavedVerses, userName, userEmail, userAvatar, onLogout, onUpdateAvatar, circle, circleMembers, onLeaveCircle }) {
  const [notifFajr,  setNotifFajr]  = useState(true);
  const [notifSoir,  setNotifSoir]  = useState(true);
  const [notifDhikr, setNotifDhikr] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);

  const earned    = BADGES.filter(b => b.cond(streak, hassanates, isPremium));
  const locked    = BADGES.filter(b => !b.cond(streak, hassanates, isPremium));
  const savedList = Object.values(savedVerses);

  return (
    <div style={{ flex:1,overflowY:"auto",padding:"10px 16px 20px" }}>

      {/* Avatar + nom */}
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",marginBottom:18 }}>
        <button onClick={() => setShowAvatar(true)}
          style={{ width:76,height:76,borderRadius:"50%",background:"linear-gradient(135deg,var(--emerald),var(--emerald-l))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,marginBottom:10,boxShadow:"0 6px 20px rgba(42,122,90,0.35)",border:"none",cursor:"pointer",position:"relative" }}>
          {userAvatar}
          <span style={{ position:"absolute",bottom:0,right:0,width:22,height:22,borderRadius:"50%",background:"var(--card)",border:"2px solid var(--emerald)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11 }}>✏️</span>
        </button>
        <p style={{ fontSize:22,fontWeight:800,color:"var(--ink)",fontFamily:"'Playfair Display',serif",textTransform:"capitalize" }}>{userName}</p>
        <p style={{ fontSize:12,color:"var(--ink-m)",marginTop:2 }}>{userEmail}</p>
        <div style={{ display:"flex",gap:6,marginTop:8 }}>
          <span className="pill">Récitant ♥</span>
          {isPremium && <span style={{ display:"inline-flex",alignItems:"center",gap:4,background:"rgba(196,154,60,0.15)",color:"var(--gold)",borderRadius:999,padding:"3px 10px",fontSize:12,fontWeight:700,border:"1px solid rgba(196,154,60,0.3)" }}>★ Gold</span>}
        </div>
      </div>

      {/* Bannière Premium */}
      {!isPremium && (
        <div onClick={onOpenPremium} style={{ background:"linear-gradient(135deg,#1A1035,#2D1F5E)",borderRadius:18,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:"1px solid rgba(196,154,60,0.3)" }}>
          <div style={{ width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#C49A3C,#E8C060)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>★</div>
          <div style={{ flex:1 }}><p style={{ fontSize:14,fontWeight:800,color:"#E8C060" }}>Devenir Premium Gold</p><p style={{ fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:2 }}>Tafsir · Stats avancées</p></div>
          <span style={{ color:"rgba(196,154,60,0.7)",fontSize:20 }}>›</span>
        </div>
      )}

      {/* Stats globales */}
      <div style={{ background:"linear-gradient(135deg,#E06B8B,#F09AAF)",borderRadius:18,padding:"16px 20px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <p style={{ color:"rgba(255,255,255,0.85)",fontSize:13,fontWeight:600 }}>Total Hassanates</p>
          <p style={{ color:"#fff",fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",marginTop:2 }}>{hassanates.toLocaleString()} ♥</p>
          <p style={{ color:"rgba(255,255,255,0.7)",fontSize:12,marginTop:4 }}>🔥 {streak} jours · ⏱️ {readingMins} min lues</p>
        </div>
        <p style={{ fontSize:40 }}>🌟</p>
      </div>

      {/* Mon cercle dans le profil */}
      {circle && (
        <div className="card" style={{ padding:"16px",marginBottom:14 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <p style={{ fontSize:14,fontWeight:800,color:"var(--ink)" }}>🤝 {circle.name}</p>
            <span style={{ fontSize:12,color:"var(--ink-m)" }}>{circleMembers.length} membre{circleMembers.length>1?"s":""}</span>
          </div>
          <p style={{ fontSize:13,color:"var(--ink-m)",marginBottom:12 }}>
            Code : <strong style={{ color:"var(--emerald)",fontSize:15,letterSpacing:2 }}>{circle.invite_code}</strong>
          </p>
          <button onClick={onLeaveCircle}
            style={{ width:"100%",padding:"10px",borderRadius:12,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.06)",color:"#EF4444",fontSize:13,fontWeight:700,cursor:"pointer" }}>
            Quitter le cercle
          </button>
        </div>
      )}

      {/* Réglages polices */}
      <p style={{ fontSize:12,fontWeight:700,color:"var(--ink-m)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8 }}>Taille des polices (Lecteur Coran)</p>
      <div className="card" style={{ padding:"16px",marginBottom:14 }}>
        {[
          { key:"arabic",   label:"Texte arabe",   icon:"🔤", min:20, max:48, preview:<p className="arabic" style={{ fontSize:fontSizes.arabic,textAlign:"center",color:"var(--emerald)",marginTop:8,lineHeight:1.8 }}>بِسْمِ اللَّهِ</p> },
          { key:"fr",       label:"Traduction",     icon:"🇫🇷", min:12, max:24, preview:<p style={{ fontSize:fontSizes.fr,textAlign:"center",color:"var(--ink-s)",marginTop:8 }}>Au nom d'Allah</p> },
          { key:"phonetic", label:"Phonétique",     icon:"📢", min:10, max:20, preview:<p style={{ fontSize:fontSizes.phonetic,textAlign:"center",color:"var(--ink-m)",fontStyle:"italic",marginTop:8 }}>Bismi llahi...</p> },
        ].map((item,i,arr) => (
          <div key={item.key} style={{ marginBottom:i<arr.length-1?18:0 }}>
            {i>0 && <div style={{ height:1,background:"var(--border-s)",marginBottom:18 }} />}
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}><span style={{ fontSize:16 }}>{item.icon}</span><p style={{ fontSize:14,fontWeight:700,color:"var(--ink)" }}>{item.label}</p></div>
              <span style={{ fontSize:14,fontWeight:800,color:"var(--emerald)" }}>{fontSizes[item.key]}px</span>
            </div>
            <input type="range" min={item.min} max={item.max} value={fontSizes[item.key]} onChange={e => setFontSizes(p => ({ ...p,[item.key]:Number(e.target.value) }))} />
            {item.preview}
          </div>
        ))}
      </div>

      {/* Objectif lecture */}
      <div className="card" style={{ padding:"14px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12 }}>
        <span style={{ fontSize:22 }}>⏱️</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:15,fontWeight:700,color:"var(--ink)" }}>Objectif de lecture</p>
          <p style={{ fontSize:12,color:"var(--ink-m)" }}>par session</p>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <button onClick={() => setGoalMins(m => Math.max(5,m-5))} style={{ width:30,height:30,borderRadius:8,background:"var(--emerald-glow)",border:"none",cursor:"pointer",fontSize:18,color:"var(--emerald)",display:"flex",alignItems:"center",justifyContent:"center" }}>-</button>
          <span style={{ fontSize:15,fontWeight:800,color:"var(--emerald)",minWidth:50,textAlign:"center" }}>{goalMins} min</span>
          <button onClick={() => setGoalMins(m => Math.min(120,m+5))} style={{ width:30,height:30,borderRadius:8,background:"var(--emerald-glow)",border:"none",cursor:"pointer",fontSize:18,color:"var(--emerald)",display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
        </div>
      </div>

      {/* Versets sauvegardés */}
      {savedList.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:12,fontWeight:700,color:"var(--ink-m)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8 }}>🔖 Versets sauvegardés ({savedList.length})</p>
          <div className="card" style={{ overflow:"hidden" }}>
            {savedList.slice(0,5).map((sv,i) => (
              <div key={i} style={{ padding:"12px 16px",borderBottom:i<Math.min(savedList.length,5)-1?"1px solid var(--border-s)":"none",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:36,height:36,borderRadius:10,background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <span style={{ fontSize:11,fontWeight:700,color:"var(--emerald)" }}>{sv.surahId}:{sv.verseId}</span>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13,fontWeight:700,color:"var(--ink)" }}>{sv.surahName}</p>
                  <p className="arabic" style={{ fontSize:13,color:"var(--ink-m)",marginTop:2,textAlign:"right" }}>{sv.arabic?.slice(0,30)}...</p>
                </div>
                <button onClick={() => setSavedVerses(p => { const n={...p}; delete n[`${sv.surahId}-${sv.verseId}`]; return n; })} style={{ background:"none",border:"none",cursor:"pointer",fontSize:16,color:"var(--ink-m)" }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div style={{ marginBottom:18 }}>
        <p style={{ fontSize:14,fontWeight:800,color:"var(--ink)",marginBottom:4 }}>🏅 Mes Succès</p>
        <p style={{ fontSize:12,color:"var(--ink-m)",marginBottom:12 }}>{earned.length} / {BADGES.length} obtenus</p>
        {earned.length > 0 && (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12 }}>
            {earned.map(b => (
              <div key={b.id} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
                <div style={{ width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${b.color}33,${b.color}18)`,border:`2px solid ${b.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>{b.icon}</div>
                <p style={{ fontSize:11,fontWeight:700,color:"var(--ink-s)",textAlign:"center" }}>{b.name}</p>
              </div>
            ))}
          </div>
        )}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
          {locked.map(b => (
            <div key={b.id} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
              <div style={{ width:56,height:56,borderRadius:16,background:"rgba(0,0,0,0.05)",border:"2px solid var(--border-s)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,filter:"grayscale(1)",opacity:0.4 }}>{b.icon}</div>
              <p style={{ fontSize:11,color:"var(--ink-m)",textAlign:"center" }}>{b.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <p style={{ fontSize:12,fontWeight:700,color:"var(--ink-m)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8 }}>Notifications</p>
      <div className="card" style={{ overflow:"hidden",marginBottom:14 }}>
        {[
          { icon:"🌅", label:"Rappel Fajr",  val:notifFajr,  set:setNotifFajr  },
          { icon:"🌙", label:"Rappel soir",  val:notifSoir,  set:setNotifSoir  },
          { icon:"📿", label:"Rappel Dhikr", val:notifDhikr, set:setNotifDhikr },
        ].map((it,ii,arr) => (
          <div key={ii} style={{ padding:"13px 16px",borderBottom:ii<arr.length-1?"1px solid var(--border-s)":"none",display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:34,height:34,borderRadius:10,background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{it.icon}</div>
            <p style={{ flex:1,fontSize:14,fontWeight:700,color:"var(--ink)" }}>{it.label}</p>
            <Toggle on={it.val} onToggle={() => it.set(v => !v)} />
          </div>
        ))}
      </div>

      {/* Déconnexion */}
      <button onClick={onLogout}
        style={{ width:"100%",padding:"14px",borderRadius:14,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.06)",color:"#EF4444",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:12 }}>
        🚪 Se déconnecter
      </button>
      <p style={{ fontSize:12,color:"var(--ink-m)",textAlign:"center" }}>Hassanates v1.0.0 — Fait avec ♥</p>

      {/* Sheet choix avatar */}
      {showAvatar && (
        <Sheet onClose={() => setShowAvatar(false)}>
          <h3 style={{ fontSize:17,fontWeight:800,color:"var(--ink)",marginBottom:16 }}>Choisis ton avatar</h3>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12 }}>
            {AVATARS.map(av => (
              <button key={av} onClick={() => { onUpdateAvatar(av); setShowAvatar(false); }}
                style={{ width:"100%",aspectRatio:"1",borderRadius:16,background:av===userAvatar?"var(--emerald-glow)":"rgba(0,0,0,0.04)",border:av===userAvatar?"2px solid var(--emerald)":"2px solid transparent",cursor:"pointer",fontSize:28,display:"flex",alignItems:"center",justifyContent:"center" }}>
                {av}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   PREMIUM PAGE
───────────────────────────────────────── */
function PremiumPage({ onClose, onActivate }) {
  const [activated, setActivated] = useState(false);
  const go = () => { setActivated(true); setTimeout(() => { onActivate(); onClose(); }, 1200); };
  const features = [
    { icon:"📖", title:"Tafsir en français",          sub:"Via Supabase — bientôt disponible" },
    { icon:"💚", title:"Émotions avancées",            sub:"Plus de douas par état d'âme"       },
    { icon:"📊", title:"Statistiques avancées",        sub:"Suivi détaillé de ta progression"   },
    { icon:"🏆", title:"Badges premium",               sub:"Accomplissements exclusifs"          },
    { icon:"🔔", title:"Rappels intelligents",         sub:"Selon tes temps de prière"           },
    { icon:"☁️", title:"Sauvegarde cloud complète",    sub:"Synchronisation multi-appareils"     },
  ];
  return (
    <div style={{ position:"fixed",inset:0,zIndex:250,maxWidth:430,margin:"0 auto",background:"linear-gradient(160deg,#1A1035,#0D1B2A)",display:"flex",flexDirection:"column",overflowY:"auto" }}>
      <div style={{ padding:"52px 20px 0" }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:14,color:"rgba(255,255,255,0.7)" }}>← Retour</button>
      </div>
      <div style={{ padding:"28px 24px 0",textAlign:"center" }}>
        <h1 style={{ fontSize:28,fontWeight:800,color:"#fff",fontFamily:"'Playfair Display',serif",lineHeight:1.3,marginBottom:12 }}>
          Élève ta pratique<br/><span style={{ background:"linear-gradient(90deg,#C49A3C,#E8C060)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>vers l'excellence</span>
        </h1>
      </div>
      <div style={{ padding:"24px 20px 0",display:"flex",flexDirection:"column",gap:10 }}>
        {features.map((f,i) => (
          <div key={i} style={{ display:"flex",alignItems:"center",gap:14,background:"rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,rgba(196,154,60,0.3),rgba(196,154,60,0.1))",border:"1px solid rgba(196,154,60,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{f.icon}</div>
            <div><p style={{ fontSize:14,fontWeight:700,color:"#fff" }}>{f.title}</p><p style={{ fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2 }}>{f.sub}</p></div>
            <span style={{ marginLeft:"auto",color:"#E8C060",fontSize:16,flexShrink:0 }}>✓</span>
          </div>
        ))}
      </div>
      <div style={{ padding:"24px 20px 40px" }}>
        <div style={{ textAlign:"center",marginBottom:16 }}>
          <p style={{ fontSize:12,color:"rgba(255,255,255,0.4)",textDecoration:"line-through" }}>9,99 € / mois</p>
          <p style={{ fontSize:30,fontWeight:800,color:"#E8C060",fontFamily:"'Playfair Display',serif" }}>4,99 € <span style={{ fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.5)" }}>/ mois</span></p>
        </div>
        <button onClick={go}
          style={{ width:"100%",padding:"16px",borderRadius:16,border:"none",cursor:"pointer",background:activated?"linear-gradient(135deg,#2A7A5A,#3DAA7F)":"linear-gradient(135deg,#C49A3C,#E8C060)",color:"#fff",fontSize:16,fontWeight:800,transition:"all 0.4s" }}>
          {activated ? "✓ Premium activé !" : "✨ Commencer mon essai gratuit · 7 jours"}
        </button>
        <p style={{ fontSize:12,color:"rgba(255,255,255,0.35)",textAlign:"center",marginTop:10 }}>Sans engagement · Annulation à tout moment</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ROOT — Composant principal
───────────────────────────────────────── */
export default function App() {
  // ── État de connexion (undefined = en cours de chargement)
  const [session,      setSession]      = useState(undefined);
  const [onboarded,    setOnboarded]    = useState(false);
  // ── Navigation
  const [tab,          setTab]          = useState("home");
  const [dark,         setDark]         = useState(false);
  // ── Données utilisateur
  const [hassanates,   setH]            = useState(0);
  const [streak,       setStreak]       = useState(0);
  const [readingMins,  setReadingMins]  = useState(0);
  const [userAvatar,   setUserAvatar]   = useState("🌿");
  // ── Paramètres
  const [goalMins,     setGoalMins]     = useState(15);
  const [fontSizes,    setFontSizes]    = useState({ arabic:28, fr:15, phonetic:12 });
  const [notes,        setNotes]        = useState({});
  const [savedVerses,  setSavedVerses]  = useState({});
  // ── UI
  const [toast,        setToast]        = useState(null);
  const [reader,       setReader]       = useState(null);
  const [isPremium,    setIsPremium]    = useState(false);
  const [showPremium,  setShowPremium]  = useState(false);
  // ── Cercle
  const [circle,         setCircle]         = useState(null);
  const [circleMembers,  setCircleMembers]  = useState([]);
  const [circleLoading,  setCircleLoading]  = useState(false);

  const toastTimer = useRef(null);
  const saveTimer  = useRef(null);

  // ────────────────────────────────────────────
  // ÉTAPE 1 : Écoute l'état de connexion Supabase
  // ────────────────────────────────────────────
  useEffect(() => {
    if (!SUPA_OK) {
      // Supabase non configuré → mode démo sans connexion
      setSession(null);
      return;
    }

    // Vérifie s'il y a déjà une session active (ex: rechargement de page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Écoute les changements de connexion
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // Si l'utilisateur se déconnecte, on remet tout à zéro
      if (!session) {
        setH(0); setStreak(0); setReadingMins(0); setUserAvatar("🌿");
        setNotes({}); setSavedVerses({}); setCircle(null); setCircleMembers([]);
        setTab("home"); setReader(null); setOnboarded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ────────────────────────────────────────────
  // ÉTAPE 2 : Quand l'utilisateur est connecté,
  //           charge ses données depuis Supabase
  // ────────────────────────────────────────────
  useEffect(() => {
    if (!session || !SUPA_OK) return;
    const uid = session.user.id;

    // Charge le profil
    dbGetProfile(uid).then(profile => {
      if (profile) {
        setH(profile.hassanates     || 0);
        setReadingMins(profile.reading_mins || 0);
        setUserAvatar(profile.avatar        || "🌿");
      }
    });

    // Met à jour le streak
    dbUpdateStreak(uid).then(s => setStreak(s));

    // Vérifie si un lien d'invitation est en attente
    const inviteCode = localStorage.getItem("hass_pending_invite");
    if (inviteCode) {
      dbJoinCircleByCode(uid, inviteCode).then(result => {
        localStorage.removeItem("hass_pending_invite");
        if (result.ok) {
          showToastMsg(`🤝 Bienvenue dans "${result.circleName}" !`);
          refreshCircle(uid);
        }
      });
    } else {
      refreshCircle(uid);
    }
  }, [session]);

  // ────────────────────────────────────────────
  // ÉTAPE 3 : Sauvegarde automatique dans Supabase
  //           2 secondes après chaque changement
  // ────────────────────────────────────────────
  useEffect(() => {
    if (!session || !SUPA_OK) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      dbSaveProfile(session.user.id, {
        hassanates:   hassanates,
        reading_mins: readingMins,
        avatar:       userAvatar,
      });
    }, 2000); // attend 2s avant de sauvegarder
  }, [hassanates, readingMins, userAvatar]);

  // ── Fonctions utilitaires ──
  const showToastMsg = msg => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const addH    = n => setH(p => p + n);
  const goHome  = () => setTab("home");

  // ── Recharge le cercle depuis Supabase ──
  const refreshCircle = async (uid) => {
    const id = uid || session?.user?.id;
    if (!id) return;
    setCircleLoading(true);
    const { circle, members } = await dbGetMyCircle(id);
    setCircle(circle);
    setCircleMembers(members);
    setCircleLoading(false);
  };

  // ── Crée un nouveau cercle ──
  const handleCreateCircle = async () => {
    if (!session) return;
    const c = await dbCreateCircle(session.user.id);
    if (c) {
      await refreshCircle(session.user.id);
      showToastMsg("✨ Cercle créé ! Invite tes amis.");
    }
  };

  // ── Rejoint un cercle par code ──
  const handleJoinCircle = async (code) => {
    if (!session) return { ok:false, error:"Non connecté." };
    const result = await dbJoinCircleByCode(session.user.id, code);
    if (result.ok) await refreshCircle(session.user.id);
    return result;
  };

  // ── Quitte un cercle ──
  const handleLeaveCircle = async () => {
    if (!session || !circle) return;
    await dbLeaveCircle(session.user.id, circle.id);
    setCircle(null); setCircleMembers([]);
    showToastMsg("👋 Tu as quitté le cercle.");
  };

  // ── Met à jour l'avatar ──
  const handleUpdateAvatar = async (av) => {
    setUserAvatar(av);
    if (session && SUPA_OK) {
      await supabase.from("profiles").update({ avatar:av }).eq("id", session.user.id);
    }
  };

  // ── Déconnexion ──
  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToastMsg("À bientôt ! 👋");
  };

  // ── Lance la lecture en reprenant là où on s'était arrêté ──
  const handleStart = () => {
    const p = loadReadingProgress();
    if (p) {
      setReader({ surah:{ id:p.surahId, name:p.surahName, arabic:p.surahArabic, verses:0, rev:"" }, verseId:p.verseId });
    } else {
      setReader({ surah:{ id:1, name:"Al-Fatiha", arabic:"الفاتحة", verses:7, rev:"Mecquoise" }, verseId:1 });
    }
  };

  const nav = [
    { id:"home",    icon:"🏠", label:"Accueil"  },
    { id:"quran",   icon:"📖", label:"Coran"    },
    { id:"dhikr",   icon:"📿", label:"Dhikr"    },
    { id:"emotion", icon:"💚", label:"Émotions" },
    { id:"profil",  icon:"👤", label:"Profil"   },
  ];

  // ────────────────────────────────────────────
  // RENDU — selon l'état de connexion
  // ────────────────────────────────────────────

  // 1. Chargement initial (vérification de session)
  if (session === undefined) {
    return (
      <>
        <Styles />
        <div style={{ minHeight:"100svh",maxWidth:430,margin:"0 auto",background:"linear-gradient(160deg,#0D1F14,#1A1035)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16 }}>
          <div style={{ width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#2A7A5A,#3DAA7F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32 }}>☽</div>
          <p style={{ color:"rgba(255,255,255,0.5)",fontSize:14,fontWeight:600 }}>Chargement...</p>
        </div>
      </>
    );
  }

  // 2. Non connecté → écran de connexion/inscription
  if (SUPA_OK && !session) {
    return <><Styles /><AuthScreen /></>;
  }

  // 3. Connecté mais premier démarrage → Onboarding
  if (!onboarded) {
    return <><Styles /><Onboarding onDone={() => setOnboarded(true)} /></>;
  }

  // 4. App principale
  const userEmail = session?.user?.email || "invité@hassanates.app";
  const userName  = userEmail.split("@")[0]; // "youssef" depuis "youssef@gmail.com"

  return (
    <>
      <Styles />
      <div className={`app${dark ? " dark" : ""}`}>

        {/* Barre de statut en haut */}
        {!reader && !showPremium && (
          <div style={{ padding:"10px 16px 0",flexShrink:0 }}>
            <div className="status-bar">
              <div className="stat-chip"><span style={{ color:"var(--heart)" }}>♥</span>{hassanates.toLocaleString()}</div>
              <div className="stat-chip">🔥 {streak}j</div>
              <div className="stat-chip">⏱️ {readingMins}m</div>
              {isPremium
                ? <span style={{ fontSize:12,fontWeight:700,color:"var(--gold)" }}>★ Gold</span>
                : <button onClick={() => setShowPremium(true)} style={{ background:"linear-gradient(135deg,#C49A3C,#E8C060)",border:"none",borderRadius:999,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:700,color:"#fff" }}>★ Premium</button>
              }
              <button onClick={() => setDark(!dark)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:18 }}>{dark ? "☀️" : "🌙"}</button>
            </div>
          </div>
        )}

        {/* Écrans principaux */}
        {!reader && !showPremium && tab==="home"    && (
          <HomeScreen
            hassanates={hassanates} streak={streak} readingMins={readingMins}
            onStart={handleStart} userName={userName}
            circle={circle} circleMembers={circleMembers} circleLoading={circleLoading}
            onCreateCircle={handleCreateCircle}
            onRefreshCircle={() => refreshCircle()}
            onJoinCircle={handleJoinCircle}
            showToast={showToastMsg}
          />
        )}
        {!reader && !showPremium && tab==="quran"   && <QuranScreen onOpen={s => setReader({ surah:s, verseId:1 })} />}
        {!reader && !showPremium && tab==="dhikr"   && <DhikrScreen onAddH={addH} toast={showToastMsg} />}
        {!reader && !showPremium && tab==="emotion" && <EmotionsScreen onAddH={addH} toast={showToastMsg} />}
        {!reader && !showPremium && tab==="profil"  && (
          <ProfilScreen
            hassanates={hassanates} streak={streak} readingMins={readingMins}
            goalMins={goalMins} setGoalMins={setGoalMins}
            onOpenPremium={() => setShowPremium(true)} isPremium={isPremium}
            fontSizes={fontSizes} setFontSizes={setFontSizes}
            savedVerses={savedVerses} setSavedVerses={setSavedVerses}
            userName={userName} userEmail={userEmail}
            userAvatar={userAvatar} onUpdateAvatar={handleUpdateAvatar}
            onLogout={handleLogout}
            circle={circle} circleMembers={circleMembers} onLeaveCircle={handleLeaveCircle}
          />
        )}

        {/* Lecteur de versets */}
        {reader && (
          <VerseReader
            surah={reader.surah} initialVerseId={reader.verseId}
            onClose={() => setReader(null)} onGoHome={goHome}
            onAddH={addH}
            notes={notes} setNotes={setNotes}
            goalSecs={goalMins * 60}
            onTimeSpent={s => setReadingMins(m => m + Math.round(s / 60))}
            savedVerses={savedVerses} setSavedVerses={setSavedVerses}
            fontSizes={fontSizes}
          />
        )}

        {/* Page Premium */}
        {showPremium && (
          <PremiumPage
            onClose={() => setShowPremium(false)}
            onActivate={() => { setIsPremium(true); showToastMsg("★ Premium Gold activé !"); }}
          />
        )}

        {/* Toast (notification temporaire) */}
        {toast && <div className="toast">{toast}</div>}

        {/* Barre de navigation en bas */}
        {!reader && !showPremium && (
          <nav className="nav-bar">
            {nav.map(it => (
              <div key={it.id} className={`nav-item${tab===it.id?" active":""}`} onClick={() => setTab(it.id)}>
                <span style={{ fontSize:21 }}>{it.icon}</span>
                <span className="nav-lbl">{it.label}</span>
              </div>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
