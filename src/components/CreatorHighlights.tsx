import React from "react";

const creators = [
  {
    name: "Rina Akter",
    category: "Digital Artist",
    avatar: "🎨",
    quote: "Finally a platform that understands Bangladeshi creators!",
  },
  {
    name: "Kamal Hossain",
    category: "Tech Educator",
    avatar: "💻",
    quote: "Getting paid in BDT directly to bKash is a game-changer.",
  },
  {
    name: "Fatema Begum",
    category: "Writer",
    avatar: "✍️",
    quote: "Simple, transparent, and made for us. Love it!",
  },
];

export const CreatorHighlights: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-secondary/30">
      <div className="container max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
          Creator Highlights
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {creators.map((creator, index) => (
            <div
              key={creator.name}
              className="tipkoro-card text-center animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-4xl mb-4">{creator.avatar}</div>
              <h3 className="font-semibold text-lg">{creator.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{creator.category}</p>
              <p className="text-sm italic text-foreground/80">"{creator.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
