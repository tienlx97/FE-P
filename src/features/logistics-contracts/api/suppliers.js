import { apiRequest } from '@/shared/api/api-client.js';

const LIST_ERROR = 'Không thể tải danh sách nhà cung cấp';

export async function listSuppliers() {
  const result = await apiRequest('/api/v1/suppliers', { errorMessage: LIST_ERROR });
  return result.success
    ? { success: true, suppliers: result.data ?? [] }
    : { success: false, message: result.message };
}

/** @param {{page?: number, pageSize?: number, conditions?: any[]}} [options] */
export async function searchSuppliers({ page = 1, pageSize = 25, conditions = [] } = {}) {
  const result = await apiRequest('/api/v1/suppliers/search', {
    method: 'POST',
    errorMessage: LIST_ERROR,
    body: {
      Page: page,
      PageSize: pageSize,
      Conditions: conditions.map((condition) => ({
        Field: condition.field,
        Operator: condition.operator,
        Value: condition.value || null,
        ValueTo: condition.valueTo || null,
        Connector: condition.connector,
      })),
    },
  });
  return result.success
    ? {
        success: true,
        suppliers: result.data?.items ?? [],
        page: result.data?.page ?? page,
        pageSize: result.data?.pageSize ?? pageSize,
        totalCount: result.data?.totalCount ?? 0,
        totalPages: result.data?.totalPages ?? 0,
      }
    : { success: false, message: result.message };
}

/** @param {any} values @param {any[]} extraFieldRows @param {any[]} bankAccounts @param {any[]} deliveryAddresses */
export async function createSupplier(values, extraFieldRows, bankAccounts, deliveryAddresses) {
  const result = await apiRequest('/api/v1/suppliers', {
    method: 'POST',
    errorMessage: 'Không thể thêm nhà cung cấp',
    body: buildPartyBody(values, extraFieldRows, bankAccounts, deliveryAddresses),
  });
  return result.success
    ? { success: true, supplier: result.data }
    : { success: false, message: result.message };
}

/** @param {string} supplierId @param {any} values @param {any[]} extraFieldRows @param {any[]} bankAccounts @param {any[]} deliveryAddresses */
export async function updateSupplier(supplierId, values, extraFieldRows, bankAccounts, deliveryAddresses) {
  const result = await apiRequest(`/api/v1/suppliers/${supplierId}`, {
    method: 'PUT',
    errorMessage: 'Không thể sửa nhà cung cấp',
    body: buildPartyBody(values, extraFieldRows, bankAccounts, deliveryAddresses),
  });
  return result.success
    ? { success: true, supplier: result.data }
    : { success: false, message: result.message };
}

/** @param {any} values @param {any[]} [extraFieldRows] @param {any[]} [bankAccounts] @param {any[]} [deliveryAddresses] */
export function buildPartyBody(values, extraFieldRows = [], bankAccounts = [], deliveryAddresses = []) {
  return {
    CompanyName: values.companyName,
    RepresentativeName: values.representativeName || null,
    RepresentativeTitle: values.representativeTitle || null,
    Address: values.address || null,
    Profile: {
      Code: values.code,
      IsOrganization: values.isOrganization,
      TaxCode: values.taxCode || null,
      BudgetUnitCode: values.budgetUnitCode || null,
      Phone: values.phone || null,
      Website: values.website || null,
      GroupId: values.groupId || null,
      EmployeeId: values.employeeId || null,
      IsInternal: values.isInternal,
      ContactSalutation: values.contactSalutation || null,
      ContactName: values.contactName || null,
      ContactEmail: values.contactEmail || null,
      ContactPhone: values.contactPhone || null,
      InvoiceRecipientName: values.invoiceRecipientName || null,
      InvoiceRecipientEmails: values.invoiceRecipientEmails || null,
      InvoiceRecipientPhone: values.invoiceRecipientPhone || null,
      PaymentTermId: values.paymentTermId || null,
      DueDays: values.dueDays ?? null,
      CreditLimit: values.creditLimit ?? null,
      DebtAccount: values.debtAccount || null,
      Country: values.country || null,
      Province: values.province || null,
      District: values.district || null,
      Ward: values.ward || null,
      DeliveryAddressSameAsMain: values.deliveryAddressSameAsMain,
      Notes: values.notes || null,
    },
    BankAccounts: bankAccounts
      .filter((row) => row.accountNumber.trim() || row.bankName.trim())
      .map(({ accountNumber, bankName, branch, province }) => ({ AccountNumber: accountNumber, BankName: bankName, Branch: branch, Province: province })),
    DeliveryAddresses: values.deliveryAddressSameAsMain
      ? []
      : deliveryAddresses.filter((row) => row.address.trim()).map(({ address }) => ({ Address: address })),
    ExtraFields: extraFieldRows.filter((row) => row.key.trim()).map((row) => ({ Key: row.key, Value: row.value })),
  };
}
