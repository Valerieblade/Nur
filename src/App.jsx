import { useState, useEffect, useRef } from "react";
import Auth from "./components/Auth";
import { supabase } from "./lib/supabase";

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Nunito:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap');
    :root {
      --bg-from:#EEE9FF;--bg-to:#E0EDFF;
      --glass-b:rgba(255,255,255,0.9);
      --border:rgba(255,255,255,0.6);--border-s:rgba(0,0,0,0.07);
      --emerald:#2A7A5A;--emerald-l:#3DAA7F;--emerald-glow:rgba(42,122,90,0.13);
      --gold:#C49A3C;--heart:#E06B8B;
      --ink:#1C1C2E;--ink-s:#4A4A6A;--ink-m:#9090B0;
      --card:rgba(255,255,255,0.72);--shadow:0 4px 24px rgba(80,60,180,0.10);
    }
    .dark {
      --bg-from:#0D0E1C;--bg-to:#121828;
      --glass-b:rgba(28,32,52,0.95);
      --border:rgba(255,255,255,0.08);--border-s:rgba(255,255,255,0.06);
      --emerald:#3DAA7F;--emerald-l:#5BCCA0;--emerald-glow:rgba(61,170,127,0.12);
      --gold:#D4AA62;--heart:#F08CA8;
      --ink:#E8E4F8;--ink-s:#A8A4C8;--ink-m:#6A6888;
      --card:rgba(28,32,52,0.82);--shadow:0 4px 24px rgba(0,0,0,0.30);
    }
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;}
    body{font-family:'Nunito',sans-serif;overflow:hidden;background:var(--bg-from);}
    .app{max-width:430px;margin:0 auto;height:100svh;background:linear-gradient(160deg,var(--bg-from),var(--bg-to));display:flex;flex-direction:column;overflow:hidden;}
    ::-webkit-scrollbar{width:0;}
    .arabic{font-family:'Amiri',serif;direction:rtl;}
    .card{background:var(--card);border-radius:20px;border:1px solid var(--border);box-shadow:var(--shadow);backdrop-filter:blur(16px);}
    .pill{display:inline-flex;align-items:center;gap:5px;background:var(--emerald-glow);color:var(--emerald);border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;border:1px solid rgba(61,170,127,0.2);}
    .nav-bar{background:var(--glass-b);border-top:1px solid var(--border-s);display:flex;justify-content:space-around;align-items:center;padding:8px 0 20px;flex-shrink:0;backdrop-filter:blur(20px);}
    .nav-item{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:6px 14px;border-radius:14px;transition:all 0.2s;}
    .nav-item.active{background:var(--emerald-glow);}
    .nav-lbl{font-size:11px;font-weight:700;color:var(--ink-m);}
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
    textarea{font-family:'Nunito',sans-serif;font-size:14px;line-height:1.6;background:rgba(0,0,0,0.04);border:1px solid var(--border-s);border-radius:12px;padding:11px;width:100%;color:var(--ink);resize:none;outline:none;transition:border 0.2s;user-select:text;}
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
  `}</style>
);

/* ─────────────────────────────────────────
   LOCALSTORAGE HELPERS
───────────────────────────────────────── */
const LS_KEY = "hassanates_progress";

function saveProgress(surahId, surahName, surahArabic, verseId) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ surahId, surahName, surahArabic, verseId, savedAt: Date.now() }));
  } catch (_) {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

/* ─────────────────────────────────────────
   SUPABASE CLIENT
   → Crée src/lib/supabase.js avec ce contenu :
     import { createClient } from "@supabase/supabase-js";
     export const supabase = createClient(
       import.meta.env.VITE_SUPABASE_URL,
       import.meta.env.VITE_SUPABASE_ANON_KEY
     );
   → Dans .env.local :
     VITE_SUPABASE_URL=https://xxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGc...
───────────────────────────────────────── */
async function fetchTafsirFromSupabase(surahNumber, ayahNumber) {
  try {
    const url  = import.meta.env.VITE_SUPABASE_URL;
    const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return null;

    const res = await fetch(
      `${url}/rest/v1/tafsirs?surah_number=eq.${surahNumber}&ayah_number=eq.${ayahNumber}&select=text&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.text || null;
  } catch (_) { return null; }
}

/* ─────────────────────────────────────────
   API HOOKS
───────────────────────────────────────── */
const API_BASE = "https://api.alquran.cloud/v1";
const RECITER  = "ar.alafasy";
const TRANS    = "fr.hamidullah";

const BASMALA = {
  arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
  fr:     "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux",
  audio:  "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3",
};

function useSurahs() {
  const [surahs,  setSurahs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/surah`).then(r => r.json()).then(d => {
      setSurahs(d.data.map(s => ({
        id: s.number, name: s.englishName, arabic: s.name,
        verses: s.numberOfAyahs, rev: s.revelationType === "Meccan" ? "Mecquoise" : "Medinoise",
      })));
      setLoading(false);
    }).catch(e => { setError(e); setLoading(false); });
  }, []);
  return { surahs, loading, error };
}

function useSurahVerses(surahId) {
  const [verses,  setVerses]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  useEffect(() => {
    if (!surahId) return;
    setLoading(true); setVerses([]); setError(null);
    Promise.all([
      fetch(`${API_BASE}/surah/${surahId}/${RECITER}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`${API_BASE}/surah/${surahId}/${TRANS}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    ]).then(([ar, fr]) => {
      if (!ar.data?.ayahs?.length) throw new Error();
      setVerses(ar.data.ayahs.map((a, i) => ({
        id: a.numberInSurah, arabic: a.text, audioUrl: a.audio,
        fr: fr.data?.ayahs?.[i]?.text || "",
      })));
      setLoading(false);
    }).catch(e => { setError(e); setLoading(false); });
  }, [surahId]);
  return { verses, loading, error };
}

/* ─────────────────────────────────────────
   DHIKR DATA
───────────────────────────────────────── */
const DHIKR_CATEGORIES = [
  {
    id:"matin", label:"Adhkar du Matin", icon:"🌅", bg:"linear-gradient(135deg,#F6A623,#F7C948)", grad:["#F6A623","#F7C948"],
    items:[
      {id:101,title:"À l'entrée du matin",arabic:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",phonetic:"Asbahna wa asbaha l-mulku lillah",fr:"Nous entrons au matin et le Royaume appartient à Allah.",source:"Abou Dawoud",count:1,h:10},
      {id:102,title:"Tasbih du matin",arabic:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",phonetic:"Subhana llahi wa bihamdih",fr:"Gloire à Allah et louange à Lui.",source:"Mouslim",count:100,h:100},
      {id:103,title:"Invocation du matin",arabic:"اللَّهُمَّ بِكَ أَصْبَحْنَا",phonetic:"Allahumma bika asbahna",fr:"Ô Allah, c'est grâce à Toi que nous entrons dans le matin.",source:"Abou Dawoud",count:1,h:10},
      {id:104,title:"Protection du matin",arabic:"أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",phonetic:"A'udhu billahi mina sh-shaytani r-rajim",fr:"Je cherche la protection d'Allah contre le Shaytan maudit.",source:"Abou Dawoud",count:3,h:30},
    ],
  },
  {
    id:"soir", label:"Adhkar du Soir", icon:"🌙", bg:"linear-gradient(135deg,#553C9A,#2D3748)", grad:["#553C9A","#2D3748"],
    items:[
      {id:201,title:"À l'entrée du soir",arabic:"أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",phonetic:"Amsayna wa amsa l-mulku lillah",fr:"Nous entrons dans le soir et le Royaume appartient à Allah.",source:"Abou Dawoud",count:1,h:10},
      {id:202,title:"Invocation du soir",arabic:"اللَّهُمَّ بِكَ أَمْسَيْنَا",phonetic:"Allahumma bika amsayna",fr:"Ô Allah, c'est grâce à Toi que nous entrons dans le soir.",source:"Abou Dawoud",count:1,h:10},
      {id:203,title:"Hisboun Allah",arabic:"حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ",phonetic:"Hasbiya llahu la ilaha illa hu",fr:"Allah me suffit, il n'y a de divinité que Lui.",source:"Abou Dawoud",count:7,h:70},
      {id:204,title:"Istighfar du soir",arabic:"أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",phonetic:"Astaghfiru llaha wa atubu ilayh",fr:"Je demande le pardon d'Allah et je me repens à Lui.",source:"Bukhari",count:100,h:100},
    ],
  },
  {
    id:"reveil", label:"Se Réveiller", icon:"⏰", bg:"linear-gradient(135deg,#48BB78,#276749)", grad:["#48BB78","#276749"],
    items:[
      {id:301,title:"Lorsqu'on change de côté la nuit",arabic:"لاَ إِلَهَ إِلاَّ اللَّهُ الْوَاحِدُ الْقَهَّارُ",phonetic:"La ilaha illa llahu l-wahidu l-qahhar",fr:"Il n'y a de dieu qu'Allah, l'Unique, le Dominateur.",source:"An-Nasa'i",count:1,h:10},
      {id:302,title:"Après le réveil",arabic:"الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا",phonetic:"Al-hamdu lillahi lladhi ahyana ba'da ma amatana",fr:"Louange à Allah qui nous a redonné la vie après nous avoir fait mourir.",source:"Bukhari",count:1,h:10},
    ],
  },
  {
    id:"sommeil", label:"Avant de Dormir", icon:"😴", bg:"linear-gradient(135deg,#667EEA,#764BA2)", grad:["#667EEA","#764BA2"],
    items:[
      {id:401,title:"Bismika amutu",arabic:"بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",phonetic:"Bismika llahumma amutu wa ahya",fr:"En Ton nom, ô Allah, je meurs et je vis.",source:"Bukhari",count:1,h:10},
      {id:402,title:"Tasbih de Fatima",arabic:"سُبْحَانَ اللَّهِ ×33 | الْحَمْدُ لِلَّهِ ×33 | اللَّهُ أَكْبَرُ ×34",phonetic:"Subhanallah 33x · Alhamdulillah 33x · Allahu Akbar 34x",fr:"Le Tasbih de Fatima — récite avant de dormir.",source:"Bukhari, Mouslim",count:1,h:100},
    ],
  },
  {
    id:"protection", label:"Protection & Rouqya", icon:"🛡️", bg:"linear-gradient(135deg,#F56565,#9B2335)", grad:["#F56565","#9B2335"],
    items:[
      {id:501,title:"Protection par le Nom d'Allah",arabic:"بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ",phonetic:"Bismi llahi lladhi la yadurru ma'a smihi shay'",fr:"Au nom d'Allah avec lequel rien ne peut nuire.",source:"Abou Dawoud, Tirmizi",count:3,h:30},
      {id:502,title:"Ayat al-Kursi",arabic:"اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ",phonetic:"Ayatu l-kursi",fr:"Récite Ayat al-Kursi chaque matin et soir pour une protection complète.",source:"Bukhari",count:1,h:50},
      {id:503,title:"Les trois Quls",arabic:"قُلْ هُوَ اللَّهُ أَحَدٌ",phonetic:"Qul huwa llahu ahad — Al-Falaq — An-Nas",fr:"Récite Al-Ikhlas, Al-Falaq et An-Nas 3 fois le matin et le soir.",source:"Abou Dawoud",count:3,h:30},
    ],
  },
  {
    id:"priere", label:"Invocations de la Prière", icon:"🕌", bg:"linear-gradient(135deg,#4299E1,#1A365D)", grad:["#4299E1","#1A365D"],
    items:[
      {id:601,title:"Pardon pour soi et ses parents",arabic:"رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ",phonetic:"Rabbi ghfir li wa liwaalidayya",fr:"Seigneur, pardonne-moi ainsi qu'à mes parents.",source:"Coran 71:28",count:3,h:30},
      {id:602,title:"Doua de ce monde et de l'au-delà",arabic:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً",phonetic:"Rabbana atina fi d-dunya hasanatan",fr:"Seigneur, accorde-nous ce qui est bon en ce monde et dans l'au-delà.",source:"Coran 2:201",count:1,h:10},
    ],
  },
  {
    id:"woudhou", label:"Salle de Bain & Woudhou", icon:"🚿", bg:"linear-gradient(135deg,#4FD1C5,#285E61)", grad:["#4FD1C5","#285E61"],
    items:[
      {id:701,title:"En entrant aux toilettes",arabic:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",phonetic:"Allahumma inni a'udhu bika mina l-khubti wa l-khaba'ith",fr:"Ô Allah, je cherche Ta protection contre les démons.",source:"Bukhari, Mouslim",count:1,h:10},
      {id:702,title:"En sortant des toilettes",arabic:"غُفْرَانَكَ",phonetic:"Ghufranaka",fr:"Ton pardon [je T'implore].",source:"Abou Dawoud, Tirmizi",count:1,h:10},
    ],
  },
  {
    id:"nourriture", label:"Nourriture & Boisson", icon:"🍽️", bg:"linear-gradient(135deg,#F6AD55,#9C4221)", grad:["#F6AD55","#9C4221"],
    items:[
      {id:801,title:"Avant de manger",arabic:"بِسْمِ اللَّهِ",phonetic:"Bismillah",fr:"Au nom d'Allah.",source:"Abou Dawoud",count:1,h:5},
      {id:802,title:"Après avoir mangé",arabic:"الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا",phonetic:"Al-hamdu lillahi lladhi at'amana wa saqana",fr:"Louange à Allah qui nous a nourris et abreuvés.",source:"Abou Dawoud",count:1,h:10},
    ],
  },
  {
    id:"maison", label:"Maison & Famille", icon:"🏠", bg:"linear-gradient(135deg,#68D391,#1C4532)", grad:["#68D391","#1C4532"],
    items:[
      {id:901,title:"En entrant chez soi",arabic:"بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا",phonetic:"Bismillahi walajna wa bismillahi kharajna",fr:"Au nom d'Allah nous entrons et au nom d'Allah nous sortons.",source:"Abou Dawoud",count:1,h:10},
      {id:902,title:"En sortant de chez soi",arabic:"بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ",phonetic:"Bismillah tawakkaltu 'ala llah",fr:"Au nom d'Allah, je m'en remets à Allah.",source:"Abou Dawoud",count:1,h:10},
    ],
  },
  {
    id:"voyage", label:"Voyage & Déplacement", icon:"✈️", bg:"linear-gradient(135deg,#76E4F7,#065666)", grad:["#76E4F7","#065666"],
    items:[
      {id:1001,title:"En montant dans un véhicule",arabic:"سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا",phonetic:"Subhana lladhi sakhkhara lana hadha",fr:"Gloire à Celui qui nous a soumis cela.",source:"Coran 43:13-14",count:1,h:20},
      {id:1002,title:"Doua du voyage",arabic:"اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى",phonetic:"Allahumma inna nas'aluka fi safarina hadha l-birra wa t-taqwa",fr:"Ô Allah, nous Te demandons dans ce voyage la vertu et la piété.",source:"Mouslim",count:1,h:20},
    ],
  },
  {
    id:"istighfar", label:"Istighfar & Repentir", icon:"🔄", bg:"linear-gradient(135deg,#9F7AEA,#44337A)", grad:["#9F7AEA","#44337A"],
    items:[
      {id:1101,title:"Sayid al-Istighfar",arabic:"اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ",phonetic:"Allahumma anta rabbi la ilaha illa anta...",fr:"Ô Allah, Tu es mon Seigneur, il n'y a de dieu que Toi.",source:"Bukhari",count:1,h:100},
      {id:1102,title:"Istighfar court",arabic:"أَسْتَغْفِرُ اللَّهَ",phonetic:"Astaghfiru llah",fr:"Je demande le pardon d'Allah.",source:"Bukhari",count:100,h:100},
    ],
  },
  {
    id:"mariage", label:"Mariage & Enfants", icon:"💍", bg:"linear-gradient(135deg,#F687B3,#702459)", grad:["#F687B3","#702459"],
    items:[
      {id:1201,title:"La nuit des noces",arabic:"بِسْمِ اللَّهِ، اللَّهُمَّ جَنِّبْنَا الشَّيْطَانَ",phonetic:"Bismillah, allahumma jannibna sh-shaytana",fr:"Au nom d'Allah. Ô Allah, éloigne de nous le Shaytan.",source:"Bukhari, Mouslim",count:1,h:20},
      {id:1202,title:"Pour bénir un marié",arabic:"بَارَكَ اللَّهُ لَكَ وَبَارَكَ عَلَيْكَ",phonetic:"Baraka llahu laka wa baraka 'alayka",fr:"Qu'Allah te bénisse et répande Ses bénédictions sur toi.",source:"Abou Dawoud",count:1,h:10},
    ],
  },
];

const AYAH_DU_JOUR = {
  arabic:"وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
  fr:"Celui qui craint Allah, Il lui accordera une issue favorable.",
  ref:"At-Talaq 65:2",
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function Sheet({ onClose, children }) {
  return (
    <>
      <div className="sheet-ov" onClick={onClose} />
      <div className="sheet"><div className="sheet-handle" />{children}</div>
    </>
  );
}
function fmtTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

/* ─────────────────────────────────────────
   VERSE READER — lecteur verset par verset
───────────────────────────────────────── */
function VerseReader({ surah, initialVerseId, onClose, onGoHome, onAddH,
                       notes, setNotes, goalSecs, onTimeSpent,
                       savedVerses, setSavedVerses, fontSizes }) {
  const { verses, loading, error } = useSurahVerses(surah.id);

  const startIdx = initialVerseId
    ? Math.max(0, (initialVerseId - 1))
    : 0;

  const [idx,          setIdx]          = useState(startIdx);
  const [cls,          setCls]          = useState("vs-in");
  const [readSet,      setReadSet]      = useState(new Set());
  const [showPop,      setShowPop]      = useState(false);
  const [hCount,       setHCount]       = useState(0);
  const [sheet,        setSheet]        = useState(null);
  const [noteText,     setNoteText]     = useState("");
  const [phonetic,     setPhonetic]     = useState(false);
  const [elapsed,      setElapsed]      = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [saveBump,     setSaveBump]     = useState(false);
  // Tafsir
  const [tafsirText,   setTafsirText]   = useState(null);
  const [tafsirLoad,   setTafsirLoad]   = useState(false);
  const [tafsirErr,    setTafsirErr]    = useState(false);

  const audioRef = useRef(null);
  const anim     = useRef(false);
  const touchX   = useRef(null);
  const timerRef = useRef(null);

  const total = verses.length;
  const v     = verses[idx];

  const remaining = Math.max(0, goalSecs - elapsed);
  const pct       = Math.min(1, elapsed / goalSecs);
  const verseKey  = v ? `${surah.id}-${v.id}` : null;
  const isSaved   = verseKey ? !!savedVerses[verseKey] : false;

  // Sauvegarde localStorage à chaque changement de verset
  useEffect(() => {
    if (v) saveProgress(surah.id, surah.name, surah.arabic, v.id);
  }, [idx, v]);

  useEffect(() => {
    if (!loading && verses.length > 0)
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, verses.length]);

  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setAudioPlaying(false); }
    if (v) setNoteText(notes[`${surah.id}-${v.id}`] || "");
    setSheet(null);
    setTafsirText(null); setTafsirErr(false);
  }, [idx]);

  // Charge le tafsir depuis Supabase quand le sheet s'ouvre
  useEffect(() => {
    if (sheet !== "tafsir" || !v) return;
    setTafsirText(null); setTafsirErr(false); setTafsirLoad(true);
    fetchTafsirFromSupabase(surah.id, v.id).then(text => {
      setTafsirLoad(false);
      if (text) setTafsirText(text);
      else setTafsirErr(true);
    });
  }, [sheet]);

  const vibrate = () => { if (navigator.vibrate) navigator.vibrate(40); };

  const toggleAudio = () => {
    if (!v?.audioUrl) return;
    if (audioRef.current) {
      if (audioPlaying) { audioRef.current.pause(); setAudioPlaying(false); }
      else { audioRef.current.play(); setAudioPlaying(true); }
      return;
    }
    // Basmala en premier si c'est le premier verset
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
    } else {
      playVerse();
    }
  };

  const goTo = (next, dir) => {
    if (anim.current || next < 0 || next >= total) return;
    anim.current = true; vibrate();
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
    onClose();
    onGoHome();
  };

  const toggleSave = () => {
    if (!v) return;
    setSavedVerses(p => {
      const n = { ...p };
      if (n[verseKey]) delete n[verseKey];
      else n[verseKey] = { surahId:surah.id, surahName:surah.name, verseId:v.id, arabic:v.arabic, fr:v.fr, savedAt:Date.now() };
      return n;
    });
    setSaveBump(true); setTimeout(() => setSaveBump(false), 200);
  };

  const saveNote = () => {
    setNotes(p => ({ ...p, [`${surah.id}-${v.id}`]: noteText })); setSheet(null);
  };

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
    <div className="reader" style={{alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{width:56,height:56,borderRadius:"50%",background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>📖</div>
      <p style={{fontSize:15,color:"var(--ink-m)",fontWeight:600}}>Chargement de {surah.name}...</p>
      <div style={{width:200,height:4,borderRadius:999,background:"var(--border-s)",overflow:"hidden"}}>
        <div style={{width:"60%",height:"100%",background:"var(--emerald)",borderRadius:999,animation:"loadBar 1.2s ease-in-out infinite"}}/>
      </div>
      <button onClick={() => { clearInterval(timerRef.current); onClose(); onGoHome(); }}
        style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink-m)",fontSize:14,fontWeight:600}}>← Retour</button>
    </div>
  );

  if (error || !v) return (
    <div className="reader" style={{alignItems:"center",justifyContent:"center",gap:12}}>
      <p style={{fontSize:28}}>⚠️</p>
      <p style={{fontSize:14,color:"var(--ink-m)"}}>Erreur de chargement</p>
      <button onClick={() => { clearInterval(timerRef.current); onClose(); onGoHome(); }}
        style={{background:"var(--emerald)",color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",cursor:"pointer",fontWeight:700}}>← Retour</button>
    </div>
  );

  return (
    <div className="reader" onTouchStart={onTS} onTouchEnd={onTE}>

      {/* ── HEADER ── */}
      <div style={{padding:"44px 16px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:8}}>
        <button onClick={markDone}
          style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"var(--ink-s)",flexShrink:0}}>
          ←
        </button>
        <div style={{flex:1,textAlign:"center"}}>
          <p style={{fontSize:15,fontWeight:800,color:"var(--emerald)"}}>{surah.name}</p>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:3}}>
            {/* Badge verset — toujours visible */}
            <div style={{background:"var(--emerald)",borderRadius:999,padding:"2px 12px",boxShadow:"0 2px 8px rgba(42,122,90,0.35)"}}>
              <span style={{fontSize:12,fontWeight:800,color:"#fff"}}>{v.id} / {total}</span>
            </div>
            {hCount > 0 && (
              <div style={{background:"rgba(224,107,139,0.12)",border:"1px solid rgba(224,107,139,0.25)",borderRadius:999,padding:"2px 9px"}}>
                <span style={{fontSize:11,fontWeight:800,color:"var(--heart)"}}>+{hCount} ♥</span>
              </div>
            )}
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button onClick={() => setPhonetic(!phonetic)}
            style={{background:phonetic?"var(--emerald-glow)":"rgba(0,0,0,0.05)",border:"1px solid "+(phonetic?"rgba(61,170,127,0.3)":"var(--border-s)"),color:phonetic?"var(--emerald)":"var(--ink-m)",borderRadius:8,padding:"4px 9px",cursor:"pointer",fontSize:12,fontWeight:700}}>
            Ph
          </button>
          <button onClick={toggleSave} className={saveBump?"bump":""}
            style={{background:isSaved?"rgba(196,154,60,0.15)":"rgba(0,0,0,0.05)",border:`1px solid ${isSaved?"rgba(196,154,60,0.4)":"var(--border-s)"}`,borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16}}>
            🔖
          </button>
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={{margin:"0 16px 10px",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:12,color:"var(--ink-m)",fontWeight:600}}>Objectif session</span>
          <span style={{fontSize:12,color:remaining===0?"var(--gold)":"var(--emerald)",fontWeight:700}}>
            {remaining===0?"✓ Objectif atteint !":fmtTime(remaining)}
          </span>
        </div>
        <div style={{background:"rgba(0,0,0,0.06)",borderRadius:999,height:5,overflow:"hidden"}}>
          <div style={{width:`${pct*100}%`,height:"100%",background:pct>=1?"var(--gold)":"linear-gradient(90deg,var(--emerald),var(--emerald-l))",borderRadius:999,transition:"width 1s linear"}}/>
        </div>
      </div>

      {/* ── ZONE VERSET ── */}
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <div className={`vslide ${cls}`} style={{justifyContent:"flex-start",paddingTop:12,gap:0}}>
          {/* Basmala si verset 1 */}
          {idx === 0 && (
            <div style={{width:"100%",marginBottom:16,padding:"10px 14px",background:"var(--emerald-glow)",borderRadius:14,border:"1px solid rgba(42,122,90,0.2)",textAlign:"center"}}>
              <p className="arabic" style={{fontSize:Math.round(fontSizes.arabic * 0.85),color:"var(--emerald)",lineHeight:2}}>{BASMALA.arabic}</p>
              <p style={{fontSize:fontSizes.fr - 2,color:"var(--ink-m)",fontStyle:"italic",marginTop:4}}>{BASMALA.fr}</p>
            </div>
          )}

          {/* Texte arabe */}
          <p className="arabic" style={{fontSize:fontSizes.arabic,lineHeight:2.4,textAlign:"center",color:"var(--ink)",marginBottom:20,width:"100%"}}>
            {v.arabic}
          </p>

          <div style={{display:"flex",alignItems:"center",gap:12,width:"100%",marginBottom:16}}>
            <div style={{flex:1,height:1,background:"var(--border-s)"}}/>
            <span style={{color:"var(--gold)",fontSize:14}}>✦</span>
            <div style={{flex:1,height:1,background:"var(--border-s)"}}/>
          </div>

          {phonetic && (
            <p style={{fontSize:fontSizes.phonetic,color:"var(--ink-m)",fontStyle:"italic",textAlign:"center",lineHeight:1.8,marginBottom:12,width:"100%"}}>
              {/* phonetic non disponible dans l'API de base */}
            </p>
          )}

          {/* Traduction */}
          <p style={{fontSize:fontSizes.fr,color:"var(--ink-s)",lineHeight:1.9,textAlign:"center",width:"100%"}}>
            {v.fr}
          </p>

          {/* Note existante */}
          {notes[`${surah.id}-${v.id}`] && (
            <div style={{marginTop:16,background:"var(--emerald-glow)",borderRadius:12,padding:"9px 14px",border:"1px solid rgba(61,170,127,0.2)",width:"100%"}}>
              <p style={{fontSize:12,color:"var(--emerald)",fontWeight:600}}>📝 {notes[`${surah.id}-${v.id}`]}</p>
            </div>
          )}
        </div>
        {showPop && <div className="hpop">+10 ♥</div>}
      </div>

      {/* ── DOTS ── */}
      <div style={{display:"flex",gap:5,justifyContent:"center",padding:"6px 0",flexShrink:0,overflowX:"auto"}}>
        {verses.slice(0,20).map((_,i) => (
          <div key={i} className="dot" onClick={() => goTo(i, i > idx ? "l" : "r")}
            style={{background:i===idx?"var(--emerald)":readSet.has(i)?"var(--emerald-l)":"rgba(0,0,0,0.12)",width:i===idx?20:6}}/>
        ))}
        {verses.length > 20 && <span style={{fontSize:10,color:"var(--ink-m)",alignSelf:"center"}}>+{verses.length-20}</span>}
      </div>

      {/* ── BOUTONS ACTION ── */}
      <div style={{padding:"4px 12px",display:"flex",gap:6,flexShrink:0}}>
        <button onClick={toggleAudio}
          style={{flex:1,background:audioPlaying?"var(--emerald-glow)":"var(--card)",border:`1px solid ${audioPlaying?"rgba(42,122,90,0.4)":"var(--border)"}`,borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:audioPlaying?"var(--emerald)":"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          {audioLoading?"⏳":audioPlaying?"⏸ Stop":"▶ Écouter"}
        </button>
        <button onClick={() => setSheet("note")}
          style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          ✏️ Note
        </button>
        <button onClick={() => setSheet("tafsir")}
          style={{flex:1,background:"linear-gradient(135deg,rgba(196,154,60,0.15),rgba(196,154,60,0.08))",border:"1px solid rgba(196,154,60,0.35)",borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          📖 Tafsir
        </button>
        <button onClick={() => setSheet("share")}
          style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:700,color:"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          🔗
        </button>
      </div>

      {/* ── NAVIGATION BAS ── */}
      <div style={{padding:"6px 16px 32px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={() => goTo(idx - 1, "r")} disabled={idx === 0}
          style={{width:48,height:48,borderRadius:"50%",border:"1px solid var(--border)",background:"var(--card)",cursor:idx===0?"default":"pointer",opacity:idx===0?0.3:1,fontSize:18,color:"var(--ink-s)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"var(--shadow)"}}>
          ←
        </button>
        <button onClick={markDone}
          style={{flex:1,height:48,borderRadius:14,border:"none",background:"linear-gradient(135deg,#2A7A5A,#3DAA7F)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 18px rgba(42,122,90,0.4)"}}>
          J'ai fini ✓
        </button>
        <button onClick={() => goTo(idx + 1, "l")} disabled={idx === total - 1}
          style={{width:48,height:48,borderRadius:"50%",border:"none",background:idx===total-1?"rgba(0,0,0,0.06)":"var(--emerald)",cursor:idx===total-1?"default":"pointer",opacity:idx===total-1?0.3:1,fontSize:18,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:idx===total-1?"none":"0 4px 14px rgba(42,122,90,0.35)"}}>
          →
        </button>
      </div>

      {/* ── SHEET TAFSIR ── */}
      {sheet === "tafsir" && (
        <Sheet onClose={() => setSheet(null)}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#C49A3C,#E8C060)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📖</div>
            <div>
              <p style={{fontSize:15,fontWeight:800,color:"var(--ink)"}}>Tafsir</p>
              <p style={{fontSize:11,color:"var(--ink-m)"}}>{surah.name} — Verset {v.id}</p>
            </div>
          </div>
          <p className="arabic" style={{fontSize:20,textAlign:"right",lineHeight:2,color:"var(--emerald)",marginBottom:14}}>{v.arabic}</p>
          <div style={{background:"rgba(0,0,0,0.03)",borderRadius:14,padding:"14px",border:"1px solid var(--border-s)",minHeight:80}}>
            {tafsirLoad && (
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <p style={{fontSize:13,color:"var(--ink-m)"}}>⏳ Chargement du Tafsir...</p>
              </div>
            )}
            {tafsirErr && !tafsirLoad && (
              <div style={{textAlign:"center",padding:"12px 0"}}>
                <p style={{fontSize:20,marginBottom:8}}>📭</p>
                <p style={{fontSize:13,color:"var(--ink-m)",fontWeight:600}}>Tafsir non disponible</p>
                <p style={{fontSize:12,color:"var(--ink-m)",marginTop:4,lineHeight:1.6}}>
                  Le Tafsir pour ce verset n'a pas encore été ajouté.<br/>
                  Connectez Supabase et ajoutez le contenu via l'éditeur SQL.
                </p>
              </div>
            )}
            {tafsirText && !tafsirLoad && (
              <p style={{fontSize:14,color:"var(--ink-s)",lineHeight:1.9}}>{tafsirText}</p>
            )}
          </div>
        </Sheet>
      )}

      {/* ── SHEET NOTE ── */}
      {sheet === "note" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3 style={{fontSize:17,marginBottom:4,color:"var(--ink)"}}>Note privée</h3>
          <p style={{fontSize:12,color:"var(--ink-m)",marginBottom:12}}>{surah.name} — Verset {v.id}</p>
          <p className="arabic" style={{fontSize:20,textAlign:"right",lineHeight:2,marginBottom:12,color:"var(--emerald)"}}>{v.arabic}</p>
          <textarea rows={4} placeholder="Réflexion, mémorisation, sens personnel..." value={noteText} onChange={e => setNoteText(e.target.value)}/>
          <button onClick={saveNote} style={{marginTop:10,width:"100%",background:"var(--emerald)",color:"#fff",border:"none",borderRadius:13,padding:"13px",cursor:"pointer",fontSize:14,fontWeight:700}}>Sauvegarder ✓</button>
        </Sheet>
      )}

      {/* ── SHEET SHARE ── */}
      {sheet === "share" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3 style={{fontSize:17,marginBottom:12,color:"var(--ink)"}}>Partager ce verset</h3>
          <div style={{background:"rgba(0,0,0,0.04)",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid var(--border-s)"}}>
            <p className="arabic" style={{fontSize:20,textAlign:"right",lineHeight:2,marginBottom:10,color:"var(--ink)"}}>{v.arabic}</p>
            <div style={{height:1,background:"var(--border-s)",marginBottom:10}}/>
            <p style={{fontSize:13,color:"var(--ink-s)",lineHeight:1.7,fontStyle:"italic"}}>{v.fr}</p>
            <p style={{fontSize:11,color:"var(--ink-m)",marginTop:8,textAlign:"right"}}>— {surah.name} {surah.id}:{v.id}</p>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={share} style={{flex:1,background:"var(--emerald)",color:"#fff",border:"none",borderRadius:13,padding:"13px",cursor:"pointer",fontSize:13,fontWeight:700}}>📤 Partager</button>
            <button onClick={() => { navigator.clipboard?.writeText(shareText); setSheet(null); }} style={{flex:1,background:"rgba(0,0,0,0.05)",color:"var(--ink-s)",border:"1px solid var(--border-s)",borderRadius:13,padding:"13px",cursor:"pointer",fontSize:13,fontWeight:700}}>📋 Copier</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   HOME
───────────────────────────────────────── */
const DAYS     = ["L","M","M","J","V","S","D"];
const todayRaw = new Date().getDay();
const todayIdx = todayRaw === 0 ? 6 : todayRaw - 1;
const WEEK_DATA = [
  {done:true,h:320,v:28,m:18},{done:true,h:210,v:15,m:12},{done:true,h:480,v:42,m:25},
  {done:false,h:90,v:8,m:5},{done:false,h:0,v:0,m:0},{done:false,h:0,v:0,m:0},{done:false,h:0,v:0,m:0},
];
const CIRCLE = [{name:"Amina",avatar:"🌸",h:2840},{name:"Karim",avatar:"🌙",h:1920},{name:"Fatima",avatar:"🌿",h:3100},{name:"Ibrahim",avatar:"⭐",h:650}];

function HomeScreen({ hassanates, streak, readingMins, onStart }) {
  const [selectedDay, setSelectedDay] = useState(todayIdx);
  const [animKey,     setAnimKey]     = useState(0);
  const [circleH,     setCircleH]     = useState(CIRCLE.reduce((a,m)=>a+m.h,0));

  // Récupère la progression sauvegardée
  const progress = loadProgress();

  const dayData = WEEK_DATA[selectedDay] || WEEK_DATA[todayIdx];
  const isToday = selectedDay === todayIdx;

  const statsGrid = [
    {icon:"♥", label:"Hassanates",   val:isToday?hassanates.toLocaleString():dayData.h.toLocaleString(), color:"var(--heart)"},
    {icon:"📖",label:"Versets lus",  val:isToday?"142":dayData.v,                                        color:"var(--emerald)"},
    {icon:"⏱️",label:"Mins lecture", val:isToday?readingMins:dayData.m,                                  color:"#7C6AE8"},
    {icon:"✅",label:"Sourates",     val:"3",                                                             color:"var(--gold)"},
  ];

  return (
    <div style={{flex:1,overflowY:"auto",padding:"10px 16px 16px"}}>
      <div className="fu" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <p style={{fontSize:14,color:"var(--ink-m)",fontWeight:600}}>Assalam Alaykum 🤍</p>
          <p style={{fontSize:24,fontWeight:800,color:"var(--ink)",fontFamily:"'Playfair Display',serif"}}>Youssef</p>
          <div className="pill" style={{marginTop:5}}>🔥 {streak} jours de suite</div>
        </div>
        <div style={{width:54,height:54,borderRadius:"50%",background:"linear-gradient(135deg,var(--emerald),var(--emerald-l))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:"0 4px 16px rgba(42,122,90,0.3)"}}>🌿</div>
      </div>

      {/* Semaine */}
      <div className="fu card" style={{padding:"12px 14px",marginBottom:14,animationDelay:"0.04s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <p style={{fontSize:12,fontWeight:700,color:"var(--ink-m)"}}>Cette semaine</p>
          {!isToday && <button onClick={()=>{setSelectedDay(todayIdx);setAnimKey(k=>k+1);}} style={{fontSize:11,fontWeight:700,color:"var(--emerald)",background:"var(--emerald-glow)",border:"none",borderRadius:999,padding:"2px 8px",cursor:"pointer"}}>Aujourd'hui</button>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {DAYS.map((d,i)=>{
            const data=WEEK_DATA[i],isSel=i===selectedDay,isT=i===todayIdx,isFut=i>todayIdx;
            return(
              <div key={i} onClick={()=>{if(isFut)return;setSelectedDay(i);setAnimKey(k=>k+1);}} style={{cursor:isFut?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:isSel?"var(--emerald)":isT?"var(--emerald-glow)":"transparent",border:isT&&!isSel?"2px solid var(--emerald)":"2px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",opacity:isFut?0.35:1,transition:"all 0.2s"}}>
                  <span style={{fontSize:12,fontWeight:800,color:isSel?"#fff":isT?"var(--emerald)":"var(--ink-m)"}}>{d}</span>
                </div>
                <div style={{width:5,height:5,borderRadius:"50%",background:data.done?"var(--gold)":"transparent"}}/>
              </div>
            );
          })}
        </div>
        {!isToday && <p style={{fontSize:12,color:"var(--ink-m)",textAlign:"center",marginTop:6,fontWeight:600}}>{["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"][selectedDay]} · {dayData.done?"✅ Objectif atteint":"Non atteint"}</p>}
      </div>

      {/* Carte lecture — affiche la progression sauvegardée */}
      <div className="fu goal-card" style={{marginBottom:14,animationDelay:"0.07s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <p style={{fontSize:12,opacity:0.8,fontWeight:600,marginBottom:4}}>
              {progress ? "Reprendre la lecture" : "Commencer la lecture"}
            </p>
            <p style={{fontSize:20,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>
              {progress ? progress.surahName : "Al-Fatiha"}
            </p>
            {progress && (
              <p style={{fontSize:12,opacity:0.8,marginTop:2}}>Verset {progress.verseId}</p>
            )}
          </div>
          <p className="arabic" style={{fontSize:28,opacity:0.85}}>
            {progress ? progress.surahArabic : "الفاتحة"}
          </p>
        </div>
        <button onClick={onStart} style={{background:"rgba(255,255,255,0.92)",color:"var(--emerald)",border:"none",borderRadius:13,padding:"13px 0",width:"100%",cursor:"pointer",fontSize:15,fontWeight:800}}>
          {progress ? `Reprendre — Verset ${progress.verseId} →` : "Commencer la lecture →"}
        </button>
      </div>

      {/* Stats */}
      <div key={animKey} className="fu" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14,animationDelay:"0.09s"}}>
        {statsGrid.map((s,i)=>(
          <div key={i} className="stat-card" style={{backdropFilter:"blur(12px)"}}>
            <span style={{fontSize:22,color:s.color}}>{s.icon}</span>
            <p style={{fontSize:24,fontWeight:800,color:"var(--ink)",fontFamily:"'Playfair Display',serif",marginTop:6}}>{s.val}</p>
            <p style={{fontSize:12,color:"var(--ink-m)",marginTop:2,fontWeight:600}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cercle */}
      <div className="fu card" style={{padding:"18px",marginBottom:14,animationDelay:"0.11s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><p style={{fontSize:15,fontWeight:800,color:"var(--ink)"}}>🤝 Mon Cercle</p><p style={{fontSize:12,color:"var(--ink-m)",marginTop:2}}>Progression collective</p></div>
          <div style={{textAlign:"right"}}><p style={{fontSize:17,fontWeight:800,color:"var(--heart)",fontFamily:"'Playfair Display',serif"}}>{circleH.toLocaleString()}</p><p style={{fontSize:11,color:"var(--ink-m)"}}>/ 10 000 ♥</p></div>
        </div>
        <div style={{background:"rgba(0,0,0,0.06)",borderRadius:999,height:8,overflow:"hidden",marginBottom:16}}>
          <div style={{width:`${Math.min(100,(circleH/10000)*100)}%`,height:"100%",background:"linear-gradient(90deg,var(--heart),#F09AAF)",borderRadius:999,transition:"width 0.8s"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
          {CIRCLE.map((m,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",marginRight:14}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${i*60},60%,75%),hsl(${i*60+30},60%,65%))`,border:"2px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{m.avatar}</div>
              <p style={{fontSize:11,fontWeight:700,color:"var(--ink-s)",marginTop:4}}>{m.name}</p>
              <p style={{fontSize:10,color:"var(--heart)",fontWeight:700}}>{m.h.toLocaleString()} ♥</p>
            </div>
          ))}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginLeft:"auto"}}>
            <button style={{width:44,height:44,borderRadius:"50%",background:"var(--emerald-glow)",border:"2px dashed rgba(42,122,90,0.4)",cursor:"pointer",fontSize:20,color:"var(--emerald)",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            <p style={{fontSize:10,fontWeight:700,color:"var(--emerald)",marginTop:4}}>Inviter</p>
          </div>
        </div>
        <button onClick={()=>setCircleH(h=>Math.min(10000,h+50))} style={{width:"100%",background:"rgba(0,0,0,0.04)",border:"1px dashed var(--border-s)",borderRadius:10,padding:"8px",cursor:"pointer",fontSize:13,fontWeight:600,color:"var(--ink-m)"}}>⚡ Simuler +50 ♥</button>
      </div>

      {/* Ayah du jour */}
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
        <div style={{background:"rgba(255,255,255,0.25)",borderRadius:999,height:6,overflow:"hidden"}}><div style={{width:"33%",height:"100%",background:"#fff",borderRadius:999}}/></div>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginTop:6}}>1 / 3 complété</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CORAN
───────────────────────────────────────── */
function QuranScreen({ onOpen }) {
  const { surahs, loading, error } = useSurahs();
  const [search, setSearch] = useState("");
  const filtered = search
    ? surahs.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.arabic.includes(search) || String(s.id).includes(search))
    : surahs;

  return (
    <div style={{flex:1,overflowY:"auto",padding:"10px 16px 16px"}}>
      <h2 style={{fontSize:26,marginBottom:4,color:"var(--ink)",fontWeight:800}}>Le Saint Coran</h2>
      <p style={{fontSize:14,color:"var(--ink-m)",marginBottom:12}}>114 sourates</p>
      <div style={{position:"relative",marginBottom:14}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,color:"var(--ink-m)"}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une sourate..."
          style={{width:"100%",padding:"11px 12px 11px 36px",borderRadius:12,border:"1px solid var(--border-s)",background:"var(--card)",color:"var(--ink)",fontSize:14,outline:"none",fontFamily:"'Nunito',sans-serif"}}/>
      </div>
      {loading && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} className="card" style={{padding:"14px 16px",height:70,opacity:0.5}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:"var(--emerald-glow)"}}/>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{width:"40%",height:13,borderRadius:6,background:"var(--border-s)"}}/>
                  <div style={{width:"60%",height:11,borderRadius:6,background:"var(--border-s)"}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div style={{textAlign:"center",padding:"40px 0",color:"var(--ink-m)"}}><p style={{fontSize:28,marginBottom:8}}>⚠️</p><p style={{fontSize:14}}>Impossible de charger le Coran</p></div>}
      {!loading && !error && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((s,i)=>(
            <div key={s.id} className="card fu" onClick={()=>onOpen(s)}
              style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",animationDelay:`${Math.min(i,12)*0.03}s`}}>
              <div style={{width:44,height:44,borderRadius:12,background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:14,fontWeight:700,color:"var(--emerald)"}}>{s.id}</span>
              </div>
              <div style={{flex:1}}>
                <p style={{fontWeight:700,fontSize:16,color:"var(--ink)"}}>{s.name}</p>
                <p style={{fontSize:12,color:"var(--ink-m)",marginTop:2}}>{s.verses} versets · {s.rev}</p>
              </div>
              <p className="arabic" style={{fontSize:22,color:"var(--gold)"}}>{s.arabic}</p>
            </div>
          ))}
          {filtered.length===0 && <div style={{textAlign:"center",padding:"40px 0",color:"var(--ink-m)"}}><p style={{fontSize:28}}>🔍</p><p style={{fontSize:14,marginTop:8}}>Aucun résultat pour « {search} »</p></div>}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   DHIKR
───────────────────────────────────────── */
function DhikrScreen({ onAddH, toast }) {
  const [selected, setSelected] = useState(null);
  const [detail,   setDetail]   = useState(null);
  const [search,   setSearch]   = useState("");
  const [ctrs,     setCtrs]     = useState({});
  const [bumpId,   setBumpId]   = useState(null);
  const [mainTab,  setMainTab]  = useState("principal");

  const cats = mainTab === "principal" ? DHIKR_CATEGORIES.slice(0,6) : DHIKR_CATEGORIES.slice(6);

  const tap = d => {
    const cur = ctrs[d.id] || 0;
    if (cur >= d.count) return;
    const next = cur + 1;
    setCtrs(p => ({ ...p, [d.id]:next }));
    setBumpId(d.id); setTimeout(() => setBumpId(null), 180);
    if (next === d.count) { onAddH(d.h); toast(`+${d.h} ♥`); }
  };

  if (detail && selected) {
    const d = detail, cur = ctrs[d.id]||0, done = cur >= d.count;
    return (
      <div style={{flex:1,overflowY:"auto",padding:"10px 16px 24px"}}>
        <button onClick={()=>setDetail(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"var(--ink-s)",marginBottom:16}}>←</button>
        <div className="card" style={{padding:"20px"}}>
          <p style={{fontSize:12,color:"var(--ink-m)",marginBottom:8,fontWeight:600}}>{selected.label}</p>
          <p style={{fontSize:18,fontWeight:800,color:"var(--ink)",marginBottom:16,lineHeight:1.4}}>{d.title}</p>
          <p className="arabic" style={{fontSize:30,textAlign:"right",lineHeight:2.4,color:"var(--ink)",marginBottom:16}}>{d.arabic}</p>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{flex:1,height:1,background:"var(--border-s)"}}/><span style={{color:"var(--gold)"}}>✦</span><div style={{flex:1,height:1,background:"var(--border-s)"}}/>
          </div>
          <p style={{fontSize:14,color:"var(--ink-m)",fontStyle:"italic",lineHeight:1.8,marginBottom:12}}>{d.phonetic}</p>
          <p style={{fontSize:15,color:"var(--ink-s)",lineHeight:1.9,marginBottom:20}}>{d.fr}</p>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <span style={{fontSize:13,fontWeight:700,color:done?"var(--gold)":"var(--emerald)"}}>+{d.h} ♥ · {d.count}×</span>
            <button style={{width:72,height:72,borderRadius:"50%",border:"none",cursor:done?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:done?"rgba(0,0,0,0.05)":`linear-gradient(135deg,${selected.grad[0]},${selected.grad[1]})`,color:done?"var(--ink-m)":"#fff",boxShadow:done?"none":`0 4px 18px ${selected.grad[0]}55`}} onClick={()=>tap(d)} disabled={done}>
              {done ? <span style={{fontSize:28}}>✓</span> : <><span style={{fontSize:22,fontWeight:800,lineHeight:1}}>{cur}</span><span style={{fontSize:11}}>/{d.count}</span></>}
            </button>
          </div>
          <div style={{background:"rgba(0,0,0,0.05)",borderRadius:999,height:6,overflow:"hidden"}}>
            <div style={{width:`${Math.round((cur/d.count)*100)}%`,height:"100%",background:done?"var(--gold)":`linear-gradient(90deg,${selected.grad[0]},${selected.grad[1]})`,borderRadius:999,transition:"width 0.25s"}}/>
          </div>
        </div>
      </div>
    );
  }

  if (selected) {
    const items = search
      ? selected.items.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || d.fr.toLowerCase().includes(search.toLowerCase()))
      : selected.items;
    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"44px 16px 14px",flexShrink:0,background:selected.bg}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>{setSelected(null);setSearch("");}} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"#fff"}}>←</button>
            <div><p style={{fontSize:20,fontWeight:800,color:"#fff"}}>{selected.label}</p><p style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>{selected.items.length} invocations</p></div>
          </div>
        </div>
        <div style={{padding:"12px 16px 0",flexShrink:0}}>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,color:"var(--ink-m)"}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."
              style={{width:"100%",padding:"10px 12px 10px 36px",borderRadius:12,border:"1px solid var(--border-s)",background:"var(--card)",color:"var(--ink)",fontSize:14,outline:"none",fontFamily:"'Nunito',sans-serif"}}/>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          <div className="card" style={{margin:"12px 16px",overflow:"hidden"}}>
            {items.map((d,i)=>{
              const cur=ctrs[d.id]||0,done=cur>=d.count;
              return(
                <div key={d.id} className="dhikr-list-item" style={{opacity:done?0.6:1}} onClick={()=>setDetail(d)}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:done?"var(--gold)":"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:done?"#fff":"var(--emerald)",flexShrink:0}}>
                    {done?"✓":i+1}
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:15,fontWeight:700,color:"var(--ink)",lineHeight:1.3}}>{d.title}</p>
                    <p style={{fontSize:12,color:"var(--ink-m)",marginTop:2}}>{done?`Complété · +${d.h} ♥`:`${d.count}× · +${d.h} ♥`}</p>
                  </div>
                  <span style={{color:"var(--ink-m)",fontSize:18}}>›</span>
                </div>
              );
            })}
            {items.length===0 && <div style={{textAlign:"center",padding:"40px 0",color:"var(--ink-m)"}}><p style={{fontSize:28}}>🔍</p><p style={{fontSize:14,marginTop:8}}>Aucun résultat</p></div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{flex:1,overflowY:"auto",padding:"10px 16px 16px"}}>
      <h2 style={{fontSize:24,fontWeight:800,color:"var(--ink)",marginBottom:14}}>Dhikr & Doua</h2>
      <div className="tab-bar" style={{marginBottom:16}}>
        <button className={`tab${mainTab==="principal"?" active":""}`} onClick={()=>setMainTab("principal")}>⭐ Principal</button>
        <button className={`tab${mainTab==="autre"?" active":""}`} onClick={()=>setMainTab("autre")}>🗂️ Autre</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {cats.map((cat,i)=>(
          <div key={cat.id} className="dhikr-cat-card fu" onClick={()=>setSelected(cat)}
            style={{background:cat.bg,animationDelay:`${i*0.05}s`,boxShadow:`0 6px 24px ${cat.grad[0]}55`}}>
            <div className="dhikr-cat-bg">{cat.icon}</div>
            <p style={{position:"relative",fontSize:15,fontWeight:800,color:"#fff",lineHeight:1.3,textShadow:"0 1px 6px rgba(0,0,0,0.35)"}}>{cat.label}</p>
            <p style={{position:"relative",fontSize:11,color:"rgba(255,255,255,0.75)",marginTop:3,fontWeight:600}}>{cat.items.length} invocations →</p>
          </div>
        ))}
      </div>
      <div style={{marginTop:20,padding:"16px",background:"var(--emerald-glow)",borderRadius:18,border:"1px solid rgba(42,122,90,0.15)",textAlign:"center"}}>
        <p className="arabic" style={{fontSize:20,color:"var(--emerald)",lineHeight:2,marginBottom:6}}>وَاذْكُر رَّبَّكَ كَثِيرًا</p>
        <p style={{fontSize:13,color:"var(--ink-s)",fontStyle:"italic"}}>« Invoque ton Seigneur beaucoup. » — Al-Imran 3:41</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ONBOARDING
───────────────────────────────────────── */
const OB = [
  {bg:["#1A2E1A","#0D1F0D"],orb:"rgba(42,122,90,0.25)",icon:"☽",iconBg:"linear-gradient(135deg,#2A7A5A,#3DAA7F)",title:"Bienvenue sur\nHassanates",accent:"#3DAA7F",sub:"Ton compagnon de progression spirituelle.",cta:null},
  {bg:["#1A1A2E","#0D0D1F"],orb:"rgba(124,106,232,0.2)",icon:"🤝",iconBg:"linear-gradient(135deg,#7C6AE8,#A08CF5)",title:"Progresse en\nCommunauté",accent:"#A08CF5",sub:"Rejoins un cercle de motivation.",cta:null},
  {bg:["#1F1A0D","#2E2410"],orb:"rgba(196,154,60,0.2)",icon:"🌿",iconBg:"linear-gradient(135deg,#C49A3C,#E8C060)",title:"Trouve ta\nSérénité",accent:"#E8C060",sub:"Des espaces de calme pour recentrer ton cœur.",cta:"Commencer"},
];
function Onboarding({ onDone }) {
  const [idx,setIdx]=useState(0);
  const anim=useRef(false),touchX=useRef(null);
  const s=OB[idx];
  const goTo=next=>{
    if(anim.current||next<0||next>=OB.length)return;
    anim.current=true;
    setTimeout(()=>{setIdx(next);anim.current=false;},280);
  };
  const onTS=e=>{touchX.current=e.touches[0].clientX;};
  const onTE=e=>{if(!touchX.current)return;const dx=touchX.current-e.changedTouches[0].clientX;if(Math.abs(dx)>44)dx>0?goTo(idx+1):goTo(idx-1);touchX.current=null;};
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,maxWidth:430,margin:"0 auto",overflow:"hidden",background:`linear-gradient(160deg,${s.bg[0]},${s.bg[1]})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}} onTouchStart={onTS} onTouchEnd={onTE}>
      <div style={{position:"absolute",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:s.orb,pointerEvents:"none"}}/>
      {idx<OB.length-1&&<button onClick={onDone} style={{position:"absolute",top:52,right:20,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:999,padding:"6px 14px",cursor:"pointer",fontSize:13,color:"rgba(255,255,255,0.6)",zIndex:10}}>Passer</button>}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"0 32px"}}>
        <div style={{width:100,height:100,borderRadius:28,background:s.iconBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:46,marginBottom:36}}>{s.icon}</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,color:"#fff",textAlign:"center",lineHeight:1.25,marginBottom:20,whiteSpace:"pre-line"}}>
          {s.title.split("\n").map((line,i)=>(
            <span key={i}>{i===1?<span style={{background:`linear-gradient(90deg,${s.accent},#fff)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{line}</span>:line}{i===0&&<br/>}</span>
          ))}
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
   SÉRÉNITÉ
───────────────────────────────────────── */
const SOUNDS  = [{id:"pluie",label:"Pluie douce",icon:"🌧️"},{id:"ocean",label:"Océan",icon:"🌊"},{id:"foret",label:"Forêt",icon:"🌲"},{id:"vent",label:"Vent de l'aube",icon:"🌬️"},{id:"riviere",label:"Rivière",icon:"🏞️"},{id:"feu",label:"Feu crépitant",icon:"🔥"}];
const PRESETS = [{name:"Océan de Paix",icon:"🌊",color:"#4A90D9",volumes:{ocean:80,pluie:20,foret:0,vent:0,riviere:0,feu:0}},{name:"Pluie de Miséricorde",icon:"🌧️",color:"#7C6AE8",volumes:{pluie:75,foret:30,ocean:0,vent:15,riviere:0,feu:0}},{name:"Vent de l'Aube",icon:"🌬️",color:"#2A7A5A",volumes:{vent:70,foret:40,ocean:0,pluie:0,riviere:20,feu:0}}];

function SereniteScreen() {
  const [volumes,setVolumes]=useState({pluie:0,ocean:0,foret:0,vent:0,riviere:0,feu:0});
  const [playing,setPlaying]=useState(false);const [activePreset,setActivePreset]=useState(null);const [wave,setWave]=useState(0);
  useEffect(()=>{if(!playing)return;const t=setInterval(()=>setWave(w=>(w+1)%100),50);return()=>clearInterval(t);},[playing]);
  const applyPreset=(p,i)=>{setVolumes(p.volumes);setActivePreset(i);setPlaying(true);};
  const isActive=Object.values(volumes).reduce((a,v)=>a+v,0)>0;
  const waveBars=Array.from({length:28},(_,i)=>{const base=8+Math.sin((i/28)*Math.PI*2)*6;const live=playing?Math.abs(Math.sin((wave/100*Math.PI*2)+i*0.4))*20:0;return base+live;});
  return(
    <div style={{flex:1,overflowY:"auto",padding:"10px 16px 20px"}}>
      <div style={{background:"linear-gradient(135deg,#0D1F14,#1A3020)",borderRadius:22,padding:"24px",marginBottom:16,textAlign:"center"}}>
        <h2 style={{fontSize:24,color:"#fff",fontFamily:"'Playfair Display',serif",marginBottom:8}}>Sérénité</h2>
        <p style={{fontSize:13,color:"rgba(255,255,255,0.65)",lineHeight:1.7,marginBottom:16}}>« Et dans le souvenir d'Allah, les cœurs trouvent la tranquillité. »</p>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:3,height:48,marginBottom:16}}>
          {waveBars.map((h,i)=><div key={i} style={{width:4,height:`${h}px`,borderRadius:2,background:isActive?`rgba(61,170,127,${0.4+(h/30)*0.6})`:"rgba(255,255,255,0.12)",transition:playing?"height 0.15s ease":"height 0.5s ease"}}/>)}
        </div>
        <button onClick={()=>setPlaying(!playing)} disabled={!isActive} style={{width:56,height:56,borderRadius:"50%",border:"none",cursor:isActive?"pointer":"default",background:isActive?"linear-gradient(135deg,#2A7A5A,#3DAA7F)":"rgba(255,255,255,0.1)",color:"#fff",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",opacity:isActive?1:0.4}}>
          {playing?"⏸":"▶"}
        </button>
      </div>
      <p style={{fontSize:13,fontWeight:800,color:"var(--ink)",marginBottom:10}}>🎛️ Presets</p>
      <div style={{display:"flex",gap:10,marginBottom:18}}>
        {PRESETS.map((p,i)=>(
          <button key={i} onClick={()=>applyPreset(p,i)} style={{flex:1,padding:"10px 6px",borderRadius:14,border:`1.5px solid ${activePreset===i?p.color:"var(--border-s)"}`,background:activePreset===i?`${p.color}22`:"var(--card)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <span style={{fontSize:22}}>{p.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:activePreset===i?p.color:"var(--ink-m)",textAlign:"center"}}>{p.name}</span>
          </button>
        ))}
      </div>
      <p style={{fontSize:13,fontWeight:800,color:"var(--ink)",marginBottom:10}}>🎚️ Mixeur</p>
      <div className="card" style={{padding:"16px",marginBottom:16}}>
        {SOUNDS.map(snd=>(
          <div key={snd.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:36,height:36,borderRadius:10,background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{snd.icon}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,fontWeight:700,color:"var(--ink-s)"}}>{snd.label}</span><span style={{fontSize:12,color:"var(--emerald)",fontWeight:700}}>{volumes[snd.id]}%</span></div>
              <div style={{position:"relative",height:4,background:"rgba(0,0,0,0.08)",borderRadius:999,cursor:"pointer"}} onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();const pct=Math.round(((e.clientX-rect.left)/rect.width)*100);setVolumes(v=>({...v,[snd.id]:Math.max(0,Math.min(100,pct))}));setActivePreset(null);}}>
                <div style={{width:`${volumes[snd.id]}%`,height:"100%",background:"linear-gradient(90deg,var(--emerald),var(--emerald-l))",borderRadius:999}}/>
                <div style={{position:"absolute",top:"50%",left:`${volumes[snd.id]}%`,transform:"translate(-50%,-50%)",width:14,height:14,borderRadius:"50%",background:"var(--emerald)",border:"2px solid #fff"}}/>
              </div>
            </div>
          </div>
        ))}
        <button onClick={()=>{setVolumes({pluie:0,ocean:0,foret:0,vent:0,riviere:0,feu:0});setPlaying(false);setActivePreset(null);}} style={{width:"100%",marginTop:4,padding:"8px",borderRadius:10,border:"1px dashed var(--border-s)",background:"none",cursor:"pointer",fontSize:13,color:"var(--ink-m)",fontWeight:600}}>Réinitialiser</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PROFIL
───────────────────────────────────────── */
const BADGES=[
  {id:"fajr",icon:"🌅",name:"Lève-tôt",cond:(s)=>s>=7,color:"#C49A3C"},
  {id:"hafidh",icon:"🌙",name:"Hafidh",cond:()=>true,color:"#3DAA7F"},
  {id:"mukhlis",icon:"♥",name:"Mukhlis",cond:(_,h)=>h>=1000,color:"#E06B8B"},
  {id:"sabir",icon:"⭐",name:"Sabir",cond:(_,h)=>h>=5000,color:"#E8C060"},
  {id:"murabit",icon:"🛡️",name:"Murabit",cond:(s)=>s>=30,color:"#7C6AE8"},
  {id:"tadabbur",icon:"📖",name:"Tadabbur",cond:()=>false,color:"#2A7A5A"},
  {id:"dhakir",icon:"📿",name:"Dhakir",cond:()=>false,color:"#4A90D9"},
  {id:"gold",icon:"★",name:"Gold Member",cond:(_,__,p)=>p,color:"#C49A3C"},
];
function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{width:44,height:26,borderRadius:999,background:on?"var(--emerald)":"rgba(0,0,0,0.12)",position:"relative",cursor:"pointer",transition:"background 0.25s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:on?20:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left 0.25s"}}/>
    </div>
  );
}
function ProfilScreen({ hassanates, streak, readingMins, goalMins, setGoalMins, onOpenPremium, isPremium, fontSizes, setFontSizes, savedVerses, setSavedVerses }) {
  const [notifFajr,setNotifFajr]=useState(true);
  const [notifSoir,setNotifSoir]=useState(true);
  const [notifDhikr,setNotifDhikr]=useState(false);
  const earned = BADGES.filter(b=>b.cond(streak,hassanates,isPremium));
  const locked  = BADGES.filter(b=>!b.cond(streak,hassanates,isPremium));
  const savedList = Object.values(savedVerses);

  return (
    <div style={{flex:1,overflowY:"auto",padding:"10px 16px 20px"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:18}}>
        <div style={{width:76,height:76,borderRadius:"50%",background:"linear-gradient(135deg,var(--emerald),var(--emerald-l))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,marginBottom:10,boxShadow:"0 6px 20px rgba(42,122,90,0.35)"}}>🌿</div>
        <p style={{fontSize:22,fontWeight:800,color:"var(--ink)",fontFamily:"'Playfair Display',serif"}}>Youssef</p>
        <div style={{display:"flex",gap:6,marginTop:6}}>
          <span className="pill">Récitant ♥</span>
          {isPremium&&<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(196,154,60,0.15)",color:"var(--gold)",borderRadius:999,padding:"3px 10px",fontSize:12,fontWeight:700,border:"1px solid rgba(196,154,60,0.3)"}}>★ Gold</span>}
        </div>
      </div>

      {!isPremium&&(
        <div onClick={onOpenPremium} style={{background:"linear-gradient(135deg,#1A1035,#2D1F5E)",borderRadius:18,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:"1px solid rgba(196,154,60,0.3)"}}>
          <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#C49A3C,#E8C060)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>★</div>
          <div style={{flex:1}}><p style={{fontSize:14,fontWeight:800,color:"#E8C060"}}>Devenir Premium Gold</p><p style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:2}}>Tafsir · Sérénité · Stats avancées</p></div>
          <span style={{color:"rgba(196,154,60,0.7)",fontSize:20}}>›</span>
        </div>
      )}

      <div style={{background:"linear-gradient(135deg,#E06B8B,#F09AAF)",borderRadius:18,padding:"16px 20px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><p style={{color:"rgba(255,255,255,0.85)",fontSize:13,fontWeight:600}}>Total Hassanates</p><p style={{color:"#fff",fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",marginTop:2}}>{hassanates.toLocaleString()} ♥</p></div>
        <p style={{fontSize:40}}>🌟</p>
      </div>

      {/* Réglages polices */}
      <p style={{fontSize:12,fontWeight:700,color:"var(--ink-m)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Taille des polices (Lecteur Coran)</p>
      <div className="card" style={{padding:"16px",marginBottom:14}}>
        {[
          {key:"arabic",  label:"Texte arabe",         icon:"🔤",min:20,max:48, preview:<p className="arabic" style={{fontSize:fontSizes.arabic,textAlign:"center",color:"var(--emerald)",marginTop:8,lineHeight:1.8}}>بِسْمِ اللَّهِ</p>},
          {key:"fr",      label:"Traduction française", icon:"🇫🇷",min:12,max:24, preview:<p style={{fontSize:fontSizes.fr,textAlign:"center",color:"var(--ink-s)",marginTop:8}}>Au nom d'Allah</p>},
          {key:"phonetic",label:"Phonétique",           icon:"📢",min:10,max:20, preview:<p style={{fontSize:fontSizes.phonetic,textAlign:"center",color:"var(--ink-m)",fontStyle:"italic",marginTop:8}}>Bismi llahi...</p>},
        ].map((item,i,arr)=>(
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
        <div style={{flex:1}}><p style={{fontSize:15,fontWeight:700,color:"var(--ink)"}}>Objectif de lecture</p><p style={{fontSize:12,color:"var(--ink-m)"}}>par session quotidienne</p></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setGoalMins(m=>Math.max(5,m-5))} style={{width:30,height:30,borderRadius:8,background:"var(--emerald-glow)",border:"none",cursor:"pointer",fontSize:18,color:"var(--emerald)",display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
          <span style={{fontSize:15,fontWeight:800,color:"var(--emerald)",minWidth:50,textAlign:"center"}}>{goalMins} min</span>
          <button onClick={()=>setGoalMins(m=>Math.min(120,m+5))} style={{width:30,height:30,borderRadius:8,background:"var(--emerald-glow)",border:"none",cursor:"pointer",fontSize:18,color:"var(--emerald)",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        </div>
      </div>

      {/* Versets sauvegardés */}
      {savedList.length>0&&(
        <div style={{marginBottom:14}}>
          <p style={{fontSize:12,fontWeight:700,color:"var(--ink-m)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>🔖 Versets sauvegardés ({savedList.length})</p>
          <div className="card" style={{overflow:"hidden"}}>
            {savedList.slice(0,5).map((sv,i)=>(
              <div key={i} style={{padding:"12px 16px",borderBottom:i<Math.min(savedList.length,5)-1?"1px solid var(--border-s)":"none",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--emerald)"}}>{sv.surahId}:{sv.verseId}</span>
                </div>
                <div style={{flex:1}}><p style={{fontSize:13,fontWeight:700,color:"var(--ink)"}}>{sv.surahName}</p><p className="arabic" style={{fontSize:13,color:"var(--ink-m)",marginTop:2,textAlign:"right"}}>{sv.arabic?.slice(0,30)}...</p></div>
                <button onClick={()=>setSavedVerses(p=>{const n={...p};delete n[`${sv.surahId}-${sv.verseId}`];return n;})} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"var(--ink-m)"}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

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
        {[{icon:"🌅",label:"Rappel Fajr",val:notifFajr,set:setNotifFajr},{icon:"🌙",label:"Rappel soir",val:notifSoir,set:setNotifSoir},{icon:"📿",label:"Rappel Dhikr",val:notifDhikr,set:setNotifDhikr}].map((it,ii,arr)=>(
          <div key={ii} style={{padding:"13px 16px",borderBottom:ii<arr.length-1?"1px solid var(--border-s)":"none",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:34,height:34,borderRadius:10,background:"var(--emerald-glow)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{it.icon}</div>
            <p style={{flex:1,fontSize:14,fontWeight:700,color:"var(--ink)"}}>{it.label}</p>
            <Toggle on={it.val} onToggle={()=>it.set(v=>!v)}/>
          </div>
        ))}
      </div>
      <p style={{fontSize:12,color:"var(--ink-m)",textAlign:"center",marginTop:8}}>Hassanates v1.0.0 — Fait avec ♥</p>
    </div>
  );
}

/* ─────────────────────────────────────────
   PREMIUM
───────────────────────────────────────── */
const PF=[{icon:"📖",title:"Tafsir en français",sub:"Via Supabase — contenu géré par vous"},{icon:"🎵",title:"Séances Sérénité exclusives",sub:"Méditations guidées, sons de la nature"},{icon:"📊",title:"Statistiques avancées",sub:"Suivi détaillé du Cercle"},{icon:"🏆",title:"Badges & défis premium",sub:"Accomplissements exclusifs"},{icon:"🔔",title:"Rappels intelligents",sub:"Selon vos temps de prière"},{icon:"☁️",title:"Sauvegarde cloud",sub:"Notes et progression synchronisés"}];
function PremiumPage({ onClose, onActivate }) {
  const [activated,setActivated]=useState(false);
  const go=()=>{setActivated(true);setTimeout(()=>{onActivate();onClose();},1200);};
  return(
    <div style={{position:"fixed",inset:0,zIndex:250,maxWidth:430,margin:"0 auto",background:"linear-gradient(160deg,#1A1035,#0D1B2A)",display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{padding:"52px 20px 0",flexShrink:0}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:14,color:"rgba(255,255,255,0.7)"}}>← Retour</button>
      </div>
      <div style={{padding:"28px 24px 0",textAlign:"center"}}>
        <h1 style={{fontSize:28,fontWeight:800,color:"#fff",fontFamily:"'Playfair Display',serif",lineHeight:1.3,marginBottom:12}}>Élève ta pratique<br/><span style={{background:"linear-gradient(90deg,#C49A3C,#E8C060)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>vers l'excellence</span></h1>
      </div>
      <div style={{padding:"24px 20px 0",display:"flex",flexDirection:"column",gap:10}}>
        {PF.map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:14,background:"rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,rgba(196,154,60,0.3),rgba(196,154,60,0.1))",border:"1px solid rgba(196,154,60,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{f.icon}</div>
            <div><p style={{fontSize:14,fontWeight:700,color:"#fff"}}>{f.title}</p><p style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2}}>{f.sub}</p></div>
            <span style={{marginLeft:"auto",color:"#E8C060",fontSize:16,flexShrink:0}}>✓</span>
          </div>
        ))}
      </div>
      <div style={{padding:"24px 20px 40px"}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",textDecoration:"line-through"}}>9,99 € / mois</p>
          <p style={{fontSize:30,fontWeight:800,color:"#E8C060",fontFamily:"'Playfair Display',serif"}}>4,99 € <span style={{fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.5)"}}>/ mois</span></p>
        </div>
        <button onClick={go} style={{width:"100%",padding:"16px",borderRadius:16,border:"none",cursor:"pointer",background:activated?"linear-gradient(135deg,#2A7A5A,#3DAA7F)":"linear-gradient(135deg,#C49A3C,#E8C060)",color:"#fff",fontSize:16,fontWeight:800,transition:"all 0.4s"}}>
          {activated?"✓ Premium activé !":"✨ Commencer mon essai gratuit · 7 jours"}
        </button>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.35)",textAlign:"center",marginTop:10}}>Sans engagement · Annulation à tout moment</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ROOT
───────────────────────────────────────── */
// ── Ajoute cet import tout en haut du fichier App.jsx ──
// import { useEffect, useState, useRef } from "react";   ← déjà présent
// Ajoute en plus :
import Auth from "./components/Auth";
import { supabase } from "./lib/supabase";

// ─────────────────────────────────────────
// ROOT — remplace toute la fonction App()
// ─────────────────────────────────────────
export default function App() {
  const [session,     setSession]     = useState(undefined); // undefined = chargement, null = non connecté
  const [onboarded,   setOnboarded]   = useState(false);
  const [tab,         setTab]         = useState("home");
  const [dark,        setDark]        = useState(false);
  const [hassanates,  setH]           = useState(0);          // commence à 0 pour un vrai utilisateur
  const [streak]                      = useState(0);
  const [readingMins, setReadingMins] = useState(0);
  const [goalMins,    setGoalMins]    = useState(15);
  const [notes,       setNotes]       = useState({});
  const [savedVerses, setSavedVerses] = useState({});
  const [toast,       setToast]       = useState(null);
  const [reader,      setReader]      = useState(null);
  const [isPremium,   setIsPremium]   = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [fontSizes,   setFontSizes]   = useState({ arabic:28, fr:15, phonetic:12 });
  const tRef = useRef(null);

  // ── Écoute l'état de connexion Supabase ──
  useEffect(() => {
    // Vérifie si une session existe déjà (ex: rechargement de page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Écoute les changements (connexion, déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Réinitialise tout quand on se déconnecte
        setH(0); setReadingMins(0); setNotes({}); setSavedVerses({});
        setTab("home"); setReader(null); setOnboarded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const showToast   = m => { setToast(m); clearTimeout(tRef.current); tRef.current = setTimeout(() => setToast(null), 2200); };
  const addH        = n => setH(p => p + n);
  const openPremium = () => setShowPremium(true);
  const goHome      = () => setTab("home");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast("À bientôt ! 👋");
  };

  const handleStart = () => {
    const progress = loadProgress();
    if (progress) {
      setReader({
        surah: { id:progress.surahId, name:progress.surahName, arabic:progress.surahArabic, verses:0, rev:"" },
        verseId: progress.verseId,
      });
    } else {
      setReader({
        surah: { id:1, name:"Al-Fatiha", arabic:"الفاتحة", verses:7, rev:"Mecquoise" },
        verseId: 1,
      });
    }
  };

  const nav = [
    { id:"home",     icon:"🏠", label:"Accueil"  },
    { id:"quran",    icon:"📖", label:"Coran"    },
    { id:"dhikr",    icon:"📿", label:"Dhikr"    },
    { id:"serenite", icon:"🌿", label:"Sérénité" },
    { id:"profil",   icon:"👤", label:"Profil"   },
  ];

  // ── Écran de chargement (vérification session) ──
  if (session === undefined) {
    return (
      <>
        <Styles />
        <div style={{ minHeight:"100svh", maxWidth:430, margin:"0 auto", background:"linear-gradient(160deg,#0D1F14,#1A1035)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:"linear-gradient(135deg,#2A7A5A,#3DAA7F)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>☽</div>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, fontWeight:600 }}>Chargement...</p>
        </div>
      </>
    );
  }

  // ── Non connecté → écran Auth ──
  if (!session) {
    return (
      <>
        <Styles />
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Nunito:wght@400;500;600;700;800&display=swap'); input{outline:none;} input::placeholder{color:rgba(255,255,255,0.3);}`}</style>
        <Auth />
      </>
    );
  }

  // ── Connecté → Onboarding si première fois ──
  if (!onboarded) {
    return (
      <>
        <Styles />
        <Onboarding onDone={() => setOnboarded(true)} />
      </>
    );
  }

  // ── Connecté + Onboarding fait → App principale ──
  const userEmail = session.user?.email || "";
  const userName  = userEmail.split("@")[0]; // "youssef" depuis "youssef@gmail.com"

  return (
    <>
      <Styles />
      <div className={`app${dark ? " dark" : ""}`}>

        {!reader && !showPremium && (
          <div style={{padding:"10px 16px 0",flexShrink:0}}>
            <div className="status-bar">
              <div className="stat-chip"><span style={{color:"var(--heart)"}}>♥</span>{hassanates.toLocaleString()}</div>
              <div className="stat-chip"><span className="fire">🔥</span>{streak}j</div>
              <div className="stat-chip">⏱️ {readingMins} min</div>
              {isPremium
                ? <span style={{fontSize:12,fontWeight:700,color:"var(--gold)"}}>★ Gold</span>
                : <button onClick={openPremium} style={{background:"linear-gradient(135deg,#C49A3C,#E8C060)",border:"none",borderRadius:999,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:700,color:"#fff"}}>★ Premium</button>}
              <button onClick={()=>setDark(!dark)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18}}>{dark?"☀️":"🌙"}</button>
            </div>
          </div>
        )}

        {!reader && !showPremium && tab==="home"     && <HomeScreen hassanates={hassanates} streak={streak} readingMins={readingMins} onStart={handleStart} userName={userName} />}
        {!reader && !showPremium && tab==="quran"    && <QuranScreen onOpen={s => setReader({ surah:s, verseId:1 })} />}
        {!reader && !showPremium && tab==="dhikr"    && <DhikrScreen onAddH={addH} toast={showToast} />}
        {!reader && !showPremium && tab==="serenite" && <SereniteScreen />}
        {!reader && !showPremium && tab==="profil"   && (
          <ProfilScreen
            hassanates={hassanates} streak={streak} readingMins={readingMins}
            goalMins={goalMins} setGoalMins={setGoalMins}
            onOpenPremium={openPremium} isPremium={isPremium}
            fontSizes={fontSizes} setFontSizes={setFontSizes}
            savedVerses={savedVerses} setSavedVerses={setSavedVerses}
            userName={userName} userEmail={userEmail}
            onLogout={handleLogout}
          />
        )}

        {reader && (
          <VerseReader
            surah={reader.surah}
            initialVerseId={reader.verseId}
            onClose={() => setReader(null)}
            onGoHome={goHome}
            onAddH={addH}
            notes={notes} setNotes={setNotes}
            goalSecs={goalMins * 60}
            onTimeSpent={s => setReadingMins(m => m + Math.round(s / 60))}
            savedVerses={savedVerses} setSavedVerses={setSavedVerses}
            fontSizes={fontSizes}
          />
        )}

        {showPremium && (
          <PremiumPage
            onClose={() => setShowPremium(false)}
            onActivate={() => { setIsPremium(true); showToast("★ Premium Gold activé !"); }}
          />
        )}

        {toast && <div className="toast">{toast}</div>}

        {!reader && !showPremium && (
          <nav className="nav-bar">
            {nav.map(it => (
              <div key={it.id} className={`nav-item${tab===it.id?" active":""}`} onClick={() => setTab(it.id)}>
                <span style={{fontSize:22}}>{it.icon}</span>
                <span className="nav-lbl">{it.label}</span>
              </div>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
  };

  const nav = [
    { id:"home",     icon:"🏠", label:"Accueil"  },
    { id:"quran",    icon:"📖", label:"Coran"    },
    { id:"dhikr",    icon:"📿", label:"Dhikr"    },
    { id:"serenite", icon:"🌿", label:"Sérénité" },
    { id:"profil",   icon:"👤", label:"Profil"   },
  ];

  if (!onboarded) return <><Styles /><Onboarding onDone={() => setOnboarded(true)} /></>;

  return (
    <>
      <Styles />
      <div className={`app${dark ? " dark" : ""}`}>

        {!reader && !showPremium && (
          <div style={{padding:"10px 16px 0",flexShrink:0}}>
            <div className="status-bar">
              <div className="stat-chip"><span style={{color:"var(--heart)"}}>♥</span>{hassanates.toLocaleString()}</div>
              <div className="stat-chip"><span className="fire">🔥</span>{streak}j</div>
              <div className="stat-chip">⏱️ {readingMins} min</div>
              {isPremium
                ? <span style={{fontSize:12,fontWeight:700,color:"var(--gold)"}}>★ Gold</span>
                : <button onClick={openPremium} style={{background:"linear-gradient(135deg,#C49A3C,#E8C060)",border:"none",borderRadius:999,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:700,color:"#fff"}}>★ Premium</button>}
              <button onClick={()=>setDark(!dark)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18}}>{dark?"☀️":"🌙"}</button>
            </div>
          </div>
        )}

        {!reader && !showPremium && tab==="home"     && <HomeScreen hassanates={hassanates} streak={streak} readingMins={readingMins} onStart={handleStart} />}
        {!reader && !showPremium && tab==="quran"    && <QuranScreen onOpen={s => setReader({ surah:s, verseId:1 })} />}
        {!reader && !showPremium && tab==="dhikr"    && <DhikrScreen onAddH={addH} toast={showToast} />}
        {!reader && !showPremium && tab==="serenite" && <SereniteScreen />}
        {!reader && !showPremium && tab==="profil"   && (
          <ProfilScreen hassanates={hassanates} streak={streak} readingMins={readingMins}
            goalMins={goalMins} setGoalMins={setGoalMins}
            onOpenPremium={openPremium} isPremium={isPremium}
            fontSizes={fontSizes} setFontSizes={setFontSizes}
            savedVerses={savedVerses} setSavedVerses={setSavedVerses}
          />
        )}

        {reader && (
          <VerseReader
            surah={reader.surah}
            initialVerseId={reader.verseId}
            onClose={() => setReader(null)}
            onGoHome={goHome}
            onAddH={addH}
            notes={notes} setNotes={setNotes}
            goalSecs={goalMins * 60}
            onTimeSpent={s => setReadingMins(m => m + Math.round(s / 60))}
            savedVerses={savedVerses} setSavedVerses={setSavedVerses}
            fontSizes={fontSizes}
          />
        )}

        {showPremium && (
          <PremiumPage
            onClose={() => setShowPremium(false)}
            onActivate={() => { setIsPremium(true); showToast("★ Premium Gold activé !"); }}
          />
        )}

        {toast && <div className="toast">{toast}</div>}

        {!reader && !showPremium && (
          <nav className="nav-bar">
            {nav.map(it => (
              <div key={it.id} className={`nav-item${tab===it.id?" active":""}`} onClick={() => setTab(it.id)}>
                <span style={{fontSize:22}}>{it.icon}</span>
                <span className="nav-lbl">{it.label}</span>
              </div>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
