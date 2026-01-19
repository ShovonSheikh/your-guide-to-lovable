import React from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function PrivacyPolicy() {
  usePageTitle("Privacy Policy");
  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-3xl py-12 px-4">
        <h1 className="text-4xl font-display font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-foreground/80 mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              make a payment, or contact us for support.
            </p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Account information (name, email, username)</li>
              <li>Profile information (bio, social links)</li>
              <li>Payment information (processed securely through our payment partners)</li>
              <li>Communication data (support messages)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-foreground/80 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Protect against fraudulent or illegal activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
            <p className="text-foreground/80">
              We do not sell, trade, or rent your personal information to third parties. 
              We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2 mt-4">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist our operations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-foreground/80">
              We implement appropriate security measures to protect your personal information. 
              All payment data is encrypted and processed through secure payment partners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <p className="text-foreground/80">
              You have the right to access, update, or delete your personal information at any time 
              through your account settings. You may also contact us for assistance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
            <p className="text-foreground/80">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:support@tipkoro.com" className="text-primary hover:underline">
                support@tipkoro.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
