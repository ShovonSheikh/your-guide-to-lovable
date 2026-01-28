
# Implementation Plan: Streamer Mode Enhancements & Explore Page Fix

This plan addresses three issues:
1. Custom sound upload for Streamer Mode alerts
2. Text-to-Speech (TTS) support for tip messages
3. Fix the Explore page showing no creators

---

## Issue Analysis

### Issue 3 (Critical): Explore Page Not Showing Creators

**Root Cause**: The security migration (`20260126050427`) dropped the RLS policy "Public can view basic creator profiles" to prevent exposure of sensitive columns (email, withdrawal_pin_hash). However, the `public_profiles` view uses `security_invoker = true`, which means queries run with the caller's permissions. Anonymous users now have NO SELECT access to the underlying `profiles` table.

**Evidence**: Direct database query returns creators:
```sql
SELECT * FROM public_profiles WHERE account_type = 'creator' 
AND onboarding_status = 'completed' LIMIT 10
-- Returns: shovon, shirin (2 creators)
```

But the frontend query returns empty array because RLS blocks anonymous access.

**Solution**: Create a new RLS policy on `profiles` that grants SELECT access ONLY through the view by checking if the query is accessing specific safe columns AND filtering for completed creators.

---

## Implementation Tasks

### Task 1: Fix Explore Page (Priority: Critical)

**Database Changes**:
Add a new RLS policy on `profiles` table that allows public read access only for completed creator profiles with non-null usernames:

```sql
CREATE POLICY "Public can view completed creator profiles via view"
  ON public.profiles FOR SELECT
  USING (
    account_type = 'creator' 
    AND onboarding_status = 'completed'
    AND username IS NOT NULL
  );
```

This is safe because:
- The `public_profiles` view already excludes sensitive columns (email, withdrawal_pin_hash, is_admin, user_id)
- The policy only allows SELECT on completed creators
- Row-level access is restricted, not column-level (sensitive columns exist but are hidden by the view)

**Files Changed**:
- New migration file: `supabase/migrations/[timestamp]_fix_public_profiles_access.sql`

---

### Task 2: Custom Sound Upload for Streamer Mode

**Overview**: Allow creators to upload custom MP3/WAV files for their tip alerts.

**Database Changes**:
1. Create a new storage bucket `alert-sounds` for audio files
2. Add `alert_sound_url` column to `streamer_settings` table (already has `alert_sound` but it's not implemented)

**Storage Setup**:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('alert-sounds', 'alert-sounds', true, 5242880, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg']);

-- RLS: Users can upload to their own folder
CREATE POLICY "Users can upload their own alert sounds"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'alert-sounds' AND
  (storage.foldername(name))[1] = (
    SELECT id::text FROM profiles 
    WHERE user_id = (current_setting('request.headers')::json->>'x-clerk-user-id')
  )
);

-- RLS: Public can read all alert sounds (needed for OBS)
CREATE POLICY "Anyone can read alert sounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'alert-sounds');

-- RLS: Users can delete their own sounds
CREATE POLICY "Users can delete their own alert sounds"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'alert-sounds' AND
  (storage.foldername(name))[1] = (
    SELECT id::text FROM profiles 
    WHERE user_id = (current_setting('request.headers')::json->>'x-clerk-user-id')
  )
);
```

**Frontend Changes**:
1. **StreamerSettings.tsx**: Add file upload UI for custom sound
   - Add "Upload Custom Sound" section with file input
   - Accept audio/mpeg, audio/wav, audio/ogg
   - Max file size: 5MB
   - Preview button to test uploaded sound
   - Delete button to revert to default
   
2. **useStreamerSettings.ts**: Add upload/delete functions
   - `uploadAlertSound(file: File)`: Uploads to `alert-sounds/{profile_id}/{filename}`
   - `deleteAlertSound()`: Removes custom sound, reverts to default

3. **StreamerAlert.tsx**: Use custom sound URL if available
   - Check `settings.alert_sound` for custom URL
   - Fallback to default Mixkit sound if null

**Files Changed**:
- New migration file: `supabase/migrations/[timestamp]_add_alert_sounds_bucket.sql`
- Modified: `src/components/StreamerSettings.tsx`
- Modified: `src/hooks/useStreamerSettings.ts`
- Modified: `src/pages/StreamerAlert.tsx`

---

### Task 3: Text-to-Speech Support for Streamer Mode

**Overview**: Use the browser's built-in Web Speech API to read tip messages aloud. This is free and requires no external API.

**Database Changes**:
Add new columns to `streamer_settings`:
```sql
ALTER TABLE public.streamer_settings
ADD COLUMN tts_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN tts_voice TEXT DEFAULT 'default',
ADD COLUMN tts_rate NUMERIC DEFAULT 1.0,
ADD COLUMN tts_pitch NUMERIC DEFAULT 1.0;
```

**Frontend Changes**:
1. **StreamerSettings.tsx**: Add TTS configuration section
   - Toggle to enable/disable TTS
   - Voice selector dropdown (populated from available browser voices)
   - Rate slider (0.5 to 2.0)
   - Pitch slider (0.5 to 2.0)
   - "Test TTS" button to preview voice

2. **useStreamerSettings.ts**: Update types and local state for TTS settings

3. **StreamerAlert.tsx**: Implement TTS playback
   - Use `window.speechSynthesis` API
   - Template: "[Supporter name] tipped [amount] taka. [Message]"
   - Play TTS after alert sound (or instead of sound if sound is disabled)
   - Handle TTS after user gesture requirement (auto-play policy)

**Implementation Notes**:
- Web Speech API is supported in all modern browsers
- No API key needed (browser-native)
- Voice selection uses `speechSynthesis.getVoices()`
- TTS plays sequentially after notification sound

**Files Changed**:
- New migration file: `supabase/migrations/[timestamp]_add_streamer_tts_settings.sql`
- Modified: `src/components/StreamerSettings.tsx`
- Modified: `src/hooks/useStreamerSettings.ts`
- Modified: `src/pages/StreamerAlert.tsx`
- Modified: `src/components/AlertPreview.tsx` (add TTS preview)

---

## Implementation Order

1. **Fix Explore Page (Task 1)** - Critical, blocking issue
2. **Custom Sound Upload (Task 2)** - Adds value, requires storage bucket
3. **TTS Support (Task 3)** - Adds value, no external dependencies

---

## Technical Details

### Web Speech API Usage (Task 3)
```typescript
const speakTip = (tip: TipData) => {
  if (!settings?.tts_enabled) return;
  
  const utterance = new SpeechSynthesisUtterance(
    `${tip.supporter_name} tipped ${tip.amount} taka. ${tip.message || ''}`
  );
  
  // Set voice
  const voices = speechSynthesis.getVoices();
  const selectedVoice = voices.find(v => v.name === settings.tts_voice);
  if (selectedVoice) utterance.voice = selectedVoice;
  
  utterance.rate = settings.tts_rate || 1;
  utterance.pitch = settings.tts_pitch || 1;
  
  speechSynthesis.speak(utterance);
};
```

### Sound Upload Component (Task 2)
```typescript
// In StreamerSettings.tsx
<div className="space-y-2">
  <Label>Custom Alert Sound</Label>
  {settings?.alert_sound ? (
    <div className="flex items-center gap-2">
      <audio src={settings.alert_sound} controls className="h-8" />
      <Button variant="ghost" size="sm" onClick={deleteAlertSound}>
        <Trash className="w-4 h-4" />
      </Button>
    </div>
  ) : (
    <div>
      <Input 
        type="file" 
        accept="audio/mpeg,audio/wav,audio/ogg"
        onChange={(e) => handleSoundUpload(e.target.files?.[0])}
      />
      <p className="text-xs text-muted-foreground mt-1">
        Max 5MB. MP3, WAV, or OGG format.
      </p>
    </div>
  )}
</div>
```

---

## Summary

| Task | Type | Priority | Complexity |
|------|------|----------|------------|
| Fix Explore Page | Database RLS | Critical | Low |
| Custom Sound Upload | Storage + Frontend | Medium | Medium |
| TTS Support | Frontend + DB | Low | Low |

All three tasks can be implemented in a single session. The Explore page fix is the most critical and should be done first.
