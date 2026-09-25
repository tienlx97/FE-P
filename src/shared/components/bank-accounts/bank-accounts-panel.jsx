'use client';

import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { useClipboard } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useMutation } from '@tanstack/react-query';
import {
  Check,
  CircleCheck,
  CirclePause,
  Copy,
  Globe,
  Landmark,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { changeBankAccount } from '@/shared/api/bank-accounts.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';
import { useVietnamBanksQuery } from '@/shared/hooks/use-vietnam-banks-query.js';

import {
  MetaPill,
  MetaShipmentSection,
  MetaThemeProvider,
} from '../custom/meta/index.js';
import { TanStackDataTable } from '../tanstack-data-table.jsx';
import { BankAccountDialog } from './bank-account-dialog.jsx';

const ALL = 'all';

/** Filter order: VND, USD, EUR first (Figma), then others A→Z. */
const CURRENCY_ORDER = ['VND', 'USD', 'EUR'];

/** @param {string} code */
function currencyRank(code) {
  const index = CURRENCY_ORDER.indexOf(code);
  return index === -1 ? CURRENCY_ORDER.length : index;
}

/**
 * Lucide star filled with its stroke colour — the default ("Ưu tiên 1")
 * marker; the outline star stays the "set as default" button.
 * @param {import('lucide-react').LucideProps} props
 */
function FilledStar(props) {
  return <Star {...props} fill="currentColor" />;
}

/** Currency pill tone — VND green, USD cobalt, others neutral (Figma). */
const CURRENCY_TONE = /** @type {const} */ ({
  VND: 'success',
  USD: 'accent',
});

/**
 * Vietnam bank catalog entry matching a free-text bank name (short name
 * or full name, case-insensitive), for the short-code tile + full name.
 * @param {import('@/shared/api/vietnam-banks.js').VietnamBank[]} banks
 * @param {string} bankName
 */
function findBank(banks, bankName) {
  const key = bankName.trim().toLocaleLowerCase('vi');
  return banks.find(
    (bank) =>
      bank.shortName.toLocaleLowerCase('vi') === key ||
      bank.code.toLocaleLowerCase('vi') === key ||
      bank.name.toLocaleLowerCase('vi') === key,
  );
}

/**
 * Bank accounts card (Figma "Danh sách tài khoản ngân hàng") shared by every
 * owner — supplier detail tab, seller accounts, employees (BE-kt-xnk
 * `unify-bank-accounts`): active-account count, currency filter, "Thêm tài
 * khoản ngân hàng"; table with the default ("Ưu tiên 1") star, bank +
 * branch + SWIFT + extra fields, copyable number, holder, currency, status,
 * Sửa / Xoá. Changes go through the owner's per-account `endpoint`;
 * `onChanged` receives each successful result (to refresh caches).
 * @param {{
 *   accounts: import('@/shared/api/bank-accounts.js').BankAccount[],
 *   endpoint: import('@/shared/api/bank-accounts.js').BankAccountEndpoint,
 *   onChanged: (result: { data: any, accounts: import('@/shared/api/bank-accounts.js').BankAccount[] }) => void,
 *   holderDefault: string,
 *   title?: string,
 *   subtitle?: string,
 * }} props
 */
export function BankAccountsPanel({
  accounts,
  endpoint,
  onChanged,
  holderDefault,
  title = 'Danh sách tài khoản ngân hàng',
  subtitle = 'Quản lý tài khoản thụ hưởng phục vụ chi trả hoa hồng, thanh toán BOQ & đối soát',
}) {
  const toast = useAppToast();
  const [currency, setCurrency] = useState(ALL);
  const [editing, setEditing] = useState(
    /** @type {import('@/shared/api/bank-accounts.js').BankAccount | null | undefined} */ (
      undefined
    ),
  );
  const [deleting, setDeleting] = useState(
    /** @type {import('@/shared/api/bank-accounts.js').BankAccount | null} */ (null),
  );
  const mutation = useMutation({
    mutationFn: (
      /** @type {Parameters<typeof changeBankAccount>[1]} */ operation,
    ) => changeBankAccount(endpoint, operation),
    onSuccess: (result) => {
      if (result.success) onChanged(result);
    },
  });
  const banks = useVietnamBanksQuery().data ?? [];

  const currencies = [
    ...new Set(accounts.map((account) => account.currency ?? 'VND')),
  ].sort((a, b) => currencyRank(a) - currencyRank(b) || a.localeCompare(b));
  const activeCurrency = currencies.includes(currency) ? currency : ALL;
  const rows = accounts
    .filter(
      (account) =>
        activeCurrency === ALL || (account.currency ?? 'VND') === activeCurrency,
    )
    .map((account) => ({ ...account, id: account.id ?? account.accountNumber }));
  const activeCount = accounts.filter((account) => account.isActive !== false)
    .length;

  /** @param {Parameters<typeof mutation.mutateAsync>[0]} options @param {string} done */
  async function run(options, done) {
    const result = await mutation.mutateAsync(options);
    toast(
      result.success
        ? { body: done }
        : { body: result.message, type: 'error' },
    );
    return result.success;
  }

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<any>[]} */
  const columns = [
    {
      key: 'isDefault',
      header: 'Mặc định',
      width: pixel(104),
      align: 'center',
      renderCell: (account) =>
        account.isDefault ? (
          <VStack gap={1} hAlign="center">
            <Icon
              icon={FilledStar}
              size="md"
              color={/** @type {any} */ ('meta-amber')}
            />
            <MetaPill label="Ưu tiên 1" tone="warning" size="sm" />
          </VStack>
        ) : (
          <IconButton
            label={`Đặt ${account.accountNumber} làm mặc định`}
            tooltip="Đặt làm mặc định"
            icon={<Icon icon={Star} size="sm" />}
            variant="ghost"
            size="sm"
            isDisabled={mutation.isPending}
            onClick={() =>
              run(
                { kind: 'default', accountId: account.id },
                `Đã đặt ${account.accountNumber} làm tài khoản mặc định.`,
              )
            }
          />
        ),
    },
    {
      key: 'bankName',
      header: 'Ngân hàng & chi nhánh',
      width: proportional(2),
      renderCell: (account) => {
        const bank = findBank(banks, account.bankName);
        // Catalog code ("VCB", "BIDV"); banks outside the catalog get a globe.
        const tileLabel = bank?.code ?? '';
        return (
          <HStack gap={3} vAlign="center" wrap="nowrap">
            <HStack hAlign="center" vAlign="center" xstyle={styles.bankTile}>
              {bank ? (
                <Text size="xsm" weight="bold" color="inherit" maxLines={1}>
                  {tileLabel.toUpperCase()}
                </Text>
              ) : (
                // Not in the Vietnam catalog — a foreign (or free-text) bank.
                <Icon icon={Globe} size="sm" color="inherit" />
              )}
            </HStack>
            <VStack gap={0.5} xstyle={styles.minZero}>
              <HStack gap={1} vAlign="center" wrap="wrap">
                <Text weight="bold">{bank?.name ?? account.bankName}</Text>
                {bank && bank.shortName !== bank.name ? (
                  <Text size="sm" color="secondary">
                    ({bank.shortName})
                  </Text>
                ) : null}
              </HStack>
              <HStack gap={2} vAlign="center" wrap="wrap">
                {account.branch || account.province ? (
                  <HStack gap={1} vAlign="center">
                    <Icon icon={MapPin} size="xsm" color="secondary" />
                    <Text size="sm" color="secondary">
                      {[account.branch, account.province]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </HStack>
                ) : null}
                {account.swiftCode ? (
                  <Text size="sm" color="secondary">
                    SWIFT:{' '}
                    <Text as="span" size="sm" type="code" weight="bold">
                      {account.swiftCode}
                    </Text>
                  </Text>
                ) : null}
              </HStack>
              {(account.extraFields ?? []).length > 0 ? (
                <Text size="sm" color="secondary" maxLines={2}>
                  {account.extraFields
                    .map(
                      (/** @type {{ key: string, value: string }} */ field) =>
                        `${field.key}: ${field.value}`,
                    )
                    .join('  ·  ')}
                </Text>
              ) : null}
            </VStack>
          </HStack>
        );
      },
    },
    {
      key: 'accountNumber',
      header: 'Số tài khoản',
      width: pixel(240),
      renderCell: (account) => (
        <AccountNumber value={account.accountNumber} />
      ),
    },
    {
      key: 'holder',
      header: 'Chủ tài khoản',
      width: proportional(1.2),
      renderCell: (account) =>
        account.holder ? (
          <Text weight="bold" xstyle={styles.uppercase}>
            {account.holder}
          </Text>
        ) : (
          <Text color={/** @type {any} */ ('meta-subtle')}>—</Text>
        ),
    },
    {
      key: 'currency',
      header: 'Loại tiền tệ',
      width: pixel(120),
      align: 'center',
      renderCell: (account) => {
        const code = account.currency ?? 'VND';
        return (
          <MetaPill
            label={code}
            tone={CURRENCY_TONE[/** @type {'VND' | 'USD'} */ (code)] ?? 'neutral'}
            hasDot
          />
        );
      },
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      width: pixel(168),
      align: 'center',
      renderCell: (account) =>
        account.isActive === false ? (
          <MetaPill label="Ngừng hoạt động" tone="muted" icon={CirclePause} />
        ) : (
          <MetaPill label="Đang hoạt động" tone="success" icon={CircleCheck} />
        ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(104),
      align: 'center',
      renderCell: (account) => (
        <HStack gap={1} hAlign="center" wrap="nowrap">
          <IconButton
            label={`Sửa ${account.accountNumber}`}
            tooltip="Sửa"
            icon={<Icon icon={Pencil} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => setEditing(account)}
          />
          <IconButton
            label={`Xoá ${account.accountNumber}`}
            tooltip="Xoá"
            icon={<Icon icon={Trash2} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => setDeleting(account)}
          />
        </HStack>
      ),
    },
  ];

  return (
    <>
      <MetaShipmentSection
        icon={Landmark}
        title={title}
        subtitle={subtitle}
        pill={{ label: `${activeCount} tài khoản hoạt động` }}
        actions={
          <HStack gap={3} vAlign="center" wrap="wrap">
            {currencies.length > 1 ? (
              <SegmentedControl
                label="Lọc theo loại tiền tệ"
                size="sm"
                value={activeCurrency}
                onChange={setCurrency}
              >
                <SegmentedControlItem value={ALL} label="Tất cả" />
                {currencies.map((code) => (
                  <SegmentedControlItem key={code} value={code} label={code} />
                ))}
              </SegmentedControl>
            ) : null}
            <Button
              label="Thêm tài khoản ngân hàng"
              variant="primary"
              icon={<Icon icon={Plus} size="sm" />}
              onClick={() => setEditing(null)}
            />
          </HStack>
        }
      >
        <TanStackDataTable
          data={rows}
          columns={columns}
          idKey="id"
          density="spacious"
          dividers="rows"
          ariaLabel="Danh sách tài khoản ngân hàng"
          headerCellXstyle={styles.headerCell}
          emptyState={
            <Text color="secondary">
              {accounts.length === 0
                ? 'Chưa có tài khoản ngân hàng.'
                : 'Không có tài khoản bằng loại tiền này.'}
            </Text>
          }
        />
      </MetaShipmentSection>

      {/* Dialogs portal out of the page tree, so they re-apply Meta. */}
      <MetaThemeProvider>
        {editing !== undefined ? (
          <BankAccountDialog
            account={editing}
            holderDefault={holderDefault}
            submit={(operation) => mutation.mutateAsync(operation)}
            onClose={() => setEditing(undefined)}
          />
        ) : null}
        <AlertDialog
          isOpen={deleting != null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setDeleting(null);
          }}
          title={`Xoá tài khoản ${deleting?.accountNumber ?? ''}?`}
          description={
            deleting?.isDefault
              ? 'Đây là tài khoản mặc định — tài khoản kế tiếp sẽ thành mặc định.'
              : 'Hành động này không thể hoàn tác.'
          }
          actionLabel="Xoá"
          isActionLoading={mutation.isPending}
          onAction={async () => {
            if (!deleting?.id) return;
            await run(
              { kind: 'delete', accountId: deleting.id },
              `Đã xoá tài khoản ${deleting.accountNumber}.`,
            );
            setDeleting(null);
          }}
        />
      </MetaThemeProvider>
    </>
  );
}

/** @param {{ value: string }} props */
function AccountNumber({ value }) {
  const { copy, isCopied } = useClipboard({
    announce: 'Đã sao chép số tài khoản',
  });
  return (
    <HStack gap={1} vAlign="center" wrap="nowrap">
      <Text weight="bold" type="code" hasTabularNumbers xstyle={styles.numberBox}>
        {value}
      </Text>
      <IconButton
        label={`Sao chép ${value}`}
        tooltip={isCopied ? 'Đã sao chép' : 'Sao chép'}
        icon={<Icon icon={isCopied ? Check : Copy} size="sm" />}
        variant="ghost"
        size="sm"
        onClick={() => copy(value)}
      />
    </HStack>
  );
}

const styles = stylex.create({
  minZero: {
    minWidth: 0,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  headerCell: {
    backgroundColor: 'var(--meta-surface-container-low)',
  },
  bankTile: {
    backgroundColor: 'var(--meta-primary-fixed)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    color: 'var(--meta-primary-strong)',
    flexShrink: 0,
    height: 'var(--spacing-10)',
    width: 'var(--spacing-10)',
  },
  numberBox: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderRadius: 'var(--radius-element)',
    paddingBlock: 'var(--spacing-1)',
    paddingInline: 'var(--spacing-2)',
    whiteSpace: 'nowrap',
  },
});
