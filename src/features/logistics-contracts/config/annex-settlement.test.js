import assert from 'node:assert/strict';
import test from 'node:test';

import {
  commissionAnnexAdjustment,
  contractAnnexAdjustment,
  sumCommissionAnnexAdjustments,
  sumContractAnnexAdjustments,
} from './annex-settlement.js';

/** @param {Partial<import('../types/index.js').ContractAnnex>} overrides */
const contractAnnex = (overrides) =>
  /** @type {import('../types/index.js').ContractAnnex} */ ({
    type: 'AmountIncrease',
    amount: 100,
    sellerSigned: true,
    buyerSigned: true,
    ...overrides,
  });

/** @param {Partial<import('../types/index.js').CommissionAnnex>} overrides */
const commissionAnnex = (overrides) =>
  /** @type {import('../types/index.js').CommissionAnnex} */ ({
    type: 'AmountIncrease',
    amount: 100,
    sellerSigned: true,
    partySigned: true,
    ...overrides,
  });

test('contract annexes count only once seller and buyer both signed', () => {
  assert.equal(contractAnnexAdjustment(contractAnnex({})), 100);
  assert.equal(
    contractAnnexAdjustment(contractAnnex({ type: 'AmountDecrease' })),
    -100,
  );
  assert.equal(
    contractAnnexAdjustment(contractAnnex({ type: 'ValueChange' })),
    0,
  );
  assert.equal(
    contractAnnexAdjustment(contractAnnex({ buyerSigned: false })),
    0,
  );
  assert.equal(
    contractAnnexAdjustment(contractAnnex({ sellerSigned: false })),
    0,
  );
  assert.equal(
    sumContractAnnexAdjustments([
      contractAnnex({ amount: 500 }),
      contractAnnex({ type: 'AmountDecrease', amount: 200 }),
      contractAnnex({ amount: 900, buyerSigned: false }),
    ]),
    300,
  );
});

test('commission annexes count only once seller and party both signed', () => {
  assert.equal(commissionAnnexAdjustment(commissionAnnex({})), 100);
  assert.equal(
    commissionAnnexAdjustment(commissionAnnex({ type: 'InfoChange' })),
    0,
  );
  assert.equal(
    commissionAnnexAdjustment(commissionAnnex({ partySigned: false })),
    0,
  );
  assert.equal(
    sumCommissionAnnexAdjustments([
      commissionAnnex({ amount: 50 }),
      commissionAnnex({ type: 'AmountDecrease', amount: 20 }),
      commissionAnnex({ amount: 70, sellerSigned: false }),
    ]),
    30,
  );
});
