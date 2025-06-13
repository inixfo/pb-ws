declare module '*/promoCodeService' {
  interface PromoCodeValidationResponse {
    valid: boolean;
    code: string;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    min_purchase_amount: number;
    max_discount_amount: number | null;
  }
  
  interface PromoCodeApplyResponse {
    success: boolean;
    message: string;
    discount_amount: number;
    cart_total_before_discount: number;
    cart_total_after_discount: number;
  }
  
  interface PromoCodeRemoveResponse {
    success: boolean;
    message: string;
  }
  
  interface PromoCodeService {
    validatePromoCode: (code: string, cartTotal: number) => Promise<PromoCodeValidationResponse>;
    applyPromoCode: (code: string) => Promise<PromoCodeApplyResponse>;
    removePromoCode: () => Promise<PromoCodeRemoveResponse>;
  }
  
  const promoCodeService: PromoCodeService;
  export default promoCodeService;
} 