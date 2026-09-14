'use client';
import { usePartyForm } from './use-party-form.js';
/** @param {{supplier?: any, onSuccess?: (supplier: any) => void}} [options] */
export function useSupplierForm({ supplier = null, onSuccess } = {}) { return usePartyForm({ kind: 'supplier', party: supplier, onSuccess }); }
