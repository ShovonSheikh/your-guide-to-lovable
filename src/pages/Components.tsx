import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

const Components: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-2">Component Library</h1>
          <p className="text-muted-foreground mb-12">
            A showcase of all UI components with their variants.
          </p>

          {/* Buttons Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold mb-6">Buttons</h2>
            
            <div className="space-y-8">
              {/* Default Variants */}
              <div>
                <h3 className="text-lg font-medium mb-4">Variants</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>

              {/* Hero Variants */}
              <div>
                <h3 className="text-lg font-medium mb-4">Hero Variants</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="hero">Hero</Button>
                  <Button variant="hero-accent">Hero Accent</Button>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="text-lg font-medium mb-4">Sizes</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                  <Button size="icon"><Info className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* States */}
              <div>
                <h3 className="text-lg font-medium mb-4">States</h3>
                <div className="flex flex-wrap gap-4">
                  <Button>Normal</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Cards Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold mb-6">Cards</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description goes here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This is the card content area.</p>
                </CardContent>
                <CardFooter>
                  <Button>Action</Button>
                </CardFooter>
              </Card>

              <div className="tipkoro-card">
                <h3 className="text-lg font-semibold mb-2">TipKoro Card</h3>
                <p className="text-muted-foreground">
                  Custom styled card with shadow and hover effects.
                </p>
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Badges Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold mb-6">Badges</h2>
            
            <div className="flex flex-wrap gap-4">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Form Elements Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold mb-6">Form Elements</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Shadcn Inputs */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Shadcn Inputs</h3>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled">Disabled</Label>
                  <Input id="disabled" disabled placeholder="Disabled input" />
                </div>
              </div>

              {/* TipKoro Inputs */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">TipKoro Inputs</h3>
                <div>
                  <label className="tipkoro-label">Full Name</label>
                  <input className="tipkoro-input" placeholder="John Doe" />
                </div>
                <div>
                  <label className="tipkoro-label">Email</label>
                  <input className="tipkoro-input" type="email" placeholder="john@example.com" />
                </div>
              </div>
            </div>

            {/* Checkboxes and Switches */}
            <div className="mt-8 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Checkbox</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms">Accept terms and conditions</Label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Switch</h3>
                <div className="flex items-center space-x-2">
                  <Switch id="notifications" />
                  <Label htmlFor="notifications">Enable notifications</Label>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Tabs Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold mb-6">Tabs</h2>
            
            <Tabs defaultValue="account" className="w-full">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Manage your account settings.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Account settings content goes here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="password" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>Change your password.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Password settings content goes here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Configure your preferences.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Settings content goes here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          <Separator className="my-12" />

          {/* Progress Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold mb-6">Progress</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-2">25%</p>
                <Progress value={25} />
              </div>
              <div>
                <p className="text-sm mb-2">50%</p>
                <Progress value={50} />
              </div>
              <div>
                <p className="text-sm mb-2">75%</p>
                <Progress value={75} />
              </div>
              <div>
                <p className="text-sm mb-2">100%</p>
                <Progress value={100} />
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Alerts Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold mb-6">Alerts</h2>
            
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Default Alert</AlertTitle>
                <AlertDescription>This is a default informational alert.</AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Something went wrong. Please try again.</AlertDescription>
              </Alert>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Typography Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold mb-6">Typography</h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">font-display (Bricolage Grotesque)</p>
                <h1 className="text-4xl font-display font-bold">Heading 1</h1>
                <h2 className="text-3xl font-display font-bold">Heading 2</h2>
                <h3 className="text-2xl font-display font-semibold">Heading 3</h3>
                <h4 className="text-xl font-display font-semibold">Heading 4</h4>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">font-sans (DM Sans)</p>
                <p className="text-lg">Large paragraph text for emphasis.</p>
                <p>Regular paragraph text for body content.</p>
                <p className="text-sm">Small text for captions and labels.</p>
                <p className="text-xs text-muted-foreground">Extra small muted text.</p>
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Colors Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold mb-6">Colors</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-primary"></div>
                <p className="text-sm font-medium">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-secondary"></div>
                <p className="text-sm font-medium">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-accent"></div>
                <p className="text-sm font-medium">Accent</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-muted"></div>
                <p className="text-sm font-medium">Muted</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-destructive"></div>
                <p className="text-sm font-medium">Destructive</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-success"></div>
                <p className="text-sm font-medium">Success</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-tipkoro-gold"></div>
                <p className="text-sm font-medium">TipKoro Gold</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-tipkoro-cream border border-border"></div>
                <p className="text-sm font-medium">TipKoro Cream</p>
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* Animations Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold mb-6">Animations</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 border border-border rounded-lg">
                <div className="animate-fade-in bg-primary/20 h-16 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium">Fade In</span>
                </div>
              </div>
              <div className="p-6 border border-border rounded-lg">
                <div className="animate-scale-in bg-accent/20 h-16 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium">Scale In</span>
                </div>
              </div>
              <div className="p-6 border border-border rounded-lg">
                <div className="animate-bounce bg-success/20 h-16 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium">Bounce</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Components;
