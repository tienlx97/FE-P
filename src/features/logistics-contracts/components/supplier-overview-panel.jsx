'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Banknote,
  Building2,
  CircleUser,
  Clock,
  Landmark,
  MapPin,
  ReceiptText,
  Wallet,
} from 'lucide-react';

import {
  MetaPartyBankBody,
  MetaPartyContactBody,
  MetaPill,
  MetaShipmentField,
  MetaShipmentSection,
  MetaWebsiteLink,
} from '@/shared/components/custom/meta/index.js';

import { formatVndAmount } from '../config/currencies.js';

/**
 * "Tổng quan" tab of the supplier detail page (Figma 141:76): Thông tin
 * chung + Điều khoản thanh toán & Công nợ on the left, Người liên hệ làm
 * việc + Tài khoản ngân hàng on the right (stacked below on narrow
 * screens). The customer detail page reuses it with its own labels.
 * @param {{
 *   supplier: import('../types/index.js').Supplier,
 *   nameLabel?: string,
 *   groupLabel?: string,
 *   groupNames: string[],
 *   paymentTermName?: string,
 *   onViewBankAccounts: () => void,
 * }} props
 */
export function SupplierOverviewPanel({
  supplier,
  nameLabel = 'Tên nhà cung cấp',
  groupLabel = 'Nhóm nhà cung cấp',
  groupNames,
  paymentTermName,
  onViewBankAccounts,
}) {
  const profile = supplier.profile;
  const isOrganization = profile?.isOrganization ?? true;
  const bankAccounts = supplier.bankAccounts ?? [];
  const hasCreditTerms = Boolean(
    profile?.paymentTermId ||
      profile?.dueDays != null ||
      profile?.creditLimit != null,
  );
  const fullAddress = [
    supplier.address,
    profile?.ward,
    profile?.district,
    profile?.province,
    profile?.country,
  ]
    .filter(Boolean)
    .join(', ');
  const contactName = [profile?.contactSalutation, profile?.contactName]
    .filter(Boolean)
    .join(' ');

  return (
    <Grid gap={4} xstyle={styles.columns}>
      <VStack gap={4} hAlign="stretch" xstyle={styles.minZero}>
        <MetaShipmentSection
          icon={Building2}
          title="Thông tin chung"
          pill={profile?.code ? { label: `ID: ${profile.code}` } : undefined}
        >
          <VStack gap={3} hAlign="stretch">
            <Grid columns={{ minWidth: 220, max: 3 }} gap={3}>
              <MetaShipmentField
                label={nameLabel}
                value={supplier.companyName.toLocaleUpperCase('vi')}
              />
              <MetaShipmentField
                label="Loại đối tượng"
                value={
                  <MetaPill label={isOrganization ? 'Tổ chức' : 'Cá nhân'} />
                }
              />
              <MetaShipmentField
                label={groupLabel}
                value={
                  groupNames.length > 0 ? (
                    <HStack gap={1} wrap="wrap">
                      {groupNames.map((name) => (
                        <MetaPill key={name} label={name} tone="accent" />
                      ))}
                    </HStack>
                  ) : null
                }
              />
              <MetaShipmentField
                label="Mã số thuế / CCCD"
                value={profile?.taxCode ?? ''}
                isCode
              />
              <MetaShipmentField
                label="Đại diện pháp luật"
                value={supplier.representativeName ?? ''}
              />
              <MetaShipmentField
                label="Chức vụ"
                value={supplier.representativeTitle ?? ''}
              />
              <MetaShipmentField
                label="Điện thoại liên hệ"
                value={profile?.phone ?? ''}
                isCode
              />
              <MetaShipmentField
                label="Website"
                value={
                  profile?.website ? (
                    <MetaWebsiteLink url={profile.website} />
                  ) : null
                }
              />
              <MetaShipmentField
                label="Đối tượng nội bộ"
                value={
                  <MetaPill
                    label={profile?.isInternal ? 'Có' : 'Không'}
                    tone={profile?.isInternal ? 'accent' : 'neutral'}
                  />
                }
              />
            </Grid>
            <MetaShipmentField
              label="Địa chỉ trụ sở chính"
              icon={MapPin}
              value={fullAddress}
            />
          </VStack>
        </MetaShipmentSection>

        <MetaShipmentSection
          icon={Banknote}
          title="Điều khoản thanh toán & Công nợ"
          subtitle="Chính sách tín dụng thương mại & thời hạn thanh toán"
          pill={
            hasCreditTerms
              ? { label: 'Đang áp dụng', tone: 'success', hasDot: true }
              : undefined
          }
        >
          <Grid columns={{ minWidth: 220, max: 3 }} gap={3}>
            <MetaShipmentField
              label="Hình thức thanh toán"
              icon={ReceiptText}
              value={paymentTermName ?? ''}
            />
            <MetaShipmentField
              label="Thời hạn công nợ"
              icon={Clock}
              valueTone="accent"
              value={profile?.dueDays == null ? '' : `${profile.dueDays} ngày`}
            />
            <MetaShipmentField
              label="Hạn mức tối đa"
              icon={Wallet}
              value={formatVndAmount(profile?.creditLimit)}
            />
          </Grid>
        </MetaShipmentSection>
      </VStack>

      <VStack gap={4} hAlign="stretch" xstyle={styles.minZero}>
        <MetaShipmentSection icon={CircleUser} title="Người liên hệ làm việc">
          <MetaPartyContactBody
            name={contactName}
            initialsOf={profile?.contactName ?? ''}
            rows={[
              { label: 'Email', value: profile?.contactEmail ?? '' },
              { label: 'Điện thoại', value: profile?.contactPhone ?? '' },
            ].filter((row) => row.value)}
            emptyText="Chưa có người liên hệ."
          />
        </MetaShipmentSection>

        <MetaShipmentSection icon={Landmark} title="Tài khoản ngân hàng">
          <MetaPartyBankBody
            account={
              bankAccounts.find((account) => account.isDefault) ??
              bankAccounts[0] ??
              null
            }
            moreCount={bankAccounts.length - 1}
            onViewAll={onViewBankAccounts}
            emptyText="Chưa có tài khoản ngân hàng."
          />
        </MetaShipmentSection>
      </VStack>
    </Grid>
  );
}

const styles = stylex.create({
  // Figma: content column + a 384px side column; one column below 1100px.
  columns: {
    alignItems: 'start',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr) calc(var(--spacing-12) * 8)',
      '@media (max-width: 1099px)': 'minmax(0, 1fr)',
    },
  },
  minZero: {
    minWidth: 0,
  },
});
