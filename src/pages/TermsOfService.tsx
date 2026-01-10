import React from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-3xl py-12 px-4">
        <h1 className="text-4xl font-display font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-foreground/80">
              By accessing or using TipKoro, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-foreground/80">
              TipKoro is a platform that enables supporters to send tips to content creators in Bangladesh. 
              We provide the technology and platform for these transactions but are not responsible for 
              the content created by users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
            <p className="text-foreground/80 mb-4">
              To use certain features of TipKoro, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Payments and Fees</h2>
            <p className="text-foreground/80 mb-4">
              <strong>For Creators:</strong> A monthly fee of ৳150 is charged for creator accounts, 
              automatically deducted from your tips. Withdrawals are processed within 3-5 business days.
            </p>
            <p className="text-foreground/80">
              <strong>For Supporters:</strong> Using TipKoro to send tips is free. Standard payment 
              processing fees may apply depending on your payment method.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. User Conduct</h2>
            <p className="text-foreground/80 mb-4">
              You agree not to use TipKoro to:
            </p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Transmit harmful, offensive, or illegal content</li>
              <li>Engage in fraudulent or deceptive practices</li>
              <li>Interfere with the operation of our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="text-foreground/80">
              TipKoro and its original content, features, and functionality are owned by TipKoro 
              and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
            <p className="text-foreground/80">
              We may terminate or suspend your account at any time for violations of these Terms. 
              You may also close your account at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-foreground/80">
              TipKoro is provided "as is" without warranties of any kind. We are not liable for 
              any indirect, incidental, or consequential damages arising from your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p className="text-foreground/80">
              We may modify these Terms at any time. Continued use of TipKoro after changes 
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-foreground/80">
              If you have any questions about these Terms, please contact us at{" "}
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
