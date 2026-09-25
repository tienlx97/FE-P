import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkContractNumberExists,
  createContract,
  searchContracts,
} from './contracts.js';

/** @type {import('../types/index.js').ContractFormValues} */
const BASE_VALUES = {
  contractNumber: 'HD-001',
  createdDate: '2026-01-01',
  quotationDate: '2025-12-15',
  projectName: 'Dự án A',
  category: 'Máy móc',
  countryId: 'country-1',
  placeOfLoading: 'Cảng Hải Phòng',
  placeOfDischarge: 'Cảng Rotterdam',
  placeOfDelivery: '',
  contractValue: 100000,
  currency: 'USD',
  incoterm: 'CIF',
  incotermYear: 2020,
  companyId: 'company-1',
  sourceSellerId: '',
  sellerInline: {
    companyName: 'Seller Corp',
    representativeName: '',
    representativeTitle: '',
    address: '',
  },
  sourceCustomerId: '',
  buyerInline: {
    companyName: 'ACME Corp',
    representativeName: '',
    representativeTitle: '',
    address: '',
  },
  note: '',
  bankIds: ['bank-1'],
  sellerSigned: false,
  buyerSigned: false,
  status: 'InProgress',
};

test('sends an inline Buyer when no source customer is selected', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({ id: 'contract-1' });
  };

  try {
    await createContract(BASE_VALUES, {
      paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }],
    });

    const body = JSON.parse(String(captured.init?.body));
    assert.equal(body.Buyer.SourceCustomerId, null);
    assert.equal(body.Buyer.CompanyName, 'ACME Corp');
    assert.equal(body.CompanyId, 'company-1');
    assert.equal(body.Currency, 'USD');
    assert.equal(body.CountryId, 'country-1');
    assert.equal(body.PlaceOfLoading, 'Cảng Hải Phòng');
    assert.equal(body.PlaceOfDischarge, 'Cảng Rotterdam');
    assert.deepEqual(body.PaymentTerms, [
      { PaymentRatioPercent: 100, PaymentCondition: 'T/T' },
    ]);
    assert.deepEqual(body.BankIds, ['bank-1']);
    assert.equal(body.NotifyParty, null);
    assert.equal(body.Consignee, null);
    assert.equal(body.Note, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sends a SourceCustomerId reference when an existing customer is selected, omitting CompanyName', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({ id: 'contract-1' });
  };

  try {
    await createContract(
      { ...BASE_VALUES, sourceCustomerId: 'customer-1' },
      { paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }] },
    );

    const body = JSON.parse(String(captured.init?.body));
    assert.equal(body.Buyer.SourceCustomerId, 'customer-1');
    assert.equal(body.Buyer.CompanyName, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('still sends RepresentativeName/RepresentativeTitle/Address even when a source customer is selected', async () => {
  // A customer can be Buyer on two contracts with a different
  // representative on each — only CompanyName is pinned to the catalog
  // (see `docs/api/Contracts.md`, BE-kt-xnk), so these must not be dropped
  // just because SourceCustomerId is set.
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({ id: 'contract-1' });
  };

  try {
    await createContract(
      {
        ...BASE_VALUES,
        sourceCustomerId: 'customer-1',
        buyerInline: {
          companyName: '',
          representativeName: 'Rep For This Contract',
          representativeTitle: 'CEO',
          address: 'Address for this contract',
        },
      },
      { paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }] },
    );

    const body = JSON.parse(String(captured.init?.body));
    assert.equal(body.Buyer.SourceCustomerId, 'customer-1');
    assert.equal(body.Buyer.RepresentativeName, 'Rep For This Contract');
    assert.equal(body.Buyer.RepresentativeTitle, 'CEO');
    assert.equal(body.Buyer.Address, 'Address for this contract');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sends CompanyId', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({ id: 'contract-1' });
  };

  try {
    await createContract(
      { ...BASE_VALUES, companyId: 'company-2' },
      { paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }] },
    );

    const body = JSON.parse(String(captured.init?.body));
    assert.equal(body.CompanyId, 'company-2');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sends Note when set, and null when blank', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({ id: 'contract-1' });
  };

  try {
    await createContract(
      { ...BASE_VALUES, note: 'Giao hàng trước 15h' },
      { paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }] },
    );
    const body = JSON.parse(String(captured.init?.body));
    assert.equal(body.Note, 'Giao hàng trước 15h');

    await createContract(BASE_VALUES, {
      paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }],
    });
    const secondBody = JSON.parse(String(captured.init?.body));
    assert.equal(secondBody.Note, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sends PlaceOfDelivery as null when blank (non-DDP), a string for DDP', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({ id: 'contract-1' });
  };

  try {
    await createContract(
      { ...BASE_VALUES, incoterm: 'FOB' },
      { paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }] },
    );
    const body = JSON.parse(String(captured.init?.body));
    assert.equal(body.PlaceOfDischarge, 'Cảng Rotterdam');
    assert.equal(body.PlaceOfDelivery, null);

    await createContract(
      { ...BASE_VALUES, incoterm: 'DDP', placeOfDelivery: 'Công trình ABC' },
      { paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }] },
    );
    const secondBody = JSON.parse(String(captured.init?.body));
    assert.equal(secondBody.PlaceOfDelivery, 'Công trình ABC');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sends SellerSigned and BuyerSigned', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({ id: 'contract-1' });
  };

  try {
    await createContract(
      { ...BASE_VALUES, sellerSigned: true, buyerSigned: false },
      { paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }] },
    );
    const body = JSON.parse(String(captured.init?.body));
    assert.equal(body.SellerSigned, true);
    assert.equal(body.BuyerSigned, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sends ProjectCompletionDate, or null when empty', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({ id: 'contract-1' });
  };

  try {
    await createContract(
      { ...BASE_VALUES, projectCompletionDate: '2026-06-30' },
      { paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }] },
    );
    const body = JSON.parse(String(captured.init?.body));
    assert.equal(body.ProjectCompletionDate, '2026-06-30');

    await createContract(
      { ...BASE_VALUES, projectCompletionDate: '' },
      { paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }] },
    );
    const emptyBody = JSON.parse(String(captured.init?.body));
    assert.equal(emptyBody.ProjectCompletionDate, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('searchContracts sends Sort, or null when omitted', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({ page: { items: [] } });
  };

  try {
    await searchContracts({
      sort: { field: 'contractValue', direction: 'Descending' },
    });
    const body = JSON.parse(String(captured.init?.body));
    assert.deepEqual(body.Sort, {
      Field: 'contractValue',
      Direction: 'Descending',
    });

    await searchContracts({});
    const noSortBody = JSON.parse(String(captured.init?.body));
    assert.equal(noSortBody.Sort, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('checkContractNumberExists sends contractNumber and excludeContractId as query params', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ url?: string }} */
  const captured = {};
  globalThis.fetch = async (input) => {
    captured.url = String(input);
    return Response.json({ exists: true });
  };

  try {
    const result = await checkContractNumberExists({
      contractNumber: 'HD-001',
      excludeContractId: 'contract-1',
    });

    assert.equal(result.success, true);
    assert.equal(result.success && result.exists, true);
    assert.match(String(captured.url), /contractNumber=HD-001/);
    assert.match(String(captured.url), /excludeContractId=contract-1/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('checkContractNumberExists omits excludeContractId when not given', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ url?: string }} */
  const captured = {};
  globalThis.fetch = async (input) => {
    captured.url = String(input);
    return Response.json({ exists: false });
  };

  try {
    const result = await checkContractNumberExists({
      contractNumber: 'HD-002',
    });

    assert.equal(result.success && result.exists, false);
    assert.doesNotMatch(String(captured.url), /excludeContractId/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
