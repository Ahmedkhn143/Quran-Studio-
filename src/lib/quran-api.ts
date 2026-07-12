/**
 * Quran API helpers.
 *
 * Uses two free public APIs (no key required):
 *  - api.alquran.cloud  → surah list, ayah-level text + audio, translations
 *  - api.quran.com      → word-by-word text + per-word audio + word translation
 *
 * Audio CDN: https://cdn.islamic.network/quran/audio (ayah-level)
 *            https://audio.qurancdn.com (word-level)
 */

const BASE = "https://api.alquran.cloud/v1";
const QURAN_COM = "https://api.quran.com/api/v4";
const WORD_AUDIO_CDN = "https://audio.qurancdn.com";
const AYAH_AUDIO_CDN = "https://cdn.islamic.network/quran/audio";

function proxiedAudioUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return `/api/audio?src=${encodeURIComponent(url)}`;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
}

export interface WordToken {
  text: string;
  audio?: string;
  translation?: string;
  transliteration?: string;
}

export interface Reciter {
  id: string;
  name: string;
  englishName: string;
  style?: string;
}

export interface TranslationEdition {
  id: string;
  name: string;
  language: string;
  englishName: string;
}

/**
 * Curated list of reciters available on islamic.network CDN.
 */
export const RECITERS: Reciter[] = [
  { id: "ar.alafasy", name: "مشاري العفاسي", englishName: "Mishary Alafasy", style: "Murattal" },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد", englishName: "Abdul Basit (Murattal)", style: "Murattal" },
  { id: "ar.abdullahbasfar", name: "عبد الله بصفر", englishName: "Abdullah Basfar", style: "Murattal" },
  { id: "ar.abdurrahmaansudais", name: "عبد الرحمن السديس", englishName: "Abdurrahmaan As-Sudais", style: "Murattal" },
  { id: "ar.hanirifai", name: "هاني الرفاعي", englishName: "Hani Rifai", style: "Murattal" },
  { id: "ar.husary", name: "محمود خليل الحصري", englishName: "Mahmoud Khalil Al-Husary", style: "Murattal" },
  { id: "ar.husarymujawwad", name: "محمود خليل الحصري", englishName: "Mahmoud Khalil Al-Husary", style: "Mujawwad" },
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي", englishName: "Maher Al Muaiqly", style: "Murattal" },
  { id: "ar.minshawi", name: "محمد صديق المنشاوي", englishName: "Mohamed Siddiq Al-Minshawi", style: "Murattal" },
  { id: "ar.minshawimujawwad", name: "محمد صديق المنشاوي", englishName: "Mohamed Siddiq Al-Minshawi", style: "Mujawwad" },
  { id: "ar.muhammadayyoub", name: "محمد أيوب", englishName: "Muhammad Ayyoub", style: "Murattal" },
  { id: "ar.muhammadjibreel", name: "محمد جبريل", englishName: "Muhammad Jibreel", style: "Murattal" },
  { id: "ar.saoodshuraym", name: "سعود الشريم", englishName: "Saood bin Ibraaheem Ash-Shuraym", style: "Murattal" },
  { id: "ar.shaatree", name: "أبو بكر الشاطري", englishName: "Abu Bakr Ash-Shaatree", style: "Murattal" },
  { id: "ar.ahmedajamy", name: "أحمد العجمي", englishName: "Ahmed ibn Ali al-Ajamy", style: "Murattal" },
  { id: "ar.aliajaber", name: "علي جابر", englishName: "Ali Jaber", style: "Murattal" },
  { id: "ar.saadghamidi", name: "سعد الغامدي", englishName: "Saad Al-Ghamdi", style: "Murattal" },
  { id: "ar.yasseraldossari", name: "ياسر الدوسري", englishName: "Yasser Al-Dossari", style: "Murattal" },
  { id: "ar.khaledaljaleel", name: "خالد الجليل", englishName: "Khaled Al-Jaleel", style: "Murattal" },
  { id: "ar.nasseralqatami", name: "ناصر القطامي", englishName: "Nasser Al-Qatami", style: "Murattal" },
  { id: "ar.farisabbad", name: "فارس عباد", englishName: "Faris Abbad", style: "Murattal" },
  { id: "ar.salahalbudair", name: "صلاح البدير", englishName: "Salah Al-Budair", style: "Murattal" },
  { id: "ar.alhuthaify", name: "علي الحذيفي", englishName: "Ali Al-Huthaify", style: "Murattal" },
];

export const TRANSLATIONS: TranslationEdition[] = [
  { id: "en.asad", name: "Muhammad Asad", language: "English", englishName: "Muhammad Asad" },
  { id: "en.pickthall", name: "Marmaduke Pickthall", language: "English", englishName: "Pickthall" },
  { id: "en.sahih", name: "Sahih International", language: "English", englishName: "Sahih International" },
  { id: "en.transliteration", name: "Transliteration", language: "English", englishName: "Transliteration" },
  { id: "ur.kanzuliman", name: "کنزالایمان", language: "Urdu", englishName: "Kanzul Iman" },
  { id: "ur.jalandhry", name: "فتح محمد جالندھری", language: "Urdu", englishName: "Jalandhry" },
  { id: "fr.hamidullah", name: "Hamidullah", language: "French", englishName: "Hamidullah" },
  { id: "es.cortes", name: "Cortés", language: "Spanish", englishName: "Cortes" },
  { id: "id.indonesian", name: "Bahasa Indonesia", language: "Indonesian", englishName: "Indonesian" },
  { id: "tr.diyanet", name: "Diyanet", language: "Turkish", englishName: "Diyanet" },
  { id: "ru.kuliev", name: "Кулиев", language: "Russian", englishName: "Kuliev" },
  { id: "bn.bengali", name: "বাংলা", language: "Bengali", englishName: "Bengali" },
  { id: "ms.basmeih", name: "Basmeih", language: "Malay", englishName: "Basmeih" },
  { id: "zh.jian", name: "中文", language: "Chinese", englishName: "Chinese (Simplified)" },
  { id: "pt.elhayek", name: "El Hayek", language: "Portuguese", englishName: "El Hayek" },
  { id: "de.aburida", name: "Abu Rida", language: "German", englishName: "Abu Rida" },
  { id: "hi.farooq", name: "फ़ारूक़", language: "Hindi", englishName: "Farooq" },
  { id: "fa.ansarian", name: "انصاریان", language: "Persian", englishName: "Ansarian" },
];

export interface SurahListItem {
  number: number;
  englishName: string;
  name: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

let surahListCache: SurahListItem[] | null = null;

export async function fetchSurahList(): Promise<SurahListItem[]> {
  if (surahListCache) return surahListCache;
  try {
    const res = await fetch(`${BASE}/surah`, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`Failed to fetch surah list: ${res.status}`);
    const json = await res.json();
    surahListCache = (json.data as Surah[]).map((s) => ({
      number: s.number,
      englishName: s.englishName,
      name: s.name,
      englishNameTranslation: s.englishNameTranslation,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: s.revelationType,
    }));
    return surahListCache;
  } catch (err) {
    console.error("fetchSurahList error:", err);
    return [];
  }
}

export interface AyahFull {
  numberInSurah: number;
  text: string;
  audio: string; // ayah-level audio URL
  words: WordToken[];
  translation?: string;
  globalNumber: number;
}

/**
 * Fetch a single ayah with Arabic text, per-word audio + translation text.
 *
 * Strategy:
 *  1. Use api.quran.com /verses/by_key/{surah}:{ayah}?words=true for word-by-word
 *     text + audio URLs + per-word translation (English only via wbw endpoint).
 *  2. Use api.alquran.cloud /surah/{n}/{reciter} for the ayah-level audio URL.
 *  3. Optionally fetch translation text from api.alquran.cloud /surah/{n}/{translation}.
 */
export async function fetchAyah(
  surahNumber: number,
  ayahNumber: number,
  reciterId: string,
  translationId?: string
): Promise<AyahFull | null> {
  try {
    // 1) Word-by-word data from quran.com
    const verseKey = `${surahNumber}:${ayahNumber}`;
    const wordRes = await fetch(
      `${QURAN_COM}/verses/by_key/${verseKey}?words=true&word_fields=text_uthmani,code_v1,text&fields=text_uthmani`,
      { next: { revalidate: 86400 } }
    );
    if (!wordRes.ok) throw new Error(`quran.com fetch failed: ${wordRes.status}`);
    const wordJson = await wordRes.json();
    const verse = wordJson.verse;
    if (!verse) return null;

    const words: WordToken[] = (verse.words || [])
      .filter((w: any) => w.char_type_name === "word")
      .map((w: any) => ({
        text: w.text_uthmani || w.text || "",
        audio: proxiedAudioUrl(
          w.audio_url ? `${WORD_AUDIO_CDN}/${w.audio_url}` : undefined
        ),
        translation: w.translation?.text || undefined,
        transliteration: w.transliteration?.text || undefined,
      }));

    // 2) Ayah-level audio from alquran.cloud
    //    We fetch the full surah in the reciter edition to get global ayah numbers + audio URLs.
    let ayahAudio = "";
    let globalNumber = 0;
    try {
      const reciterRes = await fetch(
        `${BASE}/surah/${surahNumber}/${reciterId}`,
        { next: { revalidate: 86400 } }
      );
      if (reciterRes.ok) {
        const reciterJson = await reciterRes.json();
        const ayahObj = reciterJson.data.ayahs[ayahNumber - 1];
        if (ayahObj) {
          ayahAudio = ayahObj.audio as string;
          globalNumber = ayahObj.number as number;
        }
      }
    } catch {
      // ignore
    }

    // Fallback if we didn't get the audio URL — construct it from the global ayah number.
    // (We can't do this without globalNumber, so we use verse.id from quran.com if needed.)
    if (!ayahAudio) {
      // quran.com's verse.id IS the global ayah number.
      globalNumber = (verse.id as number) || 0;
      if (globalNumber) {
        ayahAudio = `${AYAH_AUDIO_CDN}/128/${reciterId}/${globalNumber}.mp3`;
      }
    }

    ayahAudio = proxiedAudioUrl(ayahAudio) || "";

    // 3) Translation text from alquran.cloud
    let translation: string | undefined;
    if (translationId) {
      try {
        const trRes = await fetch(
          `${BASE}/surah/${surahNumber}/${translationId}`,
          { next: { revalidate: 86400 } }
        );
        if (trRes.ok) {
          const trJson = await trRes.json();
          const trAyah = trJson.data.ayahs[ayahNumber - 1];
          if (trAyah) translation = trAyah.text as string;
        }
      } catch {
        // ignore translation failures
      }
    }

    return {
      numberInSurah: ayahNumber,
      text: verse.text_uthmani || verse.text || "",
      audio: ayahAudio,
      words,
      translation,
      globalNumber,
    };
  } catch (err) {
    console.error("fetchAyah error:", err);
    return null;
  }
}
