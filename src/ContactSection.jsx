import React, { useRef } from 'react';
import emailjs from 'emailjs-com';
import './Dashboard.css';

const ContactSection = () => {
  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.sendForm(
      'service_66tokug',         // ✅ your Service ID
      'template_ku4cgk7',        // ✅ your Template ID
      form.current,
      '6l5no0kwc1k23tlP0'         // ✅ your Public Key (User ID)
    ).then(
      (result) => {
        alert('✅ Message sent successfully!');
        form.current.reset();
      },
      (error) => {
        alert('❌ Failed to send message: ' + error.text);
      }
    );
  };

  return (
    <div className="contact-modern">
      <div className="contact-modern-left">
        <h2>Let’s Talk</h2>
        <p>Have questions about IELTS prep, classes, or your application? We’re here to help you succeed.</p>
        <ul>
          <li>📍 Gurjant IELTS, Patiala</li>
          <li>📧 gurjantieltspte@gmail.com</li>
        </ul>
      </div>

      <div className="contact-modern-form">
        <form ref={form} onSubmit={sendEmail}>
          <input type="text" name="name" placeholder="Full Name" required />
          <input type="email" name="email" placeholder="Email Address" required />
          <textarea name="message" placeholder="Your message..." rows="5" required></textarea>
          <button type="submit">Send Message</button>
        </form>
      </div>
    </div>
  );
};

export default ContactSection;
