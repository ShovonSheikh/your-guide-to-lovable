import React from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { usePageTitle } from "@/hooks/usePageTitle";
import SEO from "@/components/SEO";
import { Heart, Users, Zap, Shield } from "lucide-react";

export default function About() {
    usePageTitle("About TipKoro");

    return (
        <>
            <SEO
                title="About TipKoro - Bangladesh's Creator Support Platform"
                description="Learn about TipKoro, Bangladesh's first creator tipping platform. We help Bangladeshi creators receive support via bKash, Nagad, and Rocket."
                url="https://tipkoro.com/about"
            />
            <div className="min-h-screen bg-background">
                <TopNavbar />
                <div className="h-24" />

                <main className="container max-w-4xl py-12 px-4 animate-fade-in">
                    <h1 className="text-4xl font-display font-bold mb-4">About TipKoro</h1>
                    <p className="text-xl text-muted-foreground mb-12">
                        Bangladesh's first and leading creator tipping platform
                    </p>

                    <div className="prose prose-gray max-w-none space-y-12">
                        {/* Mission Section */}
                        <section className="tipkoro-card">
                            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                                <Heart className="w-6 h-6 text-tipkoro-gold" />
                                Our Mission
                            </h2>
                            <p className="text-foreground/80 text-lg leading-relaxed">
                                TipKoro was created to solve a simple problem: <strong>Bangladeshi creators deserve an easy way to receive support from their audience.</strong>
                            </p>
                            <p className="text-foreground/80 mt-4">
                                International platforms like Ko-fi, Buy Me a Coffee, and Patreon don't support Bangladeshi payment methods.
                                PayPal has restrictions in Bangladesh, and Stripe is difficult to access. This left millions of talented
                                Bangladeshi creators without a way to monetize their work.
                            </p>
                            <p className="text-foreground/80 mt-4">
                                <strong>TipKoro changes that.</strong> We integrate directly with bKash, Nagad, and Rocket — the payment
                                methods that over 100 million Bangladeshis use every day.
                            </p>
                        </section>

                        {/* Values Section */}
                        <section>
                            <h2 className="text-2xl font-semibold mb-6">What We Stand For</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="tipkoro-card hover:-translate-y-0.5 transition-transform duration-200">
                                    <Users className="w-8 h-8 text-tipkoro-gold mb-3" />
                                    <h3 className="font-bold text-lg mb-2">Creator First</h3>
                                    <p className="text-foreground/70 text-sm">
                                        Every decision we make prioritizes the needs of Bangladeshi creators. You keep what you earn — we only charge a flat monthly fee with zero transaction cuts.
                                    </p>
                                </div>
                                <div className="tipkoro-card hover:-translate-y-0.5 transition-transform duration-200">
                                    <Zap className="w-8 h-8 text-tipkoro-gold mb-3" />
                                    <h3 className="font-bold text-lg mb-2">Local Payments</h3>
                                    <p className="text-foreground/70 text-sm">
                                        We built TipKoro specifically for Bangladesh. bKash, Nagad, Rocket — if your supporters use it, we support it.
                                    </p>
                                </div>
                                <div className="tipkoro-card hover:-translate-y-0.5 transition-transform duration-200">
                                    <Shield className="w-8 h-8 text-tipkoro-gold mb-3" />
                                    <h3 className="font-bold text-lg mb-2">Transparent Pricing</h3>
                                    <p className="text-foreground/70 text-sm">
                                        No hidden fees, no surprise cuts. Just ৳150/month for creators, and completely free for supporters. Simple.
                                    </p>
                                </div>
                                <div className="tipkoro-card hover:-translate-y-0.5 transition-transform duration-200">
                                    <Heart className="w-8 h-8 text-tipkoro-gold mb-3" />
                                    <h3 className="font-bold text-lg mb-2">Made in Bangladesh</h3>
                                    <p className="text-foreground/70 text-sm">
                                        TipKoro is proudly Bangladeshi. We understand the local creator ecosystem because we're part of it.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Contact CTA */}
                        <section className="text-center tipkoro-card bg-accent/10">
                            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
                            <p className="text-foreground/80 mb-4">
                                Have questions? Want to partner with us? We'd love to hear from you.
                            </p>
                            <a
                                href="mailto:support@tipkoro.com"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-xl font-semibold hover:bg-tipkoro-gold-hover transition-colors"
                            >
                                Contact Us
                            </a>
                        </section>
                    </div>
                </main>

                <MainFooter />
            </div>
        </>
    );
}
