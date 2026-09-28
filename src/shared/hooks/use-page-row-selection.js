'use client';

import { useState } from 'react';

const EMPTY_SET = new Set();

/**
 * Selection defaults to every row in the current server result page. A new
 * page, sort or filter gets a fresh all-selected state without an effect.
 * @param {string} scope
 */
export function usePageRowSelection(scope) {
  const [state, setState] = useState(
    /** @type {{scope: string, excludedIds: Set<string>}} */ ({
      scope,
      excludedIds: new Set(),
    }),
  );
  const excludedIds = state.scope === scope ? state.excludedIds : EMPTY_SET;

  /** @param {string[]} ids @param {boolean} checked */
  function onToggleVisible(ids, checked) {
    setState((current) => {
      const next = new Set(current.scope === scope ? current.excludedIds : []);
      for (const id of ids) {
        if (checked) next.delete(id);
        else next.add(id);
      }
      return { scope, excludedIds: next };
    });
  }

  /** @param {string} id @param {boolean} checked */
  function onToggleRow(id, checked) {
    onToggleVisible([id], checked);
  }

  return { excludedIds, onToggleRow, onToggleVisible };
}
