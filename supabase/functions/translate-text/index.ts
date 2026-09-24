import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LANG_MAP: Record<string, string> = {
  vi: "vi",
  en: "en",
  kr: "ko",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, target_langs } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targets = (target_langs as string[]) ?? ["vi", "en", "kr"];
    const results: Record<string, string> = {};

    // Detect source language from the text
    const sourceLang = detectLang(text);

    for (const target of targets) {
      const mapped = LANG_MAP[target] ?? target;
      if (target === sourceLang) {
        results[target] = text;
      } else {
        results[target] = await translateText(text, mapped);
      }
    }

    return new Response(JSON.stringify({ translations: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function detectLang(text: string): string {
  // Korean: Hangul syllables
  if (/[\uAC00-\uD7AF]/.test(text)) return "kr";
  // Vietnamese: typical diacritics
  if(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return "vi";
  return "en";
}

async function translateText(text: string, target: string): Promise<string> {
  // Use Google Translate's free endpoint (unofficial but widely used)
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!resp.ok) {
    return text; // fallback to original
  }
  const data = await resp.json();
  // Response: [[["translated","original",...],...], ...]
  if (Array.isArray(data) && Array.isArray(data[0])) {
    const translated = data[0]
      .map((seg: unknown[]) => (Array.isArray(seg) ? String(seg[0] ?? "") : ""))
      .join("");
    return translated || text;
  }
  return text;
}
