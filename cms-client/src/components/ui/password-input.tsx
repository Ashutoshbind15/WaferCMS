import { useId, useState } from "react";
import { Check, Copy, Eye, EyeOff, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CHARSET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";

const generatePassword = (length = 16): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => CHARSET[byte % CHARSET.length]).join("");
};

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  ariaLabel?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
};

export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  ariaLabel,
  id,
  disabled = false,
  className,
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    onChange(generatePassword());
    setVisible(true);
    toast.success("Strong password generated.");
  };

  const handleCopy = async () => {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Password copied to clipboard.");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy password.");
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        id={inputId}
        type={visible ? "text" : "password"}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        style={{ paddingRight: 116 }}
      />
      <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={handleGenerate}
          title="Generate strong password"
          aria-label="Generate strong password"
        >
          <Wand2 />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled || !value}
          onClick={() => void handleCopy()}
          title="Copy password"
          aria-label="Copy password"
        >
          {copied ? <Check /> : <Copy />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() => setVisible((prev) => !prev)}
          title={visible ? "Hide password" : "Show password"}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
    </div>
  );
}
