# Contract review wiring

## Requirements

- Saving a contract sends back its Consignee / Notify Party (edited or
  unchanged) and each payment term's PaymentType; nothing the form does not
  show is lost.
- Consignee kinds: Named, TO ORDER, TO ORDER OF SHIPPER, TO ORDER OF <bank>;
  Notify: Named, SAME AS CONSIGNEE. Name input only where the kind needs one.
- The contract-number check is scoped to the selected company.

## Scenarios

- Open a contract whose consignee is "ABC Ltd", change only the project
  name, save: the consignee is still "ABC Ltd".
- Set a term to L/C, save, reopen: it is still L/C.
- Consignee "TO ORDER OF Vietcombank" shows that wording on the overview.
