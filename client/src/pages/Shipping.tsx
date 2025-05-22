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
                    It will take at least 3-5 working days to ship your order.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Shipping Charges</h3>
                  <p>
                    <strong className="text-primary">Free shipping on orders more than ₹2000</strong>
                  </p>
                  <p className="mt-2">Delivery charges per kg:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>₹100 per kg for Karnataka</li>
                    <li>₹120 per kg for Andhra Pradesh, Kerala, Tamil Nadu</li>
                    <li>₹150 per kg for other places</li>
                  </ul>
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
                  <h3 className="text-lg font-semibold mb-2">No Returns Policy</h3>
                  <p>
                    We do not accept returns for any products.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Refund Eligibility</h3>
                  <p>
                    Refunds are only eligible when you receive plants dead on arrival.
                  </p>
                  <p className="mt-2 font-medium text-amber-600">
                    An unboxing video is mandatory for refund processing.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Refund Process</h3>
                  <p>
                    To request a refund for dead-on-arrival plants, please:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Email us at mahesh@aquaticexotica.com within 24 hours of receiving your order</li>
                    <li>Include your order number in the subject line</li>
                    <li>Attach your unboxing video</li>
                    <li>Provide clear photos of the affected plants</li>
                  </ul>
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
                Orders typically take 3-5 working days to be shipped after processing.
              </p>
            </Card>

            <Card className="text-center p-6">
              <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">How are refunds processed?</h3>
              <p className="text-gray-600">
                Refunds for dead-on-arrival plants are processed within 3-5 business days after verification.
              </p>
            </Card>

            <Card className="text-center p-6">
              <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Do you ship nationwide?</h3>
              <p className="text-gray-600">
                Yes, we ship to all locations across India with varying shipping charges based on region.
              </p>
            </Card>

            <Card className="text-center p-6">
              <RefreshCw className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Can I exchange items?</h3>
              <p className="text-gray-600">
                We do not offer exchanges. Please review product details carefully before placing your order.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}