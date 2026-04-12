import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────
STYLES
───────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Nunito:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap');

    :root {
      --bg-from:#EEE9FF; --bg-to:#E0EDFF;
      --glass:rgba(255,255,255,0.65); --glass-b:rgba(255,255,255,0.9);
      --border:rgba(255,255,255,0.6); --border-s:rgba(0,0,0,0.07);
      --emerald:#2A7A5A; --emerald-l:#3DAA7F; --emerald-glow:rgba(42,122,90,0.13);
      --mint:#A8EED4; --gold:#C49A3C; --heart:#E06B8B;
      --ink:#1C1C2E; --ink-s:#4A4A6A; --ink-m:#9090B0;
      --card:rgba(255,255,255,0.72); --shadow:0 4px 24px rgba(80,60,180,0.10);
      --shadow-l:0 8px 32px rgba(80,60,180,0.16);
    }
    .dark {
      --bg-from:#0D0E1C; --bg-to:#121828;
      --glass:rgba(22,26,44,0.80); --glass-b:rgba(28,32,52,0.95);
      --border:rgba(255,255,255,0.08); --border-s:rgba(255,255,255,0.06);
      --emerald:#3DAA7F; --emerald-l:#5BCCA0; --emerald-glow:rgba(61,170,127,0.12);
      --mint:#2A6E55; --gold:#D4AA62; --heart:#F08CA8;
      --ink:#E8E4F8; --ink-s:#A8A4C8; --ink-m:#6A6888;
      --card:rgba(28,32,52,0.82); --shadow:0 4px 24px rgba(0,0,0,0.30);
      --shadow-l:0 8px 32px rgba(0,0,0,0.40);
    }

    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;}
    body{font-family:'Nunito',sans-serif;overflow:hidden;background:var(--bg-from);}
    .app{
      max-width:430px;margin:0 auto;height:100svh;
      background:linear-gradient(160deg,var(--bg-from),var(--bg-to));
      position:relative;display:flex;flex-direction:column;overflow:hidden;
    }
    ::-webkit-scrollbar{width:0;}
    .arabic{font-family:'Amiri',serif;direction:rtl;}
    .serif{font-family:'Playfair Display',serif;}

    .card{
      background:var(--card);border-radius:20px;
      border:1px solid var(--border);box-shadow:var(--shadow);
      backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    }
    .pill{display:inline-flex;align-items:center;gap:5px;background:var(--emerald-glow);color:var(--emerald);border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;border:1px solid rgba(61,170,127,0.2);}

    .nav-bar{background:var(--glass-b);border-top:1px solid var(--border-s);display:flex;justify-content:space-around;align-items:center;padding:8px 0 20px;flex-shrink:0;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);}
    .nav-item{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:6px 14px;border-radius:14px;transition:all 0.2s;}
    .nav-item.active{background:var(--emerald-glow);}
    .nav-lbl{font-size:10px;font-weight:700;color:var(--ink-m);}
    .nav-item.active .nav-lbl{color:var(--emerald);}

    .status-bar{
      margin:8px 16px 0;padding:8px 16px;
      background:var(--card);border-radius:99px;
      border:1px solid var(--border);box-shadow:var(--shadow);
      display:flex;justify-content:space-between;align-items:center;
      backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
      flex-shrink:0;
    }
    .stat-chip{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:var(--ink-s);}

    @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
    .fu{animation:fadeUp 0.35s ease both;}
    @keyframes flicker{0%,100%{transform:scale(1) rotate(-2deg);}50%{transform:scale(1.1) rotate(2deg);}}
    .fire{animation:flicker 1.4s ease-in-out infinite;display:inline-block;}
    @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
    .toast{position:fixed;bottom:88px;left:50%;transform:translateX(-50%);background:var(--emerald);color:#fff;padding:9px 18px;border-radius:999px;font-size:13px;font-weight:700;animation:toastIn 0.25s ease;z-index:300;white-space:nowrap;box-shadow:0 4px 18px rgba(42,122,90,0.4);}
    @keyframes heartPop{0%{opacity:0;transform:scale(0.5);}20%{opacity:1;transform:scale(1.2);}80%{opacity:1;transform:scale(1);}100%{opacity:0;transform:scale(0.8) translateY(-8px);}}
    .hpop{position:absolute;top:12px;right:16px;font-size:15px;font-weight:800;color:var(--heart);animation:heartPop 1s ease forwards;pointer-events:none;z-index:50;}
    @keyframes bump{0%,100%{transform:scale(1);}50%{transform:scale(1.2);}}
    .bump{animation:bump 0.18s ease;}

    @keyframes sheetIn{from{transform:translateY(100%);}to{transform:translateY(0);}}
    .sheet-ov{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:200;backdrop-filter:blur(4px);}
    .sheet{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--glass-b);border-radius:24px 24px 0 0;padding:18px 20px 44px;z-index:201;animation:sheetIn 0.26s cubic-bezier(0.4,0,0.2,1);border-top:1px solid var(--border);}
    .sheet-handle{width:40px;height:4px;background:var(--border-s);border-radius:999px;margin:0 auto 16px;}

    .vslide{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 28px;transition:transform 0.3s cubic-bezier(0.4,0,0.2,1),opacity 0.3s ease;}
    .vs-in{transform:translateX(0);opacity:1;}
    .vs-out-l{transform:translateX(-100%);opacity:0;}
    .vs-out-r{transform:translateX(100%);opacity:0;}

    .dot{width:6px;height:6px;border-radius:50%;transition:all 0.25s;cursor:pointer;}

    .tab-bar{display:flex;background:rgba(0,0,0,0.05);border-radius:12px;padding:3px;gap:3px;}
    .tab{flex:1;padding:7px;border-radius:9px;border:none;cursor:pointer;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;transition:all 0.2s;background:transparent;color:var(--ink-m);}
    .tab.active{background:var(--card);color:var(--emerald);box-shadow:var(--shadow);}

    textarea{font-family:'Nunito',sans-serif;font-size:13px;line-height:1.6;background:rgba(0,0,0,0.04);border:1px solid var(--border-s);border-radius:12px;padding:11px;width:100%;color:var(--ink);resize:none;outline:none;transition:border 0.2s;user-select:text;}
    textarea:focus{border-color:var(--emerald);}
    button{font-family:'Nunito',sans-serif;}

    .dhikr-btn{width:54px;height:54px;border-radius:50%;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:all 0.2s;font-family:'Nunito',sans-serif;}

    .cat-chip{padding:8px 18px;border-radius:99px;border:1.5px solid var(--border-s);background:var(--card);cursor:pointer;font-size:13px;font-weight:700;color:var(--ink-s);white-space:nowrap;transition:all 0.2s;}
    .cat-chip.active{background:var(--emerald);color:#fff;border-color:var(--emerald);}

    .wday{width:36px;height:36px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;flex-shrink:0;}
    .wday.today{background:var(--emerald);color:#fff;box-shadow:0 4px 14px rgba(42,122,90,0.35);}
    .wday.done{background:var(--emerald-glow);}
    .wdot{width:5px;height:5px;border-radius:50%;margin-top:2px;}

    .goal-card{border-radius:22px;padding:22px;background:linear-gradient(135deg,#2A7A5A,#3DAA7F);color:#fff;position:relative;overflow:hidden;}
    .goal-card::before{content:'';position:absolute;top:-30px;right:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.1);}

    .stat-card{background:var(--card);border-radius:16px;padding:14px;border:1px solid var(--border);flex:1;}

    .reader{position:fixed;inset:0;z-index:200;max-width:430px;margin:0 auto;display:flex;flex-direction:column;background:linear-gradient(160deg,var(--bg-from),var(--bg-to));}

    @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}};
    .spin{animation:spin 1s linear infinite;display:inline-block;}
  `}</style>
);

/* ─────────────────────────────────────────
DATA & API
───────────────────────────────────────── */
const USER = { name: "Youssef", avatar: "🌿" };

const API_BASE = "https://api.alquran.cloud/v1";
const RECITER  = "ar.alafasy";
const TRANS    = "fr.hamidullah";

// ── Hook : 114 sourates ──
function useSurahs() {
  const [surahs,  setSurahs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/surah`)
      .then(r => r.json())
      .then(d => {
        setSurahs(d.data.map(s => ({
          id:     s.number,
          name:   s.englishName,
          arabic: s.name,
          verses: s.numberOfAyahs,
          rev:    s.revelationType === "Meccan" ? "Mecquoise" : "Medinoise",
        })));
        setLoading(false);
      })
      .catch(e => { setError(e); setLoading(false); });
  }, []);

  return { surahs, loading, error };
}

// ── Hook : versets d'une sourate avec audio + traduction ──
function useSurahVerses(surahId) {
  const [verses,  setVerses]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!surahId) return;
    setLoading(true);
    setVerses([]);
    setError(null);

    Promise.all([
      fetch(`${API_BASE}/surah/${surahId}/${RECITER}`).then(r => {
        if (!r.ok) throw new Error("Erreur API arabe");
        return r.json();
      }),
      fetch(`${API_BASE}/surah/${surahId}/${TRANS}`).then(r => {
        if (!r.ok) throw new Error("Erreur API traduction");
        return r.json();
      }),
    ])
      .then(([ar, fr]) => {
        if (!ar.data?.ayahs?.length) throw new Error("Données vides");
        const merged = ar.data.ayahs.map((a, i) => ({
          id:       a.numberInSurah,
          arabic:   a.text,
          audioUrl: a.audio,
          fr:       fr.data?.ayahs?.[i]?.text || "",
        }));
        setVerses(merged);
        setLoading(false);
      })
      .catch(e => {
        console.error("API error:", e);
        setError(e);
        setLoading(false);
      });
  }, [surahId]);

  return { verses, loading, error };
}

// ── Hook : Tafsir Ibn Kathir via quran.com API v4 ──
// L'édition 169 = Ibn Kathir (en anglais, la seule disponible gratuitement en ligne)
function useTafsir(surahId, verseNumber, enabled) {
  const [tafsir,  setTafsir]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!enabled || !surahId || !verseNumber) return;
    setLoading(true);
    setTafsir(null);
    setError(null);

    fetch(`https://api.quran.com/api/v4/tafsirs/169/by_ayah/${surahId}:${verseNumber}`)
      .then(r => {
        if (!r.ok) throw new Error("Erreur API Tafsir");
        return r.json();
      })
      .then(d => {
        // Le texte retourné contient du HTML — on le nettoie
        const raw   = d.tafsir?.text || "";
        const clean = raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        setTafsir(clean || "Tafsir non disponible pour ce verset.");
        setLoading(false);
      })
      .catch(e => {
        console.error("Tafsir error:", e);
        setError(e);
        setLoading(false);
      });
  }, [surahId, verseNumber, enabled]);

  return { tafsir, loading, error };
}

const DHIKR_DB = {
  Matin: [
    {id:1,arabic:"\u0623\u0635\u0628\u062D\u0646\u0627 \u0648\u0623\u0635\u0628\u062D \u0627\u0644\u0645\u0644\u0643 \u0644\u0644\u0647",phonetic:"Asbahna wa asbaha l-mulku lillah",fr:"Nous entrons au matin et le Royaume appartient à Allah.",source:"Abou Dawoud",count:1,h:10},
    {id:2,arabic:"\u0633\u0628\u062D\u0627\u0646 \u0627\u0644\u0644\u0647 \u0648\u0628\u062D\u0645\u062F\u0647",phonetic:"Subhana llahi wa bihamdih",fr:"Gloire à Allah et louange à Lui.",source:"Mouslim",count:100,h:100},
    {id:3,arabic:"\u0627\u0644\u0644\u0647\u0645 \u0628\u0643 \u0623\u0635\u0628\u062D\u0646\u0627",phonetic:"Allahumma bika asbahna",fr:"Ô Allah, c'est grâce à Toi que nous entrons dans le matin.",source:"Abou Dawoud",count:1,h:10},
    {id:4,arabic:"\u0623\u0639\u0648\u0630 \u0628\u0627\u0644\u0644\u0647 \u0645\u0646 \u0627\u0644\u0634\u064A\u0637\u0627\u0646 \u0627\u0644\u0631\u062C\u064A\u0645",phonetic:"A'udhu billahi mina sh-shaytani r-rajim",fr:"Je cherche la protection d'Allah contre le Shaytan maudit.",source:"Abou Dawoud",count:3,h:30},
  ],
  Soir: [
    {id:5,arabic:"\u0623\u0645\u0633\u064A\u0646\u0627 \u0648\u0623\u0645\u0633\u0649 \u0627\u0644\u0645\u0644\u0643 \u0644\u0644\u0647",phonetic:"Amsayna wa amsa l-mulku lillah",fr:"Nous entrons dans le soir et le Royaume appartient à Allah.",source:"Abou Dawoud",count:1,h:10},
    {id:6,arabic:"\u0627\u0644\u0644\u0647\u0645 \u0628\u0643 \u0623\u0645\u0633\u064A\u0646\u0627",phonetic:"Allahumma bika amsayna",fr:"Ô Allah, c'est grâce à Toi que nous entrons dans le soir.",source:"Abou Dawoud",count:1,h:10},
    {id:7,arabic:"\u062D\u0633\u0628\u064A \u0627\u0644\u0644\u0647 \u0644\u0627 \u0625\u0644\u0647 \u0625\u0644\u0627 \u0647\u0648",phonetic:"Hasbiya llahu la ilaha illa hu",fr:"Allah me suffit, il n'y a de divinité que Lui.",source:"Abou Dawoud",count:7,h:70},
  ],
  Protection: [
    {id:8,arabic:"\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0630\u064A \u0644\u0627 \u064A\u0636\u0631 \u0645\u0639 \u0627\u0633\u0645\u0647 \u0634\u064A\u0621",phonetic:"Bismi llahi lladhi la yadurru ma'a smihi shay'",fr:"Au nom d'Allah avec lequel rien ne peut nuire.",source:"Abou Dawoud, Tirmizi",count:3,h:30},
    {id:9,arabic:"\u0622\u064A\u0629 \u0627\u0644\u0643\u0631\u0633\u064A",phonetic:"Ayatu l-kursi",fr:"Le verset du Trône (Al-Baqara 2:255) — protège de tout mal.",source:"Bukhari",count:1,h:50},
    {id:10,arabic:"\u0642\u0644 \u0647\u0648 \u0627\u0644\u0644\u0647 \u0623\u062D\u062F",phonetic:"Qul huwa llahu ahad",fr:"Dis : Il est Allah, l'Unique. (Al-Ikhlas)",source:"Bukhari",count:3,h:30},
  ],
  Sommeil: [
    {id:11,arabic:"\u0628\u0627\u0633\u0645\u0643 \u0627\u0644\u0644\u0647\u0645 \u0623\u0645\u0648\u062A \u0648\u0623\u062D\u064A\u0627",phonetic:"Bismika llahumma amutu wa ahya",fr:"En Ton nom, ô Allah, je meurs et je vis.",source:"Bukhari",count:1,h:10},
    {id:12,arabic:"\u0633\u0628\u062D\u0627\u0646 \u0627\u0644\u0644\u0647 33x | \u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647 33x | \u0627\u0644\u0644\u0647 \u0623\u0643\u0628\u0631 34x",phonetic:"Subhanallah 33x · Alhamdulillah 33x · Allahu Akbar 34x",fr:"Le Tasbih de Fatima — récite avant de dormir.",source:"Bukhari, Mouslim",count:1,h:100},
  ],
  Priere: [
    {id:13,arabic:"\u0631\u0628 \u0627\u063A\u0641\u0631 \u0644\u064A \u0648\u0644\u0648\u0627\u0644\u062F\u064A",phonetic:"Rabbi ghfir li wa liwaalidayya",fr:"Seigneur, pardonne-moi ainsi qu'à mes parents.",source:"Coran 71:28",count:3,h:30},
    {id:14,arabic:"\u0631\u0628\u0646\u0627 \u0622\u062A\u0646\u0627 \u0641\u064A \u0627\u0644\u062F\u0646\u064A\u0627 \u062D\u0633\u0646\u0629",phonetic:"Rabbana atina fi d-dunya hasanatan",fr:"Seigneur, accorde-nous ce qui est bon en ce monde et dans l'au-delà.",source:"Coran 2:201",count:1,h:10},
  ],
};

const AYAH_DU_JOUR = {
  arabic: "\u0648\u0645\u0646 \u064A\u062A\u0642 \u0627\u0644\u0644\u0647 \u064A\u062C\u0639\u0644 \u0644\u0647 \u0645\u062E\u0631\u062C\u0627",
  fr: "Celui qui craint Allah, Il lui accordera une issue favorable.",
  ref: "At-Talaq 65:2"
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
VERSE READER
───────────────────────────────────────── */
function VerseReader({ surah, onClose, onAddH, notes, setNotes, goalSecs, onTimeSpent, isPremium, onOpenPremium }) {
  const { verses, loading, error } = useSurahVerses(surah.id);

  const [idx,        setIdx]        = useState(0);
  const [cls,        setCls]        = useState("vs-in");
  const [readSet,    setReadSet]    = useState(new Set());
  const [showPop,    setShowPop]    = useState(false);
  const [hCount,     setHCount]     = useState(0);
  const [sheet,      setSheet]      = useState(null);
  const [noteText,   setNoteText]   = useState("");
  const [phonetic,   setPhonetic]   = useState(false);
  const [fs,         setFs]         = useState(28);
  const [elapsed,    setElapsed]    = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const audioRef = useRef(null);
  const anim     = useRef(false);
  const touchX   = useRef(null);
  const timerRef = useRef(null);

  // Tafsir — on le charge seulement quand le sheet tafsir est ouvert
  const tafsirEnabled = sheet === "tafsir" && isPremium;
  const v = verses[idx];
  const { tafsir: tafsirText, loading: tafsirLoading, error: tafsirError } = useTafsir(
    surah.id,
    v?.id,
    tafsirEnabled
  );

  const total     = verses.length;
  const remaining = Math.max(0, goalSecs - elapsed);
  const pct       = Math.min(1, elapsed / goalSecs);

  useEffect(() => {
    if (!loading && verses.length > 0) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [loading, verses.length]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setAudioPlaying(false);
    }
    if (v) setNoteText(notes[`${surah.id}-${v.id}`] || "");
  }, [idx]);

  const vibrate = () => { if (navigator.vibrate) navigator.vibrate(40); };

  const toggleAudio = () => {
    if (!v?.audioUrl) return;
    if (audioRef.current) {
      if (audioPlaying) { audioRef.current.pause(); setAudioPlaying(false); }
      else { audioRef.current.play(); setAudioPlaying(true); }
      return;
    }
    setAudioLoading(true);
    const audio = new Audio(v.audioUrl);
    audioRef.current = audio;
    audio.oncanplay = () => { setAudioLoading(false); audio.play(); setAudioPlaying(true); };
    audio.onended   = () => setAudioPlaying(false);
    audio.onerror   = () => { setAudioLoading(false); setAudioPlaying(false); };
  };

  const goTo = (next, dir) => {
    if (anim.current || next < 0 || next >= total) return;
    anim.current = true;
    vibrate();
    setCls(dir === "l" ? "vs-out-l" : "vs-out-r");
    setTimeout(() => {
      setIdx(next);
      setSheet(null); // ferme le sheet au changement de verset
      setCls(dir === "l" ? "vs-out-r" : "vs-out-l");
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setCls("vs-in");
        anim.current = false;
      }));
      if (dir === "l" && !readSet.has(idx)) {
        setReadSet(p => new Set([...p, idx]));
        onAddH(10);
        setHCount(c => c + 10);
        setShowPop(true);
        setTimeout(() => setShowPop(false), 900);
      }
    }, 280);
  };

  const markDone = () => {
    if (!readSet.has(idx)) { onAddH(10); setHCount(c => c + 10); }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    clearInterval(timerRef.current);
    onTimeSpent(elapsed);
    onClose();
  };

  const onTS = e => { touchX.current = e.touches[0].clientX; };
  const onTE = e => {
    if (!touchX.current) return;
    const dx = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 44) dx > 0 ? goTo(idx + 1, "l") : goTo(idx - 1, "r");
    touchX.current = null;
  };

  const saveNote = () => {
    setNotes(p => ({ ...p, [`${surah.id}-${v.id}`]: noteText }));
    setSheet(null);
  };

  const APP_TAG   = "Hassanates — Compagnon spirituel";
  const shareText = v ? `${v.arabic}\n\n${v.fr}\n\n— ${surah.name} ${surah.id}:${v.id}\n\n${APP_TAG}` : "";
  const share = () => {
    if (navigator.share) navigator.share({ title: `${surah.name} — Verset ${v.id}`, text: shareText });
    else navigator.clipboard?.writeText(shareText);
    setSheet(null);
  };

  // ── LOADING ──
  if (loading) return (
    <div className="reader" style={{ alignItems:"center", justifyContent:"center", gap:16 }}>
      <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--emerald-glow)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>📖</div>
      <p style={{ fontSize:14, color:"var(--ink-m)", fontWeight:600 }}>Chargement de {surah.name}...</p>
      <div style={{ width:200, height:4, borderRadius:999, background:"var(--border-s)", overflow:"hidden" }}>
        <div style={{ width:"60%", height:"100%", background:"var(--emerald)", borderRadius:999, animation:"loadBar 1.2s ease-in-out infinite" }} />
      </div>
      <button onClick={() => { clearInterval(timerRef.current); onClose(); }}
        style={{ marginTop:8, background:"none", border:"none", cursor:"pointer", color:"var(--ink-m)", fontSize:13, fontWeight:600, fontFamily:"'Nunito',sans-serif" }}>
        ← Retour
      </button>
      <style>{`@keyframes loadBar{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}`}</style>
    </div>
  );

  if (error || !v) return (
    <div className="reader" style={{ alignItems:"center", justifyContent:"center", gap:12 }}>
      <p style={{ fontSize:28 }}>⚠️</p>
      <p style={{ fontSize:14, color:"var(--ink-m)" }}>Erreur de chargement</p>
      <button onClick={() => { clearInterval(timerRef.current); onClose(); }}
        style={{ background:"var(--emerald)", color:"#fff", border:"none", borderRadius:12, padding:"10px 20px", cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontWeight:700 }}>
        ← Retour
      </button>
    </div>
  );

  return (
    <div className="reader" onTouchStart={onTS} onTouchEnd={onTE}>
      {/* Header */}
      <div style={{ padding:"48px 18px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <button onClick={markDone} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:"var(--ink-s)" }}>←</button>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:13, fontWeight:700, color:"var(--emerald)" }}>{surah.name}</p>
          <p style={{ fontSize:11, color:"var(--ink-m)" }}>{v.id} / {total}</p>
          {hCount > 0 && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(224,107,139,0.12)", border:"1px solid rgba(224,107,139,0.25)", borderRadius:999, padding:"2px 9px", marginTop:3 }}>
              <span style={{ fontSize:11, fontWeight:800, color:"var(--heart)" }}>+{hCount} ♥</span>
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setPhonetic(!phonetic)}
            style={{ background: phonetic ? "var(--emerald-glow)" : "rgba(0,0,0,0.05)", border:"1px solid " + (phonetic ? "rgba(61,170,127,0.3)" : "var(--border-s)"), color: phonetic ? "var(--emerald)" : "var(--ink-m)", borderRadius:8, padding:"4px 9px", cursor:"pointer", fontSize:11, fontWeight:700 }}>
            Ph
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:3, background:"rgba(0,0,0,0.05)", borderRadius:8, padding:"3px 7px", border:"1px solid var(--border-s)" }}>
            <button onClick={() => setFs(f => Math.max(18, f-2))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:15, color:"var(--ink-s)" }}>-</button>
            <span style={{ fontSize:9, color:"var(--ink-m)", fontWeight:700 }}>Aa</span>
            <button onClick={() => setFs(f => Math.min(42, f+2))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:15, color:"var(--ink-s)" }}>+</button>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ margin:"0 18px 10px", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontSize:11, color:"var(--ink-m)", fontWeight:600 }}>Objectif session</span>
          <span style={{ fontSize:11, color: remaining === 0 ? "var(--gold)" : "var(--emerald)", fontWeight:700 }}>
            {remaining === 0 ? "Objectif atteint !" : fmtTime(remaining)}
          </span>
        </div>
        <div style={{ background:"rgba(0,0,0,0.06)", borderRadius:999, height:5, overflow:"hidden" }}>
          <div style={{ width:`${pct * 100}%`, height:"100%", background: pct >= 1 ? "var(--gold)" : "linear-gradient(90deg,var(--emerald),var(--emerald-l))", borderRadius:999, transition:"width 1s linear" }} />
        </div>
      </div>

      {/* Zone verset */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <div className={`vslide ${cls}`}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:"var(--emerald-glow)", border:"2px solid rgba(61,170,127,0.25)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:22, flexShrink:0 }}>
            <span style={{ fontSize:13, fontWeight:800, color:"var(--emerald)" }}>{v.id}</span>
          </div>
          <p className="arabic" style={{ fontSize:fs, lineHeight:2.4, textAlign:"center", color:"var(--ink)", marginBottom:20 }}>{v.arabic}</p>
          <div style={{ display:"flex", alignItems:"center", gap:12, width:"100%", marginBottom:18 }}>
            <div style={{ flex:1, height:1, background:"var(--border-s)" }} />
            <span style={{ color:"var(--gold)", fontSize:13 }}>✦</span>
            <div style={{ flex:1, height:1, background:"var(--border-s)" }} />
          </div>
          {phonetic && <p style={{ fontSize:12, color:"var(--ink-m)", fontStyle:"italic", textAlign:"center", lineHeight:1.8, marginBottom:14 }}>{v.phonetic || ""}</p>}
          <p style={{ fontSize:15, color:"var(--ink-s)", lineHeight:1.9, textAlign:"center" }}>{v.fr}</p>
          {notes[`${surah.id}-${v.id}`] && (
            <div style={{ marginTop:18, background:"var(--emerald-glow)", borderRadius:12, padding:"9px 14px", border:"1px solid rgba(61,170,127,0.2)" }}>
              <p style={{ fontSize:12, color:"var(--emerald)", fontWeight:600 }}>📝 {notes[`${surah.id}-${v.id}`]}</p>
            </div>
          )}
        </div>
        {showPop && <div className="hpop">+10 ♥</div>}
      </div>

      {/* Dots */}
      <div style={{ display:"flex", gap:5, justifyContent:"center", padding:"8px 0 6px", flexShrink:0, overflowX:"auto" }}>
        {verses.slice(0, 20).map((_, i) => (
          <div key={i} className="dot" onClick={() => goTo(i, i > idx ? "l" : "r")}
            style={{ background: i === idx ? "var(--emerald)" : readSet.has(i) ? "var(--emerald-l)" : "rgba(0,0,0,0.12)", width: i === idx ? 20 : 6 }} />
        ))}
        {verses.length > 20 && <span style={{ fontSize:10, color:"var(--ink-m)", alignSelf:"center" }}>...</span>}
      </div>

      {/* Boutons d'action */}
      <div style={{ padding:"6px 16px", display:"flex", gap:8, flexShrink:0 }}>
        <button onClick={toggleAudio}
          style={{ flex:1, background: audioPlaying ? "var(--emerald-glow)" : "var(--card)", border:`1px solid ${audioPlaying ? "rgba(42,122,90,0.4)" : "var(--border)"}`, borderRadius:13, padding:"11px 0", cursor:"pointer", fontSize:13, fontWeight:700, color: audioPlaying ? "var(--emerald)" : "var(--ink-s)", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
          {audioLoading ? "⏳" : audioPlaying ? "⏸ Stop" : "▶ Écouter"}
        </button>
        <button onClick={() => setSheet("note")}
          style={{ flex:1, background:"var(--card)", border:"1px solid var(--border)", borderRadius:13, padding:"11px 0", cursor:"pointer", fontSize:13, fontWeight:700, color:"var(--ink-s)", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
          ✏️ Note
        </button>
        <button onClick={() => setSheet("tafsir")}
          style={{ flex:1, background:"linear-gradient(135deg,rgba(196,154,60,0.15),rgba(196,154,60,0.08))", border:"1px solid rgba(196,154,60,0.35)", borderRadius:13, padding:"11px 0", cursor:"pointer", fontSize:13, fontWeight:700, color:"var(--gold)", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
          📖 Tafsir
        </button>
        <button onClick={() => setSheet("share")}
          style={{ flex:1, background:"var(--card)", border:"1px solid var(--border)", borderRadius:13, padding:"11px 0", cursor:"pointer", fontSize:13, fontWeight:700, color:"var(--ink-s)", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
          🔗
        </button>
      </div>

      {/* Navigation bas */}
      <div style={{ padding:"6px 18px 32px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={() => goTo(idx - 1, "r")} disabled={idx === 0}
          style={{ width:50, height:50, borderRadius:"50%", border:"1px solid var(--border)", background:"var(--card)", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1, fontSize:19, color:"var(--ink-s)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"var(--shadow)" }}>
          ←
        </button>
        <button onClick={markDone}
          style={{ flex:1, height:50, borderRadius:16, border:"none", background:"linear-gradient(135deg,#2A7A5A,#3DAA7F)", color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", boxShadow:"0 4px 18px rgba(42,122,90,0.4)", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          J'ai fini ✓
        </button>
        <button onClick={() => goTo(idx + 1, "l")} disabled={idx === total - 1}
          style={{ width:50, height:50, borderRadius:"50%", border:"none", background: idx === total-1 ? "rgba(0,0,0,0.06)" : "var(--emerald)", cursor: idx === total-1 ? "default" : "pointer", opacity: idx === total-1 ? 0.3 : 1, fontSize:19, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", boxShadow: idx === total-1 ? "none" : "0 4px 14px rgba(42,122,90,0.35)" }}>
          →
        </button>
      </div>

      {/* ── SHEET TAFSIR ── */}
      {sheet === "tafsir" && (
        <Sheet onClose={() => setSheet(null)}>
          {isPremium ? (
            <>
              {/* En-tête */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#C49A3C,#E8C060)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📖</div>
                <div>
                  <p style={{ fontSize:15, fontWeight:800, color:"var(--ink)" }}>Tafsir Ibn Kathir</p>
                  <p style={{ fontSize:11, color:"var(--gold)", fontWeight:700 }}>★ Premium · En anglais</p>
                </div>
              </div>

              {/* Référence + verset arabe */}
              <p style={{ fontSize:12, color:"var(--ink-m)", marginBottom:8 }}>{surah.name} — Verset {v.id}</p>
              <p className="arabic" style={{ fontSize:19, textAlign:"right", lineHeight:2, color:"var(--emerald)", marginBottom:14 }}>{v.arabic}</p>

              {/* Contenu Tafsir */}
              <div style={{ background:"rgba(0,0,0,0.03)", borderRadius:14, padding:"14px", border:"1px solid var(--border-s)", maxHeight:260, overflowY:"auto" }}>
                {tafsirLoading && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"20px 0" }}>
                    <span className="spin" style={{ fontSize:22 }}>⏳</span>
                    <p style={{ fontSize:13, color:"var(--ink-m)", fontWeight:600 }}>Chargement du Tafsir...</p>
                  </div>
                )}
                {tafsirError && !tafsirLoading && (
                  <div style={{ textAlign:"center", padding:"16px 0" }}>
                    <p style={{ fontSize:20, marginBottom:8 }}>⚠️</p>
                    <p style={{ fontSize:13, color:"var(--ink-m)" }}>Impossible de charger le Tafsir.</p>
                    <p style={{ fontSize:11, color:"var(--ink-m)", marginTop:4 }}>Vérifiez votre connexion internet.</p>
                  </div>
                )}
                {tafsirText && !tafsirLoading && (
                  <p style={{ fontSize:13, color:"var(--ink-s)", lineHeight:1.9 }}>
                    {tafsirText}
                  </p>
                )}
              </div>

              {/* Source */}
              <p style={{ fontSize:10, color:"var(--ink-m)", marginTop:10, textAlign:"right" }}>
                Source : Ibn Kathir · quran.com
              </p>

              {/* Note sur la langue */}
              <div style={{ marginTop:10, background:"rgba(196,154,60,0.08)", borderRadius:10, padding:"8px 12px", border:"1px solid rgba(196,154,60,0.2)" }}>
                <p style={{ fontSize:11, color:"var(--gold)", fontWeight:600 }}>
                  ℹ️ Le Tafsir est en anglais — la seule version disponible gratuitement en ligne. Une traduction française sera ajoutée prochainement.
                </p>
              </div>
            </>
          ) : (
            /* ── Verrouillé (non premium) ── */
            <>
              <div style={{ background:"linear-gradient(135deg,rgba(124,106,232,0.15),rgba(196,154,60,0.1))", borderRadius:20, padding:"24px", marginBottom:18, border:"1px solid rgba(196,154,60,0.25)", textAlign:"center", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:"rgba(196,154,60,0.12)" }} />
                <div style={{ position:"absolute", bottom:-15, left:-15, width:60, height:60, borderRadius:"50%", background:"rgba(124,106,232,0.1)" }} />
                <div style={{ fontSize:44, marginBottom:12 }}>🔒</div>
                <p style={{ fontSize:17, fontWeight:800, color:"var(--ink)", marginBottom:6, fontFamily:"'Playfair Display',serif" }}>Tafsir Ibn Kathir</p>
                <p style={{ fontSize:12, color:"var(--ink-s)", lineHeight:1.7, marginBottom:16 }}>
                  Accès à l'explication complète de chaque verset par l'un des plus grands savants de l'Islam.<br/>
                  <span style={{ color:"var(--gold)", fontWeight:700 }}>Fonctionnalité Premium ★</span>
                </p>
                <div style={{ background:"rgba(0,0,0,0.04)", borderRadius:12, padding:"12px", border:"1px solid var(--border-s)", filter:"blur(3px)", userSelect:"none", marginBottom:16 }}>
                  <p style={{ fontSize:12, color:"var(--ink-s)", lineHeight:1.7 }}>
                    Ibn Kathir dit à propos de ce verset : Allah le Très-Haut nous enseigne ici l'une des plus grandes vérités de la foi...
                  </p>
                </div>
                <button onClick={() => { setSheet(null); onOpenPremium(); }}
                  style={{ width:"100%", background:"linear-gradient(135deg,#C49A3C,#E8C060)", color:"#fff", border:"none", borderRadius:14, padding:"14px", cursor:"pointer", fontSize:14, fontWeight:800, boxShadow:"0 4px 20px rgba(196,154,60,0.45)" }}>
                  ✨ Devenir Premium
                </button>
              </div>
              <p style={{ fontSize:11, color:"var(--ink-m)", textAlign:"center" }}>7 jours d'essai gratuit · Sans engagement</p>
            </>
          )}
        </Sheet>
      )}

      {/* ── SHEET NOTE ── */}
      {sheet === "note" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3 style={{ fontSize:17, marginBottom:4, color:"var(--ink)" }}>Note privée</h3>
          <p style={{ fontSize:12, color:"var(--ink-m)", marginBottom:12 }}>{surah.name} — Verset {v.id}</p>
          <p className="arabic" style={{ fontSize:20, textAlign:"right", lineHeight:2, marginBottom:12, color:"var(--emerald)" }}>{v.arabic}</p>
          <textarea rows={4} placeholder="Réflexion, mémorisation, sens personnel..." value={noteText} onChange={e => setNoteText(e.target.value)} />
          <button onClick={saveNote} style={{ marginTop:10, width:"100%", background:"var(--emerald)", color:"#fff", border:"none", borderRadius:13, padding:"13px", cursor:"pointer", fontSize:14, fontWeight:700 }}>Sauvegarder ✓</button>
        </Sheet>
      )}

      {/* ── SHEET PARTAGE ── */}
      {sheet === "share" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3 style={{ fontSize:17, marginBottom:12, color:"var(--ink)" }}>Partager ce verset</h3>
          <div style={{ background:"rgba(0,0,0,0.04)", borderRadius:14, padding:"16px", marginBottom:12, border:"1px solid var(--border-s)" }}>
            <p className="arabic" style={{ fontSize:20, textAlign:"right", lineHeight:2, marginBottom:10, color:"var(--ink)" }}>{v.arabic}</p>
            <div style={{ height:1, background:"var(--border-s)", marginBottom:10 }} />
            <p style={{ fontSize:13, color:"var(--ink-s)", lineHeight:1.7, fontStyle:"italic" }}>{v.fr}</p>
            <p style={{ fontSize:11, color:"var(--ink-m)", marginTop:8, textAlign:"right" }}>— {surah.name} {surah.id}:{v.id}</p>
            <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid var(--border-s)", display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:20, height:20, borderRadius:6, background:"var(--emerald)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>☽</div>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--emerald)" }}>Hassanates</span>
              <span style={{ fontSize:10, color:"var(--ink-m)" }}>— Compagnon spirituel</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={share} style={{ flex:1, background:"var(--emerald)", color:"#fff", border:"none", borderRadius:13, padding:"13px", cursor:"pointer", fontSize:13, fontWeight:700 }}>📤 Partager</button>
            <button onClick={() => { navigator.clipboard?.writeText(shareText); setSheet(null); }} style={{ flex:1, background:"rgba(0,0,0,0.05)", color:"var(--ink-s)", border:"1px solid var(--border-s)", borderRadius:13, padding:"13px", cursor:"pointer", fontSize:13, fontWeight:700 }}>📋 Copier</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
HOME
───────────────────────────────────────── */
const DAYS = ["L","M","M","J","V","S","D"];
const todayRaw = new Date().getDay();
const todayIdx = todayRaw === 0 ? 6 : todayRaw - 1;

const WEEK_DATA = [
  { done:true,  h:320, v:28, m:18 },
  { done:true,  h:210, v:15, m:12 },
  { done:true,  h:480, v:42, m:25 },
  { done:false, h:90,  v:8,  m:5  },
  { done:false, h:0,   v:0,  m:0  },
  { done:false, h:0,   v:0,  m:0  },
  { done:false, h:0,   v:0,  m:0  },
];

const CIRCLE = [
  { name:"Amina",   avatar:"🌸", h:2840 },
  { name:"Karim",   avatar:"🌙", h:1920 },
  { name:"Fatima",  avatar:"🌿", h:3100 },
  { name:"Ibrahim", avatar:"⭐", h:650  },
];
const CIRCLE_GOAL  = 10000;
const circleTotal  = CIRCLE.reduce((a, m) => a + m.h, 0);

function HomeScreen({ hassanates, streak, readingMins, onStart }) {
  const [selectedDay, setSelectedDay] = useState(todayIdx);
  const [animKey,     setAnimKey]     = useState(0);
  const [circleH,     setCircleH]     = useState(circleTotal);

  const dayData = WEEK_DATA[selectedDay] || WEEK_DATA[todayIdx];
  const isToday = selectedDay === todayIdx;

  const handleDayClick = (i) => {
    if (i > todayIdx) return;
    setSelectedDay(i);
    setAnimKey(k => k + 1);
  };

  const statsGrid = [
    { icon:"♥",  label:"Hassanates",   val: isToday ? hassanates.toLocaleString() : dayData.h.toLocaleString(), color:"var(--heart)"   },
    { icon:"📖", label:"Versets lus",  val: isToday ? "142" : dayData.v,                                        color:"var(--emerald)" },
    { icon:"⏱️", label:"Mins lecture", val: isToday ? readingMins : dayData.m,                                  color:"#7C6AE8"        },
    { icon:"✅", label:"Pages finies", val: "3",                                                                 color:"var(--gold)"    },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"10px 16px 16px" }}>
      {/* Header */}
      <div className="fu" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <p style={{ fontSize:13, color:"var(--ink-m)", fontWeight:600 }}>Assalam Alaykum 🤍</p>
          <p style={{ fontSize:22, fontWeight:800, color:"var(--ink)", fontFamily:"'Playfair Display',serif" }}>Youssef</p>
          <div className="pill" style={{ marginTop:5 }}>🔥 {streak} jours de suite</div>
        </div>
        <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,var(--emerald),var(--emerald-l))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, boxShadow:"0 4px 16px rgba(42,122,90,0.3)" }}>🌿</div>
      </div>

      {/* Semaine */}
      <div className="fu card" style={{ padding:"12px 14px", marginBottom:14, animationDelay:"0.04s" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <p style={{ fontSize:11, fontWeight:700, color:"var(--ink-m)" }}>Cette semaine</p>
          {!isToday && (
            <button onClick={() => handleDayClick(todayIdx)}
              style={{ fontSize:10, fontWeight:700, color:"var(--emerald)", background:"var(--emerald-glow)", border:"none", borderRadius:999, padding:"2px 8px", cursor:"pointer" }}>
              Aujourd'hui
            </button>
          )}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          {DAYS.map((d, i) => {
            const data       = WEEK_DATA[i];
            const isSelected = i === selectedDay;
            const isT        = i === todayIdx;
            const isFuture   = i > todayIdx;
            return (
              <div key={i} onClick={() => handleDayClick(i)}
                style={{ cursor: isFuture ? "default" : "pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background: isSelected ? "var(--emerald)" : isT ? "var(--emerald-glow)" : "transparent", border: isT && !isSelected ? "2px solid var(--emerald)" : "2px solid transparent", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", transition:"all 0.2s", opacity: isFuture ? 0.35 : 1 }}>
                  <span style={{ fontSize:11, fontWeight:800, color: isSelected ? "#fff" : isT ? "var(--emerald)" : "var(--ink-m)" }}>{d}</span>
                </div>
                <div style={{ width:5, height:5, borderRadius:"50%", background: data.done ? "var(--gold)" : "transparent", transition:"all 0.2s" }} />
              </div>
            );
          })}
        </div>
        {!isToday && (
          <p style={{ fontSize:11, color:"var(--ink-m)", textAlign:"center", marginTop:6, fontWeight:600 }}>
            {["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"][selectedDay]} · {dayData.done ? "✅ Objectif atteint" : "Objectif non atteint"}
          </p>
        )}
      </div>

      {/* Carte objectif */}
      <div className="fu goal-card" style={{ marginBottom:14, animationDelay:"0.07s" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <p style={{ fontSize:12, opacity:0.8, fontWeight:600, marginBottom:4 }}>En cours de lecture</p>
            <p style={{ fontSize:20, fontWeight:800, fontFamily:"'Playfair Display',serif" }}>Al-Fatiha</p>
            <p style={{ fontSize:12, opacity:0.8, marginTop:2 }}>6 versets restants</p>
          </div>
          <p className="arabic" style={{ fontSize:28, opacity:0.85 }}>الفاتحة</p>
        </div>
        <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:999, height:6, overflow:"hidden", marginBottom:14 }}>
          <div style={{ width:"14%", height:"100%", background:"#fff", borderRadius:999 }} />
        </div>
        <button onClick={onStart} style={{ background:"rgba(255,255,255,0.92)", color:"var(--emerald)", border:"none", borderRadius:13, padding:"12px 0", width:"100%", cursor:"pointer", fontSize:14, fontWeight:800 }}>
          Continuer la lecture →
        </button>
      </div>

      {/* Stats */}
      <div key={animKey} className="fu" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14, animationDelay:"0.09s" }}>
        {statsGrid.map((s, i) => (
          <div key={i} className="stat-card" style={{ backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
            <span style={{ fontSize:20, color:s.color }}>{s.icon}</span>
            <p style={{ fontSize:22, fontWeight:800, color:"var(--ink)", fontFamily:"'Playfair Display',serif", marginTop:6 }}>{s.val}</p>
            <p style={{ fontSize:11, color:"var(--ink-m)", marginTop:2, fontWeight:600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cercle */}
      <div className="fu card" style={{ padding:"18px", marginBottom:14, animationDelay:"0.11s" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <p style={{ fontSize:14, fontWeight:800, color:"var(--ink)" }}>🤝 Mon Cercle</p>
            <p style={{ fontSize:11, color:"var(--ink-m)", marginTop:2 }}>Progression collective</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:16, fontWeight:800, color:"var(--heart)", fontFamily:"'Playfair Display',serif" }}>{circleH.toLocaleString()}</p>
            <p style={{ fontSize:10, color:"var(--ink-m)" }}>/ {CIRCLE_GOAL.toLocaleString()} ♥</p>
          </div>
        </div>
        <div style={{ background:"rgba(0,0,0,0.06)", borderRadius:999, height:8, overflow:"hidden", marginBottom:16 }}>
          <div style={{ width:`${Math.min(100,(circleH/CIRCLE_GOAL)*100)}%`, height:"100%", background:"linear-gradient(90deg,var(--heart),#F09AAF)", borderRadius:999, transition:"width 0.8s" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", marginBottom:14 }}>
          {CIRCLE.map((m, i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", marginRight:14 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,hsl(${i*60},60%,75%),hsl(${i*60+30},60%,65%))`, border:"2px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{m.avatar}</div>
              <p style={{ fontSize:10, fontWeight:700, color:"var(--ink-s)", marginTop:4 }}>{m.name}</p>
              <p style={{ fontSize:9, color:"var(--heart)", fontWeight:700 }}>{m.h.toLocaleString()} ♥</p>
            </div>
          ))}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginLeft:"auto" }}>
            <button style={{ width:44, height:44, borderRadius:"50%", background:"var(--emerald-glow)", border:"2px dashed rgba(42,122,90,0.4)", cursor:"pointer", fontSize:20, color:"var(--emerald)", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
            <p style={{ fontSize:10, fontWeight:700, color:"var(--emerald)", marginTop:4 }}>Inviter</p>
          </div>
        </div>
        <button onClick={() => setCircleH(h => Math.min(CIRCLE_GOAL, h+50))}
          style={{ width:"100%", background:"rgba(0,0,0,0.04)", border:"1px dashed var(--border-s)", borderRadius:10, padding:"8px", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--ink-m)" }}>
          ⚡ Simuler +50 ♥ au groupe
        </button>
      </div>

      {/* Ayah du jour */}
      <div className="fu card" style={{ padding:"16px", marginBottom:12, animationDelay:"0.13s" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <p style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>✨ Ayah du jour</p>
          <span style={{ fontSize:11, color:"var(--ink-m)", fontWeight:600 }}>{AYAH_DU_JOUR.ref}</span>
        </div>
        <p className="arabic" style={{ fontSize:20, textAlign:"right", lineHeight:2, color:"var(--emerald)", marginBottom:10 }}>{AYAH_DU_JOUR.arabic}</p>
        <p style={{ fontSize:13, color:"var(--ink-s)", lineHeight:1.7, fontStyle:"italic" }}>« {AYAH_DU_JOUR.fr} »</p>
      </div>

      {/* Défi du jour */}
      <div className="fu" style={{ background:"linear-gradient(135deg,#7C6AE8,#A08CF5)", borderRadius:20, padding:"16px", animationDelay:"0.15s" }}>
        <p style={{ fontSize:13, fontWeight:800, color:"#fff", marginBottom:4 }}>🏆 Défi du jour</p>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginBottom:12 }}>Lis 3 sourates courtes aujourd'hui</p>
        <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:999, height:6, overflow:"hidden" }}>
          <div style={{ width:"33%", height:"100%", background:"#fff", borderRadius:999 }} />
        </div>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:6 }}>1 / 3 complété</p>
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
    ? surahs.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.arabic.includes(search) ||
        String(s.id).includes(search))
    : surahs;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"10px 16px 16px" }}>
      <h2 style={{ fontSize:24, marginBottom:4, color:"var(--ink)" }}>Le Saint Coran</h2>
      <p style={{ fontSize:13, color:"var(--ink-m)", marginBottom:12 }}>114 sourates — choisissez votre lecture</p>

      <div style={{ position:"relative", marginBottom:14 }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"var(--ink-m)" }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une sourate..."
          style={{ width:"100%", padding:"10px 12px 10px 34px", borderRadius:12, border:"1px solid var(--border-s)", background:"var(--card)", color:"var(--ink)", fontSize:13, outline:"none", fontFamily:"'Nunito',sans-serif", backdropFilter:"blur(12px)" }} />
      </div>

      {loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {Array.from({ length:8 }).map((_,i) => (
            <div key={i} className="card" style={{ padding:"14px 16px", height:68, opacity:0.5 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:"var(--emerald-glow)" }} />
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ width:"40%", height:12, borderRadius:6, background:"var(--border-s)" }} />
                  <div style={{ width:"60%", height:10, borderRadius:6, background:"var(--border-s)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-m)" }}>
          <p style={{ fontSize:28, marginBottom:8 }}>⚠️</p>
          <p style={{ fontSize:13, fontWeight:600 }}>Impossible de charger le Coran</p>
          <p style={{ fontSize:12, marginTop:4 }}>Vérifiez votre connexion internet</p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map((s, i) => (
            <div key={s.id} className="card fu" onClick={() => onOpen(s)}
              style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", animationDelay:`${Math.min(i,12)*0.03}s` }}>
              <div style={{ width:42, height:42, borderRadius:12, background:"var(--emerald-glow)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"var(--emerald)" }}>{s.id}</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700, fontSize:15, color:"var(--ink)" }}>{s.name}</p>
                <p style={{ fontSize:11, color:"var(--ink-m)", marginTop:2 }}>{s.verses} versets · {s.rev}</p>
              </div>
              <p className="arabic" style={{ fontSize:20, color:"var(--gold)" }}>{s.arabic}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-m)" }}>
              <p style={{ fontSize:28 }}>🔍</p>
              <p style={{ fontSize:13, marginTop:8 }}>Aucun résultat pour « {search} »</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
DHIKR
───────────────────────────────────────── */
const ESSENTIELS = [
  { key:"Salah",    label:"Salah",           icon:"🕌", grad:["#4A90D9","#6FB3F5"], items: DHIKR_DB.Priere   },
  { key:"Salawat",  label:"Salawat",          icon:"🤲", grad:["#E06B8B","#F09AAF"], items: DHIKR_DB.Matin.slice(0,2) },
  { key:"Louanges", label:"Louanges d'Allah", icon:"✨", grad:["#C49A3C","#E8C060"], items: DHIKR_DB.Soir     },
  { key:"Noms",     label:"Noms d'Allah",     icon:"📿", grad:["#2A7A5A","#3DAA7F"], items: DHIKR_DB.Protection },
];

const PAR_THEME = [
  { key:"Rouqyah",   label:"Rouqyah & Maladie",    icon:"🛡️", grad:["#E06B8B","#C04060"], items: DHIKR_DB.Protection },
  { key:"Istighfar", label:"Istighfar",              icon:"🔄", grad:["#7C6AE8","#A08CF5"], items: DHIKR_DB.Soir       },
  { key:"MatinSoir", label:"Matin & Soir",           icon:"🌅", grad:["#C49A3C","#3DAA7F"], items: [...DHIKR_DB.Matin,...DHIKR_DB.Soir] },
  { key:"Pardon",    label:"Pardon & Repentir",      icon:"🗝️", grad:["#4A90D9","#2A7A5A"], items: DHIKR_DB.Priere    },
  { key:"Oummah",    label:"Pour la Oummah",         icon:"👥", grad:["#E06B8B","#7C6AE8"], items: DHIKR_DB.Sommeil   },
];

function DhikrScreen({ onAddH, toast }) {
  const [mainTab,  setMainTab]  = useState("essentiels");
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const [ctrs,     setCtrs]     = useState({});
  const [bumpId,   setBumpId]   = useState(null);

  const categories = mainTab === "essentiels" ? ESSENTIELS : PAR_THEME;

  const tap = d => {
    const cur = ctrs[d.id] || 0;
    if (cur >= d.count) return;
    const next = cur + 1;
    setCtrs(p => ({ ...p, [d.id]: next }));
    setBumpId(d.id);
    setTimeout(() => setBumpId(null), 180);
    if (next === d.count) { onAddH(d.h); toast(`+${d.h} ♥`); }
  };

  if (selected) {
    const items = search
      ? selected.items.filter(d =>
          d.arabic.includes(search) ||
          d.fr.toLowerCase().includes(search.toLowerCase()) ||
          d.phonetic.toLowerCase().includes(search.toLowerCase()))
      : selected.items;

    return (
      <div style={{ flex:1, overflowY:"auto", padding:"10px 16px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <button onClick={() => { setSelected(null); setSearch(""); }}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:"var(--ink-s)", lineHeight:1 }}>←</button>
          <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${selected.grad[0]},${selected.grad[1]})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{selected.icon}</div>
          <div>
            <p style={{ fontSize:16, fontWeight:800, color:"var(--ink)" }}>{selected.label}</p>
            <p style={{ fontSize:11, color:"var(--ink-m)" }}>{selected.items.length} invocations</p>
          </div>
        </div>

        <div style={{ position:"relative", marginBottom:16 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"var(--ink-m)" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            style={{ width:"100%", padding:"10px 12px 10px 34px", borderRadius:12, border:"1px solid var(--border-s)", background:"var(--card)", color:"var(--ink)", fontSize:13, outline:"none", fontFamily:"'Nunito',sans-serif" }} />
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {items.map((d, i) => {
            const cur = ctrs[d.id] || 0, done = cur >= d.count;
            return (
              <div key={d.id} className="card fu" style={{ padding:"16px", animationDelay:`${i*0.05}s`, opacity: done ? 0.6 : 1, transition:"opacity 0.3s" }}>
                <p className="arabic" style={{ fontSize:21, textAlign:"right", lineHeight:2.2, color: done ? "var(--ink-m)" : "var(--ink)", marginBottom:8 }}>{d.arabic}</p>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ flex:1, height:1, background:"var(--border-s)" }} />
                  <span style={{ fontSize:10, color:"var(--gold)" }}>✦</span>
                  <div style={{ flex:1, height:1, background:"var(--border-s)" }} />
                </div>
                <p style={{ fontSize:12, color:"var(--ink-m)", fontStyle:"italic", lineHeight:1.6, marginBottom:6 }}>{d.phonetic}</p>
                <p style={{ fontSize:13, color:"var(--ink-s)", lineHeight:1.6, marginBottom:12 }}>{d.fr}</p>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <span style={{ fontSize:10, color:"var(--ink-m)", display:"block" }}>📚 {d.source}</span>
                    <span style={{ fontSize:11, fontWeight:700, color: done ? "var(--gold)" : "var(--emerald)" }}>+{d.h} ♥</span>
                  </div>
                  <button className={`dhikr-btn${bumpId === d.id ? " bump" : ""}`} onClick={() => tap(d)} disabled={done}
                    style={{ background: done ? "rgba(0,0,0,0.05)" : `linear-gradient(135deg,${selected.grad[0]},${selected.grad[1]})`, color: done ? "var(--ink-m)" : "#fff", boxShadow: done ? "none" : `0 4px 14px ${selected.grad[0]}55` }}>
                    {done
                      ? <span style={{ fontSize:20 }}>✓</span>
                      : <><span style={{ fontSize:15, fontWeight:800, lineHeight:1 }}>{cur}</span><span style={{ fontSize:9 }}>/{d.count}</span></>}
                  </button>
                </div>
                <div style={{ background:"rgba(0,0,0,0.05)", borderRadius:999, height:3, overflow:"hidden", marginTop:10 }}>
                  <div style={{ width:`${Math.round((cur/d.count)*100)}%`, height:"100%", background: done ? "var(--gold)" : `linear-gradient(90deg,${selected.grad[0]},${selected.grad[1]})`, borderRadius:999, transition:"width 0.25s" }} />
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-m)" }}>
              <p style={{ fontSize:28, marginBottom:8 }}>🔍</p>
              <p style={{ fontSize:13 }}>Aucun résultat</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"10px 16px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:"var(--ink)" }}>Dhikr & Doua</h2>
        <button onClick={() => setSelected({ label:"Tous", icon:"📿", grad:["var(--emerald)","var(--emerald-l)"], items:[...DHIKR_DB.Matin,...DHIKR_DB.Soir,...DHIKR_DB.Protection,...DHIKR_DB.Sommeil,...DHIKR_DB.Priere] })}
          style={{ background:"var(--card)", border:"1px solid var(--border-s)", borderRadius:10, padding:"7px 12px", cursor:"pointer", fontSize:12, fontWeight:700, color:"var(--ink-s)" }}>
          🔍 Chercher
        </button>
      </div>

      <div className="tab-bar" style={{ marginBottom:18 }}>
        <button className={`tab${mainTab === "essentiels" ? " active" : ""}`} onClick={() => setMainTab("essentiels")}>⭐ Les Essentiels</button>
        <button className={`tab${mainTab === "theme" ? " active" : ""}`} onClick={() => setMainTab("theme")}>🗂️ Par Thème</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {categories.map((cat, i) => (
          <div key={cat.key} className="fu" onClick={() => setSelected(cat)}
            style={{ borderRadius:20, overflow:"hidden", cursor:"pointer", background:`linear-gradient(135deg,${cat.grad[0]}CC,${cat.grad[1]}CC)`, border:"1px solid rgba(255,255,255,0.25)", boxShadow:`0 6px 24px ${cat.grad[0]}44`, backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", padding:"18px 16px", minHeight:110, display:"flex", flexDirection:"column", justifyContent:"space-between", animationDelay:`${i*0.05}s`, position:"relative" }}>
            <span style={{ position:"absolute", right:12, bottom:8, fontSize:40, opacity:0.2 }}>{cat.icon}</span>
            <div>
              <span style={{ fontSize:26, display:"block", marginBottom:8 }}>{cat.icon}</span>
              <p style={{ fontSize:13, fontWeight:800, color:"#fff", lineHeight:1.3 }}>{cat.label}</p>
            </div>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.75)", marginTop:8 }}>{cat.items.length} invocations →</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop:20, padding:"16px", background:"var(--emerald-glow)", borderRadius:18, border:"1px solid rgba(42,122,90,0.15)", textAlign:"center" }}>
        <p className="arabic" style={{ fontSize:18, color:"var(--emerald)", lineHeight:2, marginBottom:6 }}>وَاذْكُر رَّبَّكَ كَثِيرًا</p>
        <p style={{ fontSize:12, color:"var(--ink-s)", fontStyle:"italic" }}>« Invoque ton Seigneur beaucoup. » — Al-Imran 3:41</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
ONBOARDING
───────────────────────────────────────── */
const ONBOARDING_SLIDES = [
  { bg:["#1A2E1A","#0D1F0D"], orb1:"rgba(42,122,90,0.25)", orb2:"rgba(61,170,127,0.12)", icon:"☽", iconBg:"linear-gradient(135deg,#2A7A5A,#3DAA7F)", title:"Bienvenue sur\nHassanates", accent:"#3DAA7F", sub:"Ton compagnon de progression spirituelle. Lis, invoque et grandis chaque jour.", cta:null },
  { bg:["#1A1A2E","#0D0D1F"], orb1:"rgba(124,106,232,0.2)", orb2:"rgba(160,140,245,0.1)", icon:"🤝", iconBg:"linear-gradient(135deg,#7C6AE8,#A08CF5)", title:"Progresse en\nCommunauté", accent:"#A08CF5", sub:"Rejoins un cercle de motivation, partage ta progression et inspire ceux qui t'entourent.", cta:null },
  { bg:["#1F1A0D","#2E2410"], orb1:"rgba(196,154,60,0.2)", orb2:"rgba(232,192,96,0.1)", icon:"🌿", iconBg:"linear-gradient(135deg,#C49A3C,#E8C060)", title:"Trouve ta\nSérénité", accent:"#E8C060", sub:"Des espaces de calme, des sons apaisants et des exercices pour recentrer ton cœur.", cta:"Commencer" },
];

function Onboarding({ onDone }) {
  const [idx,  setIdx]  = useState(0);
  const [cls,  setCls]  = useState("vs-in");
  const anim   = useRef(false);
  const touchX = useRef(null);
  const s = ONBOARDING_SLIDES[idx];

  const goTo = (next) => {
    if (anim.current || next < 0 || next >= ONBOARDING_SLIDES.length) return;
    anim.current = true;
    const dir = next > idx ? "l" : "r";
    setCls(dir === "l" ? "vs-out-l" : "vs-out-r");
    setTimeout(() => {
      setIdx(next);
      setCls(dir === "l" ? "vs-out-r" : "vs-out-l");
      requestAnimationFrame(() => requestAnimationFrame(() => { setCls("vs-in"); anim.current = false; }));
    }, 280);
  };

  const onTS = e => { touchX.current = e.touches[0].clientX; };
  const onTE = e => {
    if (!touchX.current) return;
    const dx = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 44) dx > 0 ? goTo(idx+1) : goTo(idx-1);
    touchX.current = null;
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, maxWidth:430, margin:"0 auto", overflow:"hidden", background:`linear-gradient(160deg,${s.bg[0]},${s.bg[1]})`, transition:"background 0.5s" }}
      onTouchStart={onTS} onTouchEnd={onTE}>
      <div style={{ position:"absolute", top:-80, right:-80, width:260, height:260, borderRadius:"50%", background:s.orb1, transition:"background 0.5s", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:120, left:-60, width:180, height:180, borderRadius:"50%", background:s.orb2, transition:"background 0.5s", pointerEvents:"none" }} />
      {idx < ONBOARDING_SLIDES.length-1 && (
        <button onClick={onDone} style={{ position:"absolute", top:52, right:20, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:999, padding:"6px 14px", cursor:"pointer", fontSize:12, color:"rgba(255,255,255,0.6)", fontFamily:"'Nunito',sans-serif", fontWeight:600, zIndex:10 }}>
          Passer
        </button>
      )}
      <div className={`vslide ${cls}`} style={{ padding:"0 32px", gap:0 }}>
        <div style={{ width:100, height:100, borderRadius:28, background:s.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:46, marginBottom:36, boxShadow:`0 12px 40px ${s.orb1}`, transition:"background 0.5s" }}>{s.icon}</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700, color:"#fff", textAlign:"center", lineHeight:1.25, marginBottom:20, whiteSpace:"pre-line" }}>
          {s.title.split("\n").map((line, i) => (
            <span key={i}>
              {i === 1
                ? <span style={{ background:`linear-gradient(90deg,${s.accent},#fff)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{line}</span>
                : line}
              {i === 0 && <br />}
            </span>
          ))}
        </h1>
        <p style={{ fontSize:15, color:"rgba(255,255,255,0.65)", textAlign:"center", lineHeight:1.8, maxWidth:300 }}>{s.sub}</p>
      </div>
      <div style={{ position:"absolute", bottom:52, left:0, right:0, display:"flex", flexDirection:"column", alignItems:"center", gap:24, padding:"0 32px" }}>
        <div style={{ display:"flex", gap:8 }}>
          {ONBOARDING_SLIDES.map((_,i) => (
            <div key={i} onClick={() => goTo(i)} style={{ height:6, width: i===idx ? 24 : 6, borderRadius:999, background: i===idx ? "#fff" : "rgba(255,255,255,0.25)", transition:"all 0.3s", cursor:"pointer" }} />
          ))}
        </div>
        {s.cta ? (
          <button onClick={onDone} style={{ width:"100%", padding:"16px", borderRadius:16, border:"none", cursor:"pointer", background:`linear-gradient(135deg,${s.accent},#fff)`, color:"#1A1A2E", fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif", boxShadow:`0 8px 32px ${s.orb1}` }}>
            {s.cta} →
          </button>
        ) : (
          <button onClick={() => goTo(idx+1)} style={{ width:"100%", padding:"16px", borderRadius:16, border:"1px solid rgba(255,255,255,0.2)", cursor:"pointer", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:15, fontWeight:700, fontFamily:"'Nunito',sans-serif", backdropFilter:"blur(8px)" }}>
            Suivant →
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
SÉRÉNITÉ
───────────────────────────────────────── */
const SOUNDS = [
  { id:"pluie",   label:"Pluie douce",    icon:"🌧️" },
  { id:"ocean",   label:"Océan",          icon:"🌊" },
  { id:"foret",   label:"Forêt",          icon:"🌲" },
  { id:"vent",    label:"Vent de l'aube", icon:"🌬️" },
  { id:"riviere", label:"Rivière",        icon:"🏞️" },
  { id:"feu",     label:"Feu crépitant",  icon:"🔥" },
];

const PRESETS = [
  { name:"Océan de Paix",        icon:"🌊", color:"#4A90D9", volumes:{ ocean:80, pluie:20, foret:0,  vent:0,  riviere:0, feu:0  } },
  { name:"Pluie de Miséricorde", icon:"🌧️", color:"#7C6AE8", volumes:{ pluie:75, foret:30, ocean:0,  vent:15, riviere:0, feu:0  } },
  { name:"Vent de l'Aube",       icon:"🌬️", color:"#2A7A5A", volumes:{ vent:70,  foret:40, ocean:0,  pluie:0, riviere:20,feu:0  } },
];

function SereniteScreen() {
  const [volumes,      setVolumes]      = useState({ pluie:0, ocean:0, foret:0, vent:0, riviere:0, feu:0 });
  const [playing,      setPlaying]      = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [wave,         setWave]         = useState(0);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setWave(w => (w+1) % 100), 50);
    return () => clearInterval(t);
  }, [playing]);

  const applyPreset = (p, i) => { setVolumes(p.volumes); setActivePreset(i); setPlaying(true); };
  const totalVol = Object.values(volumes).reduce((a,v) => a+v, 0);
  const isActive = totalVol > 0;

  const waveBars = Array.from({ length:28 }, (_,i) => {
    const base = 8 + Math.sin((i/28)*Math.PI*2)*6;
    const live = playing ? Math.abs(Math.sin((wave/100*Math.PI*2)+i*0.4))*20 : 0;
    return base + live;
  });

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"10px 16px 20px" }}>
      <div style={{ background:"linear-gradient(135deg,#0D1F14,#1A3020)", borderRadius:22, padding:"24px", marginBottom:16, textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:100, height:100, borderRadius:"50%", background:"rgba(61,170,127,0.1)" }} />
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:6, fontWeight:600 }}>Espace de calme</p>
        <h2 style={{ fontSize:22, color:"#fff", fontFamily:"'Playfair Display',serif", marginBottom:8 }}>Sérénité</h2>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.65)", lineHeight:1.7, marginBottom:16 }}>
          « Et dans le souvenir d'Allah, les cœurs trouvent la tranquillité. »<br/>
          <span style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>— Ar-Ra'd 13:28</span>
        </p>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:3, height:48, marginBottom:16 }}>
          {waveBars.map((h,i) => (
            <div key={i} style={{ width:4, height:`${h}px`, borderRadius:2, background: isActive ? `rgba(61,170,127,${0.4+(h/30)*0.6})` : "rgba(255,255,255,0.12)", transition: playing ? "height 0.15s ease" : "height 0.5s ease" }} />
          ))}
        </div>
        <button onClick={() => setPlaying(!playing)} disabled={!isActive}
          style={{ width:56, height:56, borderRadius:"50%", border:"none", cursor: isActive ? "pointer" : "default", background: isActive ? "linear-gradient(135deg,#2A7A5A,#3DAA7F)" : "rgba(255,255,255,0.1)", color:"#fff", fontSize:22, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto", boxShadow: isActive ? "0 4px 20px rgba(42,122,90,0.5)" : "none", transition:"all 0.3s", opacity: isActive ? 1 : 0.4 }}>
          {playing ? "⏸" : "▶"}
        </button>
      </div>

      <p style={{ fontSize:12, fontWeight:800, color:"var(--ink)", marginBottom:10 }}>🎛️ Presets spirituels</p>
      <div style={{ display:"flex", gap:10, marginBottom:18 }}>
        {PRESETS.map((p,i) => (
          <button key={i} onClick={() => applyPreset(p,i)}
            style={{ flex:1, padding:"10px 6px", borderRadius:14, border:`1.5px solid ${activePreset===i ? p.color : "var(--border-s)"}`, background: activePreset===i ? `${p.color}22` : "var(--card)", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:5, transition:"all 0.2s" }}>
            <span style={{ fontSize:22 }}>{p.icon}</span>
            <span style={{ fontSize:10, fontWeight:700, color: activePreset===i ? p.color : "var(--ink-m)", lineHeight:1.3, textAlign:"center" }}>{p.name}</span>
          </button>
        ))}
      </div>

      <p style={{ fontSize:12, fontWeight:800, color:"var(--ink)", marginBottom:10 }}>🎚️ Mixeur personnalisé</p>
      <div className="card" style={{ padding:"16px", marginBottom:16 }}>
        {SOUNDS.map(snd => (
          <div key={snd.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"var(--emerald-glow)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{snd.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"var(--ink-s)" }}>{snd.label}</span>
                <span style={{ fontSize:11, color:"var(--emerald)", fontWeight:700 }}>{volumes[snd.id]}%</span>
              </div>
              <div style={{ position:"relative", height:4, background:"rgba(0,0,0,0.08)", borderRadius:999, cursor:"pointer" }}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct  = Math.round(((e.clientX-rect.left)/rect.width)*100);
                  setVolumes(v => ({ ...v, [snd.id]: Math.max(0, Math.min(100, pct)) }));
                  setActivePreset(null);
                }}>
                <div style={{ width:`${volumes[snd.id]}%`, height:"100%", background:"linear-gradient(90deg,var(--emerald),var(--emerald-l))", borderRadius:999, transition:"width 0.1s" }} />
                <div style={{ position:"absolute", top:"50%", left:`${volumes[snd.id]}%`, transform:"translate(-50%,-50%)", width:14, height:14, borderRadius:"50%", background:"var(--emerald)", boxShadow:"0 2px 8px rgba(42,122,90,0.4)", border:"2px solid #fff" }} />
              </div>
            </div>
          </div>
        ))}
        <button onClick={() => { setVolumes({ pluie:0, ocean:0, foret:0, vent:0, riviere:0, feu:0 }); setPlaying(false); setActivePreset(null); }}
          style={{ width:"100%", marginTop:4, padding:"8px", borderRadius:10, border:"1px dashed var(--border-s)", background:"none", cursor:"pointer", fontSize:12, color:"var(--ink-m)", fontWeight:600, fontFamily:"'Nunito',sans-serif" }}>
          Tout réinitialiser
        </button>
      </div>

      <p style={{ fontSize:12, fontWeight:800, color:"var(--ink)", marginBottom:10 }}>🧘 Méditation guidée</p>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {[
          { icon:"🌬️", title:"Respiration 4-7-8",         sub:"4 min · Apaise le système nerveux",      color:"#4A90D9" },
          { icon:"📿", title:"Méditation sur Al-Fatiha",  sub:"8 min · Connexion spirituelle profonde",  color:"#2A7A5A" },
          { icon:"🌙", title:"Routine du coucher",         sub:"10 min · Adhkar + relaxation",           color:"#7C6AE8" },
          { icon:"☀️", title:"Éveil spirituel",            sub:"5 min · Commencer la journée avec Allah",color:"#C49A3C" },
        ].map((it,i) => (
          <div key={i} className="card fu" style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", animationDelay:`${i*0.05}s` }}>
            <div style={{ width:44, height:44, borderRadius:14, background:`${it.color}22`, border:`1.5px solid ${it.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{it.icon}</div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:13, color:"var(--ink)" }}>{it.title}</p>
              <p style={{ fontSize:11, color:"var(--ink-m)", marginTop:2 }}>{it.sub}</p>
            </div>
            <div style={{ width:32, height:32, borderRadius:"50%", background:`${it.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:it.color, flexShrink:0 }}>▶</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
PROFIL
───────────────────────────────────────── */
const BADGES = [
  { id:"fajr",     icon:"🌅", name:"Lève-tôt",     desc:"Lis après Fajr 7 jours",     cond:(s,h,p) => s >= 7,    color:"#C49A3C" },
  { id:"murabit",  icon:"🛡️", name:"Murabit",       desc:"30 jours de streak",          cond:(s,h,p) => s >= 30,   color:"#7C6AE8" },
  { id:"tadabbur", icon:"📖", name:"Tadabbur",      desc:"100 notes de lecture",        cond:(s,h,p) => false,     color:"#2A7A5A" },
  { id:"hafidh",   icon:"🌙", name:"Hafidh",        desc:"Lis 1 sourate en entier",     cond:(s,h,p) => true,      color:"#3DAA7F" },
  { id:"mukhlis",  icon:"♥",  name:"Mukhlis",       desc:"1 000 Hassanates",            cond:(s,h,p) => h >= 1000, color:"#E06B8B" },
  { id:"sabir",    icon:"⭐", name:"Sabir",         desc:"5 000 Hassanates",            cond:(s,h,p) => h >= 5000, color:"#E8C060" },
  { id:"dhakir",   icon:"📿", name:"Dhakir",        desc:"Termine tous les Adhkar",     cond:(s,h,p) => false,     color:"#4A90D9" },
  { id:"gold",     icon:"★",  name:"Gold Member",   desc:"Abonnement Premium activé",   cond:(s,h,p) => p === true,color:"#C49A3C" },
];

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width:44, height:26, borderRadius:999, background: on ? "var(--emerald)" : "rgba(0,0,0,0.12)", position:"relative", cursor:"pointer", transition:"background 0.25s", flexShrink:0, border: on ? "none" : "1px solid var(--border-s)" }}>
      <div style={{ position:"absolute", top:3, left: on ? 20 : 3, width:20, height:20, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left 0.25s" }} />
    </div>
  );
}

function ProfilScreen({ hassanates, streak, readingMins, goalMins, setGoalMins, onOpenPremium, isPremium }) {
  const [notifFajr,  setNotifFajr]  = useState(true);
  const [notifSoir,  setNotifSoir]  = useState(true);
  const [notifDhikr, setNotifDhikr] = useState(false);
  const [search,     setSearch]     = useState("");

  const stats = [
    { l:"Hassanates",   v: hassanates.toLocaleString(), i:"♥",  c:"var(--heart)"    },
    { l:"Streak",       v: `${streak}j`,                i:"🔥", c:"var(--gold)"     },
    { l:"Versets lus",  v: "142",                       i:"📖", c:"var(--emerald)"  },
    { l:"Sourates",     v: "3",                         i:"✅", c:"#7C6AE8"         },
    { l:"Mins lecture", v: readingMins,                 i:"⏱️", c:"var(--emerald-l)"},
    { l:"Notes",        v: "7",                         i:"📝", c:"var(--gold)"     },
  ];

  const earnedBadges = BADGES.filter(b => b.cond(streak, hassanates, isPremium));
  const lockedBadges = BADGES.filter(b => !b.cond(streak, hassanates, isPremium));

  const settingsGroups = [
    {
      title: "Contenu sauvegardé",
      items: [
        { icon:"🔖", label:"Mes favoris",        sub:"Versets mis en favoris" },
        { icon:"📝", label:"Mes notes",           sub:"7 notes de lecture" },
        { icon:"📚", label:"Historique lecture",  sub:"Progression sourate par sourate" },
        ...(isPremium ? [
          { icon:"📖", label:"Tafsir Ibn Kathir", sub:"★ Accès illimité à toutes les exégèses", gold:true },
          { icon:"🎵", label:"Séances Sérénité",  sub:"★ Méditations & sons exclusifs",          gold:true },
        ] : []),
      ],
    },
    {
      title: "Notifications",
      items: [
        { icon:"🌅", label:"Rappel Fajr",  toggle:true, val:notifFajr,  set:setNotifFajr  },
        { icon:"🌙", label:"Rappel soir",  toggle:true, val:notifSoir,  set:setNotifSoir  },
        { icon:"📿", label:"Rappel Dhikr", toggle:true, val:notifDhikr, set:setNotifDhikr },
      ],
    },
    {
      title: "Compte & Support",
      items: [
        { icon:"👤", label:"Mon compte",               sub:"Modifier le profil" },
        { icon:"🛡️", label:"Confidentialité",          sub:"Données & permissions" },
        { icon:"💡", label:"Suggérer une amélioration", sub:"Votre avis compte" },
        { icon:"🚨", label:"Signaler une erreur",      sub:"Nous aider à corriger" },
        { icon:"📋", label:"Conditions d'utilisation", sub:"CGU & politique" },
      ],
    },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"10px 16px 20px" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:18 }}>
        <div style={{ width:76, height:76, borderRadius:"50%", background:"linear-gradient(135deg,var(--emerald),var(--emerald-l))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, marginBottom:10, boxShadow:"0 6px 20px rgba(42,122,90,0.35)" }}>🌿</div>
        <p style={{ fontSize:20, fontWeight:800, color:"var(--ink)", fontFamily:"'Playfair Display',serif" }}>Youssef</p>
        <div style={{ display:"flex", gap:6, marginTop:6 }}>
          <span className="pill">Récitant ♥</span>
          {isPremium && <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(196,154,60,0.15)", color:"var(--gold)", borderRadius:999, padding:"3px 10px", fontSize:11, fontWeight:700, border:"1px solid rgba(196,154,60,0.3)" }}>★ Gold</span>}
        </div>
      </div>

      <div style={{ position:"relative", marginBottom:16 }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"var(--ink-m)" }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un réglage..."
          style={{ width:"100%", padding:"10px 12px 10px 34px", borderRadius:12, border:"1px solid var(--border-s)", background:"var(--card)", color:"var(--ink)", fontSize:13, outline:"none", fontFamily:"'Nunito',sans-serif" }} />
      </div>

      {!isPremium && (
        <div onClick={onOpenPremium} style={{ background:"linear-gradient(135deg,#1A1035,#2D1F5E)", borderRadius:18, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:14, cursor:"pointer", border:"1px solid rgba(196,154,60,0.3)", boxShadow:"0 4px 20px rgba(124,106,232,0.2)" }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,#C49A3C,#E8C060)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>★</div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:13, fontWeight:800, color:"#E8C060" }}>Devenir Premium Gold</p>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2 }}>Tafsir · Sérénité · Stats avancées — -50%</p>
          </div>
          <span style={{ color:"rgba(196,154,60,0.7)", fontSize:18 }}>›</span>
        </div>
      )}

      <div style={{ background:"linear-gradient(135deg,#E06B8B,#F09AAF)", borderRadius:18, padding:"16px 20px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <p style={{ color:"rgba(255,255,255,0.85)", fontSize:12, fontWeight:600 }}>Total Hassanates</p>
          <p style={{ color:"#fff", fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", marginTop:2 }}>{hassanates.toLocaleString()} ♥</p>
        </div>
        <p style={{ fontSize:40 }}>🌟</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:18 }}>
        {stats.map((s,i) => (
          <div key={i} className="fu" style={{ background:"var(--card)", borderRadius:14, padding:"11px 10px", border:"1px solid var(--border)", backdropFilter:"blur(12px)", animationDelay:`${i*0.04}s` }}>
            <span style={{ fontSize:18, color:s.c }}>{s.i}</span>
            <p style={{ fontSize:16, fontWeight:800, color:"var(--ink)", fontFamily:"'Playfair Display',serif", marginTop:4 }}>{s.v}</p>
            <p style={{ fontSize:9, color:"var(--ink-m)", marginTop:1, fontWeight:600 }}>{s.l}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding:"14px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:20 }}>⏱️</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>Objectif de lecture</p>
          <p style={{ fontSize:11, color:"var(--ink-m)" }}>par session quotidienne</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setGoalMins(m => Math.max(5, m-5))} style={{ width:28, height:28, borderRadius:8, background:"var(--emerald-glow)", border:"none", cursor:"pointer", fontSize:16, color:"var(--emerald)", display:"flex", alignItems:"center", justifyContent:"center" }}>-</button>
          <span style={{ fontSize:14, fontWeight:800, color:"var(--emerald)", minWidth:46, textAlign:"center" }}>{goalMins} min</span>
          <button onClick={() => setGoalMins(m => Math.min(120, m+5))} style={{ width:28, height:28, borderRadius:8, background:"var(--emerald-glow)", border:"none", cursor:"pointer", fontSize:16, color:"var(--emerald)", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
        </div>
      </div>

      <div style={{ marginBottom:18 }}>
        <p style={{ fontSize:13, fontWeight:800, color:"var(--ink)", marginBottom:4 }}>🏅 Mes Succès</p>
        <p style={{ fontSize:11, color:"var(--ink-m)", marginBottom:12 }}>{earnedBadges.length} / {BADGES.length} obtenus</p>
        {earnedBadges.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
            {earnedBadges.map(b => (
              <div key={b.id} className="fu" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                <div style={{ width:56, height:56, borderRadius:16, background:`linear-gradient(135deg,${b.color}33,${b.color}18)`, border:`2px solid ${b.color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, boxShadow:`0 4px 12px ${b.color}33` }}>{b.icon}</div>
                <p style={{ fontSize:10, fontWeight:700, color:"var(--ink-s)", textAlign:"center", lineHeight:1.2 }}>{b.name}</p>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize:11, color:"var(--ink-m)", marginBottom:10, fontWeight:600 }}>🔒 À débloquer</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {lockedBadges.map(b => (
            <div key={b.id} className="fu" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:"rgba(0,0,0,0.05)", border:"2px solid var(--border-s)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, filter:"grayscale(1)", opacity:0.4 }}>{b.icon}</div>
              <p style={{ fontSize:10, color:"var(--ink-m)", textAlign:"center", lineHeight:1.2 }}>{b.name}</p>
            </div>
          ))}
        </div>
      </div>

      {settingsGroups.map((group, gi) => {
        const filteredItems = search
          ? group.items.filter(it => it.label.toLowerCase().includes(search.toLowerCase()))
          : group.items;
        if (filteredItems.length === 0) return null;
        return (
          <div key={gi} style={{ marginBottom:14 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--ink-m)", textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>{group.title}</p>
            <div className="card" style={{ overflow:"hidden" }}>
              {filteredItems.map((it, ii) => (
                <div key={ii} style={{ padding:"13px 16px", borderBottom: ii < filteredItems.length-1 ? "1px solid var(--border-s)" : "none", display:"flex", alignItems:"center", gap:12, cursor: it.toggle ? "default" : "pointer" }}>
                  <div style={{ width:34, height:34, borderRadius:10, background: it.gold ? "linear-gradient(135deg,rgba(196,154,60,0.25),rgba(196,154,60,0.1))" : "var(--emerald-glow)", border: it.gold ? "1px solid rgba(196,154,60,0.3)" : "none", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{it.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{it.label}</p>
                      {it.gold && <span style={{ fontSize:10, fontWeight:700, color:"var(--gold)", background:"rgba(196,154,60,0.12)", border:"1px solid rgba(196,154,60,0.25)", borderRadius:999, padding:"1px 6px" }}>★ Gold</span>}
                    </div>
                    {it.sub && <p style={{ fontSize:11, color:"var(--ink-m)", marginTop:1 }}>{it.sub}</p>}
                  </div>
                  {it.toggle
                    ? <Toggle on={it.val} onToggle={() => it.set(v => !v)} />
                    : <span style={{ color:"var(--ink-m)", fontSize:16 }}>›</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <p style={{ fontSize:11, color:"var(--ink-m)", textAlign:"center", marginTop:8 }}>Hassanates v1.0.0 — Fait avec ♥</p>
    </div>
  );
}

/* ─────────────────────────────────────────
PREMIUM
───────────────────────────────────────── */
const PREMIUM_FEATURES = [
  { icon:"📖", title:"Tafsir Ibn Kathir complet",       sub:"Explication savante de chaque verset" },
  { icon:"🎵", title:"Séances Sérénité exclusives",     sub:"Méditations guidées, sons de la nature" },
  { icon:"📊", title:"Statistiques de groupe avancées", sub:"Suivi détaillé du Cercle de motivation" },
  { icon:"🏆", title:"Badges & défis premium",          sub:"Accomplissements exclusifs et récompenses" },
  { icon:"🔔", title:"Rappels intelligents",            sub:"Personnalisés selon vos temps de prière" },
  { icon:"☁️", title:"Sauvegarde cloud illimitée",      sub:"Notes, signets, progression synchronisés" },
];

const COMPARE = [
  { feat:"Lecture du Coran",        free:true,  gold:true },
  { feat:"Dhikr & Doua essentiels", free:true,  gold:true },
  { feat:"Hassanates & Streak",     free:true,  gold:true },
  { feat:"Tafsir Ibn Kathir",       free:false, gold:true },
  { feat:"Séances Sérénité",        free:false, gold:true },
  { feat:"Stats groupe avancées",   free:false, gold:true },
  { feat:"Badges premium",          free:false, gold:true },
];

function PremiumPage({ onClose, onActivate }) {
  const [activated, setActivated] = useState(false);

  const handleActivate = () => {
    setActivated(true);
    setTimeout(() => { onActivate(); onClose(); }, 1200);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:250, maxWidth:430, margin:"0 auto", background:"linear-gradient(160deg,#1A1035,#0D1B2A)", display:"flex", flexDirection:"column", overflowY:"auto" }}>
      <div style={{ position:"fixed", top:-60, right:-60, width:200, height:200, borderRadius:"50%", background:"rgba(196,154,60,0.08)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:100, left:-40, width:150, height:150, borderRadius:"50%", background:"rgba(124,106,232,0.1)", pointerEvents:"none" }} />

      <div style={{ padding:"52px 20px 0", flexShrink:0 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"6px 12px", cursor:"pointer", fontSize:13, color:"rgba(255,255,255,0.7)", fontFamily:"'Nunito',sans-serif" }}>← Retour</button>
      </div>

      <div style={{ padding:"28px 24px 0", textAlign:"center" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(196,154,60,0.15)", border:"1px solid rgba(196,154,60,0.35)", borderRadius:999, padding:"5px 14px", marginBottom:16 }}>
          <span style={{ fontSize:14 }}>★</span>
          <span style={{ fontSize:12, fontWeight:700, color:"#E8C060" }}>Hassanates Gold</span>
        </div>
        <h1 style={{ fontSize:28, fontWeight:800, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1.3, marginBottom:12 }}>
          Élève ta pratique<br/>
          <span style={{ background:"linear-gradient(90deg,#C49A3C,#E8C060)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>vers l'excellence</span>
        </h1>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.7, maxWidth:300, margin:"0 auto" }}>
          Accès au Tafsir complet, aux séances de sérénité exclusives et à des outils avancés pour approfondir ta connexion spirituelle.
        </p>
      </div>

      <div style={{ padding:"24px 20px 0" }}>
        <p style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>Ce qui est inclus</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {PREMIUM_FEATURES.map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,0.05)", borderRadius:14, padding:"12px 14px", border:"1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ width:38, height:38, borderRadius:11, background:"linear-gradient(135deg,rgba(196,154,60,0.3),rgba(196,154,60,0.1))", border:"1px solid rgba(196,154,60,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{f.icon}</div>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{f.title}</p>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{f.sub}</p>
              </div>
              <span style={{ marginLeft:"auto", color:"#E8C060", fontSize:16, flexShrink:0 }}>✓</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"24px 20px 0" }}>
        <p style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>Gratuit vs Premium</p>
        <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ flex:1 }} />
            <div style={{ width:64, textAlign:"center" }}><p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)" }}>Gratuit</p></div>
            <div style={{ width:64, textAlign:"center" }}><p style={{ fontSize:11, fontWeight:700, color:"#E8C060" }}>★ Gold</p></div>
          </div>
          {COMPARE.map((row,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", padding:"11px 16px", borderBottom: i < COMPARE.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <p style={{ flex:1, fontSize:12, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>{row.feat}</p>
              <div style={{ width:64, textAlign:"center", fontSize:15 }}>{row.free ? <span style={{ color:"#3DAA7F" }}>✓</span> : <span style={{ color:"rgba(255,255,255,0.2)" }}>—</span>}</div>
              <div style={{ width:64, textAlign:"center", fontSize:15 }}>{row.gold ? <span style={{ color:"#E8C060" }}>★</span> : "—"}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"24px 20px 40px" }}>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textDecoration:"line-through" }}>9,99 € / mois</p>
          <p style={{ fontSize:28, fontWeight:800, color:"#E8C060", fontFamily:"'Playfair Display',serif" }}>4,99 € <span style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.5)" }}>/ mois</span></p>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:4 }}>ou 39,99 € / an — économise 33 %</p>
        </div>
        <button onClick={handleActivate}
          style={{ width:"100%", padding:"16px", borderRadius:16, border:"none", cursor:"pointer", background: activated ? "linear-gradient(135deg,#2A7A5A,#3DAA7F)" : "linear-gradient(135deg,#C49A3C,#E8C060)", color:"#fff", fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif", boxShadow: activated ? "0 0 30px rgba(61,170,127,0.5)" : "0 0 30px rgba(196,154,60,0.5)", transition:"all 0.4s" }}>
          {activated ? "✓ Premium activé !" : "✨ Commencer mon essai gratuit · 7 jours"}
        </button>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textAlign:"center", marginTop:10 }}>Sans engagement · Annulation à tout moment</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
ROOT
───────────────────────────────────────── */
export default function App() {
  const [onboarded,   setOnboarded]   = useState(false);
  const [tab,         setTab]         = useState("home");
  const [dark,        setDark]        = useState(false);
  const [hassanates,  setH]           = useState(1240);
  const [streak]                      = useState(7);
  const [readingMins, setReadingMins] = useState(12);
  const [goalMins,    setGoalMins]    = useState(15);
  const [notes,       setNotes]       = useState({});
  const [toast,       setToast]       = useState(null);
  const [reader,      setReader]      = useState(null);
  const [isPremium,   setIsPremium]   = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const tRef = useRef(null);

  const showToast   = m => { setToast(m); clearTimeout(tRef.current); tRef.current = setTimeout(() => setToast(null), 2000); };
  const addH        = n => setH(p => p + n);
  const openPremium = () => setShowPremium(true);

  const nav = [
    { id:"home",     icon:"🏠", label:"Accueil"  },
    { id:"quran",    icon:"📖", label:"Coran"    },
    { id:"dhikr",    icon:"📿", label:"Dhikr"    },
    { id:"serenite", icon:"🌿", label:"Sérénité" },
    { id:"profil",   icon:"👤", label:"Profil"   },
  ];

  if (!onboarded) return (
    <>
      <Styles />
      <Onboarding onDone={() => setOnboarded(true)} />
    </>
  );

  return (
    <>
      <Styles />
      <div className={`app${dark ? " dark" : ""}`}>

        {/* TOP BAR */}
        {!reader && !showPremium && (
          <div style={{ padding:"10px 16px 0", flexShrink:0 }}>
            <div className="status-bar">
              <div className="stat-chip"><span style={{ color:"var(--heart)" }}>♥</span>{hassanates.toLocaleString()}</div>
              <div className="stat-chip"><span className="fire">🔥</span>{streak}j</div>
              <div className="stat-chip">⏱️ {readingMins} min</div>
              {isPremium
                ? <span style={{ fontSize:11, fontWeight:700, color:"var(--gold)" }}>★ Gold</span>
                : <button onClick={openPremium} style={{ background:"linear-gradient(135deg,#C49A3C,#E8C060)", border:"none", borderRadius:999, padding:"3px 10px", cursor:"pointer", fontSize:11, fontWeight:700, color:"#fff" }}>★ Premium</button>
              }
              <button onClick={() => setDark(!dark)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:17 }}>{dark ? "☀️" : "🌙"}</button>
            </div>
          </div>
        )}

        {/* SCREENS */}
        {!reader && !showPremium && tab === "home"     && <HomeScreen hassanates={hassanates} streak={streak} readingMins={readingMins} onStart={() => { setReader({ id:1, name:"Al-Fatiha", arabic:"الفاتحة", verses:7, rev:"Mecquoise" }); setTab("quran"); }} />}
        {!reader && !showPremium && tab === "quran"    && <QuranScreen onOpen={s => setReader(s)} />}
        {!reader && !showPremium && tab === "dhikr"    && <DhikrScreen onAddH={addH} toast={showToast} />}
        {!reader && !showPremium && tab === "serenite" && <SereniteScreen />}
        {!reader && !showPremium && tab === "profil"   && <ProfilScreen hassanates={hassanates} streak={streak} readingMins={readingMins} goalMins={goalMins} setGoalMins={setGoalMins} onOpenPremium={openPremium} isPremium={isPremium} />}

        {/* READER */}
        {reader && (
          <VerseReader
            surah={reader}
            onClose={() => setReader(null)}
            onAddH={addH}
            notes={notes}
            setNotes={setNotes}
            goalSecs={goalMins * 60}
            onTimeSpent={s => setReadingMins(m => m + Math.round(s / 60))}
            isPremium={isPremium}
            onOpenPremium={openPremium}
          />
        )}

        {/* PREMIUM */}
        {showPremium && (
          <PremiumPage
            onClose={() => setShowPremium(false)}
            onActivate={() => { setIsPremium(true); showToast("★ Premium Gold activé !"); }}
          />
        )}

        {/* TOAST */}
        {toast && <div className="toast">{toast}</div>}

        {/* NAV */}
        {!reader && !showPremium && (
          <nav className="nav-bar">
            {nav.map(it => (
              <div key={it.id} className={`nav-item${tab === it.id ? " active" : ""}`} onClick={() => setTab(it.id)}>
                <span style={{ fontSize:20 }}>{it.icon}</span>
                <span className="nav-lbl">{it.label}</span>
              </div>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
