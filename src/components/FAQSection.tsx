import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is TipKoro?",
    answer: "TipKoro is a Bangladeshi platform that allows fans and supporters to send tips and donations to their favorite creators. It's designed specifically for Bangladeshi creators with local payment methods like bKash, Nagad, and Rocket."
  },
  {
    question: "How much does TipKoro cost?",
    answer: "For supporters, TipKoro is completely free to use. For creators, we charge a fixed Creator Fee of ৳150/month — this is a flat rate, not a percentage. Whether you earn ৳1,000 or ৳1,00,000, you pay the same ৳150. This is automatically deducted from your tips. TipKoro may transition to percentage-based pricing in the future, but we commit that it will never exceed 20% of your earnings."
  },
  {
    question: "What payment methods are supported?",
    answer: "We support bKash, Nagad, Rocket, debit/credit cards, and cryptocurrency. Your supporters can choose whichever method is most convenient for them."
  },
  {
    question: "How do I withdraw my tips?",
    answer: "You can request a withdrawal anytime from your dashboard. Withdrawals are processed within 3-5 business days and sent directly to your bKash, Nagad, or Rocket wallet."
  },
  {
    question: "Is my data safe with TipKoro?",
    answer: "Absolutely. We never sell or share your personal data. All payments are processed through secure, encrypted channels, and we follow industry-standard security practices."
  },
  {
    question: "Can I cancel my creator account anytime?",
    answer: "Yes, you can cancel your creator account at any time. If you're on the promotional period, you can cancel before month 4 and you won't be charged again."
  },
  {
    question: "Do supporters need an account to tip?",
    answer: "No, supporters can tip without creating an account. However, creating a free account allows them to track their tips and follow their favorite creators."
  },
  {
    question: "What types of creators can use TipKoro?",
    answer: "TipKoro is for all types of Bangladeshi creators - YouTubers, musicians, artists, writers, developers, streamers, and more. If you create content and want to receive support from your fans, TipKoro is for you."
  }
];

export function FAQSection() {
  return (
    <div id="faq" className="flex w-full flex-col items-center bg-background px-6 py-24 md:py-16">
      <div className="flex w-full max-w-[800px] flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-4xl font-display font-bold text-foreground text-center tracking-tight md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground text-center max-w-[600px]">
            Got questions? We've got answers.
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-border">
              <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent-foreground hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
