import { z } from 'zod';

/**
 * Mirrors the backend's `CreateDeliveryPlaceCommandValidator` (BE-kt-xnk) — `Name`
 * (max 500 chars, same as `PlaceOfDelivery`) and `CountryId` (must reference an existing `Country`,
 * checked server-side) are both required.
 */
export const deliveryPlaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên nơi giao hàng')
    .max(500, 'Tối đa 500 ký tự'),
  countryId: z.string().trim().min(1, 'Vui lòng chọn nước'),
});
