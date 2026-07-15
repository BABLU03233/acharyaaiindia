import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is Acharya AI accurate?",
    a: "Our AI is trained on principles of Hasta Samudrika Shastra, the ancient Indian science of palmistry, combined with modern computer vision. Readings should be treated as spiritual guidance and reflection — not absolute prediction.",
  },
  {
    q: "Do you store my palm image?",
    a: "Your palm scans are processed securely and never shared. You can delete your scan history anytime from your account.",
  },
  {
    q: "Which hand should I scan?",
    a: "Traditionally the dominant hand shows your present and future, while the non-dominant hand shows your inherent traits. You can choose either at the start of the scan.",
  },
  {
    q: "Will it tell me when I will die or about medical issues?",
    a: "No. Acharya AI never provides death predictions or medical diagnoses. We focus on emotional, spiritual, career and relationship guidance.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major cards, UPI, and net banking via Razorpay for India, and Stripe for international payments.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 max-w-3xl mx-auto">
      <div className="text-center mb-12 space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
          Inquiries
        </span>
        <h2 className="text-4xl md:text-5xl font-serif">Questions seekers ask</h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border">
            <AccordionTrigger className="text-left font-serif text-lg hover:text-accent hover:no-underline">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-foreground/60 leading-relaxed">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
