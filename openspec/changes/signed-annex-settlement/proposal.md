# Settlement counts only annexes signed by both parties

"Giá trị quyết toán" = contract value + net amount of the annexes both the
seller and the buyer signed. "Hoa hồng quyết toán" = commission value + net
amount of the commission annexes both the seller and the party signed.
Half-signed annexes still appear in the annex lists but do not change any
total. One helper (`config/annex-settlement.js`) replaces the eight inline
sums. The contract list reads the backend's `settlementValue`, which applies
the same rule (BE `signed-annex-settlement`).
