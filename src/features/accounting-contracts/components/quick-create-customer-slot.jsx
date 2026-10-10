'use client';

import { createContext, useContext } from 'react';

/**
 * @typedef {(props: {
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   onCreated: (customer: { id: string }) => void,
 * }) => import('react').ReactNode} RenderQuickCreateCustomer
 */

const QuickCreateCustomerContext = createContext(
  /** @type {RenderQuickCreateCustomer | null} */ (null),
);

/**
 * Plugs the shared customer directory's quick-create drawer into this
 * feature's contract drawer. The drawer lives in logistics-contracts and a
 * feature may not import another, so `src/app/` composes them here.
 * @param {{ render: RenderQuickCreateCustomer, children: import('react').ReactNode }} props
 */
export function QuickCreateCustomerProvider({ render, children }) {
  return (
    <QuickCreateCustomerContext.Provider value={render}>
      {children}
    </QuickCreateCustomerContext.Provider>
  );
}

/** @returns {RenderQuickCreateCustomer | null} null when no app composes one. */
export function useQuickCreateCustomer() {
  return useContext(QuickCreateCustomerContext);
}
