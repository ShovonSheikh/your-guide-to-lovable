import { useState, useRef, useEffect } from 'react';
import { useShareImageConfig, defaultShareImageConfig, ShareImageConfig } from '@/hooks/useShareImageConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';
import { Palette, Type, Layout, RotateCcw, Save, Eye } from 'lucide-react';
import TipKoroCard from '@/components/TipKoroCard';

export default function AdminShareImage() {
  const { config, loading, saving, updateConfig, resetConfig } = useShareImageConfig();
  const [localConfig, setLocalConfig] = useState<ShareImageConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync local config when config loads
  useEffect(() => {
    if (!loading) {
      setLocalConfig(config);
    }
  }, [config, loading]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(localConfig) !== JSON.stringify(config);
    setHasChanges(changed);
  }, [localConfig, config]);

  const handleChange = <K extends keyof ShareImageConfig>(key: K, value: ShareImageConfig[K]) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const success = await updateConfig(localConfig);
    if (success) {
      toast({
        title: 'Settings Saved',
        description: 'Share image configuration has been updated.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = async () => {
    const success = await resetConfig();
    if (success) {
      setLocalConfig(defaultShareImageConfig);
      toast({
        title: 'Settings Reset',
        description: 'Share image configuration has been reset to defaults.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to reset settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Generate preview styles based on config
  const previewStyles = {
    '--preview-bg': localConfig.backgroundColor,
    '--preview-card-bg': localConfig.cardBackgroundColor,
    '--preview-accent': localConfig.accentColor,
    '--preview-text': localConfig.textColor,
    '--preview-secondary': localConfig.secondaryTextColor,
  } as React.CSSProperties;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Share Image Settings</h1>
          <p className="text-muted-foreground">
            Customize the donation share image appearance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <Spinner className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-4">
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors" className="gap-2">
                <Palette className="w-4 h-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="typography" className="gap-2">
                <Type className="w-4 h-4" />
                Typography
              </TabsTrigger>
              <TabsTrigger value="layout" className="gap-2">
                <Layout className="w-4 h-4" />
                Layout
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Color Settings</CardTitle>
                  <CardDescription>
                    Customize the colors of the share image
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor">Background Gradient</Label>
                      <Input
                        id="backgroundColor"
                        value={localConfig.backgroundColor}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        placeholder="linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 100%)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use CSS gradient syntax or solid color
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardBackgroundColor">Card Background</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={localConfig.cardBackgroundColor}
                          onChange={(e) => handleChange('cardBackgroundColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          id="cardBackgroundColor"
                          value={localConfig.cardBackgroundColor}
                          onChange={(e) => handleChange('cardBackgroundColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color (Amount)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={localConfig.accentColor}
                          onChange={(e) => handleChange('accentColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          id="accentColor"
                          value={localConfig.accentColor}
                          onChange={(e) => handleChange('accentColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="textColor">Primary Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={localConfig.textColor}
                          onChange={(e) => handleChange('textColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          id="textColor"
                          value={localConfig.textColor}
                          onChange={(e) => handleChange('textColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryTextColor">Secondary Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={localConfig.secondaryTextColor}
                          onChange={(e) => handleChange('secondaryTextColor', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          id="secondaryTextColor"
                          value={localConfig.secondaryTextColor}
                          onChange={(e) => handleChange('secondaryTextColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Typography Settings</CardTitle>
                  <CardDescription>
                    Choose fonts and text styling
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="font">Font Family</Label>
                    <Select
                      value={localConfig.font}
                      onValueChange={(value) => handleChange('font', value as ShareImageConfig['font'])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fredoka">Fredoka (Default)</SelectItem>
                        <SelectItem value="DM Sans">DM Sans</SelectItem>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brandingText">Footer Branding Text</Label>
                    <Input
                      id="brandingText"
                      value={localConfig.brandingText}
                      onChange={(e) => handleChange('brandingText', e.target.value)}
                      placeholder="Support creators with TipKoro"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Layout Settings</CardTitle>
                  <CardDescription>
                    Configure card style and decorations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardStyle">Card Style</Label>
                    <Select
                      value={localConfig.cardStyle}
                      onValueChange={(value) => handleChange('cardStyle', value as ShareImageConfig['cardStyle'])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="celebration">Celebration (Default)</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="dark">Dark Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showConfetti">Show Confetti</Label>
                      <p className="text-xs text-muted-foreground">
                        Display decorative confetti elements
                      </p>
                    </div>
                    <Switch
                      id="showConfetti"
                      checked={localConfig.showConfetti}
                      onCheckedChange={(checked) => handleChange('showConfetti', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      value={localConfig.logoUrl || ''}
                      onChange={(e) => handleChange('logoUrl', e.target.value || null)}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL of the logo displayed on the card
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </div>
              <CardDescription>
                This is how the donation share image will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="flex justify-center overflow-hidden rounded-xl border border-border"
                style={previewStyles}
              >
                <div className="transform scale-[0.6] origin-center">
                  <TipKoroCard
                    ref={cardRef}
                    creatorName="Sample Creator"
                    tipAmount="500"
                    userMessage="Thank you for the amazing content!"
                    timestamp={new Date().toLocaleString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Note: Some styling changes require regenerating the edge function for server-side rendering
              </p>
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
