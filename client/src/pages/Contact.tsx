import { Helmet } from "react-helmet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { MapPin, Phone, Mail, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      setLoading(true);
      
      await apiRequest("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      toast({
        title: "Message sent successfully",
        description: "We'll get back to you as soon as possible.",
      });

      form.reset();
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | AquaticExotica</title>
        <meta name="description" content="Get in touch with AquaticExotica for any questions about our aquarium products, shipping, or customer support. We're here to help!" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-8 text-center">Contact Us</h1>
        
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-primary p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">Get In Touch</h2>
              <p className="mb-8">
                Have questions or need assistance? We're here to help with all your aquarium needs.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="mr-4 mt-1 w-5 h-5 flex items-center justify-center bg-white bg-opacity-20 rounded-full">
                    <span className="text-xs font-bold">S</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Contact Person</h3>
                    <p className="text-sm">SREENIVASULU MAHESH BABU</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="mr-4 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">Our Location</h3>
                    <address className="not-italic">
                      Balaji Nagar, Greamspet<br />
                      Chittoor, Andhra Pradesh<br />
                      Pincode: 517002
                    </address>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="mr-4 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <p>+91 8074751370</p>
                    <p className="text-sm mt-1">Mon-Sat, 10:00 AM - 7:00 PM</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="mr-4 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p>mahesh@aquaticexotica.com</p>
                    <p className="text-sm mt-1">We'll respond as soon as possible</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-2/3 p-8">
              <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="What's this about?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us more about your inquiry..."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}