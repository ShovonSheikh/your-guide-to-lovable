import { useState, useRef, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Code, Eye, RotateCcw, Save, Variable, Copy, ZoomIn, ZoomOut, Maximize2, Mail, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseWithAuth } from '@/hooks/useSupabaseWithAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Json } from '@/integrations/supabase/types';

// Email types
const EMAIL_TYPES = [
    { id: 'tip_received', label: 'Tip Received', description: 'Sent to creator when they receive a tip' },
    { id: 'tip_sent', label: 'Tip Sent', description: 'Sent to supporter after sending a tip' },
    { id: 'withdrawal_submitted', label: 'Withdrawal Submitted', description: 'Confirmation when withdrawal is requested' },
    { id: 'withdrawal_processing', label: 'Withdrawal Processing', description: 'When withdrawal is approved for processing' },
    { id: 'withdrawal_completed', label: 'Withdrawal Completed', description: 'When withdrawal is successfully completed' },
    { id: 'withdrawal_rejected', label: 'Withdrawal Rejected', description: 'When withdrawal request is rejected' },
    { id: 'welcome_creator', label: 'Welcome Creator', description: 'Welcome email for new creators' },
    { id: 'weekly_summary', label: 'Weekly Summary', description: 'Weekly earnings summary for creators' },
    { id: 'withdrawal_otp', label: 'Withdrawal OTP', description: 'OTP code for withdrawal verification' },
    { id: 'verification_approved', label: 'Verification Approved', description: 'Sent when creator verification is approved' },
    { id: 'verification_rejected', label: 'Verification Rejected', description: 'Sent when creator verification is rejected' },
    { id: 'goal_milestone_25', label: 'Goal 25% Reached', description: 'Sent when a funding goal hits 25%' },
    { id: 'goal_milestone_50', label: 'Goal 50% Reached', description: 'Sent when a funding goal hits 50%' },
    { id: 'goal_milestone_75', label: 'Goal 75% Reached', description: 'Sent when a funding goal hits 75%' },
    { id: 'goal_milestone_100', label: 'Goal Completed', description: 'Sent when a funding goal is fully achieved' },
];

// Available dynamic variables per email type
const DYNAMIC_VARIABLES: Record<string, Array<{ name: string; description: string; example: string }>> = {
    tip_received: [
        { name: 'amount', description: 'Tip amount', example: '500' },
        { name: 'supporter_name', description: 'Name of the supporter', example: 'Jane Smith' },
        { name: 'message', description: 'Tip message', example: 'Thanks for the amazing content!' },
    ],
    tip_sent: [
        { name: 'amount', description: 'Tip amount', example: '500' },
        { name: 'creator_name', description: 'Name of the creator', example: 'John Doe' },
        { name: 'message', description: 'Tip message', example: 'Keep up the great work!' },
    ],
    withdrawal_submitted: [
        { name: 'amount', description: 'Withdrawal amount', example: '1000' },
    ],
    withdrawal_processing: [
        { name: 'amount', description: 'Withdrawal amount', example: '1000' },
    ],
    withdrawal_completed: [
        { name: 'amount', description: 'Withdrawal amount', example: '1000' },
    ],
    withdrawal_rejected: [
        { name: 'amount', description: 'Withdrawal amount', example: '1000' },
        { name: 'reason', description: 'Rejection reason', example: 'Insufficient balance' },
    ],
    welcome_creator: [
        { name: 'username', description: 'Creator username', example: 'johndoe' },
        { name: 'first_name', description: 'Creator first name', example: 'John' },
    ],
    weekly_summary: [
        { name: 'week_tips_count', description: 'Number of tips this week', example: '12' },
        { name: 'week_earnings', description: 'Total earnings this week', example: '2500' },
        { name: 'new_supporters', description: 'New supporters this week', example: '5' },
        { name: 'previous_week_earnings', description: 'Last week earnings', example: '2000' },
    ],
    withdrawal_otp: [
        { name: 'otp_code', description: 'OTP verification code', example: '123456' },
        { name: 'withdrawal_amount', description: 'Withdrawal amount', example: '1000' },
        { name: 'first_name', description: 'Creator first name', example: 'John' },
    ],
    verification_approved: [
        { name: 'creator_name', description: 'Creator name', example: 'John Doe' },
        { name: 'username', description: 'Creator username', example: 'johndoe' },
    ],
    verification_rejected: [
        { name: 'creator_name', description: 'Creator name', example: 'John Doe' },
        { name: 'reason', description: 'Rejection reason', example: 'Documents are unclear or incomplete' },
    ],
    goal_milestone_25: [
        { name: 'goal_title', description: 'Name of the funding goal', example: 'New Camera Equipment' },
        { name: 'current_amount', description: 'Current amount raised', example: '2500' },
        { name: 'target_amount', description: 'Target amount', example: '10000' },
        { name: 'percentage', description: 'Current percentage', example: '25' },
    ],
    goal_milestone_50: [
        { name: 'goal_title', description: 'Name of the funding goal', example: 'New Camera Equipment' },
        { name: 'current_amount', description: 'Current amount raised', example: '5000' },
        { name: 'target_amount', description: 'Target amount', example: '10000' },
        { name: 'percentage', description: 'Current percentage', example: '50' },
    ],
    goal_milestone_75: [
        { name: 'goal_title', description: 'Name of the funding goal', example: 'New Camera Equipment' },
        { name: 'current_amount', description: 'Current amount raised', example: '7500' },
        { name: 'target_amount', description: 'Target amount', example: '10000' },
        { name: 'percentage', description: 'Current percentage', example: '75' },
    ],
    goal_milestone_100: [
        { name: 'goal_title', description: 'Name of the funding goal', example: 'New Camera Equipment' },
        { name: 'current_amount', description: 'Current amount raised', example: '10000' },
        { name: 'target_amount', description: 'Target amount', example: '10000' },
        { name: 'percentage', description: 'Current percentage', example: '100' },
    ],
};

// Default templates (simplified versions)
const DEFAULT_TEMPLATES: Record<string, { subject: string; html: string }> = {
    tip_received: {
        subject: '💰 You received ৳{{amount}} on TipKoro!',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 34px;">💰</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">You received a tip!</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">Someone just showed their appreciation for your work</p>
      <div style="background: #FEF7E0; border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
        <p style="font-size: 48px; font-weight: 700; margin: 0;">৳{{amount}}</p>
        <p style="color: #7A7469; margin-top: 8px;">from {{supporter_name}}</p>
      </div>
      {{#if message}}
      <div style="font-style: italic; padding: 20px 24px; background: #F0EBE0; border-left: 4px solid #F9C23C; border-radius: 0 12px 12px 0; margin: 28px 0;">
        "{{message}}"
      </div>
      {{/if}}
      <div style="text-align: center;">
        <a href="https://tipkoro.com/dashboard" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Dashboard</a>
      </div>
    </div>
  </div>
</div>`,
    },
    tip_sent: {
        subject: '❤️ Your tip of ৳{{amount}} was sent successfully!',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 34px;">❤️</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">Thank you for your support!</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">Your generosity helps creators keep doing what they love</p>
      <div style="background: #FEF7E0; border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
        <p style="font-size: 48px; font-weight: 700; margin: 0;">৳{{amount}}</p>
        <p style="color: #7A7469; margin-top: 8px;">sent to {{creator_name}}</p>
      </div>
      <div style="text-align: center;">
        <a href="https://tipkoro.com/explore" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">Discover More Creators</a>
      </div>
    </div>
  </div>
</div>`,
    },
    withdrawal_submitted: {
        subject: '📤 Withdrawal Request Received - ৳{{amount}}',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <h1 style="font-size: 26px; font-weight: 700; text-align: center;">Withdrawal Request Submitted</h1>
      <div style="background: #FEF7E0; border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
        <p style="font-size: 48px; font-weight: 700; margin: 0;">৳{{amount}}</p>
        <span style="background: #FEF3C7; color: #92400E; padding: 8px 16px; border-radius: 24px; font-size: 13px;">Pending Review</span>
      </div>
      <p style="color: #4A453D; text-align: center;">We'll process your request within 3-5 business days.</p>
    </div>
  </div>
</div>`,
    },
    withdrawal_processing: {
        subject: '⏳ Withdrawal Processing - ৳{{amount}}',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <h1 style="font-size: 26px; font-weight: 700; text-align: center;">Withdrawal Being Processed</h1>
      <div style="background: #FEF7E0; border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
        <p style="font-size: 48px; font-weight: 700; margin: 0;">৳{{amount}}</p>
        <span style="background: #DBEAFE; color: #1E40AF; padding: 8px 16px; border-radius: 24px; font-size: 13px;">Processing</span>
      </div>
    </div>
  </div>
</div>`,
    },
    withdrawal_completed: {
        subject: '✅ Withdrawal Completed - ৳{{amount}}',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <h1 style="font-size: 26px; font-weight: 700; text-align: center;">Withdrawal Completed!</h1>
      <div style="background: #DCFCE7; border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
        <p style="font-size: 48px; font-weight: 700; margin: 0;">৳{{amount}}</p>
        <span style="background: #DCFCE7; color: #166534; padding: 8px 16px; border-radius: 24px; font-size: 13px;">Completed</span>
      </div>
    </div>
  </div>
</div>`,
    },
    withdrawal_rejected: {
        subject: '❌ Withdrawal Rejected - ৳{{amount}}',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <h1 style="font-size: 26px; font-weight: 700; text-align: center;">Withdrawal Rejected</h1>
      <div style="background: #FEE2E2; border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
        <p style="font-size: 48px; font-weight: 700; margin: 0;">৳{{amount}}</p>
        <span style="background: #FEE2E2; color: #991B1B; padding: 8px 16px; border-radius: 24px; font-size: 13px;">Rejected</span>
      </div>
      <p style="color: #991B1B; text-align: center;">Reason: {{reason}}</p>
    </div>
  </div>
</div>`,
    },
    welcome_creator: {
        subject: '🎉 Welcome to TipKoro, {{first_name}}!',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <h1 style="font-size: 26px; font-weight: 700; text-align: center;">Welcome to TipKoro! 🎉</h1>
      <p style="color: #4A453D; text-align: center; margin: 20px 0;">Hi {{first_name}}, your creator page is ready at tipkoro.com/{{username}}</p>
      <div style="text-align: center;">
        <a href="https://tipkoro.com/dashboard" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">Go to Dashboard</a>
      </div>
    </div>
  </div>
</div>`,
    },
    weekly_summary: {
        subject: '📊 Your Weekly Summary - ৳{{week_earnings}} earned!',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <h1 style="font-size: 26px; font-weight: 700; text-align: center;">Your Weekly Summary 📊</h1>
      <div style="display: grid; gap: 16px; margin: 28px 0;">
        <div style="background: #FEF7E0; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: #7A7469; margin: 0;">This Week</p>
          <p style="font-size: 32px; font-weight: 700; margin: 8px 0;">৳{{week_earnings}}</p>
        </div>
        <div style="display: flex; gap: 16px;">
          <div style="flex: 1; background: #F5F1E8; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="color: #7A7469; margin: 0;">Tips</p>
            <p style="font-size: 24px; font-weight: 600; margin: 4px 0;">{{week_tips_count}}</p>
          </div>
          <div style="flex: 1; background: #F5F1E8; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="color: #7A7469; margin: 0;">New Supporters</p>
            <p style="font-size: 24px; font-weight: 600; margin: 4px 0;">{{new_supporters}}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
    },
    withdrawal_otp: {
        subject: '🔐 Your Withdrawal Verification Code',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <h1 style="font-size: 26px; font-weight: 700; text-align: center;">Verification Code</h1>
      <p style="color: #4A453D; text-align: center;">Hi {{first_name}}, here's your OTP for withdrawing ৳{{withdrawal_amount}}</p>
      <div style="background: #1F1C18; border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
        <p style="font-size: 48px; font-weight: 700; color: #F9C23C; letter-spacing: 8px; margin: 0;">{{otp_code}}</p>
      </div>
      <p style="color: #7A7469; text-align: center; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
  </div>
</div>`,
    },
    verification_approved: {
        subject: '✅ Congratulations! Your Account is Verified',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">✅</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">You're Verified!</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">Congratulations {{creator_name}}, your account has been verified.</p>
      <div style="background: #DCFCE7; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0;">
        <p style="font-size: 18px; font-weight: 600; color: #166534; margin: 0;">Your profile now displays the verified badge</p>
      </div>
      <p style="color: #4A453D; text-align: center;">This badge builds trust with your supporters and shows them you're a genuine creator.</p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="https://tipkoro.com/{{username}}" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Your Profile</a>
      </div>
    </div>
  </div>
</div>`,
    },
    verification_rejected: {
        subject: '❌ Verification Request Declined',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">❌</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">Verification Declined</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">Hi {{creator_name}}, unfortunately we couldn't verify your account at this time.</p>
      <div style="background: #FEE2E2; border-radius: 16px; padding: 24px; margin: 28px 0;">
        <p style="font-size: 14px; font-weight: 600; color: #991B1B; margin: 0 0 8px;">Reason:</p>
        <p style="font-size: 16px; color: #991B1B; margin: 0;">{{reason}}</p>
      </div>
      <p style="color: #4A453D; text-align: center;">You can submit a new verification request with updated documents from your settings page.</p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="https://tipkoro.com/settings?tab=verification" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">Try Again</a>
      </div>
    </div>
  </div>
</div>`,
    },
    goal_milestone_25: {
        subject: '🌱 Strong Start! {{goal_title}} is 25% Funded',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🌱</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">Strong Start! 25% 🌱</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">You're off to a great start on "{{goal_title}}"!</p>
      <div style="background: #FEF7E0; border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
        <p style="font-size: 48px; font-weight: 700; margin: 0;">৳{{current_amount}}</p>
        <p style="color: #7A7469; margin-top: 8px;">of ৳{{target_amount}} goal</p>
      </div>
      <p style="color: #4A453D; text-align: center;">You've reached the first major milestone. Keep sharing with your fans to build momentum!</p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="https://tipkoro.com/dashboard" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Progress</a>
      </div>
    </div>
  </div>
</div>`,
    },
    goal_milestone_50: {
        subject: '🎯 Halfway There! {{goal_title}} is 50% Funded',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🎯</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">Halfway There! 50% 🎉</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">Amazing progress on "{{goal_title}}"!</p>
      <div style="background: #FEF7E0; border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
        <p style="font-size: 48px; font-weight: 700; margin: 0;">৳{{current_amount}}</p>
        <p style="color: #7A7469; margin-top: 8px;">of ৳{{target_amount}} goal</p>
      </div>
      <p style="color: #4A453D; text-align: center;">You're making great progress! Keep sharing your page to reach your goal faster.</p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="https://tipkoro.com/dashboard" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Progress</a>
      </div>
    </div>
  </div>
</div>`,
    },
    goal_milestone_75: {
        subject: '🔥 Almost There! {{goal_title}} is 75% Funded',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🔥</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">Almost There! 75% 🔥</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">You're so close to completing "{{goal_title}}"!</p>
      <div style="background: #FEF7E0; border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
        <p style="font-size: 48px; font-weight: 700; margin: 0;">৳{{current_amount}}</p>
        <p style="color: #7A7469; margin-top: 8px;">of ৳{{target_amount}} goal</p>
      </div>
      <p style="color: #4A453D; text-align: center;">Only 25% to go! Your supporters are rallying behind you. Keep the momentum going!</p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="https://tipkoro.com/dashboard" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Progress</a>
      </div>
    </div>
  </div>
</div>`,
    },
    goal_milestone_100: {
        subject: '🎉 Goal Achieved! {{goal_title}} is 100% Funded!',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🎉</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">Goal Achieved! 🎊</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">Congratulations! "{{goal_title}}" is fully funded!</p>
      <div style="background: #DCFCE7; border: 1px solid #86EFAC; border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
        <p style="font-size: 48px; font-weight: 700; color: #166534; margin: 0;">৳{{current_amount}}</p>
        <p style="color: #166534; margin-top: 8px;">Goal Complete! 🎯</p>
      </div>
      <p style="color: #4A453D; text-align: center;">Your amazing community helped you reach this milestone. Time to celebrate and maybe set a new goal!</p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="https://tipkoro.com/dashboard" style="display: inline-block; background: #166534; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">Celebrate & Set New Goal</a>
      </div>
    </div>
  </div>
</div>`,
    },
};

export default function AdminEmailTemplates() {
    usePageTitle("Admin - Email Templates");
    const supabaseAuth = useSupabaseWithAuth();
    const isMobile = useIsMobile();

    const [selectedType, setSelectedType] = useState(EMAIL_TYPES[0].id);
    const [subjectCode, setSubjectCode] = useState(DEFAULT_TEMPLATES[EMAIL_TYPES[0].id].subject);
    const [htmlCode, setHtmlCode] = useState(DEFAULT_TEMPLATES[EMAIL_TYPES[0].id].html);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [savedTemplates, setSavedTemplates] = useState<Record<string, { subject: string; html: string }>>({});
    const [zoomLevel, setZoomLevel] = useState(isMobile ? 0.4 : 0.6);
    const [testValues, setTestValues] = useState<Record<string, string>>({});

    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Fetch saved templates
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const { data, error } = await supabase
                    .from('platform_config')
                    .select('key, value')
                    .like('key', 'email_template_%');

                if (error) throw error;

                const templates: Record<string, { subject: string; html: string }> = {};
                data?.forEach(item => {
                    const typeId = item.key.replace('email_template_', '');
                    const value = item.value as { subject?: string; html?: string } | null;
                    if (value) {
                        templates[typeId] = {
                            subject: value.subject || DEFAULT_TEMPLATES[typeId]?.subject || '',
                            html: value.html || DEFAULT_TEMPLATES[typeId]?.html || '',
                        };
                    }
                });

                setSavedTemplates(templates);

                // Load current template
                const currentTemplate = templates[selectedType] || DEFAULT_TEMPLATES[selectedType];
                setSubjectCode(currentTemplate.subject);
                setHtmlCode(currentTemplate.html);
            } catch (error) {
                console.error('Error fetching templates:', error);
                toast({ title: "Error", description: "Failed to load templates", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    // Load template when type changes
    useEffect(() => {
        const currentTemplate = savedTemplates[selectedType] || DEFAULT_TEMPLATES[selectedType];
        setSubjectCode(currentTemplate.subject);
        setHtmlCode(currentTemplate.html);
        setHasChanges(false);

        // Set default test values
        const vars = DYNAMIC_VARIABLES[selectedType] || [];
        const defaults: Record<string, string> = {};
        vars.forEach(v => {
            defaults[v.name] = v.example;
        });
        setTestValues(defaults);
    }, [selectedType, savedTemplates]);

    // Track changes
    useEffect(() => {
        const savedTemplate = savedTemplates[selectedType] || DEFAULT_TEMPLATES[selectedType];
        setHasChanges(
            subjectCode !== savedTemplate.subject ||
            htmlCode !== savedTemplate.html
        );
    }, [subjectCode, htmlCode, selectedType, savedTemplates]);

    // Render preview with variable replacement
    const renderedHtml = useMemo(() => {
        let rendered = htmlCode;

        // Replace {{variable}} with test values
        Object.entries(testValues).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            rendered = rendered.replace(regex, value);
        });

        // Handle simple {{#if var}}...{{/if}} blocks
        const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
        rendered = rendered.replace(ifRegex, (_, varName, content) => {
            return testValues[varName] ? content : '';
        });

        return rendered;
    }, [htmlCode, testValues]);

    const renderedSubject = useMemo(() => {
        let rendered = subjectCode;
        Object.entries(testValues).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            rendered = rendered.replace(regex, value);
        });
        return rendered;
    }, [subjectCode, testValues]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const key = `email_template_${selectedType}`;
            const value: Json = { subject: subjectCode, html: htmlCode };

            const { data: existing } = await supabase
                .from('platform_config')
                .select('id')
                .eq('key', key)
                .maybeSingle();

            if (existing) {
                const { error } = await supabaseAuth
                    .from('platform_config')
                    .update({ value, updated_at: new Date().toISOString() })
                    .eq('key', key);
                if (error) throw error;
            } else {
                const { error } = await supabaseAuth
                    .from('platform_config')
                    .insert([{ key, value, description: `Email template for ${selectedType}` }]);
                if (error) throw error;
            }

            setSavedTemplates(prev => ({
                ...prev,
                [selectedType]: { subject: subjectCode, html: htmlCode },
            }));
            setHasChanges(false);

            toast({ title: "Success", description: "Email template saved!" });
        } catch (error) {
            console.error('Error saving template:', error);
            toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        // Load from savedTemplates (last saved in database), fallback to DEFAULT_TEMPLATES
        const template = savedTemplates[selectedType] || DEFAULT_TEMPLATES[selectedType];
        setSubjectCode(template.subject);
        setHtmlCode(template.html);
    };

    const copyVariable = (varName: string) => {
        navigator.clipboard.writeText(`{{${varName}}}`);
        toast({ title: "Copied", description: `{{${varName}}} copied to clipboard` });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    const currentEmailType = EMAIL_TYPES.find(t => t.id === selectedType);
    const currentVariables = DYNAMIC_VARIABLES[selectedType] || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="h-6 w-6" />
                        Email Templates
                    </h1>
                    <p className="text-muted-foreground">Customize email templates for notifications</p>
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Unsaved changes
                        </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                        {saving ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save
                    </Button>
                </div>
            </div>

            {/* Email Type Selector */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Select Email Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-full sm:w-[300px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {EMAIL_TYPES.map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                    <div className="flex flex-col">
                                        <span>{type.label}</span>
                                        <span className="text-xs text-muted-foreground">{type.description}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Dynamic Variables */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Variable className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">Dynamic Variables</CardTitle>
                    </div>
                    <CardDescription>
                        Use these placeholders in your template. They will be replaced with real data when the email is sent. Click a variable to copy it.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentVariables.map(variable => (
                            <div
                                key={variable.name}
                                className="group p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                                onClick={() => copyVariable(variable.name)}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        {`{{${variable.name}}}`}
                                    </Badge>
                                    <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {variable.description}
                                </p>
                                <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
                                    e.g. {variable.example}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Editor & Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editor Column */}
                <div className="space-y-4">
                    {/* Subject Editor */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Subject Line
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                value={subjectCode}
                                onChange={(e) => setSubjectCode(e.target.value)}
                                placeholder="Email subject..."
                                className="font-mono text-sm"
                            />
                        </CardContent>
                    </Card>

                    {/* HTML Editor */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                <span className="text-sm font-medium">HTML Template</span>
                                <Badge variant="outline" className="text-xs">HTML</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isMobile ? (
                                <Textarea
                                    value={htmlCode}
                                    onChange={(e) => setHtmlCode(e.target.value)}
                                    className="min-h-[400px] font-mono text-xs border-0 rounded-none resize-none focus-visible:ring-0"
                                    placeholder="Enter HTML template..."
                                />
                            ) : (
                                <div className="h-[600px] border-t">
                                    <Editor
                                        height="100%"
                                        language="html"
                                        value={htmlCode}
                                        onChange={(value) => setHtmlCode(value || '')}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            lineNumbers: 'on',
                                            wordWrap: 'on',
                                            scrollBeyondLastLine: false,
                                            folding: true,
                                            automaticLayout: true,
                                        }}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Preview Column */}
                <div className="space-y-4">
                    {/* Test Values */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Test Values</CardTitle>
                            <CardDescription>Modify these to preview different scenarios</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {currentVariables.map(variable => (
                                    <div key={variable.name} className="space-y-1">
                                        <Label className="text-xs">{variable.name}</Label>
                                        <Input
                                            value={testValues[variable.name] || ''}
                                            onChange={(e) => setTestValues(prev => ({ ...prev, [variable.name]: e.target.value }))}
                                            placeholder={variable.example}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <Card className="flex-1">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    <CardTitle className="text-base">Live Preview</CardTitle>
                                </div>
                            </div>
                            <CardDescription>Subject: {renderedSubject}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Zoom Controls */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <ZoomOut className="w-4 h-4 text-muted-foreground hidden sm:block" />
                                    <Slider
                                        value={[zoomLevel * 100]}
                                        onValueChange={(value) => setZoomLevel(value[0] / 100)}
                                        min={30}
                                        max={100}
                                        step={5}
                                        className="w-20 sm:w-32"
                                    />
                                    <ZoomIn className="w-4 h-4 text-muted-foreground hidden sm:block" />
                                    <span className="text-xs text-muted-foreground">{Math.round(zoomLevel * 100)}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setZoomLevel(0.5)}>50%</Button>
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs hidden sm:flex" onClick={() => setZoomLevel(0.75)}>75%</Button>
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs hidden sm:flex" onClick={() => setZoomLevel(1)}>100%</Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => {
                                            const containerWidth = previewContainerRef.current?.clientWidth || 480;
                                            const fitScale = Math.min((containerWidth - 32) / 600, 1);
                                            setZoomLevel(fitScale);
                                        }}
                                    >
                                        <Maximize2 className="w-3 h-3 sm:mr-1" />
                                        <span className="hidden sm:inline">Fit</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Preview Container */}
                            <div
                                ref={previewContainerRef}
                                className="overflow-auto rounded-xl border bg-muted/30 max-h-[500px]"
                            >
                                <div
                                    className="transform origin-top-left p-4"
                                    style={{ transform: `scale(${zoomLevel})` }}
                                >
                                    <div
                                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                                        className="min-w-[600px]"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
