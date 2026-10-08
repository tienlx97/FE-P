'use client';

import { findVietnamCountry } from '../config/vietnam-country.js';
import { useCountriesQuery } from './use-countries-query.js';
import { usePortsQuery } from './use-ports-query.js';

const byName = new Intl.Collator('vi').compare;

/**
 * Empty-container depots ("Depot lấy cont rỗng"): Vietnam's Port catalog
 * entries of kind `Depot` (BE `empty-pickup-depot`, 12 seeded; more are
 * added on the "Cảng" page), sorted by name.
 * @returns {{ depots: import('../types/index.js').Port[], isLoading: boolean }}
 */
export function useEmptyDepots() {
  const countriesQuery = useCountriesQuery();
  const countries = countriesQuery.data?.success
    ? countriesQuery.data.countries
    : [];
  const vietnamId = findVietnamCountry(countries)?.id ?? '';
  const portsQuery = usePortsQuery({
    countryId: vietnamId,
    enabled: Boolean(vietnamId),
  });
  const depots = portsQuery.data?.success
    ? portsQuery.data.ports
        .filter((port) => port.kind === 'Depot')
        .sort((a, b) => byName(a.name, b.name))
    : [];
  return {
    depots,
    isLoading: countriesQuery.isLoading || portsQuery.isLoading,
  };
}
