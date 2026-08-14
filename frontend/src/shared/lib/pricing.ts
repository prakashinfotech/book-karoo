import type { PricingBreakdown } from '@/shared/types';

export interface CouponInput {
  discount: number;
  hasOfferFee: boolean;
}

export interface PricingConfig {
  convFeePerTicket:  number;
  offerFeeBase:      number;
  companyStateCode:  string;
  gstRate:           number; // e.g. 0.18 for 18%
}

const DEFAULT_CONFIG: PricingConfig = {
  convFeePerTicket: 59,
  offerFeeBase:     15,
  companyStateCode: import.meta.env.VITE_COMPANY_STATE_CODE ?? '24',
  gstRate:          0.18,
};

export function calculatePricing(
  qty: number,
  seatPrice: number,
  customerStateCode: string,
  coupon: CouponInput | null,
  config: PricingConfig = DEFAULT_CONFIG,
): PricingBreakdown {
  const { convFeePerTicket, offerFeeBase, companyStateCode, gstRate } = config;
  const halfGst     = round(gstRate / 2);
  const isIntraState  = customerStateCode === companyStateCode;
  const ticketAmount  = round(qty * seatPrice);
  const convFee       = round(qty * convFeePerTicket);
  const offerFee      = coupon?.hasOfferFee ? offerFeeBase : 0;
  const discount      = round(coupon?.discount ?? 0);
  const taxableAmount = round(convFee + offerFee);

  let cgst = 0, sgst = 0, igst = 0;
  if (isIntraState) {
    cgst = round(taxableAmount * halfGst);
    sgst = round(taxableAmount * halfGst);
  } else {
    igst = round(taxableAmount * gstRate);
  }

  const convFeeGst        = round(convFee * gstRate);
  const offerFeeGst       = offerFee > 0 ? round(offerFee * gstRate) : 0;
  const amountPaid        = round(
    Math.max(0, ticketAmount + convFee + offerFee + cgst + sgst + igst - discount)
  );

  return {
    ticketAmount,
    convenienceFee:        convFee,
    convenienceFeeGst:     convFeeGst,
    offerProcessingFee:    offerFee,
    offerProcessingFeeGst: offerFeeGst,
    taxableAmount,
    cgst,
    sgst,
    igst,
    discount,
    amountPaid,
    isIntraState,
  };
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}
