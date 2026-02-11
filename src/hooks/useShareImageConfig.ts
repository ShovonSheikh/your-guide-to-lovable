import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseWithAuth } from './useSupabaseWithAuth';
import type { Json } from '@/integrations/supabase/types';

export interface ShareImageConfig {
  backgroundColor: string;
  cardBackgroundColor: string;
  accentColor: string;
  textColor: string;
  secondaryTextColor: string;
  font: 'Fredoka' | 'DM Sans' | 'Inter' | 'Poppins';
  cardStyle: 'celebration' | 'minimal' | 'dark';
  showConfetti: boolean;
  brandingText: string;
  logoUrl: string | null;
}

export interface ShareImageTemplate {
  jsx: string;
  css: string;
}

export const defaultShareImageConfig: ShareImageConfig = {
  backgroundColor: 'linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 100%)',
  cardBackgroundColor: '#ffffff',
  accentColor: '#d4a24a',
  textColor: '#2d1810',
  secondaryTextColor: '#5a4a3a',
  font: 'Fredoka',
  cardStyle: 'celebration',
  showConfetti: true,
  brandingText: 'Support creators with TipKoro',
  logoUrl: 'https://i.ibb.co.com/hF035hX2/2026-01-16-21-27-58-your-guide-to-lovable-Antigravity-tip-share-image-guide-txt-removebg-preview.png',
};

// Default JSX template with dynamic variable placeholders
export const defaultJsxTemplate = `// TipKoro Share Image Template
// Available variables: {{creatorName}}, {{tipAmount}}, {{userMessage}}, {{timestamp}}, {{supporterName}}, {{currency}}, {{avatarUrl}}

<div className="tipkoro-card-wrapper">
  {/* Decorative confetti background */}
  <div className="tipkoro-confetti">
    {/* Curved pieces */}
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece1"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece2"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece3"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece4"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece5"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece6"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece7"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece8"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece9"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece10"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece11"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece12"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece13"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece14"></div>
    <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece15"></div>

    {/* Dots */}
    <div className="tipkoro-confetti-piece tipkoro-dot tipkoro-dot1"></div>
    <div className="tipkoro-confetti-piece tipkoro-dot tipkoro-dot2"></div>
    <div className="tipkoro-confetti-piece tipkoro-dot tipkoro-dot3"></div>

    {/* Stars */}
    <div className="tipkoro-star tipkoro-star1"></div>
    <div className="tipkoro-star tipkoro-star2"></div>
    <div className="tipkoro-star tipkoro-star3"></div>
    <div className="tipkoro-star tipkoro-star4"></div>
    <div className="tipkoro-star tipkoro-star5"></div>
    <div className="tipkoro-star tipkoro-star6"></div>

    {/* Sparkles */}
    <div className="tipkoro-sparkle tipkoro-sparkle1"></div>
    <div className="tipkoro-sparkle tipkoro-sparkle2"></div>
    <div className="tipkoro-sparkle tipkoro-sparkle3"></div>
  </div>

  <div className="tipkoro-card-container">
    {/* Logo circle with image */}
    <div className="tipkoro-logo-circle">
      <img
        src="https://i.ibb.co.com/hF035hX2/2026-01-16-21-27-58-your-guide-to-lovable-Antigravity-tip-share-image-guide-txt-removebg-preview.png"
        alt="TipKoro Logo"
        className="tipkoro-logo-img"
      />
    </div>

    {/* Main card */}
    <div className="tipkoro-share-card">
      <h1 className="tipkoro-title">
        You just supported<br />{{creatorName}}!
      </h1>

      <div className="tipkoro-amount">
        <span className="tipkoro-currency">{{currency}}</span>
        <span>{{tipAmount}}</span>
      </div>

      <div className="tipkoro-message-container">
        <div className="tipkoro-message-text">
          Message: {{userMessage}}
        </div>
      </div>

      <div className="tipkoro-date-container">
        <span className="tipkoro-date">{{timestamp}}</span>
      </div>
    </div>
  </div>
</div>`;

// Default CSS template
export const defaultCssTemplate = `/* Main wrapper */
.tipkoro-card-wrapper {
  font-family: 'Fredoka', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
  width: 600px;
  height: 600px;
}

/* Confetti container */
.tipkoro-confetti {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  inset: 0;
}

.tipkoro-confetti-piece {
  position: absolute;
  border-radius: 50%;
}

/* Stars */
.tipkoro-star {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 14px solid #d4af37;
  transform: rotate(35deg);
}

/* Curved pieces */
.tipkoro-curve {
  width: 30px;
  height: 12px;
  border-radius: 50px;
}

/* Confetti positions */
.tipkoro-piece1 { top: 5%; left: 10%; background: #f4c790; transform: rotate(-25deg); width: 28px; height: 10px; }
.tipkoro-piece2 { top: 3%; left: 17%; background: #b8d4c8; transform: rotate(30deg); width: 25px; height: 10px; }
.tipkoro-piece3 { top: 7%; left: 25%; background: #f4d0a0; transform: rotate(-15deg); width: 32px; height: 11px; }
.tipkoro-piece4 { top: 2%; left: 45%; background: #e8d4b8; width: 10px; height: 10px; }
.tipkoro-piece5 { top: 6%; right: 38%; background: #f4c790; transform: rotate(20deg); width: 35px; height: 12px; }
.tipkoro-piece6 { top: 3%; right: 25%; background: #e8d4b8; width: 8px; height: 8px; }
.tipkoro-piece7 { top: 5%; right: 15%; background: #b8d4c8; transform: rotate(-30deg); width: 30px; height: 10px; }
.tipkoro-piece8 { top: 8%; right: 5%; background: #f4d0a0; transform: rotate(25deg); width: 28px; height: 11px; }
.tipkoro-piece9 { top: 3%; right: 3%; background: #e8d4b8; width: 9px; height: 9px; }
.tipkoro-piece10 { top: 25%; left: 3%; background: #b8d4c8; transform: rotate(20deg); width: 26px; height: 10px; }
.tipkoro-piece11 { bottom: 30%; left: 5%; background: #f4c790; transform: rotate(-35deg); width: 30px; height: 11px; }
.tipkoro-piece12 { bottom: 20%; left: 12%; background: #b8d4c8; transform: rotate(15deg); width: 28px; height: 10px; }
.tipkoro-piece13 { bottom: 15%; right: 8%; background: #f4d0a0; transform: rotate(-20deg); width: 32px; height: 11px; }
.tipkoro-piece14 { bottom: 25%; right: 15%; background: #b8d4c8; transform: rotate(30deg); width: 27px; height: 10px; }
.tipkoro-piece15 { top: 35%; right: 2%; background: #e8d4b8; width: 12px; height: 12px; }

/* Dots */
.tipkoro-dot { width: 8px; height: 8px; border-radius: 50%; }
.tipkoro-dot1 { top: 20%; left: 3%; background: #f4c790; }
.tipkoro-dot2 { top: 35%; right: 2%; background: #b8d4c8; }
.tipkoro-dot3 { bottom: 40%; left: 15%; background: #d4af37; }

/* Star positions */
.tipkoro-star1 { top: 8%; left: 32%; transform: scale(0.7) rotate(35deg); }
.tipkoro-star2 { top: 4%; right: 45%; transform: scale(0.5) rotate(35deg); }
.tipkoro-star3 { top: 12%; right: 10%; transform: scale(0.8) rotate(35deg); }
.tipkoro-star4 { bottom: 18%; left: 8%; transform: scale(0.9) rotate(35deg); }
.tipkoro-star5 { bottom: 12%; right: 5%; transform: scale(0.8) rotate(35deg); }
.tipkoro-star6 { top: 20%; left: 5%; transform: scale(0.6) rotate(35deg); }

/* Sparkles */
.tipkoro-sparkle {
  position: absolute;
  width: 3px;
  height: 20px;
  background: #d4af37;
}
.tipkoro-sparkle:after {
  content: '';
  position: absolute;
  width: 20px;
  height: 3px;
  background: #d4af37;
  top: 8px;
  left: -8px;
}
.tipkoro-sparkle1 { top: 12%; left: 30%; transform: scale(0.5); }
.tipkoro-sparkle2 { top: 10%; right: 35%; transform: scale(0.4); }
.tipkoro-sparkle3 { bottom: 30%; left: 25%; transform: scale(0.6); }

/* Card container */
.tipkoro-card-container {
  position: relative;
  z-index: 1;
}

/* Logo circle */
.tipkoro-logo-circle {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 70px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 2;
  overflow: hidden;
}

.tipkoro-logo-img {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

/* Main card */
.tipkoro-share-card {
  background: white;
  background-image: url('https://i.ibb.co.com/QjxJWNtb/image.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 30px;
  padding: 60px 50px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 500px;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.tipkoro-share-card:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(to top, rgba(245, 230, 211, 0.6) 0%, rgba(245, 230, 211, 0) 100%);
  pointer-events: none;
}

/* Title */
.tipkoro-title {
  font-size: 36px;
  font-weight: 600;
  color: #2d1810;
  margin-bottom: 15px;
  line-height: 1.2;
  position: relative;
  z-index: 1;
}

/* Amount */
.tipkoro-amount {
  font-size: 64px;
  font-weight: 600;
  color: #d4a24a;
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  position: relative;
  z-index: 1;
}

.tipkoro-currency {
  font-size: 52px;
}

/* Message */
.tipkoro-message-container {
  margin: 20px 0;
  position: relative;
  z-index: 1;
}

.tipkoro-message-text {
  font-size: 22px;
  font-weight: 400;
  color: #2d1810;
}

/* Date */
.tipkoro-date-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 25px;
  position: relative;
  z-index: 1;
}

.tipkoro-date {
  font-size: 18px;
  font-weight: 500;
  color: #5a4a3a;
}`;

export const defaultShareImageTemplate: ShareImageTemplate = {
  jsx: defaultJsxTemplate,
  css: defaultCssTemplate,
};

export function useShareImageConfig() {
  const supabaseAuth = useSupabaseWithAuth();
  const [config, setConfig] = useState<ShareImageConfig>(defaultShareImageConfig);
  const [template, setTemplate] = useState<ShareImageTemplate>(defaultShareImageTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      // Fetch both config and template in parallel
      const [configResult, templateResult] = await Promise.all([
        supabase
          .from('platform_config')
          .select('value')
          .eq('key', 'share_image_config')
          .maybeSingle(),
        supabase
          .from('platform_config')
          .select('value')
          .eq('key', 'share_image_template')
          .maybeSingle(),
      ]);

      if (configResult.error && configResult.error.code !== 'PGRST116') {
        console.error('Error fetching share image config:', configResult.error);
      }

      if (templateResult.error && templateResult.error.code !== 'PGRST116') {
        console.error('Error fetching share image template:', templateResult.error);
      }

      if (configResult.data?.value) {
        const configValue = configResult.data.value as unknown as ShareImageConfig;
        setConfig({ ...defaultShareImageConfig, ...configValue });
      }

      if (templateResult.data?.value) {
        const templateValue = templateResult.data.value as unknown as ShareImageTemplate;
        setTemplate({
          jsx: templateValue.jsx || defaultJsxTemplate,
          css: templateValue.css || defaultCssTemplate,
        });
      }
    } catch (err) {
      console.error('Error fetching share image config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (newConfig: Partial<ShareImageConfig>): Promise<boolean> => {
    setSaving(true);
    try {
      const updatedConfig = { ...config, ...newConfig };
      
      const { data: existing } = await supabase
        .from('platform_config')
        .select('id')
        .eq('key', 'share_image_config')
        .maybeSingle();
      
      const jsonValue: Json = updatedConfig as unknown as Json;
      
      if (existing) {
        const { error } = await supabaseAuth
          .from('platform_config')
          .update({
            value: jsonValue,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'share_image_config');
          
        if (error) {
          console.error('Error updating share image config:', error);
          return false;
        }
      } else {
        const { error } = await supabaseAuth
          .from('platform_config')
          .insert([{
            key: 'share_image_config',
            value: jsonValue,
          }]);
          
        if (error) {
          console.error('Error inserting share image config:', error);
          return false;
        }
      }

      setConfig(updatedConfig);
      return true;
    } catch (err) {
      console.error('Error updating share image config:', err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = async (newTemplate: Partial<ShareImageTemplate>): Promise<boolean> => {
    setSaving(true);
    try {
      const updatedTemplate = { ...template, ...newTemplate };
      
      const { data: existing } = await supabase
        .from('platform_config')
        .select('id')
        .eq('key', 'share_image_template')
        .maybeSingle();
      
      const jsonValue: Json = updatedTemplate as unknown as Json;
      
      if (existing) {
        const { error } = await supabaseAuth
          .from('platform_config')
          .update({
            value: jsonValue,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'share_image_template');
          
        if (error) {
          console.error('Error updating share image template:', error);
          return false;
        }
      } else {
        const { error } = await supabaseAuth
          .from('platform_config')
          .insert([{
            key: 'share_image_template',
            value: jsonValue,
            description: 'Share image JSX and CSS template',
          }]);
          
        if (error) {
          console.error('Error inserting share image template:', error);
          return false;
        }
      }

      setTemplate(updatedTemplate);
      return true;
    } catch (err) {
      console.error('Error updating share image template:', err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetConfig = async (): Promise<boolean> => {
    return updateConfig(defaultShareImageConfig);
  };

  const resetTemplate = async (): Promise<boolean> => {
    return updateTemplate(defaultShareImageTemplate);
  };

  return {
    config,
    template,
    loading,
    saving,
    updateConfig,
    updateTemplate,
    resetConfig,
    resetTemplate,
    refetch: fetchConfig,
  };
}
