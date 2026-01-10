import React, { useState } from "react";
import { Button } from "./ui/button";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const categories = [
  "Content Creator",
  "Artist",
  "Musician",
  "Writer",
  "Educator",
  "Developer",
  "Podcaster",
  "Gamer",
  "Other",
];

const payoutMethods = [
  { id: "bkash", label: "bKash" },
  { id: "nagad", label: "Nagad" },
  { id: "rocket", label: "Rocket" },
  { id: "card", label: "Bank Card" },
  { id: "crypto", label: "Crypto (USDT)" },
];

interface SignupFormProps {
  isLoading?: boolean;
  step: "payment" | "details";
  onPaymentComplete: (data: { fullname: string; email: string }) => void;
  onSubmit?: (data: FormData) => void;
}

export interface FormData {
  bio: string;
  category: string;
  twitter: string;
  instagram: string;
  youtube: string;
  otherLink: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSubmit,
  isLoading = false,
  step,
  onPaymentComplete,
}) => {
  
  const [paymentFormData, setPaymentFormData] = useState({
    fullname: "",
    email: "",
  });
  const [formData, setFormData] = useState<FormData>({
    bio: "",
    category: "",
    twitter: "",
    instagram: "",
    youtube: "",
    otherLink: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | "fullname" | "email", string>>>({});

  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Partial<Record<string, string>> = {};

    if (!paymentFormData.fullname.trim()) {
      newErrors.fullname = "Full name is required";
    }

    if (!paymentFormData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentFormData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required";
    } else if (formData.bio.length > 200) {
      newErrors.bio = "Bio must be under 200 characters";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      onPaymentComplete(paymentFormData);
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2() && onSubmit) {
      onSubmit(formData);
    }
  };

  if (step === "payment") {
    return (
      <form onSubmit={handlePaymentSubmit} className="space-y-6">
        {/* Name and Email for checkout */}
        <div className="space-y-4">
          <div>
            <label htmlFor="fullname" className="tipkoro-label">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={paymentFormData.fullname}
              onChange={handlePaymentInputChange}
              className="tipkoro-input"
              placeholder="Your full name"
            />
            {errors.fullname && (
              <p className="text-sm text-destructive mt-1">{errors.fullname}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="tipkoro-label">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={paymentFormData.email}
              onChange={handlePaymentInputChange}
              className="tipkoro-input"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="tipkoro-card bg-secondary/30">
          <p className="text-sm text-muted-foreground mb-2">
            You&apos;ll be redirected to complete payment securely
          </p>
          <p className="text-2xl font-bold text-foreground">
            ৳10 <span className="text-sm font-normal text-muted-foreground">/month</span>
          </p>
        </div>

        <Button
          type="submit"
          variant="hero-accent"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Redirecting to payment..." : "Pay & Continue →"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Secure payment processing
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleDetailsSubmit} className="space-y-5">
      {/* Bio */}
      <div>
        <label htmlFor="bio" className="tipkoro-label">
          Short Bio <span className="text-destructive">*</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          className="tipkoro-input min-h-[80px] resize-none"
          placeholder="Tell your supporters what you create..."
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.bio.length}/200 characters
        </p>
        {errors.bio && (
          <p className="text-sm text-destructive mt-1">{errors.bio}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="tipkoro-label">
          Category <span className="text-destructive">*</span>
        </label>
        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
          <SelectTrigger className="tipkoro-input">
            <SelectValue placeholder="Select your category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-destructive mt-1">{errors.category}</p>
        )}
      </div>

      {/* Social Links */}
      <div className="space-y-3">
        <label className="tipkoro-label">Social Links (Optional)</label>
        <input
          name="twitter"
          value={formData.twitter}
          onChange={handleInputChange}
          className="tipkoro-input"
          placeholder="twitter.com/username"
        />
        <input
          name="instagram"
          value={formData.instagram}
          onChange={handleInputChange}
          className="tipkoro-input"
          placeholder="instagram.com/username"
        />
        <input
          name="youtube"
          value={formData.youtube}
          onChange={handleInputChange}
          className="tipkoro-input"
          placeholder="youtube.com/@channel"
        />
        <input
          name="otherLink"
          value={formData.otherLink}
          onChange={handleInputChange}
          className="tipkoro-input"
          placeholder="other website or link"
        />
      </div>

      <Button
        type="submit"
        variant="hero-accent"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Complete Signup ✓"}
      </Button>
    </form>
  );
};
