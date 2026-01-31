## What’s happening (so it’s less confusing)
- **Text cut-off** is almost always caused by the overlay/container (or OBS browser source) clipping content while the text uses outlines/shadows or the alert is scaled.
- **“Duration should be measured by GIF duration”** is only automatically possible when we *know* the GIF duration (we have this for **Library GIFs** via `approved_gifs.duration_seconds`). For **Custom GIF URL / uploaded GIF**, the duration is not reliably detectable in the browser without heavy parsing, so we should store a duration value in settings.
- **“Tip-to-Play should also allow a GIF upload”** means tip rules need optional media (GIF) in addition to sound.

## Behavior rules (clear, predictable)
- **Per alert, audio plays once** (tip sound replaces default/custom sound when matched).
- **TTS is a separate channel** and plays **after** the alert sound (sequential).
- **Alert ends = everything stops**: sound, TTS, and visibility end together.
- **Media precedence**:
  1) Tip rule media (if configured for that amount)
  2) Library GIF (if enabled)
  3) Default Alert Media (emoji/custom GIF URL/none)
  4) Fallback emoji (if needed)

## Changes to implement
### 1) Fix text clipping (no more cut-off)
- Remove any clipping containers (`overflow-hidden`) around the alert content.
- Add safe padding/margins so outlined text never touches edges.
- Ensure text wraps properly (`break-words`, `max-w`, responsive sizing).
- Verify the Browser Source recommendation: set OBS browser size to the same logical canvas (e.g. 512×512) and avoid OBS cropping.

### 2) “Match alert duration to GIF duration”
- Add a **“Match GIF duration”** option in Streamer Settings.
- Implement duration selection:
  - If Library GIF active and has `duration_seconds`, use it.
  - If Custom GIF URL active, use a new setting like `custom_gif_duration_seconds`.
  - If tip rule has a GIF, use its stored `gif_duration_seconds`.
  - Fallback to `alert_duration` when none is set.

### 3) Add GIF upload for Tip-to-Play rules
- Extend DB (`tip_sounds`) to support optional media:
  - `media_type` (none|library_gif|custom_gif_url|uploaded_gif)
  - `gif_id` (for library)
  - `gif_url` (for custom/uploaded)
  - `gif_duration_seconds`
- Add a new Supabase Storage bucket (e.g. `alert-gifs`) with RLS similar to `alert-sounds`.
- Add UI under each tip rule:
  - Choose media source (None / Library / URL / Upload)
  - Set duration seconds (optional but recommended)

### 4) Make the “combo list” achievable via settings (without 27 separate modes)
- Keep a small set of toggles that combine into those outcomes:
  - Sound Enabled
  - TTS Enabled
  - Show Message
  - Default Alert Media (emoji/custom gif/none)
  - Library GIF Alerts (on/off)
  - Match GIF duration (on/off)
- Ensure global toggles behave as you listed:
  - GIFs disabled → show text-only container
  - Audio disabled → TTS + message still possible
  - Custom audio fails → fallback to default
  - Custom GIF fails → fallback to Library (if enabled) → else emoji

## Verification
- Add a debug mode on the overlay to simulate:
  - exact-match tip amounts
  - audio disabled / gifs disabled
  - custom URL failures
  - long message wrapping
- Run build and do a quick OBS-friendly visual check at 512×512.

If you confirm, I’ll implement these changes end-to-end (SQL migration + UI + overlay logic + fallbacks) following the behavior rules above.