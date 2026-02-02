import React from 'react';
import DOMPurify from 'dompurify';
import { TopNavbar } from '@/components/TopNavbar';
import { MainFooter } from '@/components/MainFooter';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePage } from '@/hooks/usePages';
import { Spinner } from '@/components/ui/spinner';
import { Shield, AlertCircle } from 'lucide-react';
import SEO from '@/components/SEO';

// Simple markdown-to-HTML converter with XSS sanitization
function parseMarkdown(content: string): string {
  const html = content
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr class="my-8 border-border" />')
    // Paragraphs (lines with content)
    .split('\n\n')
    .map(para => {
      if (para.startsWith('<h') || para.startsWith('<hr')) return para;
      return `<p class="text-foreground/80 mb-4">${para}</p>`;
    })
    .join('\n');
  
  // Sanitize to prevent XSS attacks
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'br', 'hr'],
    ALLOWED_ATTR: ['class']
  });
}

export default function Authenticity() {
  usePageTitle('Trust & Security');
  const { page, loading, error } = usePage('authenticity');

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Trust & Security - TipKoro"
        description={page?.meta_description || "Learn about TipKoro's commitment to security, trust, and protecting creator earnings in Bangladesh."}
        url="https://tipkoro.com/authenticity"
      />
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-3xl py-12 px-4">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner className="h-8 w-8" />
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">This page is not available.</p>
          </div>
        ) : page ? (
          <>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-accent/20">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h1 className="text-4xl font-display font-bold">{page.title}</h1>
            </div>
            
            <div 
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(page.content) }}
            />
          </>
        ) : null}
      </main>

      <MainFooter />
    </div>
  );
}
