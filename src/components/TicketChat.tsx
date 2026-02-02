import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { TicketMessage } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  FileText,
  Video,
  X,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EMOJI_LIST = ['😊', '👍', '❤️', '🙏', '😢', '😡', '🤔', '✅', '❌', '⚠️', '💡', '🎉'];

interface TicketChatProps {
  messages: TicketMessage[];
  onSendMessage: (message: string, attachments?: TicketMessage['attachments']) => Promise<void>;
  onUploadFile?: (file: File) => Promise<TicketMessage['attachments'][0] | null>;
  isAdmin?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export function TicketChat({
  messages,
  onSendMessage,
  onUploadFile,
  isAdmin = false,
  disabled = false,
  loading = false,
}: TicketChatProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<TicketMessage['attachments']>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;

    setSending(true);
    await onSendMessage(message, attachments);
    setMessage('');
    setAttachments([]);
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onUploadFile) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        continue;
      }

      const attachment = await onUploadFile(file);
      if (attachment) {
        setAttachments((prev) => [...prev, attachment]);
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  const getAttachmentIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const renderAttachment = (attachment: TicketMessage['attachments'][0]) => {
    if (attachment.type.startsWith('image/')) {
      return (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
          />
        </a>
      );
    }

    if (attachment.type.startsWith('video/')) {
      return (
        <video
          src={attachment.url}
          controls
          className="max-w-[300px] max-h-[200px] rounded-lg"
        />
      );
    }

    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
      >
        <FileText className="w-5 h-5" />
        <span className="text-sm truncate max-w-[150px]">{attachment.name}</span>
        <Download className="w-4 h-4 ml-auto" />
      </a>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-6 h-6" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p>No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isSystem = msg.sender_type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <Badge variant="secondary" className="text-xs">
                      {msg.message}
                    </Badge>
                  </div>
                );
              }

              // If viewing as admin, admin messages should be on right (like "self")
              // If viewing as user, user messages should be on right (like "self")
              const isSelf = isAdmin 
                ? msg.sender_type === 'admin' 
                : msg.sender_type === 'user';

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col gap-1 max-w-[80%]',
                    isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
                  )}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {isSelf ? 'You' : (isAdmin ? msg.sender_name : `${msg.sender_name} (Support)`)}
                    </span>
                    <span>•</span>
                    <span>{format(new Date(msg.created_at), 'MMM d, h:mm a')}</span>
                  </div>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5',
                      isSelf
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary rounded-bl-md'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.attachments.map((att, i) => (
                        <div key={i}>{renderAttachment(att)}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1 rounded-lg bg-secondary text-sm"
              >
                {getAttachmentIcon(att.type)}
                <span className="truncate max-w-[100px]">{att.name}</span>
                <button
                  onClick={() => removeAttachment(i)}
                  className="p-0.5 hover:bg-destructive/10 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'This ticket is closed' : 'Type a message...'}
              disabled={disabled || sending}
              rows={1}
              className="min-h-[44px] max-h-[120px] resize-none pr-20"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {/* Emoji Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={disabled}
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end">
                  <div className="grid grid-cols-6 gap-1">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        className="p-1.5 hover:bg-secondary rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* File Upload */}
              {onUploadFile && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={disabled || uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={disabled || sending || (!message.trim() && attachments.length === 0)}
            className="h-11"
          >
            {sending ? <Spinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
