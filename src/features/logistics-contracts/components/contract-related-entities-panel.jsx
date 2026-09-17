'use client';
import { useState } from 'react';

import { CommissionAnnexFormDialog } from './commission-annex-form-dialog.jsx';
import { CommissionFormDialog } from './commission-form-dialog.jsx';
import { CommissionPaymentQuickAddDialog } from './commission-payment-quick-add-dialog.jsx';
import { ContractAnnexFormDialog } from './contract-annex-form-dialog.jsx';
import { ContractExpandedDetails } from './contract-expanded-details.jsx';
import { ContractPrivateInfoDetailDialog } from './contract-private-info-detail-dialog.jsx';
import { PaymentScheduleFormDialog } from './payment-schedule-form-dialog.jsx';
import { ShipmentFormDialog } from './shipment-form-dialog.jsx';
import { ShipmentVgmFormDialog } from './shipment-vgm-form-dialog.jsx';

/**
 * The "Phụ lục"/"Thanh toán"/"Liên quan"/"Xem đầy đủ" tab bodies for one
 * Contract, plus every related-entity dialog those tabs can open (Annex,
 * PaymentSchedule, Shipment, VGM, Commission + its own Annex/Payment,
 * BOQ). Extracted out of `contracts-list.jsx` (task 1.4,
 * `openspec/changes/add-contract-detail-page/`) so `/logistics/contract/
 * [id]` (`ContractDetailWorkspace`) renders the exact same wiring instead
 * of duplicating it — this is the actual fix for the "cross-link opens a
 * Contract with dead tabs" bug: those cross-links now navigate to the
 * page instead of opening a bare `ContractFormDialog` with no `children`.
 *
 * Unlike the old in-dialog usage, there is no "hide while a related dialog
 * is open" concern here (ADR-0004 only applies to `<dialog>`-on-`<dialog>`
 * stacking) — this panel is embedded in a plain page, so a
 * `*FormDialog` opening over it is just one ordinary dialog.
 * @param {{
 *   contract: import('../types/index.js').Contract,
 *   customersById: Map<string, import('../types/index.js').Customer>,
 *   costCategoriesById: Map<string, import('../types/index.js').ShipmentCostCategory>,
 *   activeTab: import('./contract-expanded-details.jsx').ExpandedTab,
 *   onOpenCustomer?: (customerId: string) => void,
 * }} props
 */
export function ContractRelatedEntitiesPanel({
  contract,
  customersById,
  costCategoriesById,
  activeTab,
}) {
  const [relatedCommissionDialog, setRelatedCommissionDialog] = useState(
    /** @type {{ contractId: string, contractNumber: string, projectName: string, currency: string, commission: import('../types/index.js').Commission | null } | null} */ (
      null
    ),
  );
  const [relatedBoqDialog, setRelatedBoqDialog] = useState(
    /** @type {{ contractId: string, contractNumber: string } | null} */ (null),
  );
  const [shipmentDialog, setShipmentDialog] = useState(
    /** @type {{ contractId: string, contract: import('../types/index.js').Contract, shipment?: import('../types/index.js').Shipment } | null} */ (
      null
    ),
  );
  const [annexDialog, setAnnexDialog] = useState(
    /** @type {{ contractId: string, annex?: import('../types/index.js').ContractAnnex } | null} */ (
      null
    ),
  );
  const [paymentScheduleDialog, setPaymentScheduleDialog] = useState(
    /** @type {{ contractId: string, schedule?: import('../types/index.js').PaymentSchedule } | null} */ (
      null
    ),
  );
  const [commissionAnnexDialog, setCommissionAnnexDialog] = useState(
    /** @type {{ contractId: string, annex?: import('../types/index.js').CommissionAnnex } | null} */ (
      null
    ),
  );
  const [commissionPaymentDialog, setCommissionPaymentDialog] = useState(
    /** @type {{ contractId: string, currency: string, commission: import('../types/index.js').Commission } | null} */ (
      null
    ),
  );
  const [vgmDialog, setVgmDialog] = useState(
    /** @type {{ contractId: string, shipmentId: string, vgm?: import('../types/index.js').ShipmentVgm } | null} */ (
      null
    ),
  );

  return (
    <>
      <ContractExpandedDetails
        contract={contract}
        customersById={customersById}
        costCategoriesById={costCategoriesById}
        activeTab={activeTab}
        onAddAnnex={() => setAnnexDialog({ contractId: contract.id })}
        onEditAnnex={(annex) =>
          setAnnexDialog({ contractId: contract.id, annex })
        }
        onAddPaymentSchedule={() =>
          setPaymentScheduleDialog({ contractId: contract.id })
        }
        onEditPaymentSchedule={(schedule) =>
          setPaymentScheduleDialog({ contractId: contract.id, schedule })
        }
        onAddShipment={() =>
          setShipmentDialog({ contractId: contract.id, contract })
        }
        onEditShipment={(shipment) =>
          setShipmentDialog({ contractId: contract.id, contract, shipment })
        }
        onAddVgm={(payload) => setVgmDialog(payload)}
        onEditVgm={(payload) => setVgmDialog(payload)}
        onOpenCommission={(commission) =>
          setRelatedCommissionDialog({
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            projectName: contract.projectName,
            currency: contract.currency,
            commission,
          })
        }
        onOpenBoq={() =>
          setRelatedBoqDialog({
            contractId: contract.id,
            contractNumber: contract.contractNumber,
          })
        }
      />

      {relatedCommissionDialog ? (
        <CommissionFormDialog
          key={relatedCommissionDialog.commission?.id ?? 'create'}
          isOpen
          initialMode="view"
          onOpenChange={(isOpen) => {
            if (!isOpen) setRelatedCommissionDialog(null);
          }}
          contractId={relatedCommissionDialog.contractId}
          contractNumber={relatedCommissionDialog.contractNumber}
          projectName={relatedCommissionDialog.projectName}
          currency={relatedCommissionDialog.currency}
          commission={relatedCommissionDialog.commission}
          closeLabel="Quay lại Contract"
          onSuccess={(saved) =>
            setRelatedCommissionDialog((current) =>
              current ? { ...current, commission: saved } : current,
            )
          }
          onAddAnnex={() =>
            setCommissionAnnexDialog({
              contractId: relatedCommissionDialog.contractId,
            })
          }
          onEditAnnex={(annex) =>
            setCommissionAnnexDialog({
              contractId: relatedCommissionDialog.contractId,
              annex,
            })
          }
          onAddPayment={() =>
            relatedCommissionDialog.commission &&
            setCommissionPaymentDialog({
              contractId: relatedCommissionDialog.contractId,
              currency: relatedCommissionDialog.currency,
              commission: relatedCommissionDialog.commission,
            })
          }
        />
      ) : null}

      {relatedBoqDialog ? (
        <ContractPrivateInfoDetailDialog
          key={relatedBoqDialog.contractId}
          contractId={relatedBoqDialog.contractId}
          contractNumber={relatedBoqDialog.contractNumber}
          closeLabel="Quay lại Contract"
          onOpenChange={(isOpen) => {
            if (!isOpen) setRelatedBoqDialog(null);
          }}
        />
      ) : null}

      {shipmentDialog ? (
        <ShipmentFormDialog
          key={shipmentDialog.shipment?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setShipmentDialog(null);
          }}
          contractId={shipmentDialog.contractId}
          contract={shipmentDialog.contract}
          shipment={shipmentDialog.shipment}
          closeLabel="Quay lại Contract"
          onSuccess={(saved) =>
            setShipmentDialog((current) =>
              current?.shipment ? { ...current, shipment: saved } : null,
            )
          }
        />
      ) : null}

      {annexDialog ? (
        <ContractAnnexFormDialog
          key={annexDialog.annex?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setAnnexDialog(null);
          }}
          contractId={annexDialog.contractId}
          annex={annexDialog.annex}
          onSuccess={() => setAnnexDialog(null)}
        />
      ) : null}

      {paymentScheduleDialog ? (
        <PaymentScheduleFormDialog
          key={paymentScheduleDialog.schedule?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setPaymentScheduleDialog(null);
          }}
          contractId={paymentScheduleDialog.contractId}
          schedule={paymentScheduleDialog.schedule}
          onSuccess={() => setPaymentScheduleDialog(null)}
        />
      ) : null}

      {commissionAnnexDialog ? (
        <CommissionAnnexFormDialog
          key={commissionAnnexDialog.annex?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setCommissionAnnexDialog(null);
          }}
          contractId={commissionAnnexDialog.contractId}
          annex={commissionAnnexDialog.annex}
          onSuccess={() => setCommissionAnnexDialog(null)}
        />
      ) : null}

      {commissionPaymentDialog ? (
        <CommissionPaymentQuickAddDialog
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setCommissionPaymentDialog(null);
          }}
          contractId={commissionPaymentDialog.contractId}
          commission={commissionPaymentDialog.commission}
          currency={commissionPaymentDialog.currency}
          onSuccess={() => setCommissionPaymentDialog(null)}
        />
      ) : null}

      {vgmDialog ? (
        <ShipmentVgmFormDialog
          key={vgmDialog.vgm?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setVgmDialog(null);
          }}
          contractId={vgmDialog.contractId}
          shipmentId={vgmDialog.shipmentId}
          vgm={vgmDialog.vgm}
          onSuccess={() => setVgmDialog(null)}
        />
      ) : null}
    </>
  );
}
