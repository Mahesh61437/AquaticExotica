import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";

const sendOTPSchema = z.object({
    email: z
        .string()
        .min(1, { message: "Email is required" })
        .email({ message: "Please enter a valid email address" }),
    otp: z.string().optional()
    });

type SendOTPFormValues = z.infer<typeof sendOTPSchema>;

export default function SendOTP() {
    const [, setLocation] = useLocation();
    const { sendResetOTP } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm<SendOTPFormValues>({
        resolver: zodResolver(sendOTPSchema),
        defaultValues: {
            email: "",
            otp: ""
        }
    });
    // const onSubmit = async (data: SendOTPFormValues) => {
    //     try {
    //         setLoading(true);
    //         await sendResetOTP(data.email);
    //         toast({
    //             title: "OTP sent successfully",
    //             description: "Check your email for the OTP code.",
    //         });
    //         setLocation("/forgot-password/send-otp");
    //     } catch (error: any) {
    //         console.error("Send OTP error:", error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const onSubmit = async (data: SendOTPFormValues) => {
        try {
            setLoading(true);
            await sendResetOTP(data.email);
            toast({
                title: "OTP sent successfully",
                description: "Check your email for the OTP code.",
            });
            sessionStorage.setItem('resetEmail', data.email);
            setLocation("/forgot-password/reset-password");
        } catch (error: any) {
            console.error("Send OTP error:", error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email to receive a password reset OTP.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Sending OTP..." : "Send OTP"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}