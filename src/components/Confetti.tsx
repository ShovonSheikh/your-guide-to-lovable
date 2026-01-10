import React, { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  size: number;
}

const colors = [
  "hsl(45, 92%, 62%)",   // Gold
  "hsl(142, 52%, 45%)",  // Green
  "hsl(340, 80%, 60%)",  // Pink
  "hsl(200, 80%, 60%)",  // Blue
  "hsl(30, 90%, 60%)",   // Orange
];

export const Confetti: React.FC = () => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        size: Math.random() * 10 + 5,
      });
    }
    setPieces(newPieces);

    // Clean up after animation
    const timer = setTimeout(() => {
      setPieces([]);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
};
