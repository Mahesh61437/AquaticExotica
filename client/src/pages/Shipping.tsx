import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, RefreshCw, Clock, CreditCard } from "lucide-react";

export default function Shipping() {
  return (
    <>
      <Helmet>
        <title>Shipping & Returns | AquaticExotica</title>
        <meta name="description" content="Learn about AquaticExotica's shipping policies, delivery times, and return procedures for aquarium products." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-center">Shipping & Returns</h1>
        <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12">
          We want to ensure your aquatic plants and accessories arrive safely and in excellent condition. Learn about our shipping and return policies.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <Truck className="h-8 w-8 text-primary mr-4" />
                <h2 className="text-2xl font-bold">Shipping Policy</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Delivery Times</h3>
                  <p>
                    We process all orders within 1-2 business days. Once shipped, delivery typically takes:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Mumbai: 1-2 business days</li>
                    <li>Major metro cities: 2-3 business days</li>
                    <li>All other locations: 3-5 business days</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Shipping Charges</h3>
                  <p>
                    Standard shipping charges are ₹99 for orders below ₹2000. 
                    <strong className="text-primary"> Free delivery on all orders above ₹2000</strong>.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Special Considerations for Live Plants</h3>
                  <p>
                    Live aquatic plants are shipped with special care to ensure they arrive in optimal condition. We use insulated packaging to protect plants during transit. 
                  </p>
                  <p className="mt-2">
                    Please note: We may delay shipping during extreme weather conditions to ensure the safety of live plants.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <RefreshCw className="h-8 w-8 text-primary mr-4" />
                <h2 className="text-2xl font-bold">Returns Policy</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Return Eligibility</h3>
                  <p>
                    We accept returns within 7 days of delivery for most products. To be eligible for a return, your item must be:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>In the same condition that you received it</li>
                    <li>In the original packaging</li>
                    <li>Unused and not set up in your aquarium</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Live Plant Policy</h3>
                  <p>
                    For live plants, we offer a 48-hour guarantee. If your plants arrive damaged or unhealthy, please email us within 48 hours with photos of the plants. We'll provide a replacement or refund.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Return Process</h3>
                  <p>
                    To start a return, contact us at returns@aquaticexotica.com with your order number and details about the item you wish to return. We'll provide instructions for packaging and shipping.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Common Questions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">How long will my order take?</h3>
              <p className="text-gray-600">
                Most orders are delivered within 2-5 business days depending on your location.
              </p>
            </Card>

            <Card className="text-center p-6">
              <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">How are refunds processed?</h3>
              <p className="text-gray-600">
                Refunds are processed to the original payment method within 3-5 business days of approval.
              </p>
            </Card>

            <Card className="text-center p-6">
              <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Do you ship nationwide?</h3>
              <p className="text-gray-600">
                Yes, we ship to all locations across India. Remote areas may require additional transit time.
              </p>
            </Card>

            <Card className="text-center p-6">
              <RefreshCw className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Can I exchange items?</h3>
              <p className="text-gray-600">
                Yes, eligible items can be exchanged within 7 days. Contact us to arrange an exchange.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}