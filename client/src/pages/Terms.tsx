import { Helmet } from "react-helmet";

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions | AquaticExotica</title>
        <meta name="description" content="Read AquaticExotica's terms and conditions for using our website and purchasing our aquarium products." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-center">Terms & Conditions</h1>
        <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12">
          Please read these terms and conditions carefully before using the AquaticExotica website or placing an order.
        </p>

        <div className="max-w-4xl mx-auto prose prose-blue prose-lg">
          <div className="mb-8">
            <h2>1. Introduction</h2>
            <p>
              Welcome to AquaticExotica. These terms and conditions govern your use of our website and the purchase of products from our online store. By accessing our website or placing an order, you agree to be bound by these terms and conditions.
            </p>
          </div>

          <div className="mb-8">
            <h2>2. Definitions</h2>
            <p>
              "We," "our," and "us" refer to AquaticExotica.
              "Website" refers to the website www.aquaticexotica.com.
              "You" and "your" refer to the user or purchaser of our products.
              "Products" refers to any items listed for sale on our website.
            </p>
          </div>

          <div className="mb-8">
            <h2>3. Ordering and Payment</h2>
            <p>
              When you place an order through our website, you are making an offer to purchase products. We reserve the right to accept or decline your order for any reason.
            </p>
            <p>
              Orders are confirmed once we send you an order confirmation email. The contract for sale is only formed when we dispatch the products to you.
            </p>
            <p>
              All prices are in Indian Rupees (INR) and include applicable taxes. Shipping costs are calculated at checkout before payment is made.
            </p>
            <p>
              We accept payments through various methods including credit/debit cards, net banking, UPI, and other payment gateways. All payment information is encrypted for your security.
            </p>
          </div>

          <div className="mb-8">
            <h2>4. Shipping and Delivery</h2>
            <p>
              We ship to addresses within India only. Delivery times are estimates and not guaranteed. Delays can occur due to customs, postal delays, or other factors beyond our control.
            </p>
            <p>
              Risk of loss and damage for products passes to you upon delivery to the shipping address you provided.
            </p>
            <p>
              For live aquatic plants and animals, we take special precautions for shipping, but we cannot guarantee 100% survival due to the nature of these products. Please see our specific policies regarding live plants and animals in the product descriptions.
            </p>
          </div>

          <div className="mb-8">
            <h2>5. Returns and Refunds</h2>
            <p>
              Please refer to our separate Returns & Refunds Policy for detailed information about returning products and obtaining refunds.
            </p>
            <p>
              For live plants and animals, different return policies apply due to their perishable nature. Generally, we require notification within 48 hours of receipt with photographic evidence of any issues.
            </p>
          </div>

          <div className="mb-8">
            <h2>6. Product Information</h2>
            <p>
              We make every effort to display the colors and features of our products accurately. However, the actual colors you see depend on your monitor, and we cannot guarantee that your display will accurately reflect the product colors.
            </p>
            <p>
              For live plants and animals, variations in size, color, and pattern are natural and to be expected. The images on our website are representative, but individual specimens may vary.
            </p>
            <p>
              Product information, including pricing, availability, and descriptions, is subject to change without notice.
            </p>
          </div>

          <div className="mb-8">
            <h2>7. Intellectual Property</h2>
            <p>
              All content on this website, including text, graphics, logos, button icons, images, audio clips, and software, is the property of AquaticExotica or its content suppliers and is protected by Indian and international copyright laws.
            </p>
            <p>
              You may not reproduce, distribute, display, or transmit any content from this website without our prior written permission.
            </p>
          </div>

          <div className="mb-8">
            <h2>8. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account information, including your password, and for all activity that occurs under your account.
            </p>
            <p>
              You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
            </p>
          </div>

          <div className="mb-8">
            <h2>9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, AquaticExotica shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the website.
            </p>
          </div>

          <div className="mb-8">
            <h2>10. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes arising under these terms and conditions shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
            </p>
          </div>

          <div className="mb-8">
            <h2>11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms and conditions at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website after any changes indicates your acceptance of the modified terms.
            </p>
          </div>

          <div className="mb-8">
            <h2>12. Contact Information</h2>
            <p>
              If you have any questions about these terms and conditions, please contact us at:
            </p>
            <p>
              AquaticExotica<br />
              123 Aquarium Way, Mumbai, Maharashtra 400001, India<br />
              Email: legal@aquaticexotica.com<br />
              Phone: +91 98765 43210
            </p>
          </div>

          <div className="text-gray-600 italic mt-10">
            <p>Last updated: May 11, 2025</p>
          </div>
        </div>
      </div>
    </>
  );
}