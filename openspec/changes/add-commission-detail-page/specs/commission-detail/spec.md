# Commission detail

## Contract tab
Scenario: a contract with a commission shows, on its "Hoa hồng" tab, the three
KPI cards, the broker card and "Xem chi tiết hoa hồng", which opens
`/logistics/contract/{id}/commission`. Without one, the empty state offers
"Tạo Commission".

## Detail page
Scenario: the page shows the commission header and tabs Tổng quan / Tiến độ
thanh toán / Phụ lục; the selected tab survives a reload (`?tab=`). "Chỉnh
sửa" opens the commission drawer; "Thêm lần chi" opens the quick payment
dialog; "Thêm phụ lục" switches to the Phụ lục tab.

## Commission list
Scenario: "Xem" on a commission row opens its detail page.
