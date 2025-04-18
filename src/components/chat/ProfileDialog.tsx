
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [companyInfo, setCompanyInfo] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        setCompanyName(profile.company_name || "");
        setUserDescription(profile.user_description || "");
        setCompanyInfo(profile.user_provided_company_info || "");
        setTtsEnabled(profile.TTS_flag || false);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to update your profile",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          company_name: companyName,
          user_description: userDescription,
          user_provided_company_info: companyInfo,
          TTS_flag: ttsEnabled
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!open) {
      setCompanyName("");
      setUserDescription("");
      setCompanyInfo("");
      setTtsEnabled(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadProfile();
    } else {
      handleClose();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="companyName">Name of your company</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value.slice(0, 50))}
              maxLength={50}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-right">
              {companyName.length}/50 characters
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="userDescription" className="flex items-center gap-2">
              Personal Summary 
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[600px] w-[95vw] md:w-[500px]">
                    To get better results, you can provide a summary about yourself including your name, 
                    role at the company, hobbies, characteristics, and any other relevant information. 
                    This helps the AI consultant better understand your background.
                    <div className="mt-2 italic font-semibold">
                      PRO TIP: Ask ChatGPT to write a summary of you with detailed information 
                      that a consultant can read to prepare for an interview.
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Textarea
              id="userDescription"
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              className="min-h-[250px] resize-y w-full"
              placeholder="Share details about yourself that would help a consultant understand your background and perspective..."
            />
            <div className="text-xs text-muted-foreground">
              Maximum 1000 words
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="companyInfo" className="flex items-center gap-2">
              Information on the organization
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[600px] w-[95vw] md:w-[500px]">
                    To help assess AI readiness, you can provide information about your organization's culture, 
                    structure, current technologies, and goals. This context helps the consultant give more tailored advice.
                    <div className="mt-2 italic font-semibold">
                      PRO TIP: You can ask ChatGPT for a start again based on your ChatGPT profile.
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Textarea
              id="companyInfo"
              value={companyInfo}
              onChange={(e) => setCompanyInfo(e.target.value)}
              className="min-h-[250px] resize-y w-full"
              placeholder="Share information about your organization's structure, culture, technologies, and goals that would help assess AI readiness..."
            />
            <div className="text-xs text-muted-foreground">
              Maximum 1000 words
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="tts"
              checked={ttsEnabled}
              onCheckedChange={setTtsEnabled}
            />
            <Label htmlFor="tts">Enable audio responses</Label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            type="button"
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
