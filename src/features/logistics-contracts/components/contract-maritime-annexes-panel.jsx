'use client';
import { CircleMinus, CirclePlus, FilePen } from 'lucide-react';
import { useMemo, useState } from 'react';

import { MetaAnnexListPanel } from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { labelForContractAnnexType } from '../config/contract-annex-types.js';
import { formatMoney } from '../config/currencies.js';
import { useContractAnnexesQuery } from '../hooks/use-contract-annexes-query.js';
import { ContractAnnexFormDialog } from './contract-annex-form-dialog.jsx';

// Fields the design calls for always render; a missing value shows this
// placeholder.
const BLANK = '___';

/**
 * "Phụ lục" tab body (`openspec/changes/apply-maritime-to-contract-detail/`,
 * step 7, moved to the Meta theme 2026-09-23 — the file keeps its old name;
 * not the older `ContractAnnexesPanel`, which the "Liên quan"/"Xem đầy đủ"
 * tabs still use): `MetaAnnexListPanel` fed with the contract's real
 * `ContractAnnex`es, plus the create/edit dialog it opens. `AmountIncrease`/
 * `AmountDecrease` adjust the settlement value; `ValueChange` is
 * non-monetary (its `amount` is meaningless, see `ContractAnnex.amount`).
 * @param {{ contract: import('../types/index.js').Contract }} props
 */
export function ContractMaritimeAnnexesPanel({ contract }) {
  const [dialog, setDialog] = useState(
    /** @type {{ annex: import('../types/index.js').ContractAnnex | null } | null} */ (
      null
    ),
  );

  const annexesQuery = useContractAnnexesQuery(contract.id);
  const annexes = useMemo(
    () =>
      (annexesQuery.data?.success ? annexesQuery.data.annexes : [])
        .slice()
        .sort((a, b) => a.annexNumber - b.annexNumber),
    [annexesQuery.data],
  );

  const increases = annexes.filter((annex) => annex.type === 'AmountIncrease');
  const decreases = annexes.filter((annex) => annex.type === 'AmountDecrease');
  const sum = (
    /** @type {import('../types/index.js').ContractAnnex[]} */ list,
  ) => list.reduce((total, annex) => total + annex.amount, 0);

  const summary = [
    {
      label: 'GIÁ TRỊ HỢP ĐỒNG GỐC',
      value: formatMoney(contract.contractValue ?? 0),
      note: 'Giá trị hợp đồng ban đầu (HĐ gốc)',
      tone: /** @type {const} */ ('neutral'),
      icon: /** @type {const} */ ('file'),
      noteIcon: FilePen,
    },
    {
      label: 'PHÁT SINH TĂNG',
      value: `${increases.length > 0 ? '+' : ''}${formatMoney(sum(increases))}`,
      note: `Tổng giá trị phụ lục tăng (${increases.length} phụ lục)`,
      tone: /** @type {const} */ ('success'),
      icon: /** @type {const} */ ('up'),
      noteIcon: CirclePlus,
    },
    {
      label: 'PHÁT SINH GIẢM',
      value: `${decreases.length > 0 ? '-' : ''}${formatMoney(sum(decreases))}`,
      note: `Tổng giá trị phụ lục giảm (${decreases.length > 0 ? `${decreases.length} phụ lục` : 'Không có'})`,
      tone: /** @type {const} */ ('muted'),
      icon: /** @type {const} */ ('down'),
      noteIcon: CircleMinus,
    },
  ];

  const rows = annexes.map((annex) => ({
    id: annex.id,
    code: annex.annexCode,
    number: String(annex.annexNumber).padStart(2, '0'),
    kind: {
      label: labelForContractAnnexType(annex.type),
      tone: /** @type {'success' | 'neutral' | 'blue'} */ (
        annex.type === 'AmountIncrease'
          ? 'success'
          : annex.type === 'AmountDecrease'
            ? 'neutral'
            : 'blue'
      ),
      icon: /** @type {'increase' | 'decrease' | 'change'} */ (
        annex.type === 'AmountIncrease'
          ? 'increase'
          : annex.type === 'AmountDecrease'
            ? 'decrease'
            : 'change'
      ),
    },
    title: annex.note || BLANK,
    delta:
      annex.type === 'AmountIncrease'
        ? annex.amount
        : annex.type === 'AmountDecrease'
          ? -annex.amount
          : 0,
    signedAt: annex.signedDate ? formatDisplayDate(annex.signedDate) : BLANK,
    signatures: [
      {
        label: `Bên bán (${annex.sellerSigned ? 'Đã ký' : 'Chưa ký'})`,
        isSigned: annex.sellerSigned,
      },
      {
        label: `Bên mua (${annex.buyerSigned ? 'Đã ký' : 'Chưa ký'})`,
        isSigned: annex.buyerSigned,
      },
    ],
  }));

  return (
    <>
      <MetaAnnexListPanel
        currency={contract.currency}
        summary={summary}
        annexes={rows}
        isLoading={annexesQuery.isLoading}
        onCreate={() => setDialog({ annex: null })}
        onEdit={(id) =>
          setDialog({
            annex: annexes.find((annex) => annex.id === id) ?? null,
          })
        }
      />

      {dialog ? (
        <ContractAnnexFormDialog
          key={dialog.annex?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setDialog(null);
          }}
          contractId={contract.id}
          annex={dialog.annex}
          onSuccess={() => setDialog(null)}
        />
      ) : null}
    </>
  );
}
