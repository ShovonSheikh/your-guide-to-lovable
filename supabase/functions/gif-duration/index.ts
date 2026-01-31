import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Result =
  | { ok: true; seconds: number; ceilSeconds: number; frames: number; totalMs: number }
  | { ok: false; error: string };

const readUInt16LE = (bytes: Uint8Array, i: number) => bytes[i] | (bytes[i + 1] << 8);

const skipSubBlocks = (bytes: Uint8Array, start: number) => {
  let i = start;
  while (i < bytes.length) {
    const size = bytes[i];
    i += 1;
    if (size === 0) return i;
    i += size;
  }
  return i;
};

const parseGifDuration = (bytes: Uint8Array): Result => {
  if (bytes.length < 14) return { ok: false, error: "File too small" };
  const header = String.fromCharCode(...bytes.slice(0, 6));
  if (header !== "GIF87a" && header !== "GIF89a") return { ok: false, error: "Not a GIF" };

  const packed = bytes[10];
  const hasGct = (packed & 0x80) !== 0;
  const gctSize = hasGct ? 3 * (1 << ((packed & 0x07) + 1)) : 0;

  let i = 13 + gctSize;
  let currentDelayHundredths: number | null = null;
  let frames = 0;
  let totalMs = 0;

  while (i < bytes.length) {
    const b = bytes[i];

    if (b === 0x3b) break;

    if (b === 0x21) {
      const label = bytes[i + 1];
      if (label === 0xf9) {
        const blockSize = bytes[i + 2];
        if (blockSize !== 4) return { ok: false, error: "Invalid GCE block" };
        const delay = readUInt16LE(bytes, i + 4);
        currentDelayHundredths = delay;
        i += 8;
        continue;
      }

      i += 2;
      const blockSize = bytes[i];
      i += 1 + blockSize;
      i = skipSubBlocks(bytes, i);
      continue;
    }

    if (b === 0x2c) {
      const packedFields = bytes[i + 9];
      const hasLct = (packedFields & 0x80) !== 0;
      const lctSize = hasLct ? 3 * (1 << ((packedFields & 0x07) + 1)) : 0;

      i += 10 + lctSize;

      i += 1;
      i = skipSubBlocks(bytes, i);

      const delayHundredths = currentDelayHundredths ?? 10;
      const clampedHundredths = delayHundredths < 2 ? 10 : delayHundredths;
      totalMs += clampedHundredths * 10;
      frames += 1;
      currentDelayHundredths = null;
      continue;
    }

    return { ok: false, error: "Invalid GIF structure" };
  }

  if (frames === 0) return { ok: false, error: "No frames found" };
  const seconds = totalMs / 1000;
  const ceilSeconds = Math.max(1, Math.ceil(seconds));
  return { ok: true, seconds, ceilSeconds, frames, totalMs };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    const url = body?.url?.trim();
    if (!url) {
      return new Response(JSON.stringify({ ok: false, error: "Missing url" } satisfies Result), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid url" } satisfies Result), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new Response(JSON.stringify({ ok: false, error: "Invalid url protocol" } satisfies Result), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(parsed.toString(), {
      headers: {
        "user-agent": "tipkoro-gif-duration/1.0",
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: `Fetch failed (${res.status})` } satisfies Result), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength) {
      const size = Number(contentLength);
      if (Number.isFinite(size) && size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ ok: false, error: "GIF too large" } satisfies Result), {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ ok: false, error: "GIF too large" } satisfies Result), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = parseGifDuration(bytes);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Server error" } satisfies Result), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

