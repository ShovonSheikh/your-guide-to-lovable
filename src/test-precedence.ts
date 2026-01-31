
import React from 'react';

// Mock types
interface TipSound {
  media_type: 'none' | 'library' | 'url' | 'upload';
  gif_id?: string | null;
  gif_url?: string | null;
}

interface Settings {
  gifs_paused: boolean;
  gif_enabled: boolean;
  alert_media_type: 'emoji' | 'gif' | 'none';
  alert_gif_url?: string;
  alert_emoji?: string;
}

interface ApprovedGif {
  id: string;
  url: string;
  name: string;
}

function testGetMediaNode(
  activeTipSound: TipSound | null,
  settings: Settings,
  approvedGifs: ApprovedGif[],
  approvedGif: ApprovedGif | null,
  tipGifFailed: boolean,
  libraryGifFailed: boolean
) {
  if (settings?.gifs_paused) return 'NULL (Paused)';

  if (activeTipSound?.media_type && activeTipSound.media_type !== 'none' && !tipGifFailed) {
    if (activeTipSound.media_type === 'library' && activeTipSound.gif_id) {
      const gif = approvedGifs.find((g) => g.id === activeTipSound.gif_id);
      if (gif?.url) {
        return `Tip Media (Library): ${gif.url}`;
      }
    }

    if ((activeTipSound.media_type === 'url' || activeTipSound.media_type === 'upload') && activeTipSound.gif_url) {
      return `Tip Media (URL): ${activeTipSound.gif_url}`;
    }
  }

  // If GIF is enabled and not paused, show approved GIF
  if (settings?.gif_enabled && approvedGif && !libraryGifFailed) {
    return `Global Library GIF: ${approvedGif.url}`;
  }

  const mediaType = settings?.alert_media_type ?? 'emoji';
  if (mediaType === 'none') return 'NULL (None)';
  if (mediaType === 'gif') {
    return `Default Alert Media (GIF): ${settings?.alert_gif_url}`;
  }
  return `Default Alert Media (Emoji): ${settings?.alert_emoji}`;
}

// Scenario: Tip matches rule with GIF, but Default Library GIF is also enabled.
const scenario1 = () => {
  const activeTipSound: TipSound = {
    media_type: 'library',
    gif_id: 'gif-1',
  };
  const settings: Settings = {
    gifs_paused: false,
    gif_enabled: true, // Default Library GIF enabled
    alert_media_type: 'emoji',
  };
  const approvedGifs: ApprovedGif[] = [
    { id: 'gif-1', url: 'http://tip-gif.com', name: 'Tip Gif' },
    { id: 'gif-2', url: 'http://default-gif.com', name: 'Default Gif' },
  ];
  const approvedGif: ApprovedGif = approvedGifs[1]; // Default is gif-2

  console.log('Scenario 1 (Tip has GIF, Default is Library GIF):', 
    testGetMediaNode(activeTipSound, settings, approvedGifs, approvedGif, false, false)
  );
};

// Scenario: Tip matches rule with GIF, but Default Alert Media is Custom GIF.
const scenario2 = () => {
  const activeTipSound: TipSound = {
    media_type: 'library',
    gif_id: 'gif-1',
  };
  const settings: Settings = {
    gifs_paused: false,
    gif_enabled: false,
    alert_media_type: 'gif', // Default is Custom GIF
    alert_gif_url: 'http://custom-default.gif'
  };
  const approvedGifs: ApprovedGif[] = [
    { id: 'gif-1', url: 'http://tip-gif.com', name: 'Tip Gif' },
  ];
  
  console.log('Scenario 2 (Tip has GIF, Default is Custom GIF):', 
    testGetMediaNode(activeTipSound, settings, approvedGifs, null, false, false)
  );
};

// Scenario: Tip has NO media, Default Library GIF enabled.
const scenario3 = () => {
  const activeTipSound: TipSound = {
    media_type: 'none',
  };
  const settings: Settings = {
    gifs_paused: false,
    gif_enabled: true, 
    alert_media_type: 'emoji',
  };
  const approvedGifs: ApprovedGif[] = [
    { id: 'gif-2', url: 'http://default-gif.com', name: 'Default Gif' },
  ];
  const approvedGif: ApprovedGif = approvedGifs[0];

  console.log('Scenario 3 (Tip has NO media, Default is Library GIF):', 
    testGetMediaNode(activeTipSound, settings, approvedGifs, approvedGif, false, false)
  );
};

scenario1();
scenario2();
scenario3();
