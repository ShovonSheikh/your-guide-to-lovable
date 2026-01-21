import React from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { usePageTitle } from "@/hooks/usePageTitle";
import SEO from "@/components/SEO";
import { Mail, MessageCircle, Clock } from "lucide-react";

export default function Contact() {
    usePageTitle("Contact Us");

    return (
        <>
            <SEO
                title="Contact TipKoro - Get Support"
                description="Contact the TipKoro team for support, partnerships, or general inquiries. We're here to help Bangladeshi creators succeed."
                url="https://tipkoro.com/contact"
            />
            <div className="min-h-screen bg-background">
                <TopNavbar />
                <div className="h-24" />

                <main className="container max-w-3xl py-12 px-4">
                    <h1 className="text-4xl font-display font-bold mb-4">Contact Us</h1>
                    <p className="text-xl text-muted-foreground mb-12">
                        We're here to help. Reach out anytime.
                    </p>

                    <div className="space-y-8">
                        {/* Email Contact */}
                        <div className="bg-card border border-border rounded-2xl p-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-accent/20 rounded-xl">
                                    <Mail className="w-6 h-6 text-tipkoro-gold" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-2">Email Support</h2>
                                    <p className="text-foreground/70 mb-4">
                                        For general inquiries, account issues, or partnership requests.
                                    </p>
                                    <a
                                        href="mailto:support@tipkoro.com"
                                        className="text-lg font-semibold text-tipkoro-gold hover:underline"
                                    >
                                        support@tipkoro.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Response Time */}
                        <div className="bg-card border border-border rounded-2xl p-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-accent/20 rounded-xl">
                                    <Clock className="w-6 h-6 text-tipkoro-gold" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-2">Response Time</h2>
                                    <p className="text-foreground/70">
                                        We typically respond within <strong>24-48 hours</strong> during business days (Sunday-Thursday).
                                        For urgent payment issues, please include "URGENT" in your subject line.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Social/Community */}
                        <div className="bg-card border border-border rounded-2xl p-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-accent/20 rounded-xl">
                                    <MessageCircle className="w-6 h-6 text-tipkoro-gold" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-2">Follow Us</h2>
                                    <p className="text-foreground/70 mb-4">
                                        Stay updated with the latest news and features.
                                    </p>
                                    <div className="flex gap-4">
                                        <a href="https://twitter.com/TipKoro" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-tipkoro-gold transition-colors">
                                            Twitter/X
                                        </a>
                                        <a href="https://facebook.com/TipKoro" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-tipkoro-gold transition-colors">
                                            Facebook
                                        </a>
                                        <a href="https://instagram.com/tipkoro" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-tipkoro-gold transition-colors">
                                            Instagram
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FAQ Link */}
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-2">
                                Looking for quick answers?
                            </p>
                            <a href="/#faq" className="text-tipkoro-gold hover:underline font-semibold">
                                Check our FAQ section →
                            </a>
                        </div>
                    </div>
                </main>

                <MainFooter />
            </div>
        </>
    );
}
