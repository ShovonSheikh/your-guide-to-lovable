import { useState, useRef, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Code, Eye, RotateCcw, Save, Play, Variable, Copy, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useSupabaseWithAuth } from '@/hooks/useSupabaseWithAuth';
import { useIsMobile } from '@/hooks/use-mobile';

// Available dynamic variables
const DYNAMIC_VARIABLES = [
  { name: 'creatorName', description: 'Name of the creator receiving the tip', example: 'John Doe' },
  { name: 'tipAmount', description: 'Amount of the tip in currency', example: '500' },
  { name: 'userMessage', description: 'Message from the supporter', example: 'Thanks for the amazing content!' },
  { name: 'timestamp', description: 'Formatted date and time', example: 'Jan 20, 2026, 3:45 PM' },
  { name: 'supporterName', description: 'Name of the person sending the tip', example: 'Jane Smith' },
  { name: 'currency', description: 'Currency symbol', example: '৳' },
  { name: 'trxId', description: 'Unique transaction ID', example: 'TIP-2026012034AB' },
  { name: 'verified', description: 'Whether the creator is verified (true/false)', example: 'true' },
];

// Default template code
const DEFAULT_TEMPLATE = `// TipKoro Share Image Template
// Available variables: {{creatorName}}, {{tipAmount}}, {{userMessage}}, {{timestamp}}, {{supporterName}}, {{currency}}, {{trxId}}, {{verified}}

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
const DEFAULT_CSS = `/* TipKoro Share Image Styles */
/* You can modify colors, sizes, and positions here */

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

/* Curved confetti pieces */
.tipkoro-curve {
  width: 30px;
  height: 12px;
  border-radius: 50px;
}

/* Confetti positions */
.tipkoro-piece1 { top: 5%; left: 10%; background: #f4c790; transform: rotate(-25deg); }
.tipkoro-piece2 { top: 3%; left: 17%; background: #b8d4c8; transform: rotate(30deg); }
.tipkoro-piece3 { top: 7%; left: 25%; background: #f4d0a0; transform: rotate(-15deg); }
.tipkoro-piece4 { top: 2%; left: 45%; background: #e8d4b8; width: 10px; height: 10px; }
.tipkoro-piece5 { top: 6%; right: 38%; background: #f4c790; transform: rotate(20deg); }
.tipkoro-piece6 { top: 3%; right: 25%; background: #e8d4b8; width: 8px; height: 8px; }
.tipkoro-piece7 { top: 5%; right: 15%; background: #b8d4c8; transform: rotate(-30deg); }
.tipkoro-piece8 { top: 8%; right: 5%; background: #f4d0a0; transform: rotate(25deg); }
.tipkoro-piece9 { top: 3%; right: 3%; background: #e8d4b8; width: 9px; height: 9px; }
.tipkoro-piece10 { top: 25%; left: 3%; background: #b8d4c8; transform: rotate(20deg); }
.tipkoro-piece11 { bottom: 30%; left: 5%; background: #f4c790; transform: rotate(-35deg); }
.tipkoro-piece12 { bottom: 20%; left: 12%; background: #b8d4c8; transform: rotate(15deg); }
.tipkoro-piece13 { bottom: 15%; right: 8%; background: #f4d0a0; transform: rotate(-20deg); }
.tipkoro-piece14 { bottom: 25%; right: 15%; background: #b8d4c8; transform: rotate(30deg); }
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

// Sample preview values
const SAMPLE_VALUES = {
  creatorName: 'Sample Creator',
  tipAmount: '500',
  userMessage: 'Thank you for the amazing content!',
  timestamp: new Date().toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }),
  supporterName: 'Happy Supporter',
  currency: '৳',
  trxId: 'TIP-2026012034AB',
  verified: 'true',
};

export default function AdminShareImage() {
  const supabase = useSupabaseWithAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsxCode, setJsxCode] = useState(DEFAULT_TEMPLATE);
  const [cssCode, setCssCode] = useState(DEFAULT_CSS);
  const [previewValues, setPreviewValues] = useState(SAMPLE_VALUES);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedJsx, setSavedJsx] = useState(DEFAULT_TEMPLATE);
  const [savedCss, setSavedCss] = useState(DEFAULT_CSS);
  const [activeTab, setActiveTab] = useState<'jsx' | 'css'>('jsx');
  const [zoomLevel, setZoomLevel] = useState(isMobile ? 0.5 : 0.8);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Fetch saved template from database
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_config')
          .select('value')
          .eq('key', 'share_image_template')
          .maybeSingle();

        if (error) throw error;

        if (data?.value) {
          const template = data.value as { jsx?: string; css?: string };
          if (template.jsx) {
            setJsxCode(template.jsx);
            setSavedJsx(template.jsx);
          }
          if (template.css) {
            setCssCode(template.css);
            setSavedCss(template.css);
          }
        }
      } catch (error) {
        console.error('Error fetching template:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [supabase]);

  // Track changes
  useEffect(() => {
    const jsxChanged = jsxCode !== savedJsx;
    const cssChanged = cssCode !== savedCss;
    setHasChanges(jsxChanged || cssChanged);
  }, [jsxCode, cssCode, savedJsx, savedCss]);

  // Replace variables in template for preview (with XSS sanitization)
  const renderedHtml = useMemo(() => {
    let html = jsxCode;

    // Remove comment lines for rendering
    html = html.replace(/\/\/.*$/gm, '');

    // Replace {{variable}} with actual values
    Object.entries(previewValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      html = html.replace(regex, value);
    });

    // Convert JSX className to class for HTML
    html = html.replace(/className=/g, 'class=');

    // Remove JSX comments
    html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

    // Sanitize to prevent XSS from malicious template modifications
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'img', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'a', 'strong', 'em', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['class', 'style', 'src', 'alt', 'width', 'height', 'd', 'fill', 'stroke', 'stroke-width', 'viewBox', 'xmlns', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'href', 'target'],
    });
  }, [jsxCode, previewValues]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_config')
        .upsert({
          key: 'share_image_template',
          value: { jsx: jsxCode, css: cssCode },
          description: 'Share image JSX and CSS template',
        }, { onConflict: 'key' });

      if (error) throw error;

      setSavedJsx(jsxCode);
      setSavedCss(cssCode);
      toast({
        title: 'Template Saved',
        description: 'Share image template has been updated.',
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setJsxCode(DEFAULT_TEMPLATE);
    setCssCode(DEFAULT_CSS);
    toast({
      title: 'Template Reset',
      description: 'Template has been reset to default.',
    });
  };

  const insertVariable = (variableName: string) => {
    const variable = `{{${variableName}}}`;
    navigator.clipboard.writeText(variable);
    toast({
      title: 'Variable Copied',
      description: `${variable} copied to clipboard. Paste it in the editor.`,
    });
  };

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Share Image Editor</h1>
          <p className="text-muted-foreground">
            Edit the JSX template and CSS styles for donation share images
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? <Spinner className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Variable Reference */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Variable className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Dynamic Variables</CardTitle>
          </div>
          <CardDescription>
            Use these placeholders in your template. They will be replaced with real data when the image is generated. Click a variable to copy it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DYNAMIC_VARIABLES.map((variable) => (
              <div
                key={variable.name}
                className="group p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => insertVariable(variable.name)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {`{{${variable.name}}}`}
                  </Badge>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {variable.description}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
                  e.g. {variable.example}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 overflow-hidden min-w-0">
        {/* Code Editor Panel */}
        <div className="space-y-4 min-w-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'jsx' | 'css')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jsx" className="gap-2">
                <Code className="w-4 h-4" />
                JSX Template
              </TabsTrigger>
              <TabsTrigger value="css" className="gap-2">
                <Code className="w-4 h-4" />
                CSS Styles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jsx" className="mt-4">
              <Card className="overflow-hidden">
                <div className="border-b bg-muted/50 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">TipKoroCard.jsx</span>
                  <Badge variant="outline" className="text-xs">React JSX</Badge>
                </div>
                {isMobile ? (
                  <Textarea
                    value={jsxCode}
                    onChange={(e) => setJsxCode(e.target.value)}
                    className="min-h-[400px] font-mono text-xs border-0 rounded-none resize-none focus-visible:ring-0"
                    placeholder="Enter JSX template..."
                  />
                ) : (
                  <div className="h-[600px]">
                    <Editor
                      height="100%"
                      language="javascript"
                      theme="vs-dark"
                      value={jsxCode}
                      onChange={(value) => setJsxCode(value || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                      }}
                    />
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="css" className="mt-4">
              <Card className="overflow-hidden">
                <div className="border-b bg-muted/50 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">TipKoroCard.css</span>
                  <Badge variant="outline" className="text-xs">CSS</Badge>
                </div>
                {isMobile ? (
                  <Textarea
                    value={cssCode}
                    onChange={(e) => setCssCode(e.target.value)}
                    className="min-h-[400px] font-mono text-xs border-0 rounded-none resize-none focus-visible:ring-0"
                    placeholder="Enter CSS styles..."
                  />
                ) : (
                  <div className="h-[600px]">
                    <Editor
                      height="100%"
                      language="css"
                      theme="vs-dark"
                      value={cssCode}
                      onChange={(value) => setCssCode(value || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                      }}
                    />
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4 min-w-0 overflow-hidden">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </div>
              <CardDescription>
                Preview updates automatically as you edit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zoom Controls */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <ZoomOut className="w-4 h-4 text-muted-foreground hidden sm:block" />
                  <Slider
                    value={[zoomLevel * 100]}
                    onValueChange={(value) => setZoomLevel(value[0] / 100)}
                    min={30}
                    max={100}
                    step={5}
                    className="w-20 sm:w-32"
                  />
                  <ZoomIn className="w-4 h-4 text-muted-foreground hidden sm:block" />
                  <span className="text-xs text-muted-foreground">{Math.round(zoomLevel * 100)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setZoomLevel(0.5)}>50%</Button>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs hidden sm:flex" onClick={() => setZoomLevel(0.75)}>75%</Button>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs hidden sm:flex" onClick={() => setZoomLevel(1)}>100%</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      // Fit to container (600px card into ~480px container)
                      const containerWidth = previewContainerRef.current?.clientWidth || 480;
                      const fitScale = Math.min((containerWidth - 32) / 600, 1);
                      setZoomLevel(fitScale);
                    }}
                  >
                    <Maximize2 className="w-3 h-3 sm:mr-1" />
                    <span className="hidden sm:inline">Fit</span>
                  </Button>
                </div>
              </div>

              {/* Inject CSS and render HTML */}
              <style>{cssCode}</style>
              <div
                ref={previewContainerRef}
                className="flex justify-center overflow-hidden rounded-xl border border-border bg-muted/30 max-h-[500px] w-full"
              >
                <div
                  className="transform origin-top p-4 max-w-full"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    width: `${100 / zoomLevel}%`,
                    maxWidth: `${100 / zoomLevel}%`
                  }}
                >
                  <div
                    ref={previewRef}
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Values */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base">Test Values</CardTitle>
              </div>
              <CardDescription>Modify preview values to test different scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Creator Name</Label>
                    <Input
                      value={previewValues.creatorName}
                      onChange={(e) => setPreviewValues(prev => ({ ...prev, creatorName: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tip Amount</Label>
                    <Input
                      value={previewValues.tipAmount}
                      onChange={(e) => setPreviewValues(prev => ({ ...prev, tipAmount: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Message</Label>
                  <Input
                    value={previewValues.userMessage}
                    onChange={(e) => setPreviewValues(prev => ({ ...prev, userMessage: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Transaction ID</Label>
                    <Input
                      value={previewValues.trxId}
                      onChange={(e) => setPreviewValues(prev => ({ ...prev, trxId: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="TIP-2026012034AB"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Creator Verified</Label>
                    <Input
                      value={previewValues.verified}
                      onChange={(e) => setPreviewValues(prev => ({ ...prev, verified: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="true or false"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {hasChanges && (
            <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
              <p className="text-sm text-accent-foreground">
                You have unsaved changes. Click "Save Changes" to apply them.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
