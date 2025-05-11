import { Helmet } from "react-helmet";

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | AquaticExotica</title>
        <meta name="description" content="Read AquaticExotica's privacy policy to understand how we collect, use, and protect your personal information." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-center">Privacy Policy</h1>
        <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12">
          At AquaticExotica, we're committed to protecting your privacy and ensuring the security of your personal information.
        </p>

        <div className="max-w-4xl mx-auto prose prose-blue prose-lg">
          <div className="mb-8">
            <h2>1. Introduction</h2>
            <p>
              This Privacy Policy explains how AquaticExotica collects, uses, and protects your personal information when you use our website and services. By using our website, you consent to the data practices described in this policy.
            </p>
          </div>

          <div className="mb-8">
            <h2>2. Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>We may collect the following personal information when you register an account, place an order, or interact with our website:</p>
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information (we do not store complete credit card details)</li>
            </ul>

            <h3>Non-Personal Information</h3>
            <p>We also collect non-personal information such as:</p>
            <ul>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address</li>
              <li>Pages visited and interaction patterns</li>
              <li>Referring websites</li>
            </ul>
          </div>

          <div className="mb-8">
            <h2>3. How We Use Your Information</h2>
            <p>We use your personal information for the following purposes:</p>
            <ul>
              <li>To process and fulfill your orders</li>
              <li>To communicate with you about your orders, account, or customer service inquiries</li>
              <li>To personalize your shopping experience</li>
              <li>To send promotional emails about new products, special offers, or other information we think you may find interesting (if you have opted in)</li>
              <li>To improve our website, products, and services</li>
              <li>To prevent fraud and ensure security</li>
            </ul>
          </div>

          <div className="mb-8">
            <h2>4. Information Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul>
              <li>Encryption of sensitive data</li>
              <li>Secure network infrastructure</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication procedures</li>
            </ul>
            <p>
              However, no method of internet transmission or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </div>

          <div className="mb-8">
            <h2>5. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are files with small amounts of data that may include an anonymous unique identifier.
            </p>
            <p>
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
            </p>
            <p>We use cookies for the following purposes:</p>
            <ul>
              <li>To remember your preferences and settings</li>
              <li>To maintain your shopping cart and order information</li>
              <li>To authenticate users and prevent fraudulent use of accounts</li>
              <li>To analyze usage patterns and improve our website</li>
              <li>To track the effectiveness of our marketing campaigns</li>
            </ul>
          </div>

          <div className="mb-8">
            <h2>6. Third-Party Services</h2>
            <p>
              We may use third-party services to facilitate our business operations, such as payment processors, shipping providers, analytics services, and marketing platforms. These third parties have access to your personal information only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose.
            </p>
            <p>
              Our website may contain links to other websites that are not operated by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
            </p>
          </div>

          <div className="mb-8">
            <h2>7. Data Retention</h2>
            <p>
              We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.
            </p>
          </div>

          <div className="mb-8">
            <h2>8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information (subject to legal requirements)</li>
              <li>Object to our processing of your information</li>
              <li>Request a transfer of your information</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us using the details provided at the end of this policy.
            </p>
          </div>

          <div className="mb-8">
            <h2>9. Children's Privacy</h2>
            <p>
              Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.
            </p>
          </div>

          <div className="mb-8">
            <h2>10. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </div>

          <div className="mb-8">
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p>
              AquaticExotica<br />
              123 Aquarium Way, Mumbai, Maharashtra 400001, India<br />
              Email: privacy@aquaticexotica.com<br />
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