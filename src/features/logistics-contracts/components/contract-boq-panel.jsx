'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { CircleDollarSign, Container, Scale, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { MetaBoqPanel } from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { useContractPrivateInfoQuery } from '../hooks/use-contract-private-info-query.js';
import { ContractBoqEditDrawer } from './contract-boq-edit-drawer.jsx';
import { isPrivateInfoEntirelyEmpty } from './contract-private-info-fields.jsx';

const INTEGER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const DECIMAL = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const USD = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * @param {number | null | undefined} value
 * @returns {value is number}
 */
function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * @param {number | null | undefined} value
 * @param {Intl.NumberFormat} [formatter]
 */
function fmt(value, formatter = INTEGER) {
  return isNumber(value)
    ? formatter.format(/** @type {number} */ (value))
    : '—';
}

/** @param {number | null | undefined} value @param {string} unit */
function withUnit(value, unit, formatter = INTEGER) {
  return isNumber(value) ? `${fmt(value, formatter)} ${unit}`.trim() : '—';
}

/**
 * @param {{ label: string, value: number | null | undefined, unit: string }[]} items
 * @param {'sum' | 'max'} basis share of the total, or relative to the largest
 * @returns {import('@/shared/components/custom/meta/boq-panel.jsx').MetaBoqBar[]}
 */
function toBars(items, basis) {
  const values = items.map((item) => (isNumber(item.value) ? item.value : 0));
  const reference =
    basis === 'sum'
      ? values.reduce((total, value) => total + value, 0)
      : Math.max(0, ...values);

  return items.map((item, index) => ({
    label: item.label,
    value: withUnit(item.value, item.unit, DECIMAL),
    share: reference > 0 ? (values[index] / reference) * 100 : 0,
  }));
}

/**
 * "BOQ" tab of the contract detail page: the contract's private info
 * (`ContractPrivateInfo`, `logistics:secret` only — the caller only mounts
 * this for such users) rendered as `MetaBoqPanel`. Derived figures are
 * display-only: VND conversion (Tổng tiền × Tỷ giá), profit margin over that
 * conversion, and the logistics spread ((Giá báo − Giá vốn) × Số cont).
 * Editing opens `ContractBoqEditDrawer` (same form hook and fields as the
 * BOQ list's dialog, in the Meta drawer shell).
 * @param {{ contract: import('../types/index.js').Contract }} props
 */
export function ContractBoqPanel({ contract }) {
  const [isEditing, setIsEditing] = useState(false);
  const query = useContractPrivateInfoQuery(contract.id);

  if (query.data && !query.data.success) {
    return (
      <Banner status="error" title={query.data.message} container="card" />
    );
  }

  const info = query.data?.success ? query.data.privateInfo : null;
  const isEmpty = info ? isPrivateInfoEntirelyEmpty(info) : false;

  const totalVnd =
    info && isNumber(info.totalAmountUsd) && isNumber(info.exchangeRateVnd)
      ? /** @type {number} */ (info.totalAmountUsd) *
        /** @type {number} */ (info.exchangeRateVnd)
      : null;
  const margin =
    info && isNumber(info.profit) && totalVnd
      ? /** @type {number} */ (info.profit / totalVnd) * 100
      : null;
  const spreadPerCont =
    info &&
    isNumber(info.quotedPricePerContainer) &&
    isNumber(info.costPricePerContainer)
      ? /** @type {number} */ (info.quotedPricePerContainer) -
        /** @type {number} */ (info.costPricePerContainer)
      : null;
  const spread =
    spreadPerCont !== null && info && isNumber(info.containerCount)
      ? spreadPerCont * /** @type {number} */ (info.containerCount)
      : null;
  const unitCosts = info
    ? [
        { label: 'Nhân công', value: info.unitCostLabor, unit: 'VNĐ' },
        { label: 'Phun bi', value: info.unitCostSandblasting, unit: 'VNĐ' },
        { label: 'Sơn', value: info.unitCostPainting, unit: 'VNĐ' },
        { label: 'Nhà máy', value: info.unitCostFactory, unit: 'VNĐ' },
      ]
    : [];
  const unitCostSum = unitCosts.some((item) => isNumber(item.value))
    ? unitCosts.reduce(
        (total, item) => total + (isNumber(item.value) ? (item.value ?? 0) : 0),
        0,
      )
    : null;

  return (
    <>
      <MetaBoqPanel
        isLoading={!info}
        isEmpty={isEmpty}
        sentDateLabel={
          info?.boqSentDate ? formatDisplayDate(info.boqSentDate) : undefined
        }
        editLabel={isEmpty ? 'Nhập BOQ' : 'Sửa BOQ'}
        onEdit={() => setIsEditing(true)}
        kpis={
          info
            ? [
                {
                  label: 'Tổng tiền',
                  value: fmt(info.totalAmountUsd, USD),
                  unit: isNumber(info.totalAmountUsd) ? 'USD' : undefined,
                  note:
                    totalVnd !== null
                      ? `≈ ${fmt(totalVnd)} VNĐ · tỷ giá ${fmt(info.exchangeRateVnd)}`
                      : 'Chưa có tỷ giá quy đổi',
                  tone: 'accent',
                  icon: CircleDollarSign,
                },
                {
                  label: 'Lợi nhuận',
                  value: fmt(info.profit),
                  unit: isNumber(info.profit) ? 'VNĐ' : undefined,
                  note:
                    margin !== null
                      ? `Biên lợi nhuận ${DECIMAL.format(margin)}% trên tổng tiền quy đổi`
                      : undefined,
                  tone: 'success',
                  icon: TrendingUp,
                },
                {
                  label: 'Tổng logistics',
                  value: fmt(info.logisticsTotal),
                  unit: isNumber(info.logisticsTotal) ? 'VNĐ' : undefined,
                  note: isNumber(info.containerCount)
                    ? `${fmt(info.containerCount)} cont × ${withUnit(info.quotedPricePerContainer, 'VNĐ')}`
                    : undefined,
                  tone: 'indigo',
                  icon: Container,
                },
                {
                  label: 'Chênh lệch logistics',
                  value: fmt(spread),
                  unit: isNumber(spread) ? 'VNĐ' : undefined,
                  note:
                    spreadPerCont !== null
                      ? `Giá báo − giá vốn: ${withUnit(spreadPerCont, 'VNĐ')} / cont`
                      : undefined,
                  tone: 'neutral',
                  icon: Scale,
                },
              ]
            : []
        }
        logisticsRows={
          info
            ? [
                { label: 'Số cont', value: fmt(info.containerCount) },
                {
                  label: 'Giá vốn / cont',
                  value: withUnit(info.costPricePerContainer, 'VNĐ'),
                },
                {
                  label: 'Giá báo khách / cont',
                  value: withUnit(info.quotedPricePerContainer, 'VNĐ'),
                },
                {
                  label: 'Tổng logistics',
                  value: withUnit(info.logisticsTotal, 'VNĐ'),
                  isTotal: true,
                },
              ]
            : []
        }
        unitCostBars={toBars(unitCosts, 'sum')}
        unitCostTotal={withUnit(unitCostSum, 'VNĐ')}
        volumeBars={
          info
            ? toBars(
                [
                  // The form stores Sale / Vật tư without a unit.
                  { label: 'Sale', value: info.volumeSale, unit: '' },
                  { label: 'Vật tư', value: info.volumeMaterial, unit: '' },
                  {
                    label: 'Tờ khai (tổng Shipment)',
                    value: info.volumeDeclaration,
                    unit: 'kg',
                  },
                ],
                'max',
              )
            : []
        }
        extraFields={
          info
            ? info.extraFields
                .filter((field) => field.key.trim())
                .map((field) => ({
                  label: field.key,
                  value: field.value || '—',
                }))
            : []
        }
      />

      {isEditing && info ? (
        <ContractBoqEditDrawer
          contract={contract}
          privateInfo={info}
          onClose={() => setIsEditing(false)}
        />
      ) : null}
    </>
  );
}
