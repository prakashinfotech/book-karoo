export interface RazorpayCheckoutParams {
  keyId: string;
  orderId: string;
  amount: number;        // in INR (not paise)
  currency: string;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss: () => void;
}

export function openRazorpayCheckout(params: RazorpayCheckoutParams): void {
  if (!window.Razorpay) {
    alert('Payment gateway not available. Please refresh and try again.');
    return;
  }
  const rzp = new window.Razorpay({
    key:         params.keyId,
    amount:      Math.round(params.amount * 100), // paise
    currency:    params.currency,
    name:        'BookKaroo',
    description: `Booking ${params.bookingRef}`,
    order_id:    params.orderId,
    prefill:     {
      name:    params.customerName,
      email:   params.customerEmail,
      contact: params.customerMobile,
    },
    notes:   { booking_ref: params.bookingRef },
    theme:   { color: '#E11D74' },
    handler: params.onSuccess,
    modal:   { ondismiss: params.onDismiss, confirm_close: true, escape: false },
  });
  rzp.open();
}
