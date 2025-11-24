import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface VerificationCodeFormProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  touched?: boolean;
  className?: string;
}

export function VerificationCodeForm({
  value,
  onChange,
  onBlur,
  error,
  touched,
  className = "",
}: Readonly<VerificationCodeFormProps>) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync internal state with external value prop
  useEffect(() => {
    if (value !== code.join("")) {
      const digits = value.padEnd(6, "").slice(0, 6).split("");
      setCode(digits);
    }
  }, [value, code]);

  const getFieldStatus = () => {
    if (!touched) return null;
    return error ? "error" : "success";
  };

  const handleCodeChange = (index: number, newValue: string) => {
    if (newValue.length > 1) return; // Prevent multiple characters

    const newCode = [...code];
    newCode[index] = newValue;
    setCode(newCode);

    // Call the external onChange with the complete code
    onChange(newCode.join(""));

    // Auto-focus next input
    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newCode = [...code];

    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }

    setCode(newCode);
    onChange(newCode.join(""));

    // Focus the next empty input or the last input
    const nextEmptyIndex = newCode.findIndex((digit) => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : Math.min(nextEmptyIndex, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="otpCode">Verification Code</Label>
      <div className="flex gap-2 justify-center">
        {code.map((digit, index) => (
          <Input
            key={index + " " + digit}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onBlur={handleBlur}
            className={`w-12 h-12 text-center text-lg font-semibold rounded-md focus:ring-2 ${
              getFieldStatus() === "error"
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            } placeholder:opacity-40`}
            placeholder="0"
          />
        ))}
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
