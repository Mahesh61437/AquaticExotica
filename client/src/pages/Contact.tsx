import { Helmet } from "react-helmet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { MapPin, Phone, Mail, Loader2 } from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log("Submitting form data:", formData);
      
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      // Log response for debugging
      console.log("Response status:", response.status);
      
      let data;
      try {
        data = await response.json();
        console.log("Response data:", data);
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        data = { message: "Failed to parse server response" };
      }
      
      if (response.ok) {
        toast({
          title: "Message Sent",
          description: data.message || "Thank you for your message. We'll get back to you shortly.",
        });
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "There was a problem sending your message. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "There was a problem connecting to the server. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
                  <MapPin className="mr-4 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">Our Location</h3>
                    <address className="not-italic">
                      Hagadur, Whitefield<br />
                      Bangalore, India
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
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                    <Input 
                      id="name" 
                      placeholder="Your name" 
                      required 
                      onChange={handleChange}
                      value={formData.name}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Your email" 
                      required 
                      onChange={handleChange}
                      value={formData.email}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
                  <Input 
                    id="subject" 
                    placeholder="How can we help?" 
                    required 
                    onChange={handleChange}
                    value={formData.subject}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us more about your inquiry..." 
                    className="min-h-[150px]"
                    required
                    onChange={handleChange}
                    value={formData.message}
                    disabled={isSubmitting}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}