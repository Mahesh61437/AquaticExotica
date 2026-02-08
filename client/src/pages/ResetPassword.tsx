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

const resetPasswordSchema = z.object({
  otp: z.string().min(6, { message: "OTP must be at least 6 characters long" }),
    newPassword: z.string().min(6, { message: "New password must be at least 6 characters long" }),
    confirmPassword: z.string().min(1, { message: "Confirm password is required" })
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
    const [, setLocation] = useLocation();
    const { ResetPassword } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            otp: "",
            newPassword: "",
            confirmPassword: ""
        }
    });
    const onSubmit = async (data: ResetPasswordFormValues) => {
        const email = sessionStorage.getItem('resetEmail');
        if (!email) {
            toast({
                title: "Error",
                description: "Email not found. Please start the reset process again.",
            });
            return;
        }
        try {
            setLoading(true);
            
            await ResetPassword(email, data.otp, data.newPassword, data.confirmPassword);
            toast({
                title: "Password reset successfully",
                description: "Your password has been reset.",
            });
            setLocation("/login");
        } catch (error: any) {
            console.error("Reset password error:", error);
        } finally {
            setLoading(false);
            sessionStorage.removeItem('resetEmail');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">Enter the OTP sent to your email and set a new password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="otp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>OTP</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter OTP" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <PasswordInput placeholder="Enter new password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <PasswordInput placeholder="Confirm new password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Resetting..." : "Reset Password"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}