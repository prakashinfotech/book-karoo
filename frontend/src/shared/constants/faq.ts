export interface FaqQuestion {
  q: string;
  a: string;
}

export interface FaqCategory {
  category: string;
  questions: FaqQuestion[];
}

export const FAQ_ITEMS: FaqCategory[] = [
  {
    category: "Booking",
    questions: [
      { q: "How do I book tickets on BookKaroo?", a: "Browse movies or events, select your preferred showtime, choose seats, complete payment, and you'll receive a confirmation email with your QR code ticket." },
      { q: "Can I book tickets for someone else?", a: "Yes. Enter the attendee's mobile number and email during checkout so they receive the booking confirmation." },
      { q: "What is the maximum number of seats I can book at once?", a: "You can book up to 10 seats in a single transaction." },
      { q: "Why are my selected seats showing as unavailable?", a: "Seats are held for 8 minutes during checkout. If someone else completes payment first or your session expires, those seats become available again." },
      { q: "Can I choose my seats?", a: "Yes. Our seat selection screen shows the full theatre layout. You can manually select your preferred seats or use the quick-select feature to automatically pick the best available seats." }
    ]
  },
  {
    category: "Payments",
    questions: [
      { q: "What payment methods are accepted?", a: "We accept Credit/Debit Cards, UPI, Net Banking, and popular wallets. All transactions are secured with industry-standard encryption." },
      { q: "Is my payment information safe?", a: "Yes. BookKaroo does not store your card details. All payments are processed through a secure payment gateway with PCI DSS compliance." },
      { q: "What is the convenience fee?", a: "A convenience fee of ₹59 per ticket is charged to cover our platform and service costs. This fee is subject to 18% GST and is non-refundable." },
      { q: "I was charged but didn't receive a confirmation. What should I do?", a: "Please wait 15 minutes and check your spam folder. If you still haven't received confirmation, contact our support team with your payment reference number." }
    ]
  },
  {
    category: "Cancellation & Refunds",
    questions: [
      { q: "Can I cancel my booking?", a: "Yes, you can cancel bookings up to 2 hours before the show starts from My Bookings page. The convenience fee is non-refundable; the ticket amount will be refunded." },
      { q: "How long does a refund take?", a: "Refunds are processed within 7 business days and credited to your original payment method." },
      { q: "What happens if a show is cancelled by the cinema?", a: "If a show is cancelled, you will receive a full refund including the convenience fee. We'll notify you via email immediately." },
      { q: "Can I modify my booking instead of cancelling?", a: "Booking modifications are not supported currently. Please cancel and rebook if you need to change your seats or showtime." }
    ]
  },
  {
    category: "Tickets & Entry",
    questions: [
      { q: "How do I collect my tickets?", a: "Your booking confirmation email contains a QR code. Show this QR code at the cinema entry counter. No physical ticket is required." },
      { q: "Do I need to carry a photo ID?", a: "Yes. A valid government-issued photo ID (Aadhaar, PAN, Passport, Driving Licence) may be required at entry, especially for age-restricted films." },
      { q: "I lost my confirmation email. How can I retrieve my tickets?", a: "Log in to BookKaroo and go to My Bookings. You can view and download your ticket QR code from there at any time." },
      { q: "Can I use a screenshot of my QR code?", a: "Yes, a screenshot of your QR code is accepted. Ensure the code is clearly visible and the screen brightness is turned up." }
    ]
  },
  {
    category: "Account",
    questions: [
      { q: "How do I create a BookKaroo account?", a: "Click Sign Up on the home page. Enter your name, email, mobile number, and password. Verify your email to activate your account." },
      { q: "I forgot my password. How do I reset it?", a: "Click Forgot Password on the login page and enter your registered email. You'll receive a reset link valid for 1 hour." },
      { q: "Can I use BookKaroo without creating an account?", a: "You can browse movies and events without an account. However, booking tickets requires a registered account." },
      { q: "How do I delete my account?", a: "Go to Profile → scroll to the bottom → Delete Account. Your data will be retained for legal compliance but your account will be deactivated." }
    ]
  },
  {
    category: "IPL & Sports",
    questions: [
      { q: "How do I book IPL match tickets?", a: "Go to the IPL section from the home page, select your match, choose your ticket tier (General/Premium/Corporate Box), and complete payment." },
      { q: "Are IPL tickets refundable?", a: "IPL tickets follow the same cancellation policy as movies — cancellations up to 2 hours before the match start time." },
      { q: "What should I carry to an IPL match?", a: "Your QR code ticket, a valid government ID, and follow the stadium's guidelines on permitted items. Outside food and beverages are generally not allowed." }
    ]
  }
];
