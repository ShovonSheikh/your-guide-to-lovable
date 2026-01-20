import React, { forwardRef } from 'react';
import './TipKoroCard.css';
import { BadgeCheck } from 'lucide-react';

interface TipKoroCardProps {
    creatorName: string;
    tipAmount: string;
    userMessage: string;
    timestamp: string;
    trxId?: string;
    verified?: boolean;
}

const TipKoroCard = forwardRef<HTMLDivElement, TipKoroCardProps>(({
    creatorName,
    tipAmount,
    userMessage,
    timestamp,
    trxId,
    verified = false,
}, ref) => {
    return (
        <div ref={ref} className="tipkoro-card-wrapper">
            {/* Decorative confetti background */}
            <div className="tipkoro-confetti">
                {/* Curved pieces */}
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece1"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece2"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece3"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece4"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece5"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece6"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece7"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece8"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece9"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece10"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece11"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece12"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece13"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece14"></div>
                <div className="tipkoro-confetti-piece tipkoro-curve tipkoro-piece15"></div>

                {/* Dots */}
                <div className="tipkoro-confetti-piece tipkoro-dot tipkoro-dot1"></div>
                <div className="tipkoro-confetti-piece tipkoro-dot tipkoro-dot2"></div>
                <div className="tipkoro-confetti-piece tipkoro-dot tipkoro-dot3"></div>

                {/* Stars */}
                <div className="tipkoro-star tipkoro-star1"></div>
                <div className="tipkoro-star tipkoro-star2"></div>
                <div className="tipkoro-star tipkoro-star3"></div>
                <div className="tipkoro-star tipkoro-star4"></div>
                <div className="tipkoro-star tipkoro-star5"></div>
                <div className="tipkoro-star tipkoro-star6"></div>

                {/* Sparkles */}
                <div className="tipkoro-sparkle tipkoro-sparkle1"></div>
                <div className="tipkoro-sparkle tipkoro-sparkle2"></div>
                <div className="tipkoro-sparkle tipkoro-sparkle3"></div>
            </div>

            <div className="tipkoro-card-container">
                {/* Logo circle with image */}
                <div className="tipkoro-logo-circle">
                    <img
                        src="https://i.ibb.co.com/hF035hX2/2026-01-16-21-27-58-your-guide-to-lovable-Antigravity-tip-share-image-guide-txt-removebg-preview.png"
                        alt="TipKoro Logo"
                        className="tipkoro-logo-img"
                    />
                </div>

                {/* Main card */}
                <div className="tipkoro-share-card">
                    <h1 className="tipkoro-title">
                        You just supported<br />
                        <span className="tipkoro-creator-name">
                            {creatorName}
                            {verified && (
                                <BadgeCheck className="tipkoro-verified-badge" />
                            )}
                        </span>
                        !
                    </h1>

                    <div className="tipkoro-amount">
                        <span className="tipkoro-currency">৳</span>
                        <span>{tipAmount}</span>
                    </div>

                    <div className="tipkoro-message-container">
                        <div className="tipkoro-message-text">
                            Message: {userMessage || 'Thanks for being awesome!'}
                        </div>
                    </div>

                    <div className="tipkoro-date-container">
                        <span className="tipkoro-date">{timestamp}</span>
                        {trxId && (
                            <span className="tipkoro-trx-id">ID: {trxId}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

TipKoroCard.displayName = 'TipKoroCard';

export default TipKoroCard;