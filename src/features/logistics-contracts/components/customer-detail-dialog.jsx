'use client';

import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Building2 } from 'lucide-react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';

import { useCustomersQuery } from '../hooks/use-customers-query.js';
import { CustomerContractHistory } from './customer-contract-history.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * "Chi tiết khách hàng" — opened by customer id from anywhere a customer
 * name appears as a link (Contract's Buyer field today). Shows the
 * customer's profile plus the shared `CustomerContractHistory` table
 * (`customers-list.jsx`'s own inline row-expansion panel renders the same
 * component, so both surfaces show identical data).
 *
 * Looks the customer up from `useCustomersQuery`'s already-cached full
 * directory rather than a dedicated fetch — the backend has no
 * `GET /api/v1/customers/{id}` endpoint (BE-kt-xnk), only list/search.
 * @param {{ customerId: string, onOpenChange: (isOpen: boolean) => void }} props
 */
export function CustomerDetailDialog({ customerId, onOpenChange }) {
  const customersQuery = useCustomersQuery();

  const customer = customersQuery.data?.success
    ? customersQuery.data.customers.find((row) => row.id === customerId)
    : undefined;

  return (
    <CommonDialog isOpen onOpenChange={onOpenChange} width={1080}>
      <Layout
        header={
          <DialogHeader
            title={customer ? customer.companyName : 'Chi tiết khách hàng'}
            onOpenChange={onOpenChange}
          />
        }
        content={
          <LayoutContent padding={4}>
            {!customer ? (
              <HStack hAlign="center" paddingBlock={6}>
                <Spinner label="Đang tải thông tin khách hàng" />
              </HStack>
            ) : (
              <VStack gap={4} hAlign="stretch">
                <HStack gap={3} vAlign="center">
                  <Icon icon={Building2} size="md" />
                  <VStack gap={1}>
                    <Heading level={3}>{customer.companyName}</Heading>
                    {customer.representativeName ? (
                      <Text color="secondary">
                        {customer.representativeName}
                        {customer.representativeTitle
                          ? ` · ${customer.representativeTitle}`
                          : ''}
                      </Text>
                    ) : null}
                  </VStack>
                </HStack>

                <MetadataList columns={2} label={{ position: 'top' }}>
                  <MetadataListItem label="Địa chỉ">
                    {orDash(customer.address)}
                  </MetadataListItem>
                  <MetadataListItem label="Mã khách hàng">
                    {orDash(customer.profile?.code)}
                  </MetadataListItem>
                </MetadataList>

                <Divider />

                <CustomerContractHistory
                  customerId={customerId}
                  customerName={customer.companyName}
                />
              </VStack>
            )}
          </LayoutContent>
        }
        footer={
          <LayoutFooter>
            <HStack hAlign="end" gap={2}>
              <Button
                width={144}
                label="Đóng"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              />
            </HStack>
          </LayoutFooter>
        }
      />
    </CommonDialog>
  );
}
