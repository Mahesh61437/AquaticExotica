import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RecaptchaVerifier } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .regex(/^\+?[0-9]+$/, { message: "Phone number can only contain digits and an optional + prefix" })
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, { message: "OTP must be at least 6 digits" })
    .regex(/^[0-9]+$/, { message: "OTP can only contain digits" })
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { generateRecaptcha, sendOtp, verifyOtp } = useAuth();
  const { toast } = useToast();
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [loading, setLoading] = useState(false);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: ""
    }
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: ""
    }
  });

  const onPhoneSubmit = async (data: PhoneFormValues) => {
    try {
      setLoading(true);
      
      let formattedPhone = data.phoneNumber;
      // Ensure the phone number starts with +
      if (!formattedPhone.startsWith('+')) {
        // If no country code, assume India (+91)
        if (formattedPhone.startsWith('91')) {
          formattedPhone = '+' + formattedPhone;
        } else {
          formattedPhone = '+91' + formattedPhone;
        }
      }

      if (!recaptchaVerifier.current && recaptchaContainerRef.current) {
        recaptchaVerifier.current = generateRecaptcha('recaptcha-container');
      }

      if (recaptchaVerifier.current) {
        const verificationIdResult = await sendOtp(formattedPhone, recaptchaVerifier.current);
        setVerificationId(verificationIdResult);
        setIsOtpSent(true);
        toast({
          title: "OTP Sent",
          description: `Verification code sent to ${formattedPhone}`,
        });
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (data: OtpFormValues) => {
    try {
      setLoading(true);
      await verifyOtp(data.otp, verificationId);
      toast({
        title: "Login successful",
        description: "You have been logged in successfully",
      });
      setLocation("/account");
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const formattedPhone = phoneForm.getValues().phoneNumber;
      
      if (!recaptchaVerifier.current && recaptchaContainerRef.current) {
        recaptchaVerifier.current = generateRecaptcha('recaptcha-container');
      }

      if (recaptchaVerifier.current) {
        const verificationIdResult = await sendOtp(formattedPhone, recaptchaVerifier.current);
        setVerificationId(verificationIdResult);
        toast({
          title: "OTP Resent",
          description: `Verification code resent to ${formattedPhone}`,
        });
      }
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in to your account</CardTitle>
          <CardDescription className="text-center">
            Enter your phone number to receive a verification code
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOtpSent ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Verification Code"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Resend Code
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-center text-sm text-gray-500 mt-2">
            Don't have an account?{" "}
            <a className="text-blue-500 hover:text-blue-700 font-semibold cursor-pointer" onClick={() => setLocation("/signup")}>
              Sign up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}