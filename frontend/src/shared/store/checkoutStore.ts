import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CreateOrderResponse, CouponValidation, BookingDetailResponse } from '@/features/booking/types';

export interface EventCheckoutContext {
  eventId:    string;
  eventTitle: string;
  tierName:   string;
  quantity:   number;
  unitPrice:  number;
  posterUrl:  string | null;
  eventDate:  string | null; // ISO string
  venueName:  string;
  cityName:   string;
}

interface CheckoutState {
  orderResponse:    CreateOrderResponse | null;
  bookingDetail:    BookingDetailResponse | null;
  couponCode:       string | null;
  couponValidation: CouponValidation | null;
  contactMobile:    string;
  contactEmail:     string;
  eventContext:     EventCheckoutContext | null;
}

interface CheckoutActions {
  setOrder:          (order: CreateOrderResponse)                     => void;
  setBookingDetail:  (detail: BookingDetailResponse)                  => void;
  setCoupon:         (code: string, validation: CouponValidation)     => void;
  clearCoupon:       ()                                               => void;
  setContact:        (mobile: string, email: string)                  => void;
  setEventContext:   (ctx: EventCheckoutContext)                      => void;
  clearAll:          ()                                               => void;
}

export const useCheckoutStore = create<CheckoutState & CheckoutActions>()(
  persist(
    (set) => ({
      orderResponse:    null,
      bookingDetail:    null,
      couponCode:       null,
      couponValidation: null,
      contactMobile:    '',
      contactEmail:     '',
      eventContext:     null,

      setOrder: (order)               => set({ orderResponse: order }),
      setBookingDetail: (detail)      => set({ bookingDetail: detail }),
      setCoupon: (code, validation)   => set({ couponCode: code, couponValidation: validation }),
      clearCoupon: ()                 => set({ couponCode: null, couponValidation: null }),
      setContact: (mobile, email)     => set({ contactMobile: mobile, contactEmail: email }),
      setEventContext: (ctx)          => set({ eventContext: ctx }),
      clearAll: ()                    => set({
        orderResponse:    null,
        bookingDetail:    null,
        couponCode:       null,
        couponValidation: null,
        contactMobile:    '',
        contactEmail:     '',
        eventContext:     null,
      }),
    }),
    {
      name:    'bk-checkout',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
