import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─────────────────────────────────────────
   SUPABASE
───────────────────────────────────────── */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL  || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
);

async function fetchTafsir(surahId, verseId) {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const res = await fetch(
      `${url}/rest/v1/tafsirs?surah_number=eq.${surahId}&ayah_number=eq.${verseId}&select=text&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const data = await res.json();
    return data?.[0]?.text || null;
  } catch { return null; }
}

/* ─────────────────────────────────────────
   LOCALSTORAGE
───────────────────────────────────────── */
function saveProgress(surahId, surahName, surahArabic, verseId) {
  try { localStorage.setItem("hass_progress", JSON.stringify({ surahId, surahName, surahArabic, verseId })); } catch {}
}
function loadProgress() {
  try { const r = localStorage.getItem("hass_progress"); return r ? JSON.parse(r) : null; } catch { return null; }
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Nunito:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap');
    :root {
      --bg-from:#EEE9FF; --bg-to:#E0EDFF;
      --glass-b:rgba(255,255,255,0.9);
      --border:rgba(255,255,255,0.6); --border-s:rgba(0,0,0,0.07);
      --emerald:#2A7A5A; --emerald-l:#3DAA7F; --emerald-glow:rgba(42,122,90,0.13);
      --gold:#C49A3C; --heart:#E06B8B;
      --ink:#1C1C2E; --ink-s:#4A4A6A; --ink-m:#9090B0;
      --card:rgba(255,255,255,0.72); --shadow:0 4px 24px rgba(80,60,180,0.10);
    }
    .dark {
      --bg-from:#0D0E1C; --bg-to:#121828;
      --glass-b:rgba(28,32,52,0.95);
      --border:rgba(255,255,255,0.08); --border-s:rgba(255,255,255,0.06);
      --emerald:#3DAA7F; --emerald-l:#5BCCA0; --emerald-glow:rgba(61,170,127,0.12);
      --gold:#D4AA62; --heart:#F08CA8;
      --ink:#E8E4F8; --ink-s:#A8A4C8; --ink-m:#6A6888;
      --card:rgba(28,32,52,0.82); --shadow:0 4px 24px rgba(0,0,0,0.30);
    }
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;}
    body{font-family:'Nunito',sans-serif;overflow:hidden;background:var(--bg-from);}
    .app{max-width:430px;margin:0 auto;height:100svh;background:linear-gradient(160deg,var(--bg-from),var(--bg-to));display:flex;flex-direction:column;overflow:hidden;}
    ::-webkit-scrollbar{width:0;}
    .arabic{font-family:'Amiri',serif;direction:rtl;}
    .card{background:var(--card);border-radius:20px;border:1px solid var(--border);box-shadow:var(--shadow);backdrop-filter:blur(16px);}
    .pill{display:inline-flex;align-items:center;gap:5px;background:var(--emerald-glow);color:var(--emerald);border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;border:1px solid rgba(61,170,127,0.2);}
    .nav-bar{background:var(--glass-b);border-top:1px solid var(--border-s);display:flex;justify-content:space-around;align-items:center;padding:8px 0 20px;flex-shrink:0;backdrop-filter:blur(20px);}
    .nav-item{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:6px 12px;border-radius:14px;transition:all 0.2s;}
    .nav-item.active{background:var(--emerald-glow);}
    .nav-lbl{font-size:10px;font-weight:700;color:var(--ink-m);}
    .nav-item.active .nav-lbl{color:var(--emerald);}
    .status-bar{margin:8px 16px 0;padding:8px 16px;background:var(--card);border-radius:99px;border:1px solid var(--border);box-shadow:var(--shadow);display:flex;justify-content:space-between;align-items:center;backdrop-filter:blur(16px);flex-shrink:0;}
    .stat-chip{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:700;color:var(--ink-s);}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
    .fu{animation:fadeUp 0.35s ease both;}
    @keyframes flicker{0%,100%{transform:scale(1) rotate(-2deg);}50%{transform:scale(1.1) rotate(2deg);}}
    .fire{animation:flicker 1.4s ease-in-out infinite;display:inline-block;}
    @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
    .toast{position:fixed;bottom:88px;left:50%;transform:translateX(-50%);background:var(--emerald);color:#fff;padding:9px 18px;border-radius:999px;font-size:13px;font-weight:700;animation:toastIn 0.25s ease;z-index:300;white-space:nowrap;box-shadow:0 4px 18px rgba(42,122,90,0.4);}
    @keyframes heartPop{0%{opacity:0;transform:scale(0.5);}20%{opacity:1;transform:scale(1.2);}80%{opacity:1;}100%{opacity:0;transform:scale(0.8) translateY(-8px);}}
    .hpop{position:absolute;top:12px;right:16px;font-size:15px;font-weight:800;color:var(--heart);animation:heartPop 1s ease forwards;pointer-events:none;z-index:50;}
    @keyframes bump{0%,100%{transform:scale(1);}50%{transform:scale(1.18);}}
    .bump{animation:bump 0.18s ease;}
    @keyframes sheetIn{from{transform:translateY(100%);}to{transform:translateY(0);}}
    .sheet-ov{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:200;backdrop-filter:blur(4px);}
    .sheet{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--glass-b);border-radius:24px 24px 0 0;padding:18px 20px 44px;z-index:201;animation:sheetIn 0.26s cubic-bezier(0.4,0,0.2,1);border-top:1px solid var(--border);max-height:88vh;overflow-y:auto;}
    .sheet-handle{width:40px;height:4px;background:var(--border-s);border-radius:999px;margin:0 auto 16px;}
    .vslide{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 24px;transition:transform 0.3s cubic-bezier(0.4,0,0.2,1),opacity 0.3s ease;overflow-y:auto;}
    .vs-in{transform:translateX(0);opacity:1;}
    .vs-out-l{transform:translateX(-100%);opacity:0;}
    .vs-out-r{transform:translateX(100%);opacity:0;}
    .dot{width:6px;height:6px;border-radius:50%;transition:all 0.25s;cursor:pointer;}
    .tab-bar{display:flex;background:rgba(0,0,0,0.05);border-radius:12px;padding:3px;gap:3px;}
    .tab{flex:1;padding:7px;border-radius:9px;border:none;cursor:pointer;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;transition:all 0.2s;background:transparent;color:var(--ink-m);}
    .tab.active{background:var(--card);color:var(--emerald);box-shadow:var(--shadow);}
    textarea{font-family:'Nunito',sans-serif;font-size:14px;line-height:1.6;background:rgba(0,0,0,0.04);border:1px solid var(--border-s);border-radius:12px;padding:11px;width:100%;color:var(--ink);resize:none;outline:none;user-select:text;}
    textarea:focus{border-color:var(--emerald);}
    button{font-family:'Nunito',sans-serif;}
    .reader{position:fixed;inset:0;z-index:200;max-width:430px;margin:0 auto;display:flex;flex-direction:column;background:linear-gradient(160deg,var(--bg-from),var(--bg-to));}
    @keyframes loadBar{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
    .goal-card{border-radius:22px;padding:22px;background:linear-gradient(135deg,#2A7A5A,#3DAA7F);color:#fff;position:relative;overflow:hidden;}
    .goal-card::before{content:'';position:absolute;top:-30px;right:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.1);}
    .stat-card{background:var(--card);border-radius:16px;padding:14px;border:1px solid var(--border);}
    .dhikr-cat-card{border-radius:20px;overflow:hidden;cursor:pointer;position:relative;min-height:130px;display:flex;flex-direction:column;justify-content:flex-end;padding:14px;transition:transform 0.18s;}
    .dhikr-cat-card:active{transform:scale(0.97);}
    .dhikr-cat-bg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:64px;opacity:0.18;}
    .dhikr-list-item{display:flex;align-items:center;gap:14px;padding:16px;border-bottom:1px solid var(--border-s);cursor:pointer;transition:background 0.15s;}
    .dhikr-list-item:active{background:var(--emerald-glow);}
    input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:999px;background:rgba(0,0,0,0.1);outline:none;}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--emerald);cursor:pointer;box-shadow:0 2px 8px rgba(42,122,90,0.4);}
    /* Emotion cards */
    .emotion-card{border-radius:18px;padding:20px 16px;cursor:pointer;display:flex;align-items:center;justify-content:center;min-height:80px;transition:transform 0.18s,box-shadow 0.18s;border:none;}
    .emotion-card:active{transform:scale(0.96);}
    /* Doua detail full screen */
    .doua-screen{position:fixed;inset:0;z-index:210;max-width:430px;margin:0 auto;display:flex;flex-direction:column;background:#fff;}
    .dark .doua-screen{background:#0D0E1C;}
  `}</style>
);

/* ─────────────────────────────────────────
   API HOOKS
───────────────────────────────────────── */
const API_BASE = "https://api.alquran.cloud/v1";
const RECITER  = "ar.alafasy";
const TRANS    = "fr.hamidullah";

const BASMALA = {
  arabic:"بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
  fr:"Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux",
  audio:"https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3",
};

function useSurahs() {
  const [surahs,setSurahs]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  useEffect(()=>{fetch(`${API_BASE}/surah`).then(r=>r.json()).then(d=>{setSurahs(d.data.map(s=>({id:s.number,name:s.englishName,arabic:s.name,verses:s.numberOfAyahs,rev:s.revelationType==="Meccan"?"Mecquoise":"Medinoise"})));setLoading(false);}).catch(e=>{setError(e);setLoading(false);});},[]);
  return {surahs,loading,error};
}
function useSurahVerses(surahId) {
  const [verses,setVerses]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  useEffect(()=>{if(!surahId)return;setLoading(true);setVerses([]);setError(null);Promise.all([fetch(`${API_BASE}/surah/${surahId}/${RECITER}`).then(r=>{if(!r.ok)throw new Error();return r.json();}),fetch(`${API_BASE}/surah/${surahId}/${TRANS}`).then(r=>{if(!r.ok)throw new Error();return r.json();})]).then(([ar,fr])=>{if(!ar.data?.ayahs?.length)throw new Error();setVerses(ar.data.ayahs.map((a,i)=>({id:a.numberInSurah,arabic:a.text,audioUrl:a.audio,fr:fr.data?.ayahs?.[i]?.text||""})));setLoading(false);}).catch(e=>{setError(e);setLoading(false);});},[surahId]);
  return {verses,loading,error};
}

/* ─────────────────────────────────────────
   ÉMOTIONS DATA
───────────────────────────────────────── */
const EMOTIONS = [
  {
    id:"colere", label:"Colère", color:"#FADADD", textColor:"#7A3040",
    icon:"😤", desc:"Invocations pour apaiser la colère",
    douas:[
      {id:"c1",title:"Protection contre la colère",arabic:"أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",phonetic:"A'ûdhu billâhi mina sh-shaytâni r-rajîm",fr:"Je cherche la protection d'Allah contre le Shaytan maudit. Le Prophète ﷺ a dit : si l'un d'entre vous ressent de la colère, qu'il dise cette parole.",source:"Bukhari & Mouslim",count:3},
      {id:"c2",title:"Faire ses ablutions",arabic:"اللَّهُمَّ اغْفِرْ لِي ذَنْبِي وَأَذْهِبْ غَيْظَ قَلْبِي",phonetic:"Allâhumma ghfir lî dhanbî wa adhhib ghayza qalbî",fr:"Ô Allah, pardonne-moi mon péché et fais disparaître la colère de mon cœur.",source:"Ibn Sunni",count:1},
      {id:"c3",title:"Changer de position",arabic:"إِنَّ الْغَضَبَ مِنَ الشَّيْطَانِ",phonetic:"Inna l-ghadaba mina sh-shaytân",fr:"La colère vient du Shaytan. Le Prophète ﷺ conseille de s'asseoir si on est debout, et de se coucher si on est assis.",source:"Abou Dawoud",count:1},
    ]
  },
  {
    id:"anxiete", label:"Anxiété", color:"#C8E6C9", textColor:"#2E5935",
    icon:"😰", desc:"Invocations pour calmer l'inquiétude",
    douas:[
      {id:"a1",title:"Doua contre l'anxiété",arabic:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحُزْنِ",phonetic:"Allâhumma innî a'ûdhu bika mina l-hammi wa l-huzn",fr:"Ô Allah, je cherche Ta protection contre l'anxiété et la tristesse, contre la faiblesse et la paresse, contre la lâcheté et la pingrerie, contre le poids des dettes et la domination des hommes.",source:"Bukhari",count:3},
      {id:"a2",title:"La confiance en Allah",arabic:"حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",phonetic:"Hasbunallâhu wa ni'ma l-wakîl",fr:"Allah nous suffit et Il est le meilleur des garants. C'est ce qu'Ibrahim ﷺ disait quand on le jetait dans le feu.",source:"Bukhari",count:7},
      {id:"a3",title:"Doua du Prophète Youssouf",arabic:"رَبِّ السِّجْنُ أَحَبُّ إِلَيَّ مِمَّا يَدْعُونَنِي إِلَيْهِ",phonetic:"Rabbi s-sijnu ahabb ilayya mimmâ yad'ûnanî ilayh",fr:"Seigneur, la prison m'est plus chère que ce à quoi ils m'invitent. (Coran 12:33) — Doua de patience face aux épreuves.",source:"Coran 12:33",count:1},
    ]
  },
  {
    id:"tentations", label:"Tentations", color:"#BBDEFB", textColor:"#1A3A5C",
    icon:"😈", desc:"Invocations pour résister aux tentations",
    douas:[
      {id:"t1",title:"Protection contre le Shaytan",arabic:"أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",phonetic:"A'ûdhu bi kalimâtillâhi t-tâmmâti min sharri mâ khalaq",fr:"Je cherche refuge dans les paroles parfaites d'Allah contre tout ce qu'Il a créé.",source:"Mouslim",count:3},
      {id:"t2",title:"Contre le regard illicite",arabic:"اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",phonetic:"Allâhumma innî as'aluka l-hudâ wa t-tuqâ wa l-'afâfa wa l-ghinâ",fr:"Ô Allah, je Te demande la guidance, la piété, la chasteté et l'aisance.",source:"Mouslim",count:1},
      {id:"t3",title:"Istighfar des tentations",arabic:"أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",phonetic:"Astaghfirullâha lladhî lâ ilâha illâ huwa l-hayyu l-qayyûmu wa atûbu ilayh",fr:"Je demande pardon à Allah, il n'y a de dieu que Lui, le Vivant, Celui qui subsiste par Lui-même, et je me repens à Lui.",source:"Abou Dawoud, Tirmizi",count:3},
    ]
  },
  {
    id:"confiance", label:"Confiance", color:"#FFF9C4", textColor:"#5D4A00",
    icon:"🌟", desc:"Douas pour renforcer la confiance en Allah",
    douas:[
      {id:"cf1",title:"Tawakkul — Confiance totale",arabic:"تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",phonetic:"Tawakkaltu 'ala llâhi wa lâ hawla wa lâ quwwata illâ billâh",fr:"Je m'en remets à Allah, il n'y a de force ni de puissance qu'en Allah.",source:"Abou Dawoud, Tirmizi",count:1},
      {id:"cf2",title:"Doua pour la certitude",arabic:"اللَّهُمَّ أَلِّفْ بَيْنَ قُلُوبِنَا",phonetic:"Allâhumma allif bayna qulûbinâ",fr:"Ô Allah, unis nos cœurs et réconcilie-nous. Guide-nous sur les chemins de la paix.",source:"Abou Dawoud",count:1},
    ]
  },
  {
    id:"contentement", label:"Contentement", color:"#FFCCBC", textColor:"#7A2E00",
    icon:"🤲", desc:"Douas de gratitude et de contentement",
    douas:[
      {id:"co1",title:"Accomplir son devoir de remercier Allah",arabic:"اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",phonetic:"Allâhumma mâ amsâ bî min ni'matin aw bi-ahadin min khalqik, fa-minka wahdaka lâ sharîka lak, fa laka l-hamdu wa laka sh-shukr",fr:"Ô Allah, tous les bienfaits dont je jouis ce soir ou dont l'une de Tes créatures jouit viennent de Toi seul, Tu n'as aucun associé. À Toi seule revient toute la louange et toute la gratitude.",source:"Abou Dawoud",count:1},
      {id:"co2",title:"Remercier Allah de t'avoir béni",arabic:"الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ",phonetic:"Al-hamdu lillâhi lladhî bi-ni'matihi tatimmu s-sâlihât",fr:"Louange à Allah, par la grâce duquel les bonnes œuvres s'accomplissent.",source:"Ibn Maja",count:3},
      {id:"co3",title:"Louer Allah avec les louanges de toute la création",arabic:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ",phonetic:"Subhânallâhi wa bihamdihi 'adada khalqihi wa ridâ nafsih wa zinata 'arshih wa midâda kalimâtih",fr:"Gloire à Allah et louange à Lui, au nombre de Ses créatures, selon Sa satisfaction, à la mesure du poids de Son Trône et à l'encre de Ses paroles.",source:"Mouslim",count:3},
    ]
  },
  {
    id:"confusion", label:"Confusion", color:"#B2DFDB", textColor:"#1A4A44",
    icon:"🌀", desc:"Douas pour trouver la clarté et la guidance",
    douas:[
      {id:"cn1",title:"Doua Istikhara — Demander la guidance",arabic:"اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ",phonetic:"Allâhumma innî astakhîruka bi-'ilmik wa astaqdiruka bi-qudratik",fr:"Ô Allah, je Te demande de choisir pour moi grâce à Ton savoir, je Te demande de me donner la capacité grâce à Ta puissance, et je T'implore de Ta grande grâce.",source:"Bukhari",count:1},
      {id:"cn2",title:"Doua pour la clarté d'esprit",arabic:"رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",phonetic:"Rabbi shrah lî sadrî wa yassir lî amrî",fr:"Seigneur, ouvre ma poitrine (à Ta lumière) et facilite mes affaires. (Coran 20:25-26)",source:"Coran 20:25-26",count:3},
    ]
  },
  {
    id:"depression", label:"Dépression", color:"#CFD8DC", textColor:"#37474F",
    icon:"🌧️", desc:"Invocations pour traverser les moments difficiles",
    douas:[
      {id:"d1",title:"Doua contre la tristesse",arabic:"لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ",phonetic:"Lâ ilâha illallâhu l-'azîmu l-halîm, lâ ilâha illallâhu rabbu l-'arshi l-'azîm, lâ ilâha illallâhu rabbu s-samâwâti wa rabbu l-ardi wa rabbu l-'arshi l-karîm",fr:"Il n'y a de dieu qu'Allah, l'Immense, le Doux. Il n'y a de dieu qu'Allah, Seigneur du Trône Immense. Il n'y a de dieu qu'Allah, Seigneur des cieux, de la terre et du Noble Trône.",source:"Bukhari, Mouslim",count:3},
      {id:"d2",title:"Le Prophète dans l'épreuve",arabic:"لَا إِلَهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",phonetic:"Lâ ilâha illâ anta subhânaka innî kuntu mina z-zâlimîn",fr:"Il n'y a de dieu que Toi, Gloire à Toi ! J'étais vraiment parmi les injustes. (Doua de Younous ﷺ dans le ventre de la baleine — Coran 21:87)",source:"Coran 21:87",count:3},
    ]
  },
  {
    id:"incertitude", label:"Incertitude", color:"#D1C4E9", textColor:"#4A148C",
    icon:"❓", desc:"Douas pour trouver la sérénité dans l'inconnu",
    douas:[
      {id:"i1",title:"Confier ses affaires à Allah",arabic:"فَوَّضْتُ أَمْرِي إِلَى اللَّهِ إِنَّ اللَّهَ بَصِيرٌ بِالْعِبَادِ",phonetic:"Fawwadtu amrî ilallâh innallâha basîrun bi l-'ibâd",fr:"Je confie mes affaires à Allah. Allah voit très bien Ses serviteurs. (Coran 40:44)",source:"Coran 40:44",count:3},
      {id:"i2",title:"Tawakkul face à l'inconnu",arabic:"حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",phonetic:"Hasbiyallâhu lâ ilâha illâ huwa 'alayhi tawakkaltu wa huwa rabbu l-'arshi l-'azîm",fr:"Allah me suffit, il n'y a de dieu que Lui. En Lui je place ma confiance. Il est le Seigneur du Trône immense. (Coran 9:129)",source:"Coran 9:129",count:7},
    ]
  },
  {
    id:"reconnaissance", label:"Reconnaissance", color:"#F8BBD0", textColor:"#7A1432",
    icon:"🙏", desc:"Douas pour exprimer sa gratitude",
    douas:[
      {id:"r1",title:"Chukr — La gratitude parfaite",arabic:"اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",phonetic:"Allâhumma a'innî 'alâ dhikrika wa shukrika wa husni 'ibâdatik",fr:"Ô Allah, aide-moi à T'invoquer, à T'être reconnaissant et à T'adorer de la meilleure façon.",source:"Abou Dawoud",count:3},
      {id:"r2",title:"Doua du matin de gratitude",arabic:"اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالأَرْضِ",phonetic:"Allâhumma laka l-hamdu anta nûru s-samâwâti wa l-ard",fr:"Ô Allah, à Toi la louange, Tu es la Lumière des cieux et de la terre.",source:"Bukhari, Mouslim",count:1},
    ]
  },
  {
    id:"avarice", label:"Avarice", color:"#F5F5DC", textColor:"#5D4A00",
    icon:"💰", desc:"Douas contre l'amour excessif des biens",
    douas:[
      {id:"av1",title:"Se protéger de l'avarice",arabic:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبُخْلِ",phonetic:"Allâhumma innî a'ûdhu bika mina l-bukhl",fr:"Ô Allah, je cherche Ta protection contre l'avarice, la lâcheté et le fait d'être renvoyé à un âge avancé. Je cherche Ta protection contre le tourment de la tombe et contre l'épreuve de la vie et de la mort.",source:"Bukhari",count:3},
      {id:"av2",title:"La générosité comme adoration",arabic:"اللَّهُمَّ اجْعَلْنِي مِنَ الَّذِينَ إِذَا أُعْطُوا شَكَرُوا",phonetic:"Allâhumma j'alnî mina lladhîna idhâ u'tû shakarû",fr:"Ô Allah, fais de moi de ceux qui, lorsqu'ils reçoivent, sont reconnaissants, et lorsqu'ils sont éprouvés, s'arment de patience.",source:"Ibn Maja",count:1},
    ]
  },
  {
    id:"solitude", label:"Solitude", color:"#E8EAF6", textColor:"#283593",
    icon:"🕊️", desc:"Douas pour ceux qui se sentent seuls",
    douas:[
      {id:"s1",title:"Allah est suffisant",arabic:"أَلَا إِنَّ أَوْلِيَاءَ اللَّهِ لَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ",phonetic:"Alâ inna awliyâallâhi lâ khawfun 'alayhim wa lâ hum yahzanûn",fr:"Certes, les amis d'Allah n'auront aucune crainte et ne seront pas affligés. (Coran 10:62)",source:"Coran 10:62",count:1},
      {id:"s2",title:"Chercher la compagnie d'Allah",arabic:"يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ",phonetic:"Yâ hayyu yâ qayyûmu bi-rahmatika astaghîth",fr:"Ô Toi le Vivant, Toi qui subsistes par Toi-même, c'est par Ta miséricorde que j'implore Ton secours.",source:"Tirmizi",count:3},
    ]
  },
  {
    id:"espoir", label:"Espoir", color:"#E0F2F1", textColor:"#00695C",
    icon:"🌅", desc:"Douas pour raviver l'espoir et la foi",
    douas:[
      {id:"e1",title:"Allah ne déçoit jamais",arabic:"رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا",phonetic:"Rabbanâ lâ tu'âkhidhnâ in nasînâ aw akhta'nâ",fr:"Seigneur, ne nous blâme pas si nous oublions ou si nous nous trompons. (Coran 2:286)",source:"Coran 2:286",count:1},
      {id:"e2",title:"L'espoir en la miséricorde d'Allah",arabic:"قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",phonetic:"Qul yâ 'ibâdiya lladhîna asrafû 'alâ anfusihim lâ taqnatû min rahmati llâh",fr:"Dis : Ô Mes serviteurs qui avez commis des excès à votre détriment, ne désespérez pas de la miséricorde d'Allah. (Coran 39:53)",source:"Coran 39:53",count:1},
    ]
  },
];

/* ─────────────────────────────────────────
   DHIKR DATA
───────────────────────────────────────── */
const DHIKR_CATEGORIES = [
  {id:"matin",label:"Adhkar du Matin",icon:"🌅",bg:"linear-gradient(135deg,#F6A623,#F7C948)",grad:["#F6A623","#F7C948"],items:[{id:101,title:"À l'entrée du matin",arabic:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",phonetic:"Asbahna wa asbaha l-mulku lillah",fr:"Nous entrons au matin et le Royaume appartient à Allah.",source:"Abou Dawoud",count:1,h:10},{id:102,title:"Tasbih du matin",arabic:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",phonetic:"Subhana llahi wa bihamdih",fr:"Gloire à Allah et louange à Lui.",source:"Mouslim",count:100,h:100},{id:103,title:"Invocation du matin",arabic:"اللَّهُمَّ بِكَ أَصْبَحْنَا",phonetic:"Allahumma bika asbahna",fr:"Ô Allah, c'est grâce à Toi que nous entrons dans le matin.",source:"Abou Dawoud",count:1,h:10}]},
  {id:"soir",label:"Adhkar du Soir",icon:"🌙",bg:"linear-gradient(135deg,#553C9A,#2D3748)",grad:["#553C9A","#2D3748"],items:[{id:201,title:"À l'entrée du soir",arabic:"أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",phonetic:"Amsayna wa amsa l-mulku lillah",fr:"Nous entrons dans le soir et le Royaume appartient à Allah.",source:"Abou Dawoud",count:1,h:10},{id:202,title:"Invocation du soir",arabic:"اللَّهُمَّ بِكَ أَمْسَيْنَا",phonetic:"Allahumma bika amsayna",fr:"Ô Allah, c'est grâce à Toi que nous entrons dans le soir.",source:"Abou Dawoud",count:1,h:10},{id:203,title:"Hisboun Allah",arabic:"حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ",phonetic:"Hasbiya llahu la ilaha illa hu",fr:"Allah me suffit, il n'y a de divinité que Lui.",source:"Abou Dawoud",count:7,h:70}]},
  {id:"protection",label:"Protection & Rouqya",icon:"🛡️",bg:"linear-gradient(135deg,#F56565,#9B2335)",grad:["#F56565","#9B2335"],items:[{id:501,title:"Protection par le Nom d'Allah",arabic:"بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ",phonetic:"Bismi llahi lladhi la yadurru ma'a smihi shay'",fr:"Au nom d'Allah avec lequel rien ne peut nuire.",source:"Abou Dawoud, Tirmizi",count:3,h:30},{id:502,title:"Ayat al-Kursi",arabic:"اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ",phonetic:"Ayatu l-kursi",fr:"Récite Ayat al-Kursi chaque matin et soir pour une protection complète.",source:"Bukhari",count:1,h:50}]},
  {id:"priere",label:"Invocations de la Prière",icon:"🕌",bg:"linear-gradient(135deg,#4299E1,#1A365D)",grad:["#4299E1","#1A365D"],items:[{id:601,title:"Pardon pour soi et ses parents",arabic:"رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ",phonetic:"Rabbi ghfir li wa liwaalidayya",fr:"Seigneur, pardonne-moi ainsi qu'à mes parents.",source:"Coran 71:28",count:3,h:30},{id:602,title:"Doua de ce monde et de l'au-delà",arabic:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً",phonetic:"Rabbana atina fi d-dunya hasanatan",fr:"Seigneur, accorde-nous ce qui est bon en ce monde et dans l'au-delà.",source:"Coran 2:201",count:1,h:10}]},
  {id:"reveil",label:"Se Réveiller",icon:"⏰",bg:"linear-gradient(135deg,#48BB78,#276749)",grad:["#48BB78","#276749"],items:[{id:301,title:"Après le réveil",arabic:"الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا",phonetic:"Al-hamdu lillahi lladhi ahyana ba'da ma amatana",fr:"Louange à Allah qui nous a redonné la vie après nous avoir fait mourir.",source:"Bukhari",count:1,h:10}]},
  {id:"sommeil",label:"Avant de Dormir",icon:"😴",bg:"linear-gradient(135deg,#667EEA,#764BA2)",grad:["#667EEA","#764BA2"],items:[{id:401,title:"Bismika amutu",arabic:"بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",phonetic:"Bismika llahumma amutu wa ahya",fr:"En Ton nom, ô Allah, je meurs et je vis.",source:"Bukhari",count:1,h:10},{id:402,title:"Tasbih de Fatima",arabic:"سُبْحَانَ اللَّهِ ×33 | الْحَمْدُ لِلَّهِ ×33 | اللَّهُ أَكْبَرُ ×34",phonetic:"Subhanallah 33x · Alhamdulillah 33x · Allahu Akbar 34x",fr:"Le Tasbih de Fatima — récite avant de dormir.",source:"Bukhari, Mouslim",count:1,h:100}]},
  {id:"woudhou",label:"Woudhou & Purification",icon:"🚿",bg:"linear-gradient(135deg,#4FD1C5,#285E61)",grad:["#4FD1C5","#285E61"],items:[{id:701,title:"En entrant aux toilettes",arabic:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",phonetic:"Allahumma inni a'udhu bika mina l-khubti wa l-khaba'ith",fr:"Ô Allah, je cherche Ta protection contre les démons.",source:"Bukhari, Mouslim",count:1,h:10},{id:702,title:"Après le woudhou",arabic:"أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ",phonetic:"Ashhadu an la ilaha illa llahu...",fr:"J'atteste qu'il n'y a de dieu qu'Allah et que Muhammad est Son messager.",source:"Mouslim",count:1,h:20}]},
  {id:"istighfar",label:"Istighfar & Repentir",icon:"🔄",bg:"linear-gradient(135deg,#9F7AEA,#44337A)",grad:["#9F7AEA","#44337A"],items:[{id:1101,title:"Sayid al-Istighfar",arabic:"اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ",phonetic:"Allahumma anta rabbi la ilaha illa anta...",fr:"Ô Allah, Tu es mon Seigneur, il n'y a de dieu que Toi.",source:"Bukhari",count:1,h:100},{id:1102,title:"Istighfar court",arabic:"أَسْتَغْفِرُ اللَّهَ",phonetic:"Astaghfiru llah",fr:"Je demande le pardon d'Allah.",source:"Bukhari",count:100,h:100}]},
  {id:"voyage",label:"Voyage & Déplacement",icon:"✈️",bg:"linear-gradient(135deg,#76E4F7,#065666)",grad:["#76E4F7","#065666"],items:[{id:1001,title:"En montant dans un véhicule",arabic:"سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا",phonetic:"Subhana lladhi sakhkhara lana hadha",fr:"Gloire à Celui qui nous a soumis cela.",source:"Coran 43:13-14",count:1,h:20}]},
  {id:"nourriture",label:"Nourriture & Boisson",icon:"🍽️",bg:"linear-gradient(135deg,#F6AD55,#9C4221)",grad:["#F6AD55","#9C4221"],items:[{id:801,title:"Avant de manger",arabic:"بِسْمِ اللَّهِ",phonetic:"Bismillah",fr:"Au nom d'Allah.",source:"Abou Dawoud",count:1,h:5},{id:802,title:"Après avoir mangé",arabic:"الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا",phonetic:"Al-hamdu lillahi lladhi at'amana wa saqana",fr:"Louange à Allah qui nous a nourris et abreuvés.",source:"Abou Dawoud",count:1,h:10}]},
  {id:"maison",label:"Maison & Famille",icon:"🏠",bg:"linear-gradient(135deg,#68D391,#1C4532)",grad:["#68D391","#1C4532"],items:[{id:901,title:"En entrant chez soi",arabic:"بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا",phonetic:"Bismillahi walajna wa bismillahi kharajna",fr:"Au nom d'Allah nous entrons et au nom d'Allah nous sortons.",source:"Abou Dawoud",count:1,h:10}]},
  {id:"mariage",label:"Mariage & Enfants",icon:"💍",bg:"linear-gradient(135deg,#F687B3,#702459)",grad:["#F687B3","#702459"],items:[{id:1201,title:"La nuit des noces",arabic:"بِسْمِ اللَّهِ، اللَّهُمَّ جَنِّبْنَا الشَّيْطَانَ",phonetic:"Bismillah, allahumma jannibna sh-shaytana",fr:"Au nom d'Allah. Ô Allah, éloigne de nous le Shaytan.",source:"Bukhari, Mouslim",count:1,h:20}]},
];

const AYAH_DU_JOUR = {arabic:"وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",fr:"Celui qui craint Allah, Il lui accordera une issue favorable.",ref:"At-Talaq 65:2"};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function Sheet({onClose,children}){return(<><div className="sheet-ov" onClick={onClose}/><div className="sheet"><div className="sheet-handle"/>{children}</div></>);}
function fmtTime(s){const m=Math.floor(s/60),sec=s%60;return`${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;}

/* ─────────────────────────────────────────
   AUTH SCREEN
───────────────────────────────────────── */
function AuthScreen() {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState(null);
  const [showPass,setShowPass]=useState(false);

  const friendlyError = m => {
    if(m.includes("Invalid login"))return"Email ou mot de passe incorrect.";
    if(m.includes("Email not confirmed"))return"Confirme ton email avant de te connecter.";
    if(m.includes("already registered"))return"Cet email est déjà utilisé.";
    if(m.includes("Password should"))return"Mot de passe trop court (6 caractères min).";
    return"Une erreur est survenue. Réessaie.";
  };

  const submit = async () => {
    if(!email||(!password&&mode!=="forgot"))return setMsg({type:"error",text:"Remplis tous les champs."});
    setLoading(true);setMsg(null);
    if(mode==="login"){
      const{error}=await supabase.auth.signInWithPassword({email,password});
      setLoading(false);
      if(error)setMsg({type:"error",text:friendlyError(error.message)});
    } else if(mode==="signup"){
      if(password.length<6)return setMsg({type:"error",text:"Mot de passe trop court (6 caractères min)."});
      const{error}=await supabase.auth.signUp({email,password});
      setLoading(false);
      if(error)setMsg({type:"error",text:friendlyError(error.message)});
      else setMsg({type:"success",text:"✅ Compte créé ! Vérifie ta boîte mail pour confirmer."});
    } else {
      const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
      setLoading(false);
      if(error)setMsg({type:"error",text:friendlyError(error.message)});
      else setMsg({type:"success",text:"📧 Email de réinitialisation envoyé !"});
    }
  };

  return(
    <div style={{minHeight:"100svh",maxWidth:430,margin:"0 auto",background:"linear-gradient(160deg,#0D1F14,#1A1035)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:"rgba(42,122,90,0.15)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-60,left:-60,width:200,height:200,borderRadius:"50%",background:"rgba(124,106,232,0.12)",pointerEvents:"none"}}/>

      {/* Logo */}
      <div style={{marginBottom:32,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div style={{width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#2A7A5A,#3DAA7F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,boxShadow:"0 12px 40px rgba(42,122,90,0.4)"}}>☽</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:"#fff",textAlign:"center"}}>Hassanates</h1>
        <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",textAlign:"center"}}>Ton compagnon de progression spirituelle</p>
      </div>

      {/* Carte formulaire */}
      <div style={{width:"100%",background:"rgba(255,255,255,0.06)",borderRadius:24,border:"1px solid rgba(255,255,255,0.1)",padding:"28px 24px",backdropFilter:"blur(20px)"}}>
        {mode!=="forgot"&&(
          <div style={{display:"flex",background:"rgba(0,0,0,0.2)",borderRadius:12,padding:3,gap:3,marginBottom:24}}>
            {[["login","Connexion"],["signup","Inscription"]].map(([m,lbl])=>(
              <button key={m} onClick={()=>{setMode(m);setMsg(null);}} style={{flex:1,padding:"9px",borderRadius:9,border:"none",cursor:"pointer",fontSize:14,fontWeight:700,transition:"all 0.2s",background:mode===m?"rgba(42,122,90,0.9)":"transparent",color:mode===m?"#fff":"rgba(255,255,255,0.5)"}}>
                {lbl}
              </button>
            ))}
          </div>
        )}
        {mode==="forgot"&&(
          <div style={{marginBottom:20}}>
            <button onClick={()=>{setMode("login");setMsg(null);}} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.6)",fontSize:14,display:"flex",alignItems:"center",gap:6}}>← Retour</button>
            <h2 style={{fontSize:18,fontWeight:800,color:"#fff",marginTop:12}}>Mot de passe oublié</h2>
          </div>
        )}
        {msg&&(
          <div style={{padding:"12px 14px",borderRadius:12,marginBottom:16,background:msg.type==="error"?"rgba(239,68,68,0.15)":"rgba(42,122,90,0.2)",border:`1px solid ${msg.type==="error"?"rgba(239,68,68,0.3)":"rgba(61,170,127,0.3)"}`}}>
            <p style={{fontSize:13,fontWeight:600,color:msg.type==="error"?"#FCA5A5":"#6EE7B7",lineHeight:1.5}}>{msg.text}</p>
          </div>
        )}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.6)",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com" onKeyDown={e=>e.key==="Enter"&&submit()}
            style={{width:"100%",padding:"13px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:15,outline:"none",fontFamily:"'Nunito',sans-serif",userSelect:"text"}}/>
        </div>
        {mode!=="forgot"&&(
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.6)",marginBottom:6,textTransform:"uppercase",letterSpacing:0.6}}>Mot de passe</label>
            <div style={{position:"relative"}}>
              <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="signup"?"6 caractères minimum":"••••••••"} onKeyDown={e=>e.key==="Enter"&&submit()}
                style={{width:"100%",padding:"13px 44px 13px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:15,outline:"none",fontFamily:"'Nunito',sans-serif",userSelect:"text"}}/>
              <button onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:18,color:"rgba(255,255,255,0.4)"}}>
                {showPass?"🙈":"👁️"}
              </button>
            </div>
            {mode==="login"&&<button onClick={()=>{setMode("forgot");setMsg(null);}} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(61,170,127,0.8)",fontSize:12,fontWeight:600,marginTop:8,padding:0,textAlign:"right",width:"100%"}}>Mot de passe oublié ?</button>}
          </div>
        )}
        <button onClick={submit} disabled={loading} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",cursor:loading?"default":"pointer",background:loading?"rgba(42,122,90,0.5)":"linear-gradient(135deg,#2A7A5A,#3DAA7F)",color:"#fff",fontSize:15,fontWeight:800,boxShadow:loading?"none":"0 4px 20px rgba(42,122,90,0.45)",transition:"all 0.2s"}}>
          {loading?"⏳ Chargement...":mode==="login"?"Se connecter":mode==="signup"?"Créer mon compte":"Envoyer le lien"}
        </button>
      </div>

      <p style={{marginTop:28,fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",lineHeight:1.8,fontStyle:"italic"}}>
        « Et quiconque craint Allah, Il lui facilite sa situation. »<br/>— At-Talaq 65:4
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────
   ÉMOTIONS SCREEN
───────────────────────────────────────── */
function EmotionsScreen({ onAddH, toast }) {
  const [selected, setSelected] = useState(null); // émotion sélectionnée
  const [doua,     setDoua]     = useState(null); // doua sélectionné
  const [ctr,      setCtr]      = useState({});   // compteurs

  // ── Vue détail d'un doua ──
  if (doua && selected) {
    const cur  = ctr[doua.id] || 0;
    const done = cur >= doua.count;
    const idx  = selected.douas.indexOf(doua);
    const total= selected.douas.length;

    return (
      <div className="doua-screen">
        {/* Header coloré */}
        <div style={{background:selected.color,padding:"44px 16px 20px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button onClick={()=>setDoua(null)} style={{background:"rgba(0,0,0,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:selected.textColor}}>←</button>
            <span style={{fontSize:13,fontWeight:700,color:selected.textColor,background:"rgba(0,0,0,0.08)",borderRadius:999,padding:"4px 12px"}}>{idx+1}/{total}</span>
            <div style={{width:36}}/>
          </div>
          <h2 style={{fontSize:18,fontWeight:800,color:selected.textColor,lineHeight:1.4}}>{doua.title}</h2>
        </div>

        {/* Contenu scrollable */}
        <div style={{flex:1,overflowY:"auto",padding:"24px 20px"}}>
          {/* Texte arabe */}
          <p className="arabic" style={{fontSize:32,lineHeight:2.4,textAlign:"center",color:"var(--ink)",marginBottom:28}}>
            {doua.arabic}
          </p>

          {/* Phonétique */}
          <p style={{fontSize:15,color:"var(--ink-m)",fontStyle:"italic",lineHeight:1.9,textAlign:"center",marginBottom:20}}>
            {doua.phonetic}
          </p>

          <div style={{height:1,background:"var(--border-s)",marginBottom:20}}/>

          {/* Traduction */}
          <p style={{fontSize:16,color:"var(--ink-s)",lineHeight:1.9,fontWeight:500,marginBottom:24}}>
            {doua.fr}
          </p>

          <p style={{fontSize:12,color:"var(--ink-m)",textAlign:"right",marginBottom:24}}>📚 {doua.source}</p>

          {/* Compteur */}
          {doua.count > 1 && (
            <div style={{textAlign:"center",marginBottom:16}}>
              <p style={{fontSize:13,color:"var(--ink-m)",marginBottom:12}}>À réciter {doua.count} fois</p>
              <div style={{background:"rgba(0,0,0,0.06)",borderRadius:999,height:6,overflow:"hidden",marginBottom:16}}>
                <div style={{width:`${Math.round((cur/doua.count)*100)}%`,height:"100%",background:done?"var(--gold)":`linear-gradient(90deg,${selected.color},${selected.textColor})`,borderRadius:999,transition:"width 0.25s"}}/>
              </div>
            </div>
          )}
        </div>

        {/* Bouton compteur bas */}
        <div style={{padding:"12px 20px 36px",flexShrink:0,borderTop:"1px solid var(--border-s)"}}>
          <button onClick={()=>{
            if(done)return;
            const next=(ctr[doua.id]||0)+1;
            setCtr(p=>({...p,[doua.id]:next}));
            if(next>=doua.count){onAddH(20);toast(`+20 ♥ — ${doua.title.slice(0,20)}...`);}
          }} disabled={done}
            style={{width:"100%",height:56,borderRadius:16,border:"none",cursor:done?"default":"pointer",
              background:done?"var(--emerald-glow)":`linear-gradient(135deg,${selected.color},${selected.color}CC)`,
              color:done?"var(--emerald)":selected.textColor,fontSize:done?15:22,fontWeight:800,
              boxShadow:done?"none":`0 4px 18px ${selected.color}AA`,
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s"}}>
            {done
              ? "✓ Récité"
              : doua.count===1
                ? "Récité ✓"
                : <><span style={{fontSize:26,fontWeight:800,lineHeight:1}}>{cur}</span><span style={{fontSize:14}}>/{doua.count}</span></>
            }
          </button>
        </div>

        {/* Navigation prev/next */}
        <div style={{padding:"0 20px 20px",display:"flex",gap:10,flexShrink:0}}>
          <button onClick={()=>setDoua(selected.douas[idx-1])} disabled={idx===0}
            style={{flex:1,height:44,borderRadius:12,border:"1px solid var(--border-s)",background:"var(--card)",cursor:idx===0?"default":"pointer",opacity:idx===0?0.3:1,fontSize:14,fontWeight:700,color:"var(--ink-s)"}}>
            ← Précédent
          </button>
          <button onClick={()=>setDoua(selected.douas[idx+1])} disabled={idx===total-1}
            style={{flex:1,height:44,borderRadius:12,border:"none",background:idx===total-1?"rgba(0,0,0,0.06)":"var(--emerald)",cursor:idx===total-1?"default":"pointer",opacity:idx===total-1?0.3:1,fontSize:14,fontWeight:700,color:"#fff"}}>
            Suivant →
          </button>
        </div>
      </div>
    );
  }

  // ── Vue liste des douas d'une émotion ──
  if (selected) {
    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:selected.color,padding:"44px 16px 20px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <button onClick={()=>setSelected(null)} style={{background:"rgba(0,0,0,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:selected.textColor}}>←</button>
            <div>
              <h2 style={{fontSize:20,fontWeight:800,color:selected.textColor}}>{selected.label}</h2>
              <p style={{fontSize:12,color:selected.textColor,opacity:0.7,marginTop:2}}>{selected.douas.length} invocations</p>
            </div>
          </div>
          {/* Tip */}
          <div style={{background:"rgba(255,255,255,0.35)",borderRadius:14,padding:"12px 14px"}}>
            <p style={{fontSize:13,color:selected.textColor,fontWeight:600,lineHeight:1.5}}>
              Sélectionne une ou plusieurs supplications ci-dessous à réciter.
            </p>
          </div>
        </div>

        {/* Liste */}
        <div style={{flex:1,overflowY:"auto"}}>
          <div style={{background:"var(--card)",margin:"12px 16px",borderRadius:20,overflow:"hidden",border:"1px solid var(--border)"}}>
            {selected.douas.map((d,i)=>{
              const done=(ctr[d.id]||0)>=d.count;
              return(
                <div key={d.id} className="dhikr-list-item" style={{opacity:done?0.6:1,padding:"18px 16px"}} onClick={()=>setDoua(d)}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:done?selected.color:"rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:done?selected.textColor:"var(--ink-m)",flexShrink:0,transition:"all 0.2s"}}>
                    {done?"✓":i+1}
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:15,fontWeight:700,color:"var(--ink)",lineHeight:1.4}}>{d.title}</p>
                    {done&&<p style={{fontSize:11,color:"var(--emerald)",fontWeight:700,marginTop:3}}>✓ Complété</p>}
                  </div>
                  <span style={{color:"var(--ink-m)",fontSize:20}}>›</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Vue grille des émotions ──
  return (
    <div style={{flex:1,overflowY:"auto",padding:"10px 16px 16px"}}>
      <h2 style={{fontSize:26,fontWeight:800,color:"var(--ink)",marginBottom:4}}>Émotions</h2>
      <p style={{fontSize:15,color:"var(--ink-m)",marginBottom:20}}>Que <strong style={{color:"var(--ink)"}}>ressens-tu</strong> ?</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {EMOTIONS.map((em,i)=>(
          <button key={em.id} className="emotion-card fu"
            onClick={()=>setSelected(em)}
            style={{
              background:em.color,
              animationDelay:`${i*0.04}s`,
              boxShadow:`0 4px 16px ${em.color}88`,
            }}>
            <div style={{textAlign:"center"}}>
              <span style={{fontSize:28,display:"block",marginBottom:8}}>{em.icon}</span>
              <p style={{fontSize:16,fontWeight:700,color:em.textColor}}>{em.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div style={{marginTop:20,padding:"14px 16px",background:"var(--emerald-glow)",borderRadius:16,border:"1px solid rgba(42,122,90,0.15)",textAlign:"center"}}>
        <p style={{fontSize:13,color:"var(--ink-s)",fontStyle:"italic"}}>« Allah est avec ceux qui se maîtrisent et avec les bienfaisants. » — An-Nahl 16:128</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   VERSE READER
───────────────────────────────────────── */
function VerseReader({surah,initialVerseId,onClose,onGoHome,onAddH,notes,setNotes,goalSecs,onTimeSpent,savedVerses,setSavedVerses,fontSizes}){
  const{verses,loading,error}=useSurahVerses(surah.id);
  const startIdx=initialVerseId?Math.max(0,initialVerseId-1):0;
  const[idx,setIdx]=useState(startIdx);
  const[cls,setCls]=useState("vs-in");
  const[readSet,setReadSet]=useState(new Set());
  const[showPop,setShowPop]=useState(false);
  const[hCount,setHCount]=useState(0);
  const[sheet,setSheet]=useState(null);
  const[noteText,setNoteText]=useState("");
  const[phonetic,setPhonetic]=useState(false);
  const[elapsed,setElapsed]=useState(0);
  const[audioPlaying,setAudioPlaying]=useState(false);
  const[audioLoading,setAudioLoading]=useState(false);
  const[saveBump,setSaveBump]=useState(false);
  const[tafsirText,setTafsirText]=useState(null);
  const[tafsirLoad,setTafsirLoad]=useState(false);
  const[tafsirErr,setTafsirErr]=useState(false);
  const audioRef=useRef(null);const anim=useRef(false);const touchX=useRef(null);const timerRef=useRef(null);
  const total=verses.length;const v=verses[idx];
  const remaining=Math.max(0,goalSecs-elapsed);const pct=Math.min(1,elapsed/goalSecs);
  const verseKey=v?`${surah.id}-${v.id}`:null;const isSaved=verseKey?!!savedVerses[verseKey]:false;
  useEffect(()=>{if(v)saveProgress(surah.id,surah.name,surah.arabic,v.id);},[idx,v]);
  useEffect(()=>{if(!loading&&verses.length>0)timerRef.current=setInterval(()=>setElapsed(e=>e+1),1000);return()=>clearInterval(timerRef.current);},[loading,verses.length]);
  useEffect(()=>{if(audioRef.current){audioRef.current.pause();audioRef.current=null;setAudioPlaying(false);}if(v)setNoteText(notes[`${surah.id}-${v.id}`]||"");setSheet(null);setTafsirText(null);setTafsirErr(false);},[idx]);
  useEffect(()=>{if(sheet!=="tafsir"||!v)return;setTafsirText(null);setTafsirErr(false);setTafsirLoad(true);fetchTafsir(surah.id,v.id).then(text=>{setTafsirLoad(false);if(text)setTafsirText(text);else setTafsirErr(true);});},[sheet]);
  const vibrate=()=>{if(navigator.vibrate)navigator.vibrate(40);};
  const toggleAudio=()=>{
    if(!v?.audioUrl)return;
    if(audioRef.current){if(audioPlaying){audioRef.current.pause();setAudioPlaying(false);}else{audioRef.current.play();setAudioPlaying(true);}return;}
    setAudioLoading(true);
    const playVerse=()=>{const a=new Audio(v.audioUrl);audioRef.current=a;a.oncanplay=()=>{setAudioLoading(false);a.play();setAudioPlaying(true);};a.onended=()=>setAudioPlaying(false);a.onerror=()=>{setAudioLoading(false);setAudioPlaying(false);};};
    if(idx===0){const bas=new Audio(BASMALA.audio);audioRef.current=bas;bas.oncanplay=()=>{setAudioLoading(false);bas.play();setAudioPlaying(true);};bas.onended=()=>{audioRef.current=null;playVerse();};bas.onerror=()=>playVerse();}else{playVerse();}
  };
  const goTo=(next,dir)=>{
    if(anim.current||next<0||next>=total)return;anim.current=true;vibrate();
    setCls(dir==="l"?"vs-out-l":"vs-out-r");
    setTimeout(()=>{setIdx(next);setCls(dir==="l"?"vs-out-r":"vs-out-l");requestAnimationFrame(()=>requestAnimationFrame(()=>{setCls("vs-in");anim.current=false;}));if(dir==="l"&&!readSet.has(idx)){setReadSet(p=>new Set([...p,idx]));onAddH(10);setHCount(c=>c+10);setShowPop(true);setTimeout(()=>setShowPop(false),900);}},280);
  };
  const markDone=()=>{if(!readSet.has(idx)){onAddH(10);setHCount(c=>c+10);}if(audioRef.current){audioRef.current.pause();audioRef.current=null;}clearInterval(timerRef.current);onTimeSpent(elapsed);onClose();onGoHome();};
  const toggleSave=()=>{if(!v)return;setSavedVerses(p=>{const n={...p};if(n[verseKey])delete n[verseKey];else n[verseKey]={surahId:surah.id,surahName:surah.name,verseId:v.id,arabic:v.arabic,fr:v.fr,savedAt:Date.now()};return n;});setSaveBump(true);setTimeout(()=>setSaveBump(false),200);};
  const saveNote=()=>{setNotes(p=>({...p,[`${surah.id}-${v.id}`]:noteText}));setSheet(null);};
  const shareText=v?`${v.arabic}\n\n${v.fr}\n\n— ${surah.name} ${surah.id}:${v.id}\n\nHassanates`:"";
  const share=()=>{if(navigator.share)navigator.share({title:`${surah.name} — Verset ${v.id}`,text:shareText});else navigator.clipboard?.writeText(shareText);setSheet(null);};
  const onTS=e=>{touchX.current=e.touches[0].clientX;};
  const onTE=e=>{if(!touchX.current)return;const dx=touchX.current-e.changedTouches[0].clientX;if(Math.abs(dx)>44)dx>0?goTo(idx+1,"l"):goTo(idx-1,"r");touchX.current=null;};

  if(loading)return(<div className="reader" style={{alignItems:"center",justifyContent:"center",gap:16}}><div style={{width:56,height:56,borderRadius:"50%",background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>📖</div><p style={{fontSize:15,color:"var(--ink-m)",fontWeight:600}}>Chargement de {surah.name}...</p><div style={{width:200,height:4,borderRadius:999,background:"var(--border-s)",overflow:"hidden"}}><div style={{width:"60%",height:"100%",background:"var(--emerald)",borderRadius:999,animation:"loadBar 1.2s ease-in-out infinite"}}/></div><button onClick={()=>{clearInterval(timerRef.current);onClose();onGoHome();}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink-m)",fontSize:14,fontWeight:600}}>← Retour</button></div>);
  if(error||!v)return(<div className="reader" style={{alignItems:"center",justifyContent:"center",gap:12}}><p style={{fontSize:28}}>⚠️</p><p style={{fontSize:14,color:"var(--ink-m)"}}>Erreur de chargement</p><button onClick={()=>{clearInterval(timerRef.current);onClose();onGoHome();}} style={{background:"var(--emerald)",color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",cursor:"pointer",fontWeight:700}}>← Retour</button></div>);

  return(
    <div className="reader" onTouchStart={onTS} onTouchEnd={onTE}>
      {/* Header */}
      <div style={{padding:"44px 16px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:8}}>
        <button onClick={markDone} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"var(--ink-s)",flexShrink:0}}>←</button>
        <div style={{flex:1,textAlign:"center"}}>
          <p style={{fontSize:15,fontWeight:800,color:"var(--emerald)"}}>{surah.name}</p>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:3}}>
            <div style={{background:"var(--emerald)",borderRadius:999,padding:"2px 12px",boxShadow:"0 2px 8px rgba(42,122,90,0.35)"}}><span style={{fontSize:12,fontWeight:800,color:"#fff"}}>{v.id} / {total}</span></div>
            {hCount>0&&<div style={{background:"rgba(224,107,139,0.12)",border:"1px solid rgba(224,107,139,0.25)",borderRadius:999,padding:"2px 9px"}}><span style={{fontSize:11,fontWeight:800,color:"var(--heart)"}}>+{hCount} ♥</span></div>}
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button onClick={()=>setPhonetic(!phonetic)} style={{background:phonetic?"var(--emerald-glow)":"rgba(0,0,0,0.05)",border:"1px solid "+(phonetic?"rgba(61,170,127,0.3)":"var(--border-s)"),color:phonetic?"var(--emerald)":"var(--ink-m)",borderRadius:8,padding:"4px 9px",cursor:"pointer",fontSize:12,fontWeight:700}}>Ph</button>
          <button onClick={toggleSave} className={saveBump?"bump":""} style={{background:isSaved?"rgba(196,154,60,0.15)":"rgba(0,0,0,0.05)",border:`1px solid ${isSaved?"rgba(196,154,60,0.4)":"var(--border-s)"}`,borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16}}>🔖</button>
        </div>
      </div>
      {/* Progress */}
      <div style={{margin:"0 16px 10px",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:12,color:"var(--ink-m)",fontWeight:600}}>Objectif session</span>
          <span style={{fontSize:12,color:remaining===0?"var(--gold)":"var(--emerald)",fontWeight:700}}>{remaining===0?"✓ Atteint !":fmtTime(remaining)}</span>
        </div>
        <div style={{background:"rgba(0,0,0,0.06)",borderRadius:999,height:5,overflow:"hidden"}}><div style={{width:`${pct*100}%`,height:"100%",background:pct>=1?"var(--gold)":"linear-gradient(90deg,var(--emerald),var(--emerald-l))",borderRadius:999,transition:"width 1s linear"}}/></div>
      </div>
      {/* Verset */}
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <div className={`vslide ${cls}`} style={{justifyContent:"flex-start",paddingTop:12}}>
          {idx===0&&<div style={{width:"100%",marginBottom:16,padding:"10px 14px",background:"var(--emerald-glow)",borderRadius:14,border:"1px solid rgba(42,122,90,0.2)",textAlign:"center"}}><p className="arabic" style={{fontSize:Math.round(fontSizes.arabic*0.85),color:"var(--emerald)",lineHeight:2}}>{BASMALA.arabic}</p><p style={{fontSize:fontSizes.fr-2,color:"var(--ink-m)",fontStyle:"italic",marginTop:4}}>{BASMALA.fr}</p></div>}
          <p className="arabic" style={{fontSize:fontSizes.arabic,lineHeight:2.4,textAlign:"center",color:"var(--ink)",marginBottom:20,width:"100%"}}>{v.arabic}</p>
          <div style={{display:"flex",alignItems:"center",gap:12,width:"100%",marginBottom:16}}><div style={{flex:1,height:1,background:"var(--border-s)"}}/><span style={{color:"var(--gold)",fontSize:14}}>✦</span><div style={{flex:1,height:1,background:"var(--border-s)"}}/></div>
          {phonetic&&<p style={{fontSize:fontSizes.phonetic,color:"var(--ink-m)",fontStyle:"italic",textAlign:"center",lineHeight:1.8,marginBottom:12,width:"100%"}}></p>}
          <p style={{fontSize:fontSizes.fr,color:"var(--ink-s)",lineHeight:1.9,textAlign:"center",width:"100%"}}>{v.fr}</p>
          {notes[`${surah.id}-${v.id}`]&&<div style={{marginTop:16,background:"var(--emerald-glow)",borderRadius:12,padding:"9px 14px",border:"1px solid rgba(61,170,127,0.2)",width:"100%"}}><p style={{fontSize:12,color:"var(--emerald)",fontWeight:600}}>📝 {notes[`${surah.id}-${v.id}`]}</p></div>}
        </div>
        {showPop&&<div className="hpop">+10 ♥</div>}
      </div>
      {/* Dots */}
      <div style={{display:"flex",gap:5,justifyContent:"center",padding:"6px 0",flexShrink:0,overflowX:"auto"}}>
        {verses.slice(0,20).map((_,i)=><div key={i} className="dot" onClick={()=>goTo(i,i>idx?"l":"r")} style={{background:i===idx?"var(--emerald)":readSet.has(i)?"var(--emerald-l)":"rgba(0,0,0,0.12)",width:i===idx?20:6}}/>)}
        {verses.length>20&&<span style={{fontSize:10,color:"var(--ink-m)",alignSelf:"center"}}>+{verses.length-20}</span>}
      </div>
      {/* Actions */}
      <div style={{padding:"4px 12px",display:"flex",gap:6,flexShrink:0}}>
        <button onClick={toggleAudio} style={{flex:1,background:audioPlaying?"var(--emerald-glow)":"var(--card)",border:`1px solid ${audioPlaying?"rgba(42,122,90,0.4)":"var(--border)"}`,borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:audioPlaying?"var(--emerald)":"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>{audioLoading?"⏳":audioPlaying?"⏸ Stop":"▶ Écouter"}</button>
        <button onClick={()=>setSheet("note")} style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>✏️ Note</button>
        <button onClick={()=>setSheet("tafsir")} style={{flex:1,background:"linear-gradient(135deg,rgba(196,154,60,0.15),rgba(196,154,60,0.08))",border:"1px solid rgba(196,154,60,0.35)",borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>📖 Tafsir</button>
        <button onClick={()=>setSheet("share")} style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center"}}>🔗</button>
      </div>
      {/* Nav bas */}
      <div style={{padding:"6px 16px 32px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={()=>goTo(idx-1,"r")} disabled={idx===0} style={{width:48,height:48,borderRadius:"50%",border:"1px solid var(--border)",background:"var(--card)",cursor:idx===0?"default":"pointer",opacity:idx===0?0.3:1,fontSize:18,color:"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"var(--shadow)"}}>←</button>
        <button onClick={markDone} style={{flex:1,height:48,borderRadius:14,border:"none",background:"linear-gradient(135deg,#2A7A5A,#3DAA7F)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 18px rgba(42,122,90,0.4)"}}>J'ai fini ✓</button>
        <button onClick={()=>goTo(idx+1,"l")} disabled={idx===total-1} style={{width:48,height:48,borderRadius:"50%",border:"none",background:idx===total-1?"rgba(0,0,0,0.06)":"var(--emerald)",cursor:idx===total-1?"default":"pointer",opacity:idx===total-1?0.3:1,fontSize:18,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:idx===total-1?"none":"0 4px 14px rgba(42,122,90,0.35)"}}>→</button>
      </div>
      {/* Sheets */}
      {sheet==="tafsir"&&<Sheet onClose={()=>setSheet(null)}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#C49A3C,#E8C060)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📖</div><div><p style={{fontSize:15,fontWeight:800,color:"var(--ink)"}}>Tafsir</p><p style={{fontSize:11,color:"var(--ink-m)"}}>{surah.name} — Verset {v.id}</p></div></div><p className="arabic" style={{fontSize:20,textAlign:"right",lineHeight:2,color:"var(--emerald)",marginBottom:14}}>{v.arabic}</p><div style={{background:"rgba(0,0,0,0.03)",borderRadius:14,padding:"14px",border:"1px solid var(--border-s)",minHeight:80}}>{tafsirLoad&&<p style={{fontSize:13,color:"var(--ink-m)",textAlign:"center",padding:"20px 0"}}>⏳ Chargement...</p>}{tafsirErr&&!tafsirLoad&&<div style={{textAlign:"center",padding:"12px 0"}}><p style={{fontSize:20}}>📭</p><p style={{fontSize:13,color:"var(--ink-m)",marginTop:8,fontWeight:600}}>Tafsir non disponible</p><p style={{fontSize:12,color:"var(--ink-m)",marginTop:4,lineHeight:1.6}}>Ajoute du contenu via Supabase (table tafsirs).</p></div>}{tafsirText&&!tafsirLoad&&<p style={{fontSize:14,color:"var(--ink-s)",lineHeight:1.9}}>{tafsirText}</p>}</div></Sheet>}
      {sheet==="note"&&<Sheet onClose={()=>setSheet(null)}><h3 style={{fontSize:17,marginBottom:4,color:"var(--ink)"}}>Note privée</h3><p style={{fontSize:12,color:"var(--ink-m)",marginBottom:12}}>{surah.name} — Verset {v.id}</p><p className="arabic" style={{fontSize:20,textAlign:"right",lineHeight:2,marginBottom:12,color:"var(--emerald)"}}>{v.arabic}</p><textarea rows={4} placeholder="Réflexion, mémorisation..." value={noteText} onChange={e=>setNoteText(e.target.value)}/><button onClick={saveNote} style={{marginTop:10,width:"100%",background:"var(--emerald)",color:"#fff",border:"none",borderRadius:13,padding:"13px",cursor:"pointer",fontSize:14,fontWeight:700}}>Sauvegarder ✓</button></Sheet>}
      {sheet==="share"&&<Sheet onClose={()=>setSheet(null)}><h3 style={{fontSize:17,marginBottom:12,color:"var(--ink)"}}>Partager ce verset</h3><div style={{background:"rgba(0,0,0,0.04)",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid var(--border-s)"}}><p className="arabic" style={{fontSize:20,textAlign:"right",lineHeight:2,marginBottom:10,color:"var(--ink)"}}>{v.arabic}</p><div style={{height:1,background:"var(--border-s)",marginBottom:10}}/><p style={{fontSize:13,color:"var(--ink-s)",lineHeight:1.7,fontStyle:"italic"}}>{v.fr}</p><p style={{fontSize:11,color:"var(--ink-m)",marginTop:8,textAlign:"right"}}>— {surah.name} {surah.id}:{v.id}</p></div><div style={{display:"flex",gap:10}}><button onClick={share} style={{flex:1,background:"var(--emerald)",color:"#fff",border:"none",borderRadius:13,padding:"13px",cursor:"pointer",fontSize:13,fontWeight:700}}>📤 Partager</button><button onClick={()=>{navigator.clipboard?.writeText(shareText);setSheet(null);}} style={{flex:1,background:"rgba(0,0,0,0.05)",color:"var(--ink-s)",border:"1px solid var(--border-s)",borderRadius:13,padding:"13px",cursor:"pointer",fontSize:13,fontWeight:700}}>📋 Copier</button></div></Sheet>}
    </div>
  );
}

/* ─────────────────────────────────────────
   HOME
───────────────────────────────────────── */
const DAYS=["L","M","M","J","V","S","D"];
const todayRaw=new Date().getDay();const todayIdx=todayRaw===0?6:todayRaw-1;
const WEEK_DATA=[{done:true,h:320,v:28,m:18},{done:true,h:210,v:15,m:12},{done:true,h:480,v:42,m:25},{done:false,h:90,v:8,m:5},{done:false,h:0,v:0,m:0},{done:false,h:0,v:0,m:0},{done:false,h:0,v:0,m:0}];
const CIRCLE=[{name:"Amina",avatar:"🌸",h:2840},{name:"Karim",avatar:"🌙",h:1920},{name:"Fatima",avatar:"🌿",h:3100},{name:"Ibrahim",avatar:"⭐",h:650}];

function HomeScreen({hassanates,streak,readingMins,onStart,userName}){
  const[selectedDay,setSelectedDay]=useState(todayIdx);
  const[circleH,setCircleH]=useState(CIRCLE.reduce((a,m)=>a+m.h,0));
  const progress=loadProgress();
  const dayData=WEEK_DATA[selectedDay]||WEEK_DATA[todayIdx];
  const isToday=selectedDay===todayIdx;
  const statsGrid=[{icon:"♥",label:"Hassanates",val:isToday?hassanates.toLocaleString():dayData.h.toLocaleString(),color:"var(--heart)"},{icon:"📖",label:"Versets lus",val:isToday?"0":dayData.v,color:"var(--emerald)"},{icon:"⏱️",label:"Mins lecture",val:isToday?readingMins:dayData.m,color:"#7C6AE8"},{icon:"✅",label:"Sourates",val:"0",color:"var(--gold)"}];
  return(
    <div style={{flex:1,overflowY:"auto",padding:"10px 16px 16px"}}>
      <div className="fu" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <p style={{fontSize:14,color:"var(--ink-m)",fontWeight:600}}>Assalam Alaykum 🤍</p>
          <p style={{fontSize:24,fontWeight:800,color:"var(--ink)",fontFamily:"'Playfair Display',serif",textTransform:"capitalize"}}>{userName}</p>
          <div className="pill" style={{marginTop:5}}>🔥 {streak} jour{streak>1?"s":""} de suite</div>
        </div>
        <div style={{width:54,height:54,borderRadius:"50%",background:"linear-gradient(135deg,var(--emerald),var(--emerald-l))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:"0 4px 16px rgba(42,122,90,0.3)"}}>🌿</div>
      </div>

      {/* Semaine */}
      <div className="fu card" style={{padding:"12px 14px",marginBottom:14,animationDelay:"0.04s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <p style={{fontSize:12,fontWeight:700,color:"var(--ink-m)"}}>Cette semaine</p>
          {!isToday&&<button onClick={()=>setSelectedDay(todayIdx)} style={{fontSize:11,fontWeight:700,color:"var(--emerald)",background:"var(--emerald-glow)",border:"none",borderRadius:999,padding:"2px 8px",cursor:"pointer"}}>Aujourd'hui</button>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {DAYS.map((d,i)=>{const data=WEEK_DATA[i],isSel=i===selectedDay,isT=i===todayIdx,isFut=i>todayIdx;return(<div key={i} onClick={()=>{if(isFut)return;setSelectedDay(i);}} style={{cursor:isFut?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:36,height:36,borderRadius:"50%",background:isSel?"var(--emerald)":isT?"var(--emerald-glow)":"transparent",border:isT&&!isSel?"2px solid var(--emerald)":"2px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",opacity:isFut?0.35:1,transition:"all 0.2s"}}><span style={{fontSize:12,fontWeight:800,color:isSel?"#fff":isT?"var(--emerald)":"var(--ink-m)"}}>{d}</span></div><div style={{width:5,height:5,borderRadius:"50%",background:data.done?"var(--gold)":"transparent"}}/></div>);})}
        </div>
        {!isToday&&<p style={{fontSize:12,color:"var(--ink-m)",textAlign:"center",marginTop:6,fontWeight:600}}>{["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"][selectedDay]} · {dayData.done?"✅ Objectif atteint":"Non atteint"}</p>}
      </div>

      {/* Carte lecture */}
      <div className="fu goal-card" style={{marginBottom:14,animationDelay:"0.07s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <p style={{fontSize:12,opacity:0.8,fontWeight:600,marginBottom:4}}>{progress?"Reprendre la lecture":"Commencer la lecture"}</p>
            <p style={{fontSize:20,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>{progress?progress.surahName:"Al-Fatiha"}</p>
            {progress&&<p style={{fontSize:12,opacity:0.8,marginTop:2}}>Verset {progress.verseId}</p>}
          </div>
          <p className="arabic" style={{fontSize:28,opacity:0.85}}>{progress?progress.surahArabic:"الفاتحة"}</p>
        </div>
        <button onClick={onStart} style={{background:"rgba(255,255,255,0.92)",color:"var(--emerald)",border:"none",borderRadius:13,padding:"13px 0",width:"100%",cursor:"pointer",fontSize:15,fontWeight:800}}>{progress?`Reprendre — Verset ${progress.verseId} →`:"Commencer la lecture →"}</button>
      </div>

      {/* Stats */}
      <div className="fu" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14,animationDelay:"0.09s"}}>
        {statsGrid.map((s,i)=><div key={i} className="stat-card" style={{backdropFilter:"blur(12px)"}}><span style={{fontSize:22,color:s.color}}>{s.icon}</span><p style={{fontSize:24,fontWeight:800,color:"var(--ink)",fontFamily:"'Playfair Display',serif",marginTop:6}}>{s.val}</p><p style={{fontSize:12,color:"var(--ink-m)",marginTop:2,fontWeight:600}}>{s.label}</p></div>)}
      </div>

      {/* Cercle */}
      <div className="fu card" style={{padding:"18px",marginBottom:14,animationDelay:"0.11s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><p style={{fontSize:15,fontWeight:800,color:"var(--ink)"}}>🤝 Mon Cercle</p><p style={{fontSize:12,color:"var(--ink-m)",marginTop:2}}>Progression collective</p></div>
          <div style={{textAlign:"right"}}><p style={{fontSize:17,fontWeight:800,color:"var(--heart)",fontFamily:"'Playfair Display',serif"}}>{circleH.toLocaleString()}</p><p style={{fontSize:11,color:"var(--ink-m)"}}>/ 10 000 ♥</p></div>
        </div>
        <div style={{background:"rgba(0,0,0,0.06)",borderRadius:999,height:8,overflow:"hidden",marginBottom:16}}><div style={{width:`${Math.min(100,(circleH/10000)*100)}%`,height:"100%",background:"linear-gradient(90deg,var(--heart),#F09AAF)",borderRadius:999,transition:"width 0.8s"}}/></div>
        <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
          {CIRCLE.map((m,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",marginRight:14}}><div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${i*60},60%,75%),hsl(${i*60+30},60%,65%))`,border:"2px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{m.avatar}</div><p style={{fontSize:11,fontWeight:700,color:"var(--ink-s)",marginTop:4}}>{m.name}</p><p style={{fontSize:10,color:"var(--heart)",fontWeight:700}}>{m.h.toLocaleString()} ♥</p></div>)}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginLeft:"auto"}}><button style={{width:44,height:44,borderRadius:"50%",background:"var(--emerald-glow)",border:"2px dashed rgba(42,122,90,0.4)",cursor:"pointer",fontSize:20,color:"var(--emerald)",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button><p style={{fontSize:10,fontWeight:700,color:"var(--emerald)",marginTop:4}}>Inviter</p></div>
        </div>
        <button onClick={()=>setCircleH(h=>Math.min(10000,h+50))} style={{width:"100%",background:"rgba(0,0,0,0.04)",border:"1px dashed var(--border-s)",borderRadius:10,padding:"8px",cursor:"pointer",fontSize:13,fontWeight:600,color:"var(--ink-m)"}}>⚡ Simuler +50 ♥</button>
      </div>

      {/* Ayah */}
      <div className="fu card" style={{padding:"16px",marginBottom:12,animationDelay:"0.13s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <p style={{fontSize:14,fontWeight:800,color:"var(--ink)"}}>✨ Ayah du jour</p>
          <span style={{fontSize:12,color:"var(--ink-m)",fontWeight:600}}>{AYAH_DU_JOUR.ref}</span>
        </div>
        <p className="arabic" style={{fontSize:22,textAlign:"right",lineHeight:2,color:"var(--emerald)",marginBottom:10}}>{AYAH_DU_JOUR.arabic}</p>
        <p style={{fontSize:14,color:"var(--ink-s)",lineHeight:1.7,fontStyle:"italic"}}>« {AYAH_DU_JOUR.fr} »</p>
      </div>

      {/* Défi */}
      <div className="fu" style={{background:"linear-gradient(135deg,#7C6AE8,#A08CF5)",borderRadius:20,padding:"16px",animationDelay:"0.15s"}}>
        <p style={{fontSize:14,fontWeight:800,color:"#fff",marginBottom:4}}>🏆 Défi du jour</p>
        <p style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginBottom:12}}>Lis 3 sourates courtes aujourd'hui</p>
        <div style={{background:"rgba(255,255,255,0.25)",borderRadius:999,height:6,overflow:"hidden"}}><div style={{width:"0%",height:"100%",background:"#fff",borderRadius:999}}/></div>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginTop:6}}>0 / 3 complété</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CORAN
───────────────────────────────────────── */
function QuranScreen({onOpen}){
  const{surahs,loading,error}=useSurahs();const[search,setSearch]=useState("");
  const filtered=search?surahs.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.arabic.includes(search)||String(s.id).includes(search)):surahs;
  return(
    <div style={{flex:1,overflowY:"auto",padding:"10px 16px 16px"}}>
      <h2 style={{fontSize:26,marginBottom:4,color:"var(--ink)",fontWeight:800}}>Le Saint Coran</h2>
      <p style={{fontSize:14,color:"var(--ink-m)",marginBottom:12}}>114 sourates</p>
      <div style={{position:"relative",marginBottom:14}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,color:"var(--ink-m)"}}>🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une sourate..." style={{width:"100%",padding:"11px 12px 11px 36px",borderRadius:12,border:"1px solid var(--border-s)",background:"var(--card)",color:"var(--ink)",fontSize:14,outline:"none",fontFamily:"'Nunito',sans-serif"}}/></div>
      {loading&&<div style={{display:"flex",flexDirection:"column",gap:10}}>{Array.from({length:8}).map((_,i)=><div key={i} className="card" style={{padding:"14px 16px",height:70,opacity:0.5}}><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:44,height:44,borderRadius:12,background:"var(--emerald-glow)"}}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}><div style={{width:"40%",height:13,borderRadius:6,background:"var(--border-s)"}}/><div style={{width:"60%",height:11,borderRadius:6,background:"var(--border-s)"}}/></div></div></div>)}</div>}
      {error&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--ink-m)"}}><p style={{fontSize:28,marginBottom:8}}>⚠️</p><p style={{fontSize:14}}>Impossible de charger le Coran</p></div>}
      {!loading&&!error&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((s,i)=><div key={s.id} className="card fu" onClick={()=>onOpen(s)} style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",animationDelay:`${Math.min(i,12)*0.03}s`}}><div style={{width:44,height:44,borderRadius:12,background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:14,fontWeight:700,color:"var(--emerald)"}}>{s.id}</span></div><div style={{flex:1}}><p style={{fontWeight:700,fontSize:16,color:"var(--ink)"}}>{s.name}</p><p style={{fontSize:12,color:"var(--ink-m)",marginTop:2}}>{s.verses} versets · {s.rev}</p></div><p className="arabic" style={{fontSize:22,color:"var(--gold)"}}>{s.arabic}</p></div>)}
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--ink-m)"}}><p style={{fontSize:28}}>🔍</p><p style={{fontSize:14,marginTop:8}}>Aucun résultat pour « {search} »</p></div>}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   DHIKR
───────────────────────────────────────── */
function DhikrScreen({onAddH,toast}){
  const[selected,setSelected]=useState(null);const[detail,setDetail]=useState(null);const[search,setSearch]=useState("");const[ctrs,setCtrs]=useState({});const[bumpId,setBumpId]=useState(null);const[mainTab,setMainTab]=useState("principal");
  const cats=mainTab==="principal"?DHIKR_CATEGORIES.slice(0,6):DHIKR_CATEGORIES.slice(6);
  const tap=d=>{const cur=ctrs[d.id]||0;if(cur>=d.count)return;const next=cur+1;setCtrs(p=>({...p,[d.id]:next}));setBumpId(d.id);setTimeout(()=>setBumpId(null),180);if(next===d.count){onAddH(d.h);toast(`+${d.h} ♥`);}};
  if(detail&&selected){const d=detail,cur=ctrs[d.id]||0,done=cur>=d.count;return(<div style={{flex:1,overflowY:"auto",padding:"10px 16px 24px"}}><button onClick={()=>setDetail(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"var(--ink-s)",marginBottom:16}}>←</button><div className="card" style={{padding:"20px"}}><p style={{fontSize:12,color:"var(--ink-m)",marginBottom:8,fontWeight:600}}>{selected.label}</p><p style={{fontSize:18,fontWeight:800,color:"var(--ink)",marginBottom:16,lineHeight:1.4}}>{d.title}</p><p className="arabic" style={{fontSize:30,textAlign:"right",lineHeight:2.4,color:"var(--ink)",marginBottom:16}}>{d.arabic}</p><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><div style={{flex:1,height:1,background:"var(--border-s)"}}/><span style={{color:"var(--gold)"}}>✦</span><div style={{flex:1,height:1,background:"var(--border-s)"}}/></div><p style={{fontSize:14,color:"var(--ink-m)",fontStyle:"italic",lineHeight:1.8,marginBottom:12}}>{d.phonetic}</p><p style={{fontSize:15,color:"var(--ink-s)",lineHeight:1.9,marginBottom:20}}>{d.fr}</p><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><span style={{fontSize:13,fontWeight:700,color:done?"var(--gold)":"var(--emerald)"}}>+{d.h} ♥ · {d.count}×</span><button style={{width:72,height:72,borderRadius:"50%",border:"none",cursor:done?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:done?"rgba(0,0,0,0.05)":`linear-gradient(135deg,${selected.grad[0]},${selected.grad[1]})`,color:done?"var(--ink-m)":"#fff",boxShadow:done?"none":`0 4px 18px ${selected.grad[0]}55`}} onClick={()=>tap(d)} disabled={done}>{done?<span style={{fontSize:28}}>✓</span>:<><span style={{fontSize:22,fontWeight:800,lineHeight:1}}>{cur}</span><span style={{fontSize:11}}>/{d.count}</span></>}</button></div><div style={{background:"rgba(0,0,0,0.05)",borderRadius:999,height:6,overflow:"hidden"}}><div style={{width:`${Math.round((cur/d.count)*100)}%`,height:"100%",background:done?"var(--gold)":`linear-gradient(90deg,${selected.grad[0]},${selected.grad[1]})`,borderRadius:999,transition:"width 0.25s"}}/></div></div></div>);}
  if(selected){const items=search?selected.items.filter(d=>d.title.toLowerCase().includes(search.toLowerCase())||d.fr.toLowerCase().includes(search.toLowerCase())):selected.items;return(<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}><div style={{padding:"44px 16px 14px",flexShrink:0,background:selected.bg}}><div style={{display:"flex",alignItems:"center",gap:12}}><button onClick={()=>{setSelected(null);setSearch("");}} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"#fff"}}>←</button><div><p style={{fontSize:20,fontWeight:800,color:"#fff"}}>{selected.label}</p><p style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>{selected.items.length} invocations</p></div></div></div><div style={{padding:"12px 16px 0",flexShrink:0}}><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,color:"var(--ink-m)"}}>🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." style={{width:"100%",padding:"10px 12px 10px 36px",borderRadius:12,border:"1px solid var(--border-s)",background:"var(--card)",color:"var(--ink)",fontSize:14,outline:"none",fontFamily:"'Nunito',sans-serif"}}/></div></div><div style={{flex:1,overflowY:"auto"}}><div className="card" style={{margin:"12px 16px",overflow:"hidden"}}>{items.map((d,i)=>{const cur=ctrs[d.id]||0,done=cur>=d.count;return(<div key={d.id} className="dhikr-list-item" style={{opacity:done?0.6:1}} onClick={()=>setDetail(d)}><div style={{width:38,height:38,borderRadius:"50%",background:done?"var(--gold)":"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:done?"#fff":"var(--emerald)",flexShrink:0}}>{done?"✓":i+1}</div><div style={{flex:1}}><p style={{fontSize:15,fontWeight:700,color:"var(--ink)",lineHeight:1.3}}>{d.title}</p><p style={{fontSize:12,color:"var(--ink-m)",marginTop:2}}>{done?`Complété · +${d.h} ♥`:`${d.count}× · +${d.h} ♥`}</p></div><span style={{color:"var(--ink-m)",fontSize:18}}>›</span></div>);})}{items.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--ink-m)"}}><p style={{fontSize:28}}>🔍</p><p style={{fontSize:14,marginTop:8}}>Aucun résultat</p></div>}</div></div></div>);}
  return(<div style={{flex:1,overflowY:"auto",padding:"10px 16px 16px"}}><h2 style={{fontSize:24,fontWeight:800,color:"var(--ink)",marginBottom:14}}>Dhikr & Doua</h2><div className="tab-bar" style={{marginBottom:16}}><button className={`tab${mainTab==="principal"?" active":""}`} onClick={()=>setMainTab("principal")}>⭐ Principal</button><button className={`tab${mainTab==="autre"?" active":""}`} onClick={()=>setMainTab("autre")}>🗂️ Autre</button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{cats.map((cat,i)=><div key={cat.id} className="dhikr-cat-card fu" onClick={()=>setSelected(cat)} style={{background:cat.bg,animationDelay:`${i*0.05}s`,boxShadow:`0 6px 24px ${cat.grad[0]}55`}}><div className="dhikr-cat-bg">{cat.icon}</div><p style={{position:"relative",fontSize:15,fontWeight:800,color:"#fff",lineHeight:1.3,textShadow:"0 1px 6px rgba(0,0,0,0.35)"}}>{cat.label}</p><p style={{position:"relative",fontSize:11,color:"rgba(255,255,255,0.75)",marginTop:3,fontWeight:600}}>{cat.items.length} invocations →</p></div>)}</div><div style={{marginTop:20,padding:"16px",background:"var(--emerald-glow)",borderRadius:18,border:"1px solid rgba(42,122,90,0.15)",textAlign:"center"}}><p className="arabic" style={{fontSize:20,color:"var(--emerald)",lineHeight:2,marginBottom:6}}>وَاذْكُر رَّبَّكَ كَثِيرًا</p><p style={{fontSize:13,color:"var(--ink-s)",fontStyle:"italic"}}>« Invoque ton Seigneur beaucoup. » — Al-Imran 3:41</p></div></div>);
}

/* ─────────────────────────────────────────
   ONBOARDING
───────────────────────────────────────── */
const OB=[{bg:["#1A2E1A","#0D1F0D"],orb:"rgba(42,122,90,0.25)",icon:"☽",iconBg:"linear-gradient(135deg,#2A7A5A,#3DAA7F)",title:"Bienvenue sur\nHassanates",accent:"#3DAA7F",sub:"Ton compagnon de progression spirituelle. Lis, invoque et grandis chaque jour.",cta:null},{bg:["#1A1A2E","#0D0D1F"],orb:"rgba(124,106,232,0.2)",icon:"🤝",iconBg:"linear-gradient(135deg,#7C6AE8,#A08CF5)",title:"Progresse en\nCommunauté",accent:"#A08CF5",sub:"Rejoins un cercle de motivation, partage ta progression et inspire ceux qui t'entourent.",cta:null},{bg:["#1F1A0D","#2E2410"],orb:"rgba(196,154,60,0.2)",icon:"🌿",iconBg:"linear-gradient(135deg,#C49A3C,#E8C060)",title:"Trouve ta\nVoie",accent:"#E8C060",sub:"Des douas pour chaque émotion, des outils pour approfondir ta connexion spirituelle.",cta:"Commencer"}];
function Onboarding({onDone}){
  const[idx,setIdx]=useState(0);const anim=useRef(false);const touchX=useRef(null);const s=OB[idx];
  const goTo=next=>{if(anim.current||next<0||next>=OB.length)return;anim.current=true;setTimeout(()=>{setIdx(next);anim.current=false;},200);};
  const onTS=e=>{touchX.current=e.touches[0].clientX;};
  const onTE=e=>{if(!touchX.current)return;const dx=touchX.current-e.changedTouches[0].clientX;if(Math.abs(dx)>44)dx>0?goTo(idx+1):goTo(idx-1);touchX.current=null;};
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,maxWidth:430,margin:"0 auto",overflow:"hidden",background:`linear-gradient(160deg,${s.bg[0]},${s.bg[1]})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}} onTouchStart={onTS} onTouchEnd={onTE}>
      <div style={{position:"absolute",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:s.orb,pointerEvents:"none"}}/>
      {idx<OB.length-1&&<button onClick={onDone} style={{position:"absolute",top:52,right:20,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:999,padding:"6px 14px",cursor:"pointer",fontSize:13,color:"rgba(255,255,255,0.6)",zIndex:10}}>Passer</button>}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"0 32px"}}>
        <div style={{width:100,height:100,borderRadius:28,background:s.iconBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:46,marginBottom:36}}>{s.icon}</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,color:"#fff",textAlign:"center",lineHeight:1.25,marginBottom:20,whiteSpace:"pre-line"}}>
          {s.title.split("\n").map((line,i)=><span key={i}>{i===1?<span style={{background:`linear-gradient(90deg,${s.accent},#fff)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{line}</span>:line}{i===0&&<br/>}</span>)}
        </h1>
        <p style={{fontSize:15,color:"rgba(255,255,255,0.65)",textAlign:"center",lineHeight:1.8}}>{s.sub}</p>
      </div>
      <div style={{position:"absolute",bottom:52,left:0,right:0,display:"flex",flexDirection:"column",alignItems:"center",gap:24,padding:"0 32px"}}>
        <div style={{display:"flex",gap:8}}>{OB.map((_,i)=><div key={i} onClick={()=>goTo(i)} style={{height:6,width:i===idx?24:6,borderRadius:999,background:i===idx?"#fff":"rgba(255,255,255,0.25)",transition:"all 0.3s",cursor:"pointer"}}/>)}</div>
        {s.cta?<button onClick={onDone} style={{width:"100%",padding:"16px",borderRadius:16,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${s.accent},#fff)`,color:"#1A1A2E",fontSize:16,fontWeight:800}}>{s.cta} →</button>:<button onClick={()=>goTo(idx+1)} style={{width:"100%",padding:"16px",borderRadius:16,border:"1px solid rgba(255,255,255,0.2)",cursor:"pointer",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:15,fontWeight:700}}>Suivant →</button>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PROFIL
───────────────────────────────────────── */
const BADGES=[{id:"hafidh",icon:"🌙",name:"Hafidh",cond:()=>true,color:"#3DAA7F"},{id:"mukhlis",icon:"♥",name:"Mukhlis",cond:(_,h)=>h>=1000,color:"#E06B8B"},{id:"sabir",icon:"⭐",name:"Sabir",cond:(_,h)=>h>=5000,color:"#E8C060"},{id:"fajr",icon:"🌅",name:"Lève-tôt",cond:(s)=>s>=7,color:"#C49A3C"},{id:"murabit",icon:"🛡️",name:"Murabit",cond:(s)=>s>=30,color:"#7C6AE8"},{id:"tadabbur",icon:"📖",name:"Tadabbur",cond:()=>false,color:"#2A7A5A"},{id:"dhakir",icon:"📿",name:"Dhakir",cond:()=>false,color:"#4A90D9"},{id:"gold",icon:"★",name:"Gold Member",cond:(_,__,p)=>p,color:"#C49A3C"}];
function Toggle({on,onToggle}){return(<div onClick={onToggle} style={{width:44,height:26,borderRadius:999,background:on?"var(--emerald)":"rgba(0,0,0,0.12)",position:"relative",cursor:"pointer",transition:"background 0.25s",flexShrink:0}}><div style={{position:"absolute",top:3,left:on?20:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left 0.25s"}}/></div>);}

function ProfilScreen({hassanates,streak,readingMins,goalMins,setGoalMins,onOpenPremium,isPremium,fontSizes,setFontSizes,savedVerses,setSavedVerses,userName,userEmail,onLogout}){
  const[notifFajr,setNotifFajr]=useState(true);const[notifSoir,setNotifSoir]=useState(true);const[notifDhikr,setNotifDhikr]=useState(false);
  const earned=BADGES.filter(b=>b.cond(streak,hassanates,isPremium));const locked=BADGES.filter(b=>!b.cond(streak,hassanates,isPremium));
  const savedList=Object.values(savedVerses);
  return(
    <div style={{flex:1,overflowY:"auto",padding:"10px 16px 20px"}}>
      {/* Avatar */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:18}}>
        <div style={{width:76,height:76,borderRadius:"50%",background:"linear-gradient(135deg,var(--emerald),var(--emerald-l))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,marginBottom:10,boxShadow:"0 6px 20px rgba(42,122,90,0.35)"}}>🌿</div>
        <p style={{fontSize:22,fontWeight:800,color:"var(--ink)",fontFamily:"'Playfair Display',serif",textTransform:"capitalize"}}>{userName}</p>
        <p style={{fontSize:12,color:"var(--ink-m)",marginTop:2}}>{userEmail}</p>
        <div style={{display:"flex",gap:6,marginTop:8}}>
          <span className="pill">Récitant ♥</span>
          {isPremium&&<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(196,154,60,0.15)",color:"var(--gold)",borderRadius:999,padding:"3px 10px",fontSize:12,fontWeight:700,border:"1px solid rgba(196,154,60,0.3)"}}>★ Gold</span>}
        </div>
      </div>

      {!isPremium&&<div onClick={onOpenPremium} style={{background:"linear-gradient(135deg,#1A1035,#2D1F5E)",borderRadius:18,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:"1px solid rgba(196,154,60,0.3)"}}><div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#C49A3C,#E8C060)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>★</div><div style={{flex:1}}><p style={{fontSize:14,fontWeight:800,color:"#E8C060"}}>Devenir Premium Gold</p><p style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:2}}>Tafsir · Stats avancées</p></div><span style={{color:"rgba(196,154,60,0.7)",fontSize:20}}>›</span></div>}

      <div style={{background:"linear-gradient(135deg,#E06B8B,#F09AAF)",borderRadius:18,padding:"16px 20px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><p style={{color:"rgba(255,255,255,0.85)",fontSize:13,fontWeight:600}}>Total Hassanates</p><p style={{color:"#fff",fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",marginTop:2}}>{hassanates.toLocaleString()} ♥</p></div>
        <p style={{fontSize:40}}>🌟</p>
      </div>

      {/* Polices */}
      <p style={{fontSize:12,fontWeight:700,color:"var(--ink-m)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Taille des polices (Lecteur Coran)</p>
      <div className="card" style={{padding:"16px",marginBottom:14}}>
        {[{key:"arabic",label:"Texte arabe",icon:"🔤",min:20,max:48,preview:<p className="arabic" style={{fontSize:fontSizes.arabic,textAlign:"center",color:"var(--emerald)",marginTop:8,lineHeight:1.8}}>بِسْمِ اللَّهِ</p>},{key:"fr",label:"Traduction française",icon:"🇫🇷",min:12,max:24,preview:<p style={{fontSize:fontSizes.fr,textAlign:"center",color:"var(--ink-s)",marginTop:8}}>Au nom d'Allah</p>},{key:"phonetic",label:"Phonétique",icon:"📢",min:10,max:20,preview:<p style={{fontSize:fontSizes.phonetic,textAlign:"center",color:"var(--ink-m)",fontStyle:"italic",marginTop:8}}>Bismi llahi...</p>}].map((item,i,arr)=>(
          <div key={item.key} style={{marginBottom:i<arr.length-1?18:0}}>
            {i>0&&<div style={{height:1,background:"var(--border-s)",marginBottom:18}}/>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{item.icon}</span><p style={{fontSize:14,fontWeight:700,color:"var(--ink)"}}>{item.label}</p></div>
              <span style={{fontSize:14,fontWeight:800,color:"var(--emerald)"}}>{fontSizes[item.key]}px</span>
            </div>
            <input type="range" min={item.min} max={item.max} value={fontSizes[item.key]} onChange={e=>setFontSizes(p=>({...p,[item.key]:Number(e.target.value)}))}/>
            {item.preview}
          </div>
        ))}
      </div>

      {/* Objectif */}
      <div className="card" style={{padding:"14px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:22}}>⏱️</span>
        <div style={{flex:1}}><p style={{fontSize:15,fontWeight:700,color:"var(--ink)"}}>Objectif de lecture</p><p style={{fontSize:12,color:"var(--ink-m)"}}>par session</p></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setGoalMins(m=>Math.max(5,m-5))} style={{width:30,height:30,borderRadius:8,background:"var(--emerald-glow)",border:"none",cursor:"pointer",fontSize:18,color:"var(--emerald)",display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
          <span style={{fontSize:15,fontWeight:800,color:"var(--emerald)",minWidth:50,textAlign:"center"}}>{goalMins} min</span>
          <button onClick={()=>setGoalMins(m=>Math.min(120,m+5))} style={{width:30,height:30,borderRadius:8,background:"var(--emerald-glow)",border:"none",cursor:"pointer",fontSize:18,color:"var(--emerald)",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        </div>
      </div>

      {/* Versets sauvegardés */}
      {savedList.length>0&&<div style={{marginBottom:14}}><p style={{fontSize:12,fontWeight:700,color:"var(--ink-m)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>🔖 Versets sauvegardés ({savedList.length})</p><div className="card" style={{overflow:"hidden"}}>{savedList.slice(0,5).map((sv,i)=><div key={i} style={{padding:"12px 16px",borderBottom:i<Math.min(savedList.length,5)-1?"1px solid var(--border-s)":"none",display:"flex",alignItems:"center",gap:12}}><div style={{width:36,height:36,borderRadius:10,background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:700,color:"var(--emerald)"}}>{sv.surahId}:{sv.verseId}</span></div><div style={{flex:1}}><p style={{fontSize:13,fontWeight:700,color:"var(--ink)"}}>{sv.surahName}</p><p className="arabic" style={{fontSize:13,color:"var(--ink-m)",marginTop:2,textAlign:"right"}}>{sv.arabic?.slice(0,30)}...</p></div><button onClick={()=>setSavedVerses(p=>{const n={...p};delete n[`${sv.surahId}-${sv.verseId}`];return n;})} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"var(--ink-m)"}}>✕</button></div>)}</div></div>}

      {/* Badges */}
      <div style={{marginBottom:18}}>
        <p style={{fontSize:14,fontWeight:800,color:"var(--ink)",marginBottom:4}}>🏅 Mes Succès</p>
        <p style={{fontSize:12,color:"var(--ink-m)",marginBottom:12}}>{earned.length} / {BADGES.length} obtenus</p>
        {earned.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>{earned.map(b=><div key={b.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}><div style={{width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${b.color}33,${b.color}18)`,border:`2px solid ${b.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{b.icon}</div><p style={{fontSize:11,fontWeight:700,color:"var(--ink-s)",textAlign:"center"}}>{b.name}</p></div>)}</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>{locked.map(b=><div key={b.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}><div style={{width:56,height:56,borderRadius:16,background:"rgba(0,0,0,0.05)",border:"2px solid var(--border-s)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,filter:"grayscale(1)",opacity:0.4}}>{b.icon}</div><p style={{fontSize:11,color:"var(--ink-m)",textAlign:"center"}}>{b.name}</p></div>)}</div>
      </div>

      {/* Notifications */}
      <p style={{fontSize:12,fontWeight:700,color:"var(--ink-m)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Notifications</p>
      <div className="card" style={{overflow:"hidden",marginBottom:14}}>
        {[{icon:"🌅",label:"Rappel Fajr",val:notifFajr,set:setNotifFajr},{icon:"🌙",label:"Rappel soir",val:notifSoir,set:setNotifSoir},{icon:"📿",label:"Rappel Dhikr",val:notifDhikr,set:setNotifDhikr}].map((it,ii,arr)=><div key={ii} style={{padding:"13px 16px",borderBottom:ii<arr.length-1?"1px solid var(--border-s)":"none",display:"flex",alignItems:"center",gap:12}}><div style={{width:34,height:34,borderRadius:10,background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{it.icon}</div><p style={{flex:1,fontSize:14,fontWeight:700,color:"var(--ink)"}}>{it.label}</p><Toggle on={it.val} onToggle={()=>it.set(v=>!v)}/></div>)}
      </div>

      {/* Déconnexion */}
      <button onClick={onLogout} style={{width:"100%",padding:"14px",borderRadius:14,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.06)",color:"#EF4444",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:12}}>
        🚪 Se déconnecter
      </button>

      <p style={{fontSize:12,color:"var(--ink-m)",textAlign:"center"}}>Hassanates v1.0.0 — Fait avec ♥</p>
    </div>
  );
}

/* ─────────────────────────────────────────
   PREMIUM
───────────────────────────────────────── */
const PF=[{icon:"📖",title:"Tafsir en français",sub:"Via Supabase — bientôt disponible"},{icon:"😌",title:"Émotions avancées",sub:"Plus de douas pour chaque état d'âme"},{icon:"📊",title:"Statistiques avancées",sub:"Suivi détaillé de ta progression"},{icon:"🏆",title:"Badges & défis premium",sub:"Accomplissements exclusifs"},{icon:"🔔",title:"Rappels intelligents",sub:"Selon tes temps de prière"},{icon:"☁️",title:"Sauvegarde cloud",sub:"Notes et progression synchronisées"}];
function PremiumPage({onClose,onActivate}){
  const[activated,setActivated]=useState(false);
  const go=()=>{setActivated(true);setTimeout(()=>{onActivate();onClose();},1200);};
  return(<div style={{position:"fixed",inset:0,zIndex:250,maxWidth:430,margin:"0 auto",background:"linear-gradient(160deg,#1A1035,#0D1B2A)",display:"flex",flexDirection:"column",overflowY:"auto"}}><div style={{padding:"52px 20px 0",flexShrink:0}}><button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:14,color:"rgba(255,255,255,0.7)"}}>← Retour</button></div><div style={{padding:"28px 24px 0",textAlign:"center"}}><h1 style={{fontSize:28,fontWeight:800,color:"#fff",fontFamily:"'Playfair Display',serif",lineHeight:1.3,marginBottom:12}}>Élève ta pratique<br/><span style={{background:"linear-gradient(90deg,#C49A3C,#E8C060)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>vers l'excellence</span></h1></div><div style={{padding:"24px 20px 0",display:"flex",flexDirection:"column",gap:10}}>{PF.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:14,background:"rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.08)"}}><div style={{width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,rgba(196,154,60,0.3),rgba(196,154,60,0.1))",border:"1px solid rgba(196,154,60,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{f.icon}</div><div><p style={{fontSize:14,fontWeight:700,color:"#fff"}}>{f.title}</p><p style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2}}>{f.sub}</p></div><span style={{marginLeft:"auto",color:"#E8C060",fontSize:16,flexShrink:0}}>✓</span></div>)}</div><div style={{padding:"24px 20px 40px"}}><div style={{textAlign:"center",marginBottom:16}}><p style={{fontSize:12,color:"rgba(255,255,255,0.4)",textDecoration:"line-through"}}>9,99 € / mois</p><p style={{fontSize:30,fontWeight:800,color:"#E8C060",fontFamily:"'Playfair Display',serif"}}>4,99 € <span style={{fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.5)"}}>/ mois</span></p></div><button onClick={go} style={{width:"100%",padding:"16px",borderRadius:16,border:"none",cursor:"pointer",background:activated?"linear-gradient(135deg,#2A7A5A,#3DAA7F)":"linear-gradient(135deg,#C49A3C,#E8C060)",color:"#fff",fontSize:16,fontWeight:800,transition:"all 0.4s"}}>{activated?"✓ Premium activé !":"✨ Commencer mon essai gratuit · 7 jours"}</button><p style={{fontSize:12,color:"rgba(255,255,255,0.35)",textAlign:"center",marginTop:10}}>Sans engagement · Annulation à tout moment</p></div></div>);
}

/* ─────────────────────────────────────────
   ROOT
───────────────────────────────────────── */
export default function App() {
  const [session,     setSession]     = useState(undefined);
  const [onboarded,   setOnboarded]   = useState(false);
  const [tab,         setTab]         = useState("home");
  const [dark,        setDark]        = useState(false);
  const [hassanates,  setH]           = useState(0);
  const [streak]                      = useState(0);
  const [readingMins, setReadingMins] = useState(0);
  const [goalMins,    setGoalMins]    = useState(15);
  const [notes,       setNotes]       = useState({});
  const [savedVerses, setSavedVerses] = useState({});
  const [toast,       setToast]       = useState(null);
  const [reader,      setReader]      = useState(null);
  const [isPremium,   setIsPremium]   = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [fontSizes,   setFontSizes]   = useState({arabic:28,fr:15,phonetic:12});
  const tRef = useRef(null);

  // ── Auth Supabase ──
  useEffect(() => {
    const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      // Pas encore configuré → mode démo sans auth
      setSession(null);
      return;
    }

    supabase.auth.getSession().then(({data:{session}}) => setSession(session));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session) => {
      setSession(session);
      if (!session) {
        setH(0); setReadingMins(0); setNotes({}); setSavedVerses({});
        setTab("home"); setReader(null); setOnboarded(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const showToast   = m => {setToast(m);clearTimeout(tRef.current);tRef.current=setTimeout(()=>setToast(null),2200);};
  const addH        = n => setH(p => p + n);
  const openPremium = () => setShowPremium(true);
  const goHome      = () => setTab("home");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast("À bientôt ! 👋");
  };

  const handleStart = () => {
    const p = loadProgress();
    if (p) setReader({surah:{id:p.surahId,name:p.surahName,arabic:p.surahArabic,verses:0,rev:""},verseId:p.verseId});
    else setReader({surah:{id:1,name:"Al-Fatiha",arabic:"الفاتحة",verses:7,rev:"Mecquoise"},verseId:1});
  };

  const nav = [
    {id:"home",   icon:"🏠", label:"Accueil"},
    {id:"quran",  icon:"📖", label:"Coran"},
    {id:"dhikr",  icon:"📿", label:"Dhikr"},
    {id:"emotion",icon:"💚", label:"Émotions"},
    {id:"profil", icon:"👤", label:"Profil"},
  ];

  // ── Chargement ──
  if (session === undefined) return (
    <>
      <Styles/>
      <div style={{minHeight:"100svh",maxWidth:430,margin:"0 auto",background:"linear-gradient(160deg,#0D1F14,#1A1035)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#2A7A5A,#3DAA7F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>☽</div>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:14,fontWeight:600}}>Chargement...</p>
      </div>
    </>
  );

  // ── Non connecté (Supabase configuré) → Auth ──
  const supabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  if (supabaseConfigured && !session) return <><Styles/><AuthScreen/></>;

  // ── Onboarding ──
  if (!onboarded) return <><Styles/><Onboarding onDone={()=>setOnboarded(true)}/></>;

  // ── App principale ──
  const userEmail = session?.user?.email || "invité@hassanates.app";
  const userName  = userEmail.split("@")[0];

  return (
    <>
      <Styles/>
      <div className={`app${dark?" dark":""}`}>

        {!reader && !showPremium && (
          <div style={{padding:"10px 16px 0",flexShrink:0}}>
            <div className="status-bar">
              <div className="stat-chip"><span style={{color:"var(--heart)"}}>♥</span>{hassanates.toLocaleString()}</div>
              <div className="stat-chip">🔥 {streak}j</div>
              <div className="stat-chip">⏱️ {readingMins}m</div>
              {isPremium
                ? <span style={{fontSize:12,fontWeight:700,color:"var(--gold)"}}>★ Gold</span>
                : <button onClick={openPremium} style={{background:"linear-gradient(135deg,#C49A3C,#E8C060)",border:"none",borderRadius:999,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:700,color:"#fff"}}>★ Premium</button>}
              <button onClick={()=>setDark(!dark)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18}}>{dark?"☀️":"🌙"}</button>
            </div>
          </div>
        )}

        {!reader&&!showPremium&&tab==="home"    &&<HomeScreen hassanates={hassanates} streak={streak} readingMins={readingMins} onStart={handleStart} userName={userName}/>}
        {!reader&&!showPremium&&tab==="quran"   &&<QuranScreen onOpen={s=>setReader({surah:s,verseId:1})}/>}
        {!reader&&!showPremium&&tab==="dhikr"   &&<DhikrScreen onAddH={addH} toast={showToast}/>}
        {!reader&&!showPremium&&tab==="emotion" &&<EmotionsScreen onAddH={addH} toast={showToast}/>}
        {!reader&&!showPremium&&tab==="profil"  &&<ProfilScreen hassanates={hassanates} streak={streak} readingMins={readingMins} goalMins={goalMins} setGoalMins={setGoalMins} onOpenPremium={openPremium} isPremium={isPremium} fontSizes={fontSizes} setFontSizes={setFontSizes} savedVerses={savedVerses} setSavedVerses={setSavedVerses} userName={userName} userEmail={userEmail} onLogout={handleLogout}/>}

        {reader&&<VerseReader surah={reader.surah} initialVerseId={reader.verseId} onClose={()=>setReader(null)} onGoHome={goHome} onAddH={addH} notes={notes} setNotes={setNotes} goalSecs={goalMins*60} onTimeSpent={s=>setReadingMins(m=>m+Math.round(s/60))} savedVerses={savedVerses} setSavedVerses={setSavedVerses} fontSizes={fontSizes}/>}

        {showPremium&&<PremiumPage onClose={()=>setShowPremium(false)} onActivate={()=>{setIsPremium(true);showToast("★ Premium Gold activé !");}}/>}

        {toast&&<div className="toast">{toast}</div>}

        {!reader&&!showPremium&&(
          <nav className="nav-bar">
            {nav.map(it=>(
              <div key={it.id} className={`nav-item${tab===it.id?" active":""}`} onClick={()=>setTab(it.id)}>
                <span style={{fontSize:21}}>{it.icon}</span>
                <span className="nav-lbl">{it.label}</span>
              </div>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
