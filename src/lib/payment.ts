/**
 * Controls payment-related presentation in the frontend.
 * Access authorization itself always comes from the backend as `canAccess`.
 */
export const isPaymentRequired = import.meta.env.VITE_REQUIRE_PAYMENT === "1";
