import React from "react";

export const BkashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#E2136E"/>
    <path d="M20 8L28 16L20 24L12 16L20 8Z" fill="white"/>
    <path d="M20 16L28 24L20 32L12 24L20 16Z" fill="white" fillOpacity="0.7"/>
  </svg>
);

export const NagadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#F6921E"/>
    <path d="M12 14H28V26H12V14Z" fill="white"/>
    <path d="M16 18H24V22H16V18Z" fill="#F6921E"/>
  </svg>
);

export const RocketIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#8B2F89"/>
    <path d="M20 10L26 16V24L20 30L14 24V16L20 10Z" fill="white"/>
    <circle cx="20" cy="20" r="4" fill="#8B2F89"/>
  </svg>
);

export const CardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#1A1F36"/>
    <rect x="8" y="12" width="24" height="16" rx="2" fill="white"/>
    <rect x="8" y="16" width="24" height="4" fill="#1A1F36"/>
    <rect x="12" y="22" width="8" height="2" rx="1" fill="#1A1F36"/>
  </svg>
);

export const CryptoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#F7931A"/>
    <path d="M24 16C24 13.8 22.2 12 20 12V10H18V12C15.8 12 14 13.8 14 16H16C16 14.9 16.9 14 18 14V19H16C13.8 19 12 20.8 12 23C12 25.2 13.8 27 16 27H18V29H20V27C22.2 27 24 25.2 24 23H22C22 24.1 21.1 25 20 25V20H22C24.2 20 26 18.2 26 16H24Z" fill="white"/>
  </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="currentColor"/>
  </svg>
);

export const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/>
  </svg>
);

export const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7V12C3 17.5 7.5 22 12 22C16.5 22 21 17.5 21 12V7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <ellipse cx="12" cy="12" rx="4" ry="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 12H22" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const ZapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="currentColor"/>
  </svg>
);
