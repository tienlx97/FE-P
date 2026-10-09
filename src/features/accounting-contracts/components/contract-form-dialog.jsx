'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid, GridSpan } from '@astryxdesign/core/Grid';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { FileText } from 'lucide-react';
import { useEffect } from 'react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { checkContractCodes } from '../api/contracts.js';
import { contractSchema } from '../config/contract-schema.js';
import { formatVnd, valueAfterTax } from '../config/money.js';
import { useCustomersQuery, useSourcesQuery } from '../hooks/use-catalogs.js';
import {
  useCompaniesQuery,
  useSaveContractMutation,
} from '../hooks/use-contracts.js';
import { useZodForm } from '../hooks/use-zod-form.js';

/** @typedef {import('../types/index.js').AccountingContractFormValues} FormValues */
/** @typedef {import('@astryxdesign/core/Calendar').ISODateString} ISODateString */

/**
 * @param {import('../types/index.js').AccountingContractSummary | null} contract
 * @param {string} defaultCompanyId
 * @returns {FormValues}
 */
function valuesOf(contract, defaultCompanyId) {
  return {
    companyId: contract?.companyId ?? defaultCompanyId,
    contractNumber: contract?.contractNumber ?? '',
    signedDate: contract?.signedDate ?? '',
    projectCode: contract?.projectCode ?? '',
    projectName: contract?.projectName ?? '',
    sourceId: contract?.sourceId ?? '',
    customerId: contract?.customerId ?? '',
    valueBeforeTax: contract?.valueBeforeTax,
    taxRatePercent: contract?.taxRatePercent ?? 8,
    paymentDueDate: contract?.paymentDueDate ?? '',
    note: contract?.note ?? '',
  };
}

/**
 * Create (no `contract`) or edit an accounting contract. Before saving, the
 * contract number and the project code are checked for duplicates (the
 * project code also against Logistics contract numbers), so the clash shows
 * on the field itself.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contract: import('../types/index.js').AccountingContractSummary | null,
 *   onSaved?: (detail: import('../types/index.js').AccountingContractDetail) => void,
 * }} props
 */
export function ContractFormDialog({
  isOpen,
  onOpenChange,
  contract,
  onSaved,
}) {
  const companiesQuery = useCompaniesQuery();
  const customersQuery = useCustomersQuery();
  const sourcesQuery = useSourcesQuery();
  const saveMutation = useSaveContractMutation();

  const companies = companiesQuery.data ?? [];
  const defaultCompanyId = companies.length === 1 ? companies[0].id : '';
  const customers = customersQuery.data?.success
    ? customersQuery.data.data
    : [];
  const sources = sourcesQuery.data?.success ? sourcesQuery.data.data : [];

  const form = useZodForm({
    initialValues: valuesOf(contract, defaultCompanyId),
    schema: contractSchema,
    submit: async (_parsed, values) => {
      const check = await checkContractCodes({
        companyId: values.companyId,
        contractNumber: values.contractNumber,
        projectCode: values.projectCode,
        excludeContractId: contract?.id,
      });
      if (check.success) {
        /** @type {Record<string, string>} */
        const fieldErrors = {};
        if (check.data.contractNumberExists)
          fieldErrors.contractNumber = 'Số hợp đồng đã tồn tại';
        if (check.data.projectCodeExists)
          fieldErrors.projectCode = 'Mã công trình đã tồn tại';
        else if (check.data.projectCodeIsLogisticsContractNumber)
          fieldErrors.projectCode = 'Trùng với số hợp đồng bên Logistics';
        if (Object.keys(fieldErrors).length > 0) {
          return {
            success: false,
            message: 'Số hợp đồng hoặc mã công trình bị trùng',
            fieldErrors,
          };
        }
      }

      const result = await saveMutation.mutateAsync({
        values,
        id: contract?.id,
        version: contract?.version,
      });
      if (result.success) onSaved?.(result.data);
      return result;
    },
    onSuccess: () => onOpenChange(false),
  });
  const { reset, values, setField, fieldStatuses } = form;

  useEffect(() => {
    if (isOpen) reset(valuesOf(contract, defaultCompanyId));
    // Reload the values each time the dialog opens on a (possibly other) contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contract, defaultCompanyId]);

  const afterTax = valueAfterTax(values.valueBeforeTax, values.taxRatePercent);

  return (
    <FormDialog
      variant="drawer"
      drawerIcon={FileText}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={
        contract ? `Sửa hợp đồng ${contract.contractNumber}` : 'Thêm hợp đồng'
      }
      submitLabel={contract ? 'Lưu' : 'Thêm'}
      width={760}
      draft={{ values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
        <MetaFormSection
          isBoxed
          index={1}
          title="Thông tin hợp đồng"
          meta="Bắt buộc"
        >
          <Grid columns={10} gap={3}>
            <GridSpan columns={10}>
              <Selector
                label="Công ty"
                placeholder="Chọn công ty"
                value={values.companyId}
                onChange={(value) => setField('companyId', value ?? '')}
                options={companies.map((company) => ({
                  value: company.id,
                  label: company.name,
                }))}
                isRequired
                isDisabled={contract !== null}
                status={fieldStatuses.companyId}
                statusVariant="tooltip"
              />
            </GridSpan>
            <GridSpan columns={5}>
              <TextInput
                label="Số hợp đồng"
                value={values.contractNumber}
                onChange={(value) => setField('contractNumber', value)}
                isRequired
                status={fieldStatuses.contractNumber}
                statusVariant="tooltip"
              />
            </GridSpan>
            <GridSpan columns={5}>
              <TextInput
                label="Mã công trình"
                value={values.projectCode}
                onChange={(value) => setField('projectCode', value)}
                isRequired
                status={fieldStatuses.projectCode}
                statusVariant="tooltip"
              />
            </GridSpan>
            <GridSpan columns={7}>
              <TextInput
                label="Tên dự án"
                value={values.projectName}
                onChange={(value) => setField('projectName', value)}
                isRequired
                status={fieldStatuses.projectName}
                statusVariant="tooltip"
              />
            </GridSpan>
            <GridSpan columns={3}>
              <DateInput
                label="Ngày ký"
                value={/** @type {ISODateString} */ (values.signedDate)}
                onChange={(value) => setField('signedDate', value ?? '')}
                format={formatDateInputValue}
                isRequired
                status={fieldStatuses.signedDate}
                statusVariant="tooltip"
              />
            </GridSpan>
          </Grid>
        </MetaFormSection>
        <MetaFormSection isBoxed index={2} title="Khách hàng & thanh toán">
          <Grid columns={10} gap={3}>
            <GridSpan columns={10}>
              <Selector
                label="Khách hàng"
                placeholder="Chọn khách hàng"
                value={values.customerId}
                onChange={(value) => setField('customerId', value ?? '')}
                options={customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                }))}
                isRequired
                status={fieldStatuses.customerId}
                statusVariant="tooltip"
              />
            </GridSpan>
            <GridSpan columns={7}>
              <Selector
                label="Nguồn"
                placeholder="Chọn nguồn"
                value={values.sourceId}
                onChange={(value) => setField('sourceId', value ?? '')}
                options={[
                  { value: '', label: '— Không có —' },
                  ...sources.map((source) => ({
                    value: source.id,
                    label: source.name,
                  })),
                ]}
                isOptional
              />
            </GridSpan>
            <GridSpan columns={3}>
              <DateInput
                label="Hạn thanh toán"
                value={/** @type {ISODateString} */ (values.paymentDueDate)}
                onChange={(value) => setField('paymentDueDate', value ?? '')}
                format={formatDateInputValue}
                isOptional
              />
            </GridSpan>
          </Grid>
        </MetaFormSection>
        <MetaFormSection isBoxed index={3} title="Giá trị hợp đồng">
          <Grid columns={{ minWidth: 220, max: 2 }} gap={3}>
            <FormattedNumberTextInput
              label="Giá trị hợp đồng (trước thuế)"
              value={values.valueBeforeTax}
              onChange={(value) => setField('valueBeforeTax', value)}
              units="VND"
              isRequired
              status={fieldStatuses.valueBeforeTax}
            />
            <FormattedNumberTextInput
              label="Thuế (%)"
              value={values.taxRatePercent}
              onChange={(value) => setField('taxRatePercent', value)}
              units="%"
              placeholder="8"
              isRequired
              status={fieldStatuses.taxRatePercent}
            />
          </Grid>
          <Text color="secondary">
            Giá trị hợp đồng (sau thuế):{' '}
            <Text weight="semibold">{formatVnd(afterTax)}</Text>
          </Text>
        </MetaFormSection>
        <MetaFormSection isBoxed index={4} title="Ghi chú">
          <TextArea
            label="Ghi chú"
            isLabelHidden
            value={values.note}
            onChange={(value) => setField('note', value)}
            isOptional
            maxLength={2000}
            status={fieldStatuses.note}
            statusVariant="tooltip"
          />
        </MetaFormSection>
      </VStack>
    </FormDialog>
  );
}
