import { Helmet } from "react-helmet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqCategories = [
    {
      title: "Orders & Shipping",
      questions: [
        {
          question: "How long will it take to receive my order?",
          answer: "Most orders are processed within 1-2 business days. Once shipped, delivery typically takes 2-5 business days depending on your location. Mumbai and nearby areas usually receive orders within 1-2 days, while other locations may take 3-5 days."
        },
        {
          question: "Do you offer free shipping?",
          answer: "Yes! We offer free delivery on all orders above ₹2000. For orders below ₹2000, a standard shipping fee of ₹99 applies."
        },
        {
          question: "How do you ship live plants and fish?",
          answer: "We use specialized packaging techniques to ensure live plants and fish arrive safely. Plants are wrapped in damp paper to maintain moisture, and fish are shipped in oxygen-filled bags with insulated packaging to maintain temperature. We may delay shipping during extreme weather conditions to ensure the safety of live species."
        },
        {
          question: "Do you ship internationally?",
          answer: "Currently, we only ship within India. We hope to expand to international shipping in the future."
        }
      ]
    },
    {
      title: "Products & Care",
      questions: [
        {
          question: "How should I care for newly received aquatic plants?",
          answer: "When you receive your aquatic plants, gently rinse them in room temperature dechlorinated water to remove any shipping gel or protective coating. Plant them in your aquarium according to their specific requirements (lighting, substrate, etc.). Most plants undergo an adjustment period, so don't be alarmed if some leaves melt or die back initially. New growth should appear within 1-2 weeks with proper care."
        },
        {
          question: "What lighting is recommended for planted aquariums?",
          answer: "For low-light plants (Anubias, Java Fern), standard LED aquarium lights are sufficient. Medium-light plants (Cryptocoryne, Vallisneria) benefit from moderate LED or fluorescent lighting. High-light plants (Carpeting plants, Red plants) require high-output LED lighting systems. We recommend 8-10 hours of light daily for most planted aquariums."
        },
        {
          question: "Do I need CO2 for a planted aquarium?",
          answer: "Not necessarily. Many plants can thrive without supplemental CO2. Low-light, slow-growing plants like Anubias, Java Fern, and Cryptocoryne species don't require CO2. However, for dense, lush growth and for keeping more demanding plant species, a CO2 system will significantly improve results."
        },
        {
          question: "How do I cycle a new aquarium?",
          answer: "Cycling a new aquarium establishes beneficial bacteria that process fish waste. Start by setting up your tank with substrate, plants, and equipment. Add a source of ammonia (fish food or pure ammonia). Test water regularly for ammonia, nitrite, and nitrate. The cycle is complete when ammonia and nitrite levels read zero, and nitrates are present. This process typically takes 4-6 weeks. We sell beneficial bacteria products that can help speed up this process."
        }
      ]
    },
    {
      title: "Returns & Refunds",
      questions: [
        {
          question: "What is your return policy?",
          answer: "We accept returns of unused, undamaged items in original packaging within 7 days of delivery. For aquarium equipment and accessories, we provide a 7-day return window. For live plants, we offer a 48-hour guarantee - if they arrive damaged or unhealthy, contact us with photos within 48 hours."
        },
        {
          question: "How do I initiate a return?",
          answer: "To start a return, please email returns@aquaticexotica.com with your order number and photos of the items you wish to return. We'll provide instructions for packaging and shipping the items back to us."
        },
        {
          question: "How long do refunds take to process?",
          answer: "Once we receive your returned item, we'll inspect it and process your refund within 3-5 business days. Refunds are issued to the original payment method. It may take an additional 5-7 business days for the refund to appear in your account, depending on your bank or payment provider."
        },
        {
          question: "Do you offer exchanges?",
          answer: "Yes, we offer exchanges for eligible items within the 7-day return window. Contact our customer service team to arrange an exchange."
        }
      ]
    },
    {
      title: "Account & Orders",
      questions: [
        {
          question: "How do I track my order?",
          answer: "Once your order has been shipped, you'll receive a tracking number via email. You can use this number to track your order's progress through our website or directly through the courier's tracking portal."
        },
        {
          question: "I forgot my password. How do I reset it?",
          answer: "On the login page, click on 'Forgot Password' and enter your registered email address. We'll send you a password reset link that will be valid for 24 hours."
        },
        {
          question: "Can I modify or cancel my order after it's placed?",
          answer: "You can modify or cancel an order within 2 hours of placing it, provided it hasn't entered the processing stage. Please contact our customer service team immediately if you need to make changes to a recent order."
        },
        {
          question: "Do you offer wholesale or bulk discounts?",
          answer: "Yes, we offer wholesale pricing for aquarium shops, landscapers, and other businesses. Please contact us at wholesale@aquaticexotica.com for more information about our wholesale program and bulk pricing."
        }
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions | AquaticExotica</title>
        <meta name="description" content="Find answers to common questions about AquaticExotica's products, shipping, plant care, and aquarium maintenance." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-center">Frequently Asked Questions</h1>
        <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12">
          Find answers to common questions about our products, shipping, aquarium maintenance, and more. 
          Can't find what you're looking for? Contact our support team.
        </p>

        <div className="max-w-4xl mx-auto">
          {faqCategories.map((category, index) => (
            <div key={index} className="mb-10">
              <h2 className="text-2xl font-bold mb-6">{category.title}</h2>
              <Accordion type="single" collapsible className="border rounded-lg">
                {category.questions.map((faq, faqIndex) => (
                  <AccordionItem value={`${index}-${faqIndex}`} key={faqIndex}>
                    <AccordionTrigger className="px-4 hover:no-underline text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <p className="text-gray-600">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            If you couldn't find the answer to your question, please feel free to contact us directly. 
            Our customer service team is ready to assist you.
          </p>
          <div className="inline-flex space-x-4">
            <a
              href="/contact"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              Contact Us
            </a>
            <a
              href="mailto:support@aquaticexotica.com"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Email Support
            </a>
          </div>
        </div>
      </div>
    </>
  );
}