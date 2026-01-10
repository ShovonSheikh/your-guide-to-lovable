import React from "react";
import { BkashIcon, NagadIcon, RocketIcon, CardIcon, CryptoIcon } from "./icons/PaymentIcons";
interface PaymentMethod {
  id: string;
  name: string;
  icon: React.FC<{
    className?: string;
  }>;
  description: string;
}
const paymentMethods: PaymentMethod[] = [{
  id: "bkash",
  name: "bKash",
  icon: BkashIcon,
  description: "Pay with bKash"
}, {
  id: "nagad",
  name: "Nagad",
  icon: NagadIcon,
  description: "Pay with Nagad"
}, {
  id: "rocket",
  name: "Rocket",
  icon: RocketIcon,
  description: "Pay with Rocket"
}, {
  id: "card",
  name: "Card",
  icon: CardIcon,
  description: "Visa/Mastercard"
}, {
  id: "crypto",
  name: "Crypto",
  icon: CryptoIcon,
  description: "BTC/ETH/USDT"
}];
interface PaymentMethodSelectorProps {
  selectedMethod: string | null;
  onSelect: (method: string) => void;
}
export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect
}) => {
  return <div className="space-y-3">
      
      
    </div>;
};