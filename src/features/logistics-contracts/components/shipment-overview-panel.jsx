'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import {
  Anchor,
  ArrowRight,
  CircleCheck,
  CircleDashed,
  Clock,
  FileCheck2,
  MapPin,
  Navigation,
  Package,
  ReceiptText,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  Truck,
} from 'lucide-react';

import {
  MetaContainerCard,
  MetaPill,
  MetaShipmentField,
  MetaShipmentKpiCard,
  MetaShipmentSection,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatMoney, formatVndAmount } from '../config/currencies.js';
import { labelForPaymentType } from '../config/payment-schedule-types.js';
import { labelForShipmentContainerType } from '../config/shipment-container-types.js';
import {
  labelForCustomsChannel,
  metaToneForCustomsChannel,
  splitSiCutoff,
} from '../config/shipment-operational-details.js';
import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
import {
  labelForShipmentStatus,
  metaToneForShipmentStatus,
} from '../config/shipment-status.js';

const FIELD_GRID_COLUMNS = { minWidth: 260, max: 3 };
const CARD_GRID_COLUMNS = { minWidth: 240, max: 4 };

const WEIGHT_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const RATE_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

/** "" for a missing date, so the field shows its own muted "—". */
/** @param {string | null | undefined} iso */
function dateOrEmpty(iso) {
  return iso ? formatDisplayDate(iso) : '';
}

/** @param {number} value */
function formatKg(value) {
  return `${WEIGHT_FORMATTER.format(value)} kg`;
}

/**
 * "4x20' · 1x40'HC" from the VGM records' container types, in the
 * container catalog's order.
 * @param {import('../types/index.js').ShipmentVgm[]} vgms
 */
function containerMixLabel(vgms) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const vgm of vgms) {
    counts.set(vgm.containerType, (counts.get(vgm.containerType) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => `${count}x${labelForShipmentContainerType(type)}`)
    .join(' · ');
}

/**
 * SI / VGM cut-off as "17:00 • 30/09/2026", flagged closed once passed.
 * @param {string | null | undefined} siCutoff
 */
function describeSiCutoff(siCutoff) {
  if (!siCutoff) return null;
  const { date, time } = splitSiCutoff(siCutoff);
  const isClosed = new Date(siCutoff).getTime() < Date.now();
  return {
    label: `${time} • ${formatDisplayDate(date)}${isClosed ? ' (Đã đóng)' : ''}`,
    isClosed,
  };
}

/**
 * Overview tab of the shipment detail page — Figma node 111:7829 below
 * the tab bar: 3 financial KPI cards, then "Thông tin booking", "Hải quan
 * & Chứng nhận xuất xứ (C/O)" and "Thông tin hàng hóa & Danh sách
 * Container" cards. Containers are the shipment's VGM records.
 * @param {{
 *   shipment: import('../types/index.js').Shipment,
 *   forwarderName: string,
 *   vgms: import('../types/index.js').ShipmentVgm[],
 *   isVgmsLoading: boolean,
 *   onViewVgms: () => void,
 * }} props
 */
export function ShipmentOverviewPanel({
  shipment,
  forwarderName,
  vgms,
  isVgmsLoading,
  onViewVgms,
}) {
  const details = shipment.operationalDetails;
  const siCutoff = describeSiCutoff(details?.siCutoff);
  const sameCurrency =
    shipment.invoiceCurrency === shipment.declarationCurrency;
  const matchPercent =
    sameCurrency && shipment.invoiceValue > 0
      ? Math.round((shipment.declarationValue / shipment.invoiceValue) * 1000) /
        10
      : null;
  const isMatched = matchPercent === 100;
  const grossTotal = vgms.reduce((total, vgm) => total + vgm.grossWeight, 0);
  const netTotal = vgms.reduce((total, vgm) => total + vgm.netWeight, 0);
  const quantityLabel = `${shipment.quantityAmount} ${labelForShipmentQuantityUnit(shipment.quantityUnit)}`;
  const vesselLabel = [shipment.vesselName, details?.voyageNumber]
    .filter(Boolean)
    .join(' // ');

  return (
    <VStack gap={6} hAlign="stretch">
      <Grid columns={{ minWidth: 300, max: 3 }} gap={5}>
        <MetaShipmentKpiCard
          icon={ReceiptText}
          tone="accent"
          label="GIÁ TRỊ INVOICE (THƯƠNG MẠI)"
          tag={{ label: 'INV' }}
          value={formatMoney(shipment.invoiceValue)}
          unit={shipment.invoiceCurrency}
          footLabel="Hoá đơn TM số:"
          footValue={details?.invoiceNumber ?? '—'}
          footStatus={
            details?.invoiceNumber
              ? { label: 'Đã phát hành', icon: CircleCheck, tone: 'success' }
              : { label: 'Chưa có số HĐ', icon: CircleDashed, tone: 'neutral' }
          }
        />
        <MetaShipmentKpiCard
          icon={ShieldCheck}
          tone="success"
          label="GIÁ TRỊ TỜ KHAI HẢI QUAN"
          tag={
            matchPercent === null
              ? undefined
              : {
                  label: isMatched ? 'Khớp 100%' : `Khớp ${matchPercent}%`,
                  tone: isMatched ? 'success' : 'warning',
                  hasDot: true,
                }
          }
          value={formatMoney(shipment.declarationValue)}
          unit={shipment.declarationCurrency}
          footLabel="Trị giá tính thuế xuất khẩu"
          footStatus={
            matchPercent === null
              ? undefined
              : isMatched
                ? { label: 'Khớp invoice', icon: CircleCheck, tone: 'success' }
                : {
                    label: 'Lệch invoice',
                    icon: CircleDashed,
                    tone: 'warning',
                  }
          }
        />
        <MetaShipmentKpiCard
          icon={RefreshCcw}
          tone="indigo"
          label="TỶ GIÁ QUY ĐỔI TỜ KHAI"
          value={RATE_FORMATTER.format(shipment.declarationExchangeRate)}
          unit={`VND / ${shipment.declarationCurrency}`}
          footLabel="Quy đổi ước tính:"
          footValue={`~ ${formatVndAmount(shipment.declarationValueVnd)}`}
        />
      </Grid>

      <MetaShipmentSection
        icon={Truck}
        title="Thông tin booking"
        pill={
          details?.serviceTerm
            ? { label: details.serviceTerm.replace('/', ' / ') }
            : undefined
        }
      >
        <Grid columns={FIELD_GRID_COLUMNS} gap={4}>
          <MetaShipmentField label="Forwarder" value={forwarderName} />
          <MetaShipmentField
            label="Số booking"
            value={shipment.bookingNumber}
            isCode
          />
          <MetaShipmentField
            label="Số B/L (vận đơn đường biển)"
            value={shipment.billOfLadingNumber ?? ''}
            valueTone="accent"
            isCode
          />
          <MetaShipmentField
            label="Hãng tàu / Line tàu"
            value={shipment.shippingLine ?? ''}
          />
          <MetaShipmentField
            label="Tên tàu // Số chuyến"
            value={vesselLabel}
            isCode
          />
          <MetaShipmentField
            label="Thời hạn nộp SI / VGM"
            value={siCutoff?.label ?? ''}
            icon={Clock}
            iconTone={siCutoff?.isClosed ? 'warning' : 'accent'}
            valueTone={siCutoff?.isClosed ? 'warning' : 'accent'}
            isCode
          />
          <MetaShipmentField
            label="Cảng xếp hàng (POL)"
            value={shipment.placeOfLoading ?? ''}
            icon={Anchor}
            iconTone="accent"
            caption={
              shipment.etd
                ? `ETD: ${formatDisplayDate(shipment.etd)}`
                : undefined
            }
            captionTone="accent"
          />
          <MetaShipmentField
            label="Cảng dỡ hàng (POD)"
            value={shipment.placeOfDischarge ?? ''}
            icon={MapPin}
            iconTone="danger"
            caption={
              shipment.eta
                ? `ETA: ${formatDisplayDate(shipment.eta)}`
                : undefined
            }
          />
          {shipment.placeOfDelivery ? (
            <MetaShipmentField
              label="Nơi giao hàng"
              value={shipment.placeOfDelivery}
              icon={MapPin}
              iconTone="success"
            />
          ) : null}
          <MetaShipmentField
            label="Phương thức vận chuyển"
            value={
              details?.isTransshipment
                ? 'Chuyển tải (Transshipment)'
                : 'Đi thẳng (Direct)'
            }
            icon={Navigation}
            iconTone="success"
          />
        </Grid>
      </MetaShipmentSection>

      <MetaShipmentSection
        icon={FileCheck2}
        tone="warning"
        title="Hải quan & Chứng nhận xuất xứ (C/O)"
        pill={
          details?.customsChannel
            ? {
                label: labelForCustomsChannel(details.customsChannel),
                tone: metaToneForCustomsChannel(details.customsChannel),
              }
            : undefined
        }
      >
        <Grid columns={FIELD_GRID_COLUMNS} gap={4}>
          <MetaShipmentField
            label="Mã số C/O"
            value={shipment.coNumber ?? ''}
            isCode
            trailing={details?.coForm ? { label: details.coForm } : undefined}
          />
          <MetaShipmentField
            label="Ngày khai C/O"
            value={dateOrEmpty(shipment.coDeclarationDate)}
            isCode
          />
          <MetaShipmentField
            label="Ngày cấp C/O"
            value={dateOrEmpty(shipment.coIssuedDate)}
            isCode
          />
          <MetaShipmentField
            label="Số tờ khai xuất khẩu"
            value={shipment.customsDeclarationNumber ?? ''}
            isCode
            trailing={
              details?.customsChannel
                ? {
                    label: labelForCustomsChannel(details.customsChannel),
                    tone: metaToneForCustomsChannel(details.customsChannel),
                  }
                : undefined
            }
          />
          <MetaShipmentField
            label="Ngày khai tờ khai"
            value={dateOrEmpty(shipment.customsDeclarationDate)}
            isCode
          />
          <MetaShipmentField
            label="Kiểm hoá thực tế"
            value={
              shipment.customsInspected ? (
                <MetaPill label="Bị kiểm hoá" tone="warning" icon={ScanLine} />
              ) : (
                <MetaPill
                  label="Không kiểm hoá"
                  tone="success"
                  icon={CircleCheck}
                />
              )
            }
          />
        </Grid>
      </MetaShipmentSection>

      <MetaShipmentSection
        icon={Package}
        title="Thông tin hàng hoá & Danh sách Container"
        pill={
          vgms.length > 0
            ? { label: containerMixLabel(vgms), tone: 'accent' }
            : { label: quantityLabel, tone: 'accent' }
        }
      >
        <Grid columns={CARD_GRID_COLUMNS} gap={4}>
          <MetaShipmentField
            label="Tên lô hàng"
            value={shipment.name}
            caption={quantityLabel}
          />
          <MetaShipmentField
            label="Điều kiện thanh toán"
            value={
              <MetaPill
                label={labelForPaymentType(shipment.paymentCondition)}
                tone="neutral"
                hasBorder
              />
            }
            caption={
              details?.letterOfCreditNumber
                ? `LC: ${details.letterOfCreditNumber}`
                : undefined
            }
          />
          <MetaShipmentField
            label={
              vgms.length > 0 ? 'Tổng khối lượng gộp' : 'Khối lượng tờ khai'
            }
            value={formatKg(
              vgms.length > 0 ? grossTotal : shipment.declarationWeightKg,
            )}
            isCode
            caption={
              vgms.length > 0 ? `Net weight: ${formatKg(netTotal)}` : undefined
            }
          />
          <MetaShipmentField
            label="Tình trạng lô hàng"
            value={
              <MetaPill
                label={labelForShipmentStatus(shipment.status)}
                tone={metaToneForShipmentStatus(shipment.status)}
                hasDot
              />
            }
            caption={shipment.placeOfLoading ?? undefined}
          />
        </Grid>

        <VStack gap={4} hAlign="stretch">
          <HStack hAlign="between" vAlign="center" gap={3}>
            <HStack gap={2} vAlign="center">
              <Icon icon={ScanLine} size="sm" color="accent" />
              <Text weight="bold">DANH SÁCH CONTAINER</Text>
            </HStack>
            <Link weight="bold" color="accent" onClick={onViewVgms}>
              <HStack as="span" gap={1} vAlign="center" wrap="nowrap">
                <Text as="span" type="inherit" color="inherit" size="base">
                  Xem VGM
                </Text>
                <Icon icon={ArrowRight} size="xsm" color="inherit" />
              </HStack>
            </Link>
          </HStack>

          {isVgmsLoading ? (
            <Grid columns={CARD_GRID_COLUMNS} gap={4}>
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} height={180} radius={3} />
              ))}
            </Grid>
          ) : vgms.length === 0 ? (
            <Text color="secondary">
              Chưa có container nào — thêm ở tab VGM & Container.
            </Text>
          ) : (
            <Grid columns={CARD_GRID_COLUMNS} gap={4}>
              {vgms.map((vgm, index) => (
                <MetaContainerCard
                  key={vgm.id}
                  indexLabel={`CONT #${index + 1}`}
                  typeLabel={labelForShipmentContainerType(vgm.containerType)}
                  containerNumber={vgm.containerNumber}
                  sealNumber={vgm.sealNumber}
                  packingDate={formatDisplayDate(vgm.packingDate)}
                  vgm={formatKg(vgm.vgm)}
                />
              ))}
            </Grid>
          )}
        </VStack>
      </MetaShipmentSection>
    </VStack>
  );
}
