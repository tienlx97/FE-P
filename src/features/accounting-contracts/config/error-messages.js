/**
 * The backend's 404 / 409 `detail` texts are English; these are the ones a
 * Kế toán user can trigger, shown in Vietnamese instead.
 * @type {Record<string, string>}
 */
const VIETNAMESE = {
  'A source with this name already exists': 'Tên nguồn đã tồn tại',
  'Source is used by at least one contract':
    'Nguồn đang được dùng trong hợp đồng, không thể xoá',
  'Source not found': 'Không tìm thấy nguồn',
  'A customer with this tax code already exists':
    'Mã số thuế đã thuộc về khách hàng khác',
  'Customer is used by at least one contract':
    'Khách hàng đang có hợp đồng, không thể xoá',
  'Customer not found': 'Không tìm thấy khách hàng',
  'Company not found': 'Không tìm thấy công ty',
  'Contract not found': 'Không tìm thấy hợp đồng',
  'A contract with this number already exists': 'Số hợp đồng đã tồn tại',
  'A contract with this project code already exists':
    'Mã công trình đã tồn tại',
  'This project code is already a Logistics contract number':
    'Mã công trình trùng với số hợp đồng bên Logistics',
  'This contract already has an invoice with this number':
    'Số hoá đơn đã có trong hợp đồng này',
  'Appendix not found': 'Không tìm thấy phụ lục',
  'Invoice not found': 'Không tìm thấy hoá đơn',
  'Instalment not found': 'Không tìm thấy đợt thanh toán',
  'Sub-instalment not found': 'Không tìm thấy đợt thanh toán con',
  'An instalment needs at least one sub-instalment; delete the instalment instead':
    'Đợt cần ít nhất một đợt con — hãy xoá cả đợt',
};

/** @param {string} message */
export function vietnameseMessage(message) {
  return VIETNAMESE[message] ?? message;
}
