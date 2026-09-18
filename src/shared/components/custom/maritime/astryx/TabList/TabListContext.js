// Copyright (c) Meta Platforms, Inc. and affiliates.
'use client';
/**
 * @file TabListContext.ts
 * @input React createContext, use
 * @output Exports TabListContext, useTabListContext, TabListPattern
 * @position Context provider; consumed by Tab.tsx, TabMenu.tsx
 *
 * SYNC: When modified, update /packages/core/src/TabList/TabList.doc.mjs
 */
import { createContext, use } from 'react';
export const TabListContext = createContext(null);
TabListContext.displayName = 'TabListContext';
/**
 * Returns TabListContext value or throws if used outside TabList.
 */
export function useTabListContext() {
    const ctx = use(TabListContext);
    if (ctx == null) {
        throw new Error('useTabListContext must be used within TabList. ' +
            'Wrap your Tab/TabMenu in <TabList>.');
    }
    return ctx;
}
