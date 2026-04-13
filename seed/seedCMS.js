/**
 * Seed default CMS pages
 * Usage: node seed/seedCMS.js
 */
import mongoose from "mongoose";
import dotenv   from "dotenv";
import path     from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
await mongoose.connect(process.env.MONGO_URI);
console.log("✅ Connected");

const CMS = (await import("../models/Admin/cms.model.js")).default;

const pages = [
  {
    slug: "about-us",
    title: "About Us",
    status: "active",
    content: `<h2>About NeoHealth</h2>
<p>NeoHealth is India's premier digital healthcare platform connecting patients with doctors, laboratories, and pharmacies across the country.</p>
<h3>Our Mission</h3>
<p>To make quality healthcare accessible, affordable, and convenient for every Indian citizen through technology.</p>
<h3>Our Vision</h3>
<p>A healthier India where every person has access to world-class medical services at their fingertips.</p>
<h3>What We Offer</h3>
<ul>
  <li>Online Doctor Consultations (OPD & IPD)</li>
  <li>Lab Test Booking with Home Sample Collection</li>
  <li>Medicine Delivery from Verified Pharmacies</li>
  <li>Hospital Bed Management & Discharge</li>
  <li>Lifetime NeoHealthCard with Unique Patient ID</li>
  <li>24/7 Emergency Ambulance Booking</li>
</ul>
<h3>Our Team</h3>
<p>Founded by healthcare professionals and technology experts, NeoHealth is committed to transforming how India accesses healthcare services.</p>`
  },
  {
    slug: "terms-conditions",
    title: "Terms & Conditions",
    status: "active",
    content: `<h2>Terms and Conditions</h2>
<p><strong>Last Updated:</strong> March 2025</p>
<h3>1. Acceptance of Terms</h3>
<p>By accessing or using NeoHealth services, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
<h3>2. Use of Services</h3>
<p>NeoHealth provides a platform for connecting patients with healthcare providers. We do not provide direct medical advice or treatment.</p>
<h3>3. User Accounts</h3>
<p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
<h3>4. Medical Disclaimer</h3>
<p>Information provided on NeoHealth is for informational purposes only. Always consult a qualified healthcare professional for medical advice.</p>
<h3>5. Privacy</h3>
<p>Your use of NeoHealth is subject to our Privacy Policy, which is incorporated into these Terms by reference.</p>
<h3>6. Prohibited Activities</h3>
<p>You may not use NeoHealth for any unlawful purpose, to harm others, or to misrepresent your identity or qualifications.</p>
<h3>7. Limitation of Liability</h3>
<p>NeoHealth shall not be liable for any indirect, incidental, or consequential damages arising from use of our platform.</p>
<h3>8. Changes to Terms</h3>
<p>We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance.</p>
<h3>9. Contact</h3>
<p>For questions about these Terms, contact us at legal@neohealth.com</p>`
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    status: "active",
    content: `<h2>Privacy Policy</h2>
<p><strong>Last Updated:</strong> March 2025</p>
<h3>1. Information We Collect</h3>
<p>We collect personal information including name, contact details, medical history, and payment information when you register and use our services.</p>
<h3>2. How We Use Your Information</h3>
<ul>
  <li>To provide and improve our healthcare services</li>
  <li>To connect you with healthcare providers</li>
  <li>To process payments and send notifications</li>
  <li>To comply with legal obligations</li>
</ul>
<h3>3. Data Security</h3>
<p>We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal health information.</p>
<h3>4. Data Sharing</h3>
<p>We share your information only with healthcare providers involved in your care, payment processors, and as required by law. We do not sell your data.</p>
<h3>5. Your Rights</h3>
<p>You have the right to access, correct, or delete your personal information. Contact support@neohealth.com to exercise these rights.</p>
<h3>6. Cookies</h3>
<p>We use cookies to improve your experience. You can disable cookies in your browser settings, though this may affect functionality.</p>
<h3>7. Children's Privacy</h3>
<p>Our services are not directed to children under 13. We do not knowingly collect information from children.</p>
<h3>8. Contact Us</h3>
<p>For privacy concerns: privacy@neohealth.com</p>`
  },
  {
    slug: "contact-us",
    title: "Contact Us",
    status: "active",
    content: `<h2>Contact NeoHealth</h2>
<p>We're here to help! Reach out to us through any of the following channels:</p>
<h3>Customer Support</h3>
<p><strong>Email:</strong> support@neohealth.com<br>
<strong>Phone:</strong> 1800-XXX-XXXX (Toll Free)<br>
<strong>Hours:</strong> Monday – Saturday, 9:00 AM – 6:00 PM IST</p>
<h3>Technical Support</h3>
<p><strong>Email:</strong> tech@neohealth.com<br>
<strong>Response Time:</strong> Within 24 hours</p>
<h3>Head Office</h3>
<p>NeoHealth Technologies Pvt. Ltd.<br>
Plot No. 42, Tech Park, Malviya Nagar<br>
Jaipur, Rajasthan – 302017<br>
India</p>
<h3>For Doctors & Healthcare Providers</h3>
<p><strong>Email:</strong> providers@neohealth.com<br>
<strong>Phone:</strong> +91-XXXXX-XXXXX</p>
<h3>For Business Inquiries</h3>
<p><strong>Email:</strong> business@neohealth.com</p>`
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    status: "active",
    content: `<h2>Refund Policy</h2>
<p><strong>Last Updated:</strong> March 2025</p>
<h3>Doctor Consultation Refunds</h3>
<p>Full refund if cancelled 2+ hours before appointment. 50% refund within 2 hours. No refund for no-shows.</p>
<h3>Lab Test Refunds</h3>
<p>Full refund if cancelled before sample collection. Partial refund (minus processing fees) if sample collected but test not started.</p>
<h3>Pharmacy Orders</h3>
<p>Refund issued for damaged, wrong, or expired medicines. Return within 7 days with original packaging.</p>
<h3>Processing Time</h3>
<p>Refunds processed within 5-7 business days to original payment method.</p>
<h3>How to Request a Refund</h3>
<p>Contact support@neohealth.com or call 1800-XXX-XXXX with your order ID.</p>`
  },
  {
    slug: "disclaimer",
    title: "Disclaimer",
    status: "active",
    content: `<h2>Medical Disclaimer</h2>
<p>The information provided on NeoHealth is for general informational and educational purposes only.</p>
<h3>Not Medical Advice</h3>
<p>Content on this platform does not constitute medical advice, diagnosis, or treatment. Always seek guidance from a qualified healthcare professional.</p>
<h3>Emergency Situations</h3>
<p>In case of a medical emergency, call 112 or go to the nearest emergency room immediately. Do not rely solely on this platform.</p>
<h3>Accuracy of Information</h3>
<p>While we strive to provide accurate information, NeoHealth makes no warranties about completeness or accuracy of content.</p>
<h3>Third Party Links</h3>
<p>NeoHealth may contain links to third-party websites. We are not responsible for content on external sites.</p>`
  }
];

let created = 0, updated = 0;
for (const page of pages) {
  const existing = await CMS.findOne({ slug: page.slug });
  if (existing) {
    await CMS.findOneAndUpdate({ slug: page.slug }, { title: page.title, status: page.status, content: page.content });
    updated++;
  } else {
    await CMS.create(page);
    created++;
  }
}

console.log(`✅ CMS Seeded: ${created} created, ${updated} updated`);
console.log("Pages:", pages.map(p => `  → ${p.slug} (${p.title})`).join("\n"));
await mongoose.disconnect();
