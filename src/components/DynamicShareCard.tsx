import React, { forwardRef, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  defaultJsxTemplate,
  defaultCssTemplate,
  type ShareImageTemplate,
} from '@/hooks/useShareImageConfig';

interface DynamicShareCardProps {
  creatorName: string;
  tipAmount: string;
  userMessage?: string;
  timestamp: string;
  trxId?: string;
  verified?: boolean;
  supporterName?: string;
  currency?: string;
}

const DynamicShareCard = forwardRef<HTMLDivElement, DynamicShareCardProps>(
  (
    {
      creatorName,
      tipAmount,
      userMessage = '',
      timestamp,
      trxId = '',
      verified = false,
      supporterName = '',
      currency = '৳',
    },
    ref
  ) => {
    const [template, setTemplate] = useState<ShareImageTemplate | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch template from database
    useEffect(() => {
      const fetchTemplate = async () => {
        try {
          const { data, error } = await supabase
            .from('platform_config')
            .select('value')
            .eq('key', 'share_image_template')
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching share image template:', error);
          }

          if (data?.value) {
            const templateValue = data.value as unknown as ShareImageTemplate;
            setTemplate({
              jsx: templateValue.jsx || defaultJsxTemplate,
              css: templateValue.css || defaultCssTemplate,
            });
          } else {
            // Use defaults if no template in database
            setTemplate({
              jsx: defaultJsxTemplate,
              css: defaultCssTemplate,
            });
          }
        } catch (err) {
          console.error('Error fetching template:', err);
          setTemplate({
            jsx: defaultJsxTemplate,
            css: defaultCssTemplate,
          });
        } finally {
          setLoading(false);
        }
      };

      fetchTemplate();
    }, []);

    // Process template with variable substitution
    const renderedHtml = useMemo(() => {
      if (!template) return '';

      let html = template.jsx;

      // Remove JSX comments (lines starting with //)
      html = html
        .split('\n')
        .filter((line) => !line.trim().startsWith('//'))
        .join('\n');

      // Replace all dynamic variables
      const variables: Record<string, string> = {
        creatorName,
        tipAmount,
        userMessage: userMessage || 'Thanks for being awesome!',
        timestamp,
        trxId,
        verified: verified ? 'true' : 'false',
        supporterName,
        currency,
      };

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        html = html.replace(regex, value);
      });

      // Convert JSX className to class for HTML rendering
      html = html.replace(/className=/g, 'class=');

      // Remove JSX-style comments {/* */}
      html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

      return html;
    }, [
      template,
      creatorName,
      tipAmount,
      userMessage,
      timestamp,
      trxId,
      verified,
      supporterName,
      currency,
    ]);

    if (loading) {
      return (
        <div className="w-[600px] h-[600px] flex items-center justify-center bg-muted">
          <Skeleton className="w-full h-full" />
        </div>
      );
    }

    return (
      <div ref={ref}>
        {/* Inject CSS styles */}
        <style>{template?.css || ''}</style>

        {/* Render the dynamic HTML template */}
        <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      </div>
    );
  }
);

DynamicShareCard.displayName = 'DynamicShareCard';

export default DynamicShareCard;
