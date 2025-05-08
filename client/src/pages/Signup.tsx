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

const signupSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
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

type SignupFormValues = z.infer<typeof signupSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const { generateRecaptcha, sendOtp, verifyOtp } = useAuth();
  const { toast } = useToast();
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<SignupFormValues | null>(null);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: ""
    }
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: ""
    }
  });

  const onSignupSubmit = async (data: SignupFormValues) => {
    try {
      setLoading(true);
      setUserInfo(data);
      
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
      const user = await verifyOtp(data.otp, verificationId);
      
      if (user && userInfo) {
        // In a real application, we would store the additional user information
        // in our database here or update the user profile in Firebase
        console.log("User verified:", user.uid);
        console.log("Additional info:", userInfo);
        
        toast({
          title: "Registration successful",
          description: "Your account has been created successfully",
        });
        setLocation("/account");
      }
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
      if (!userInfo) return;
      
      let formattedPhone = userInfo.phoneNumber;
      if (!formattedPhone.startsWith('+')) {
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
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            {isOtpSent ? "Enter the verification code sent to your phone" : "Fill in your details to create an account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOtpSent ? (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                <FormField
                  control={signupForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
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
                  {loading ? "Creating Account..." : "Create Account"}
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
                  {loading ? "Verifying..." : "Verify & Create Account"}
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
            Already have an account?{" "}
            <a className="text-blue-500 hover:text-blue-700 font-semibold cursor-pointer" onClick={() => setLocation("/login")}>
              Sign in
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}