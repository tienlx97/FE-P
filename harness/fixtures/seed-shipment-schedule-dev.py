"""Draft test data for schedule / free time / container dates / alerts on
the LOCAL dev API (http://localhost:8081). Dates are relative to today
(Vietnam) so the alerts stay meaningful.

Env: KTX_ID, KTX_PW (the user's dev login, given in chat).
"""
import datetime as dt
import json
import os
import urllib.error
import urllib.request

API = 'http://localhost:8081/api/v1'
TODAY = (dt.datetime.utcnow() + dt.timedelta(hours=7)).date()


def d(days):
    return (TODAY + dt.timedelta(days=days)).isoformat()


def t(days, hhmm):
    return f'{d(days)}T{hhmm}:00'


def call(method, path, body=None, token=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data) as res:
            text = res.read().decode()
            return json.loads(text) if text else None
    except urllib.error.HTTPError as err:
        raise SystemExit(f'{method} {path} -> {err.code}: {err.read().decode()[:600]}')


login = call('POST', '/authentication/login', {
    'NationalId': os.environ['KTX_ID'], 'Password': os.environ['KTX_PW']})
TOKEN = login.get('accessToken') or login.get('token')
assert TOKEN, list(login)


def shipment(cid, sid):
    return call('GET', f'/contracts/{cid}/shipments/{sid}', token=TOKEN)


def update_status(cid, s, status):
    """Full update from the current response — keeps costs, providers and
    operational details as they are."""
    body = {
        'SupplierCustomerId': s['supplierCustomerId'], 'BookingNumber': s['bookingNumber'],
        'BillOfLadingNumber': s['billOfLadingNumber'], 'ShippingLine': s['shippingLine'],
        'VesselName': s['vesselName'], 'Name': s['name'], 'PaymentCondition': s['paymentCondition'],
        'InvoiceValue': s['invoiceValue'], 'InvoiceCurrency': s['invoiceCurrency'],
        'DeclarationValue': s['declarationValue'], 'DeclarationCurrency': s['declarationCurrency'],
        'DeclarationExchangeRate': s['declarationExchangeRate'], 'QuantityAmount': s['quantityAmount'],
        'DeclarationWeightKg': s['declarationWeightKg'], 'CoNumber': s['coNumber'],
        'CoDeclarationDate': s['coDeclarationDate'], 'CoIssuedDate': s['coIssuedDate'],
        'CustomsDeclarationNumber': s['customsDeclarationNumber'],
        'CustomsDeclarationDate': s['customsDeclarationDate'], 'CustomsInspected': s['customsInspected'],
        'Etd': s['etd'], 'Eta': s['eta'], 'PlaceOfLoading': s['placeOfLoading'],
        'PlaceOfDischarge': s['placeOfDischarge'], 'PlaceOfDelivery': s.get('placeOfDelivery'),
        'Costs': [{
            'CostCategoryId': c['costCategoryId'], 'Name': c['name'], 'Amount': c['amount'],
            'Note': c['note'], 'ProviderCustomerId': c['providerCustomerId'],
            'InvoiceNumber': c['invoiceNumber'], 'CostNature': c['costNature'],
            'InvoiceDate': c['invoiceDate']} for c in s['costs']],
        'Status': status, 'Version': s['version'],
        'ServiceProviders': [{'Role': p['role'], 'SupplierId': p['supplierId']}
                             for p in s.get('serviceProviders') or []],
        # null = keep the operational details as they are
        'OperationalDetails': None,
    }
    return call('PUT', f"/contracts/{cid}/shipments/{s['id']}", body, TOKEN)


def schedule(cid, sid, **values):
    current = call('GET', f'/contracts/{cid}/shipments/{sid}/schedule', token=TOKEN)
    cur = current['current']
    body = {
        'Version': current['version'],
        'Etd': cur['etd'], 'Eta': cur['eta'], 'SiCutoff': cur['siCutoff'],
        'CyCutoff': cur['cyCutoff'], 'VesselName': cur['vesselName'],
        'VoyageNumber': cur['voyageNumber'], 'Reason': 'Other', 'NoticeOn': d(0),
        'ActualDeparture': current['actualDeparture'], 'ActualArrival': current['actualArrival'],
        'OriginFreeTime': current['originFreeTime'], 'DestinationFreeTime': current['destinationFreeTime'],
    }
    body.update(values)
    return call('PUT', f'/contracts/{cid}/shipments/{sid}/schedule', body, TOKEN)


def container_dates(cid, sid, rows):
    return call('PUT', f'/contracts/{cid}/shipments/{sid}/vgm/container-dates', {'Containers': rows}, TOKEN)


def vgms(cid, sid):
    return call('GET', f'/contracts/{cid}/shipments/{sid}/vgm', token=TOKEN)


# ── A. 26KCT03/LOT-01 — CIF, 5 cont, completed: two delays, both free
#    times, 3/5 empties back, the rest overdue.
A_C, A_S = 'b3d33ae5-8878-4dff-9a55-3e14fd45a61a', 'cb06809d-4471-4f83-b1d3-53b66ff673ba'
schedule(A_C, A_S, Etd=d(-34), Eta=d(-18), SiCutoff=t(-37, '17:00'), CyCutoff=t(-36, '12:00'),
         VoyageNumber='2601S', Reason='Edited', NoticeOn=d(-45), Note='Booking ban đầu')
schedule(A_C, A_S, Etd=d(-32), Eta=d(-16), SiCutoff=t(-35, '17:00'), CyCutoff=t(-34, '12:00'),
         Reason='CarrierDelay', NoticeOn=d(-40), Note='Hãng tàu báo trễ 2 ngày')
schedule(A_C, A_S, Etd=d(-31), Eta=d(-15), Reason='VesselChange', NoticeOn=d(-36),
         Note='Đổi sang chuyến 2601S-B',
         ActualDeparture=d(-31), ActualArrival=d(-14),
         OriginFreeTime={'Mode': 'Separate', 'DemDays': 5, 'DetDays': 7},
         DestinationFreeTime={'Mode': 'Combined', 'CombinedDays': 10})
rows = []
for i, v in enumerate(vgms(A_C, A_S)):
    rows.append({
        'VgmId': v['id'],
        'EmptyPickedUpOn': d(-44 + (i % 2)),
        'GatedInOn': d(-37 + (1 if i == 4 else 0)),   # one late gate-in: DET 7 exceeded? no, 7 days
        'DestinationGatedOutOn': None,
        'EmptyReturnedOn': d(-8 + i) if i < 3 else None,
        'EmptyReturnDepot': 'Depot Laem Chabang' if i < 3 else None,
    })
container_dates(A_C, A_S, rows)
print('A done')

# ── B. 26KCT02/LOT-01 — CIF, 2 cont, back to "Đang đóng hàng": ETD
#    delayed 3 days, CY cut-off in 2 days, 1 of 2 gated in, origin
#    combined 7 days ending today.
B_C, B_S = '5a02ad47-2fa5-45d7-b0cc-ffd849abf9c5', '57eb8066-fd38-4c56-b8a1-2dfdd2f9f73c'
update_status(B_C, shipment(B_C, B_S), 'Packing')
schedule(B_C, B_S, Etd=d(4), Eta=d(20), SiCutoff=t(1, '17:00'), CyCutoff=t(2, '12:00'),
         VoyageNumber='2610N', Reason='Edited', NoticeOn=d(-10), Note='Booking ban đầu',
         OriginFreeTime={'Mode': 'Combined', 'CombinedDays': 7},
         DestinationFreeTime={'Mode': 'Separate', 'DemDays': 5, 'DetDays': 5})
schedule(B_C, B_S, Etd=d(7), Eta=d(23), SiCutoff=t(4, '17:00'), CyCutoff=t(2, '12:00'),
         Reason='PortCongestion', NoticeOn=d(-1), Note='Cảng Cát Lái ùn tắc, tàu dời 3 ngày')
b = vgms(B_C, B_S)
container_dates(B_C, B_S, [
    {'VgmId': b[0]['id'], 'EmptyPickedUpOn': d(-6), 'GatedInOn': d(-1)},
    {'VgmId': b[1]['id'], 'EmptyPickedUpOn': d(-6), 'GatedInOn': None},
])
print('B done')

# ── C. 26KCT06/LOT-01 — DDP, no container yet, booked: SI cut-off passed
#    yesterday, CY cut-off tomorrow.
C_C, C_S = '99c7eeb4-a667-4a1f-86d6-45d4847380a8', '90166604-9e83-440e-9a62-b30ec74ba768'
update_status(C_C, shipment(C_C, C_S), 'Booked')
schedule(C_C, C_S, Etd=d(5), Eta=d(25), SiCutoff=t(-1, '17:00'), CyCutoff=t(1, '12:00'),
         Reason='Edited', NoticeOn=d(-7), Note='Booking',
         OriginFreeTime={'Mode': 'Separate', 'DemDays': 4, 'DetDays': 6},
         DestinationFreeTime={'Mode': 'Separate', 'DemDays': 5, 'DetDays': 7})
print('C done')

alerts = call('GET', '/shipments/alerts', token=TOKEN)
for row in alerts:
    print(row['shipmentCode'], [(a['kind'], a['days'], a.get('containerNumber')) for a in row['alerts']])
