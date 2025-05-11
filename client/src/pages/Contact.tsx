import { Helmet } from "react-helmet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Contact() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real application, we would send the form data to the server
    toast({
      title: "Message Sent",
      description: "Thank you for your message. We'll get back to you shortly.",
    });
    // Reset form
    e.currentTarget.reset();
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
                      123 Aquarium Way<br />
                      Mumbai, Maharashtra 400001<br />
                      India
                    </address>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="mr-4 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <p>+91 98765 43210</p>
                    <p className="text-sm mt-1">Mon-Sat, 10:00 AM - 7:00 PM</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="mr-4 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p>info@aquaticexotica.com</p>
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
                    <Input id="name" placeholder="Your name" required />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                    <Input id="email" type="email" placeholder="Your email" required />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
                  <Input id="subject" placeholder="How can we help?" required />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us more about your inquiry..." 
                    className="min-h-[150px]"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">Send Message</Button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Visit Our Store</h2>
          <div className="h-[400px] bg-gray-200 rounded-lg shadow-md">
            {/* In a real application, you would embed a Google Map here */}
            <div className="h-full flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">Map Loading...</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}