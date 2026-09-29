/**
 * `GET /api/v1/carrier-status` — see BE-kt-xnk `docs/api/CarrierStatus.md`.
 * @typedef {'Up' | 'Degraded' | 'Down'} CarrierHealthOutcome
 *
 * @typedef {object} CarrierStatusDay
 * @property {string} date - Việt Nam date `yyyy-MM-dd`
 * @property {CarrierHealthOutcome | null} outcome - null = no probe that day
 * @property {number} checks
 * @property {number} down
 * @property {number} degraded
 *
 * @typedef {object} CarrierStatusCheck
 * @property {string} checkedAtUtc
 * @property {CarrierHealthOutcome} outcome
 * @property {number} latencyMs
 * @property {string | null} detail
 * @property {string} adapterVersion
 *
 * @typedef {object} CarrierStatusComponent
 * @property {'Schedule' | 'Tracking'} integration
 * @property {boolean} isImplemented - false = not connected
 * @property {boolean} isWatched - false = connected, no probe configured
 * @property {string | null} activeVersion
 * @property {CarrierStatusCheck | null} latest
 * @property {number | null} uptimePercent
 * @property {CarrierStatusDay[]} days - oldest first
 *
 * @typedef {object} CarrierStatusCarrier
 * @property {{ code: string, name: string }} carrier
 * @property {CarrierStatusComponent[]} components
 *
 * @typedef {object} CarrierStatus
 * @property {CarrierHealthOutcome | null} overall - null = nothing probed yet
 * @property {string | null} lastCheckedAtUtc
 * @property {number} windowDays
 * @property {CarrierStatusCarrier[]} carriers
 */

export {};
