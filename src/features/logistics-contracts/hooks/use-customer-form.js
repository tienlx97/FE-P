'use client';
import { usePartyForm } from './use-party-form.js';
/** @param {{customer?: any, onSuccess?: (customer: any) => void}} [options] */
export function useCustomerForm({ customer = null, onSuccess } = {}) { return usePartyForm({ kind: 'customer', party: customer, onSuccess }); }
