import React, { useState, useEffect } from "react";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  BadgeCheck, 
  Upload, 
  Camera, 
  CheckCircle, 
  Clock, 
  XCircle,
  ImageIcon,
  AlertCircle
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface VerificationRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

export function VerificationForm() {
  const supabase = useSupabaseWithAuth();
  const { profile } = useProfile();
  
  const [existingRequest, setExistingRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchExistingRequest();
    }
  }, [profile?.id]);

  const fetchExistingRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('id, status, admin_notes, created_at')
        .eq('profile_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setExistingRequest(data as VerificationRequest);
      }
    } catch (error) {
      console.error('Error fetching verification request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('verification-documents')
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!idFrontFile || !idBackFile || !selfieFile) {
      toast({
        title: "Missing files",
        description: "Please upload all required documents",
        variant: "destructive"
      });
      return;
    }

    if (!profile?.id) return;

    setSubmitting(true);
    try {
      const timestamp = Date.now();
      // Use username as prefix (sanitized), fallback to profile ID
      const username = profile?.username || profile?.id;
      const sanitizedUsername = username?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'user';
      const basePath = `${sanitizedUsername}_${timestamp}`;

      // Upload all files with username prefix
      const [idFrontUrl, idBackUrl, selfieUrl] = await Promise.all([
        uploadFile(idFrontFile, `${basePath}_id-front.${idFrontFile.name.split('.').pop()}`),
        uploadFile(idBackFile, `${basePath}_id-back.${idBackFile.name.split('.').pop()}`),
        uploadFile(selfieFile, `${basePath}_selfie.${selfieFile.name.split('.').pop()}`),
      ]);

      // Create verification request
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          profile_id: profile.id,
          id_front_url: idFrontUrl,
          id_back_url: idBackUrl,
          selfie_url: selfieUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Verification submitted!",
        description: "Your documents have been submitted for review. We'll notify you once processed."
      });

      // Refresh the request status
      fetchExistingRequest();
      
      // Clear form
      setIdFrontFile(null);
      setIdBackFile(null);
      setSelfieFile(null);
      setIdFrontPreview(null);
      setIdBackPreview(null);
      setSelfiePreview(null);

    } catch (error: any) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit verification request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  // Already verified - also check for admin notes (could contain approval message)
  if (profile?.is_verified) {
    // Find the most recent approved request with admin_notes
    const approvedRequest = existingRequest?.status === 'approved' ? existingRequest : null;
    
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <BadgeCheck className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">You're Verified!</h3>
        <p className="text-muted-foreground">
          Your account has been verified. Your profile now displays a verification badge.
        </p>
        {approvedRequest?.admin_notes && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-left max-w-md mx-auto">
            <p className="text-sm font-medium text-green-700 mb-1">Admin Note:</p>
            <p className="text-sm text-muted-foreground">{approvedRequest.admin_notes}</p>
          </div>
        )}
      </div>
    );
  }

  // Existing pending request
  if (existingRequest?.status === 'pending') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Verification Pending</h3>
        <p className="text-muted-foreground mb-4">
          Your verification request is being reviewed. This usually takes 1-2 business days.
        </p>
        <p className="text-sm text-muted-foreground">
          Submitted on {new Date(existingRequest.created_at).toLocaleDateString()}
        </p>
      </div>
    );
  }

  // Rejected - allow resubmission
  if (existingRequest?.status === 'rejected') {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-600">Previous Request Rejected</h4>
              {existingRequest.admin_notes && (
                <p className="text-sm text-muted-foreground mt-1">
                  Reason: {existingRequest.admin_notes}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                You can submit a new verification request below.
              </p>
            </div>
          </div>
        </div>
        
        <VerificationFormFields
          idFrontPreview={idFrontPreview}
          idBackPreview={idBackPreview}
          selfiePreview={selfiePreview}
          onIdFrontChange={(e) => handleFileChange(e, setIdFrontFile, setIdFrontPreview)}
          onIdBackChange={(e) => handleFileChange(e, setIdBackFile, setIdBackPreview)}
          onSelfieChange={(e) => handleFileChange(e, setSelfieFile, setSelfiePreview)}
          onSubmit={handleSubmit}
          submitting={submitting}
          canSubmit={!!idFrontFile && !!idBackFile && !!selfieFile}
        />
      </div>
    );
  }

  // No request yet - show form
  return (
    <div className="space-y-6">
      <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-medium">Get Verified</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Verification adds a badge to your profile and increases trust with supporters.
              You'll need to provide a government-issued ID and a selfie.
            </p>
          </div>
        </div>
      </div>

      <VerificationFormFields
        idFrontPreview={idFrontPreview}
        idBackPreview={idBackPreview}
        selfiePreview={selfiePreview}
        onIdFrontChange={(e) => handleFileChange(e, setIdFrontFile, setIdFrontPreview)}
        onIdBackChange={(e) => handleFileChange(e, setIdBackFile, setIdBackPreview)}
        onSelfieChange={(e) => handleFileChange(e, setSelfieFile, setSelfiePreview)}
        onSubmit={handleSubmit}
        submitting={submitting}
        canSubmit={!!idFrontFile && !!idBackFile && !!selfieFile}
      />
    </div>
  );
}

interface VerificationFormFieldsProps {
  idFrontPreview: string | null;
  idBackPreview: string | null;
  selfiePreview: string | null;
  onIdFrontChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIdBackChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelfieChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  submitting: boolean;
  canSubmit: boolean;
}

function VerificationFormFields({
  idFrontPreview,
  idBackPreview,
  selfiePreview,
  onIdFrontChange,
  onIdBackChange,
  onSelfieChange,
  onSubmit,
  submitting,
  canSubmit
}: VerificationFormFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* ID Front */}
        <div>
          <Label className="mb-2 block">ID Card Front</Label>
          <label className="aspect-[4/3] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors overflow-hidden">
            {idFrontPreview ? (
              <img src={idFrontPreview} alt="ID Front" className="w-full h-full object-cover" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Upload front</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onIdFrontChange}
            />
          </label>
        </div>

        {/* ID Back */}
        <div>
          <Label className="mb-2 block">ID Card Back</Label>
          <label className="aspect-[4/3] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors overflow-hidden">
            {idBackPreview ? (
              <img src={idBackPreview} alt="ID Back" className="w-full h-full object-cover" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Upload back</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onIdBackChange}
            />
          </label>
        </div>

        {/* Selfie */}
        <div>
          <Label className="mb-2 block">Selfie</Label>
          <label className="aspect-[4/3] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors overflow-hidden">
            {selfiePreview ? (
              <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Upload selfie</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onSelfieChange}
            />
          </label>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Requirements:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Use a valid government-issued ID (NID, Passport, Driving License)</li>
          <li>Ensure all text is clearly visible</li>
          <li>Take a clear selfie showing your face</li>
          <li>Files must be less than 5MB each</li>
        </ul>
      </div>

      <Button 
        onClick={onSubmit} 
        disabled={!canSubmit || submitting}
        className="w-full"
      >
        {submitting ? (
          <>
            <Spinner className="w-4 h-4 mr-2" />
            Submitting...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Submit for Verification
          </>
        )}
      </Button>
    </div>
  );
}
