import { useState, useRef, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Code, Eye, RotateCcw, Save, Variable, Copy, ZoomIn, ZoomOut, Maximize2, Mail, Send, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useSupabaseWithAuth } from '@/hooks/useSupabaseWithAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useIsMobile } from '@/hooks/use-mobile';
import { MassEmailDialog } from '@/components/admin/MassEmailDialog';
import type { Json } from '@/integrations/supabase/types';

// Email categories for organized dropdown
const EMAIL_CATEGORIES = [
    {
        label: 'User & Creator',
        types: [
            { id: 'welcome_user', label: 'Welcome User', description: 'Welcome email for all new signups (supporters & creators)' },
            { id: 'welcome_creator', label: 'Welcome Creator', description: 'Welcome email for new creators after onboarding' },
        ]
    },
    {
        label: 'Tips',
        types: [
            { id: 'tip_received', label: 'Tip Received', description: 'Sent to creator when they receive a tip' },
            { id: 'tip_sent', label: 'Tip Sent', description: 'Sent to supporter after sending a tip' },
        ]
    },
    {
        label: 'Withdrawals',
        types: [
            { id: 'withdrawal_submitted', label: 'Withdrawal Submitted', description: 'Confirmation when withdrawal is requested' },
            { id: 'withdrawal_processing', label: 'Withdrawal Processing', description: 'When withdrawal is approved for processing' },
            { id: 'withdrawal_completed', label: 'Withdrawal Completed', description: 'When withdrawal is successfully completed' },
            { id: 'withdrawal_rejected', label: 'Withdrawal Rejected', description: 'When withdrawal request is rejected' },
            { id: 'withdrawal_otp', label: 'Withdrawal OTP', description: 'OTP code for withdrawal verification' },
        ]
    },
    {
        label: 'Verification',
        types: [
            { id: 'verification_approved', label: 'Verification Approved', description: 'Sent when creator verification is approved' },
            { id: 'verification_rejected', label: 'Verification Rejected', description: 'Sent when creator verification is rejected' },
        ]
    },
    {
        label: 'Funding Goals',
        types: [
            { id: 'goal_milestone_25', label: 'Goal 25% Reached', description: 'Sent when a funding goal hits 25%' },
            { id: 'goal_milestone_50', label: 'Goal 50% Reached', description: 'Sent when a funding goal hits 50%' },
            { id: 'goal_milestone_75', label: 'Goal 75% Reached', description: 'Sent when a funding goal hits 75%' },
            { id: 'goal_milestone_100', label: 'Goal Completed', description: 'Sent when a funding goal is fully achieved' },
        ]
    },
    {
        label: 'Support',
        types: [
            { id: 'support_ticket_created', label: 'Ticket Created', description: 'Sent when a support ticket is created' },
            { id: 'support_new_reply', label: 'New Reply', description: 'Sent when admin replies to a ticket' },
            { id: 'support_ticket_closed', label: 'Ticket Closed', description: 'Sent when a support ticket is closed' },
        ]
    },
    {
        label: 'Other',
        types: [
            { id: 'weekly_summary', label: 'Weekly Summary', description: 'Weekly earnings summary for creators' },
        ]
    }
];

// Flatten for easy lookup
const EMAIL_TYPES = EMAIL_CATEGORIES.flatMap(cat => cat.types);

// Available dynamic variables per email type
const DYNAMIC_VARIABLES: Record<string, Array<{ name: string; description: string; example: string }>> = {
    welcome_user: [
        { name: 'first_name', description: 'User first name', example: 'John' },
    ],
    welcome_creator: [
        { name: 'username', description: 'Creator username', example: 'johndoe' },
        { name: 'first_name', description: 'Creator first name', example: 'John' },
    ],
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
    support_ticket_created: [
        { name: 'name', description: 'User name', example: 'John' },
        { name: 'ticket_number', description: 'Ticket reference', example: 'TK-20260202-A1B2' },
        { name: 'subject', description: 'Ticket subject', example: 'Payment Issue' },
        { name: 'ticket_url', description: 'Link to ticket', example: 'https://tipkoro.com/support/ticket/xxx' },
    ],
    support_new_reply: [
        { name: 'ticket_number', description: 'Ticket reference', example: 'TK-20260202-A1B2' },
        { name: 'message_preview', description: 'Preview of reply', example: 'Thank you for contacting us...' },
        { name: 'ticket_url', description: 'Link to ticket', example: 'https://tipkoro.com/support/ticket/xxx' },
    ],
    support_ticket_closed: [
        { name: 'ticket_number', description: 'Ticket reference', example: 'TK-20260202-A1B2' },
        { name: 'subject', description: 'Ticket subject', example: 'Payment Issue' },
    ],
};

// Default templates (simplified versions)
const DEFAULT_TEMPLATES: Record<string, { subject: string; html: string }> = {
    welcome_user: {
        subject: '👋 Welcome to TipKoro, {{first_name}}!',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">👋</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">Welcome to TipKoro!</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">Hi {{first_name}}, thanks for joining the TipKoro community!</p>
      <p style="color: #4A453D; text-align: center; margin: 0 0 28px;">Whether you're here to support your favorite creators or share your own content, we're excited to have you.</p>
      <div style="text-align: center;">
        <a href="https://tipkoro.com/explore" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">Explore Creators</a>
      </div>
    </div>
    <div style="text-align: center; padding: 24px 0; color: #7A7469; font-size: 14px;">
      <p style="margin: 0;">Made with ❤️ in Bangladesh</p>
    </div>
  </div>
</div>`,
    },
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
    support_ticket_created: {
        subject: '🎫 Ticket {{ticket_number}} Created - {{subject}}',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🎫</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">Support Ticket Created</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">Hi {{name}}, thank you for contacting TipKoro support.</p>
      <div style="background: #F5F1E8; border-radius: 16px; padding: 24px; margin: 28px 0;">
        <p style="margin: 0 0 8px;"><strong>Ticket Number:</strong> {{ticket_number}}</p>
        <p style="margin: 0;"><strong>Subject:</strong> {{subject}}</p>
      </div>
      <p style="color: #4A453D; text-align: center;">We typically respond within 24 hours. You'll receive an email notification when we reply.</p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="{{ticket_url}}" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Ticket</a>
      </div>
    </div>
    <div style="text-align: center; padding: 24px 0; color: #7A7469; font-size: 14px;">
      <p style="margin: 0;">Made with ❤️ in Bangladesh</p>
    </div>
  </div>
</div>`,
    },
    support_new_reply: {
        subject: '💬 New Reply on Ticket {{ticket_number}}',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">💬</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">New Reply on Your Ticket</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">Our support team has replied to ticket <strong>{{ticket_number}}</strong>.</p>
      <div style="background: #F5F1E8; border-left: 4px solid #F9C23C; border-radius: 0 12px 12px 0; padding: 20px 24px; margin: 28px 0;">
        <p style="margin: 0; color: #4A453D;">{{message_preview}}</p>
      </div>
      <div style="text-align: center; margin-top: 28px;">
        <a href="{{ticket_url}}" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Full Reply</a>
      </div>
    </div>
    <div style="text-align: center; padding: 24px 0; color: #7A7469; font-size: 14px;">
      <p style="margin: 0;">TipKoro Support Team</p>
    </div>
  </div>
</div>`,
    },
    support_ticket_closed: {
        subject: '✅ Ticket {{ticket_number}} Closed',
        html: `<div style="font-family: 'DM Sans', sans-serif; background: #F5F1E8; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 24px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #1F1C18;">💛 TipKoro</span>
    </div>
    <div style="background: #FEFDFB; border: 1px solid #E5E0D5; border-radius: 20px; padding: 44px 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">✅</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 700; text-align: center; margin: 0 0 10px;">Ticket Closed</h1>
      <p style="color: #7A7469; text-align: center; margin: 0 0 28px;">Your support ticket <strong>{{ticket_number}}</strong> regarding "{{subject}}" has been closed.</p>
      <p style="color: #4A453D; text-align: center;">We hope we were able to help resolve your issue. If you need further assistance, feel free to create a new ticket.</p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="https://tipkoro.com/support" style="display: inline-block; background: #1F1C18; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600;">Contact Support</a>
      </div>
      <p style="color: #7A7469; font-size: 14px; text-align: center; margin-top: 24px;">Thank you for using TipKoro. Your feedback helps us improve!</p>
    </div>
    <div style="text-align: center; padding: 24px 0; color: #7A7469; font-size: 14px;">
      <p style="margin: 0;">Made with ❤️ in Bangladesh</p>
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
    const [massEmailOpen, setMassEmailOpen] = useState(false);

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

                // Load template for selected type
                const current = templates[selectedType] || DEFAULT_TEMPLATES[selectedType];
                setSubjectCode(current.subject);
                setHtmlCode(current.html);
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, [selectedType]);

    // Current template type info
    const currentType = EMAIL_TYPES.find(t => t.id === selectedType);
    const currentVariables = DYNAMIC_VARIABLES[selectedType] || [];

    // Replace variables with test values for preview
    const renderedHtml = useMemo(() => {
        let html = htmlCode;

        // Replace {{variable}} with test values or examples
        currentVariables.forEach(v => {
            const value = testValues[v.name] || v.example;
            const regex = new RegExp(`{{${v.name}}}`, 'g');
            html = html.replace(regex, value);
        });

        // Handle simple conditionals {{#if variable}}...{{/if}}
        html = html.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (_, varName, content) => {
            const value = testValues[varName] || DYNAMIC_VARIABLES[selectedType]?.find(v => v.name === varName)?.example;
            return value ? content : '';
        });

        return DOMPurify.sanitize(html);
    }, [htmlCode, testValues, currentVariables, selectedType]);

    const renderedSubject = useMemo(() => {
        let subject = subjectCode;
        currentVariables.forEach(v => {
            const value = testValues[v.name] || v.example;
            const regex = new RegExp(`{{${v.name}}}`, 'g');
            subject = subject.replace(regex, value);
        });
        return subject;
    }, [subjectCode, testValues, currentVariables]);

    const handleTypeChange = (typeId: string) => {
        const template = savedTemplates[typeId] || DEFAULT_TEMPLATES[typeId];
        setSelectedType(typeId);
        setSubjectCode(template.subject);
        setHtmlCode(template.html);
        setHasChanges(false);
        setTestValues({});
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabaseAuth
                .from('platform_config')
                .upsert({
                    key: `email_template_${selectedType}`,
                    value: { subject: subjectCode, html: htmlCode } as unknown as Json,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'key' });

            if (error) throw error;

            setSavedTemplates(prev => ({
                ...prev,
                [selectedType]: { subject: subjectCode, html: htmlCode }
            }));
            setHasChanges(false);
            toast({ title: 'Saved!', description: `${currentType?.label} template updated.` });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        const defaultTemplate = DEFAULT_TEMPLATES[selectedType];
        setSubjectCode(defaultTemplate.subject);
        setHtmlCode(defaultTemplate.html);
        setHasChanges(true);
    };

    const copyVariable = (variable: string) => {
        navigator.clipboard.writeText(`{{${variable}}}`);
        toast({ title: 'Copied!', description: `{{${variable}}} copied to clipboard` });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="w-6 h-6" />
                        Email Templates
                    </h1>
                    <p className="text-muted-foreground">Customize transactional email templates</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => setMassEmailOpen(true)}>
                        <Users className="w-4 h-4 mr-2" />
                        Mass Email
                    </Button>
                    <Button variant="outline" onClick={handleReset} disabled={saving}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset to Default
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !hasChanges}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Template'}
                    </Button>
                </div>
            </div>

            {/* Template Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Select Template</CardTitle>
                    <CardDescription>Choose which email template to edit</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={selectedType} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-full md:w-[400px]">
                            <SelectValue placeholder="Select email type" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[400px]">
                            {EMAIL_CATEGORIES.map((category) => (
                                <SelectGroup key={category.label}>
                                    <SelectLabel className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1.5 -mx-1">
                                        {category.label}
                                    </SelectLabel>
                                    {category.types.map(type => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                    {currentType && (
                        <p className="text-sm text-muted-foreground mt-2">{currentType.description}</p>
                    )}
                </CardContent>
            </Card>

            {/* Available Variables */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Variable className="w-5 h-5" />
                        Available Variables
                    </CardTitle>
                    <CardDescription>Click to copy. Use {`{{variable}}`} in your template.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentVariables.map(v => (
                            <div
                                key={v.name}
                                onClick={() => copyVariable(v.name)}
                                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                            >
                                <div>
                                    <Badge variant="outline" className="font-mono mb-1">{`{{${v.name}}}`}</Badge>
                                    <p className="text-xs text-muted-foreground">{v.description}</p>
                                    <p className="text-xs text-muted-foreground/70">e.g., {v.example}</p>
                                </div>
                                <Copy className="w-4 h-4 text-muted-foreground" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Test Values */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Test Values</CardTitle>
                    <CardDescription>Override example values for preview</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentVariables.map(v => (
                            <div key={v.name}>
                                <Label htmlFor={v.name} className="text-sm">{v.name}</Label>
                                <Input
                                    id={v.name}
                                    placeholder={v.example}
                                    value={testValues[v.name] || ''}
                                    onChange={(e) => setTestValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                                    className="mt-1"
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Editor */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Code Editor */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Code className="w-5 h-5" />
                            Editor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Subject Line</Label>
                            <Input
                                value={subjectCode}
                                onChange={(e) => {
                                    setSubjectCode(e.target.value);
                                    setHasChanges(true);
                                }}
                                className="font-mono mt-1"
                            />
                        </div>
                        <div>
                            <Label>HTML Body</Label>
                            <div className="mt-1 border rounded-lg overflow-hidden">
                                {isMobile ? (
                                    <Textarea
                                        value={htmlCode}
                                        onChange={(e) => {
                                            setHtmlCode(e.target.value);
                                            setHasChanges(true);
                                        }}
                                        className="min-h-[400px] font-mono text-xs border-0 rounded-none resize-none focus-visible:ring-0"
                                        placeholder="Enter HTML template..."
                                    />
                                ) : (
                                    <Editor
                                        height="400px"
                                        defaultLanguage="html"
                                        value={htmlCode}
                                        onChange={(value) => {
                                            setHtmlCode(value || '');
                                            setHasChanges(true);
                                        }}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            lineNumbers: 'on',
                                            wordWrap: 'on',
                                            automaticLayout: true,
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Preview
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.1))}>
                                    <ZoomOut className="w-4 h-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                                <Button variant="ghost" size="icon" onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))}>
                                    <ZoomIn className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-muted/30 p-3 rounded-lg mb-4">
                            <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                            <p className="font-medium">{renderedSubject}</p>
                        </div>
                        <div
                            ref={previewContainerRef}
                            className="border rounded-lg overflow-auto bg-white"
                            style={{ height: '450px' }}
                        >
                            <div
                                style={{
                                    transform: `scale(${zoomLevel})`,
                                    transformOrigin: 'top left',
                                    width: `${100 / zoomLevel}%`,
                                }}
                                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Mass Email Dialog */}
            <MassEmailDialog open={massEmailOpen} onOpenChange={setMassEmailOpen} />
        </div>
    );
}
