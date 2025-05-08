import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { auth } from "@lib/firebase";
import { useToast } from "@hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  generateRecaptcha: (elementId: string) => RecaptchaVerifier;
  sendOtp: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<string>;
  verifyOtp: (otp: string, verificationId: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error) {
      console.error("Sign out error", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const generateRecaptcha = (elementId: string) => {
    return new RecaptchaVerifier(auth, elementId, {
      size: "invisible",
    });
  };

  const sendOtp = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      toast({
        title: "OTP Sent",
        description: "We've sent a verification code to your phone",
      });
      return verificationId.verificationId;
    } catch (error: any) {
      console.error("OTP send error", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
      throw error;
    }
  };

  const verifyOtp = async (otp: string, verificationId: string) => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await auth.signInWithCredential(credential);
      toast({
        title: "Verification successful",
        description: "You have been signed in successfully",
      });
      return userCredential.user;
    } catch (error: any) {
      console.error("OTP verification error", error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signOut,
    generateRecaptcha,
    sendOtp,
    verifyOtp
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}