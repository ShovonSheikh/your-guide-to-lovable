import React from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { usePageTitle } from "@/hooks/usePageTitle";
import SEO from "@/components/SEO";

export default function CookiePolicy() {
    usePageTitle("Cookie Policy");

    return (
        <>
            <SEO
                title="Cookie Policy - TipKoro"
                description="Learn about how TipKoro uses cookies and similar technologies to provide and improve our services."
                url="https://tipkoro.com/cookie-policy"
            />
            <div className="min-h-screen bg-background">
                <TopNavbar />
                <div className="h-24" />

                <main className="container max-w-3xl py-12 px-4">
                    <h1 className="text-4xl font-display font-bold mb-8">Cookie Policy</h1>

                    <div className="prose prose-gray max-w-none space-y-8">
                        <section>
                            <p className="text-muted-foreground">
                                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
                            <p className="text-foreground/80">
                                Cookies are small text files that are stored on your device when you visit a website.
                                They help websites remember your preferences and provide a better user experience.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
                            <p className="text-foreground/80 mb-4">
                                TipKoro uses cookies for the following purposes:
                            </p>
                            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                                <li>
                                    <strong>Essential Cookies:</strong> Required for the website to function properly.
                                    These include authentication cookies that keep you logged in.
                                </li>
                                <li>
                                    <strong>Preference Cookies:</strong> Remember your settings and preferences,
                                    such as language and theme choices.
                                </li>
                                <li>
                                    <strong>Analytics Cookies:</strong> Help us understand how visitors use our website
                                    so we can improve the user experience.
                                </li>
                                <li>
                                    <strong>Security Cookies:</strong> Help protect your account and detect
                                    fraudulent activity.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
                            <p className="text-foreground/80">
                                We may use third-party services that set their own cookies, including:
                            </p>
                            <ul className="list-disc pl-6 text-foreground/80 space-y-2 mt-4">
                                <li><strong>Clerk:</strong> For authentication and user management</li>
                                <li><strong>Analytics providers:</strong> To understand website usage</li>
                                <li><strong>Payment processors:</strong> For secure payment handling</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
                            <p className="text-foreground/80">
                                You can control cookies through your browser settings. Most browsers allow you to:
                            </p>
                            <ul className="list-disc pl-6 text-foreground/80 space-y-2 mt-4">
                                <li>View what cookies are stored on your device</li>
                                <li>Delete all or specific cookies</li>
                                <li>Block cookies from being set</li>
                                <li>Set preferences for certain websites</li>
                            </ul>
                            <p className="text-foreground/80 mt-4">
                                Please note that disabling essential cookies may affect the functionality of our website.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
                            <p className="text-foreground/80">
                                We may update this Cookie Policy from time to time. Any changes will be posted on this page
                                with an updated "Last updated" date.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                            <p className="text-foreground/80">
                                If you have any questions about our use of cookies, please contact us at{" "}
                                <a href="mailto:support@tipkoro.com" className="text-primary hover:underline">
                                    support@tipkoro.com
                                </a>
                            </p>
                        </section>
                    </div>
                </main>

                <MainFooter />
            </div>
        </>
    );
}
