import React, { useEffect } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { IconWithBackground } from "@/components/IconWithBackground";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { LiveTipsFeed } from "@/components/LiveTipsFeed";
import { Link, useLocation } from "react-router-dom";
import { SignUpButton } from "@clerk/clerk-react";
import { FAQSection } from "@/components/FAQSection";
import {
  Heart,
  Zap,
  Rocket,
  UserPlus,
  Share2,
  DollarSign,
  Mic,
  PenTool,
  Code,
  Video,
  Users,
  Shield,
  Check,
  Clock,
} from "lucide-react";

function Index() {
  const location = useLocation();

  // Handle hash navigation from other pages
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.hash]);

  return (
    <div className="flex h-full w-full flex-col items-center bg-background">
      <TopNavbar />
      <div className="h-20"></div>
      
      {/* Hero Section */}
      <div className="flex w-full max-w-[1280px] flex-col items-center gap-6 px-6 py-12 md:px-6 md:py-24">
        <div className="flex w-full flex-col items-center gap-8">
          <div className="flex w-full max-w-[768px] flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Badge variant="warning" icon={<Heart className="w-4 h-4" />}>
                100% Bangladeshi
              </Badge>
              <Badge variant="success" icon={<Zap className="w-4 h-4" />}>
                Instant Support
              </Badge>
            </div>
            <div className="flex flex-col items-center gap-4">
              <h1 className="w-full text-[40px] sm:text-[56px] font-display font-bold leading-[1.1] text-foreground text-center -tracking-[0.02em] md:text-[64px]">
                TipKoro — Support your favorite creators, <span className="text-transparent bg-clip-text bg-gradient-to-r from-tipkoro-gold to-orange-500">instantly!</span>
              </h1>
              <p className="w-full text-xl leading-relaxed text-muted-foreground text-center max-w-[600px]">
                Send small tips, show big love. 100% Bangladeshi, 100% yours.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <SignUpButton mode="modal">
                <Button variant="hero" size="xl" className="gap-2 bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover shadow-tipkoro hover:shadow-tipkoro-hover transition-all duration-300">
                  <Rocket className="w-6 h-6" />
                  Start My Creator Page
                </Button>
              </SignUpButton>
              <span className="text-sm text-muted-foreground">
                It's free and takes less than a minute.
              </span>
            </div>
          </div>
          
          {/* Live Tips Feed */}
          <div className="flex w-full items-center justify-center pt-8">
            <LiveTipsFeed />
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how" className="flex w-full flex-col items-center bg-background px-6 py-24 md:py-16">
        <div className="flex w-full max-w-[1280px] flex-col items-center gap-16">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-4xl font-display font-bold text-foreground text-center tracking-tight md:text-5xl">
              How TipKoro Works
            </h2>
            <p className="text-xl text-muted-foreground text-center max-w-[600px]">
              Simple steps to start receiving support from your fans
            </p>
          </div>
          <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1100px]">
            <div className="flex flex-col items-center gap-6 text-center group">
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300">
                <IconWithBackground size="x-large" icon={<UserPlus className="w-9 h-9" />} />
              </div>
              <div className="flex flex-col items-center gap-3">
                <h3 className="text-xl font-bold text-foreground">1. Create your page</h3>
                <p className="text-base text-muted-foreground">Quick signup with phone or Google.</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 text-center group">
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300">
                <IconWithBackground size="x-large" icon={<Share2 className="w-9 h-9" />} />
              </div>
              <div className="flex flex-col items-center gap-3">
                <h3 className="text-xl font-bold text-foreground">2. Share your link</h3>
                <p className="text-base text-muted-foreground">Post it anywhere (YouTube, Instagram, Facebook).</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 text-center group">
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300">
                <IconWithBackground variant="success" size="x-large" icon={<Heart className="w-9 h-9" />} />
              </div>
              <div className="flex flex-col items-center gap-3">
                <h3 className="text-xl font-bold text-foreground">3. Get tipped</h3>
                <p className="text-base text-muted-foreground">Fans send support through bKash, Nagad, or Rocket.</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 text-center group">
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300">
                <IconWithBackground variant="warning" size="x-large" icon={<DollarSign className="w-9 h-9" />} />
              </div>
              <div className="flex flex-col items-center gap-3">
                <h3 className="text-xl font-bold text-foreground">4. Pay only 150৳/month</h3>
                <p className="text-base text-muted-foreground">From your total earnings. Supporters stay free forever.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="flex w-full flex-col items-center bg-secondary/30 px-6 py-24 md:py-16">
        <div className="flex w-full max-w-[1280px] flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-4xl font-display font-bold text-foreground text-center tracking-tight md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground text-center max-w-[600px]">
              No hidden fees, no surprise cuts. What you see is what you keep.
            </p>
          </div>
          
          <div className="grid w-full max-w-[800px] grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supporter Plan */}
            <div className="tipkoro-card flex flex-col h-full hover:scale-[1.02] transition-transform duration-300">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Supporter</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-display">Free</span>
                  <span className="text-muted-foreground">forever</span>
                </div>
                <p className="text-muted-foreground">Support your favorite creators with ease</p>
              </div>
              <div className="flex flex-col gap-3 mt-8 flex-grow">
                {["Unlimited tipping", "Follow creators", "Get notifications", "Support locally via bKash, Nagad, Rocket"].map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-1 p-0.5 rounded-full bg-success/20 text-success">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </div>
                ))}
              </div>
              <SignUpButton mode="modal">
                <Button variant="outline" className="w-full rounded-xl border-2 h-12 text-base font-semibold hover:border-primary/20 hover:bg-secondary mt-8">
                  Get Started Free
                </Button>
              </SignUpButton>
            </div>
            
            {/* Creator Plan */}
            <div className="tipkoro-card flex flex-col h-full border-2 border-tipkoro-gold relative overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute top-0 right-0 bg-tipkoro-gold text-tipkoro-dark text-xs font-bold px-3 py-1 rounded-bl-xl">
                Most Popular
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-accent/20">
                    <Rocket className="w-6 h-6 text-tipkoro-dark" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Creator</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-display">150৳</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground">Deducted from your tips automatically</p>
              </div>
              
              {/* Calculation Example */}
              <div className="mt-6 p-4 rounded-xl bg-secondary border border-border">
                <p className="text-sm font-semibold mb-3">Example Calculation:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tips received</span>
                    <span className="font-medium">1,000৳</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Platform fee</span>
                    <span>-150৳</span>
                  </div>
                  <div className="flex justify-between font-bold text-tipkoro-dark pt-2 border-t border-border/50">
                    <span>You keep</span>
                    <span>850৳</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mt-6 flex-grow">
                {["Unlimited tips received", "Custom creator page", "Analytics dashboard", "bKash/Nagad/Rocket withdrawals"].map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-1 p-0.5 rounded-full bg-tipkoro-gold text-tipkoro-dark">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg justify-center">
                <Clock className="w-3 h-3" />
                <span>Withdrawals in 3-5 business days</span>
              </div>
              
              <SignUpButton mode="modal">
                <Button className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover font-bold mt-6">
                  Start Creating
                </Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </div>

      {/* For All Creators Section */}
      <div id="creators" className="flex w-full flex-col items-center bg-background px-6 py-24 md:py-16">
        <div className="flex w-full max-w-[1280px] flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-4xl font-display font-bold text-foreground text-center tracking-tight md:text-5xl">
              For all kinds of Bangladeshi creators
            </h2>
          </div>
          <div className="flex w-full items-start justify-center gap-6 flex-wrap">
            {[
              { icon: Mic, title: "Streamers & Musicians", desc: "Get appreciation for your live work." },
              { icon: PenTool, title: "Artists & Writers", desc: "Turn your fans' love into real support." },
              { icon: Code, title: "Developers & Designers", desc: "Receive tips for your open-source work." },
              { icon: Video, title: "Video Creators", desc: "Add your TipKoro link in your bio or description." },
            ].map((item) => (
              <div key={item.title} className="tipkoro-card flex min-w-[288px] max-w-[320px] grow shrink-0 basis-0 flex-col items-start gap-4 hover:shadow-tipkoro-hover hover:-translate-y-1 transition-all duration-300">
                <IconWithBackground size="large" icon={<item.icon />} />
                <div className="flex flex-col items-start gap-2">
                  <h3 className="text-xl font-bold font-display text-foreground">{item.title}</h3>
                  <p className="text-base text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Creators Love TipKoro */}
      <div className="flex w-full flex-col items-center bg-background px-6 py-24 md:py-16">
        <div className="flex w-full max-w-[1280px] flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-4xl font-display font-bold text-foreground text-center tracking-tight md:text-5xl">
              Why Creators Love TipKoro
            </h2>
          </div>
          <div className="flex w-full items-start justify-center gap-6 flex-wrap">
            <div className="tipkoro-card flex min-w-[288px] max-w-[384px] grow shrink-0 basis-0 flex-col items-center gap-4 hover:shadow-tipkoro-hover transition-all duration-300">
              <IconWithBackground variant="success" size="large" icon={<Clock />} />
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-xl font-bold font-display text-foreground">Fast Withdrawals</h3>
                <p className="text-base text-muted-foreground text-center">Get your money in 3-5 business days to your bKash, Nagad, or Rocket wallet.</p>
              </div>
            </div>
            <div className="tipkoro-card flex min-w-[288px] max-w-[384px] grow shrink-0 basis-0 flex-col items-center gap-4 hover:shadow-tipkoro-hover transition-all duration-300">
              <IconWithBackground size="large" icon={<Users />} />
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-xl font-bold font-display text-foreground">Friendly Support</h3>
                <p className="text-base text-muted-foreground text-center">Talk to real people when you need help.</p>
              </div>
            </div>
            <div className="tipkoro-card flex min-w-[288px] max-w-[384px] grow shrink-0 basis-0 flex-col items-center gap-4 hover:shadow-tipkoro-hover transition-all duration-300">
              <IconWithBackground variant="neutral" size="large" icon={<Shield />} />
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-xl font-bold font-display text-foreground">Privacy First</h3>
                <p className="text-base text-muted-foreground text-center">We never sell or share your data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <div className="flex w-full flex-col items-center bg-accent/10 px-6 py-24 md:py-16">
        <div className="flex w-full max-w-[600px] flex-col items-center gap-6 text-center">
          <h2 className="text-4xl font-display font-bold text-foreground tracking-tight md:text-5xl">
            Ready to start earning?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of Bangladeshi creators who are already earning with TipKoro.
          </p>
          <SignUpButton mode="modal">
            <Button variant="hero" size="xl" className="gap-2 bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover shadow-tipkoro hover:shadow-tipkoro-hover transition-all duration-300">
              <Rocket className="w-6 h-6" />
              Get Started Now
            </Button>
          </SignUpButton>
        </div>
      </div>

      <MainFooter />
    </div>
  );
}

export default Index;
