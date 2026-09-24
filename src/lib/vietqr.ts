import QRCode from 'qrcode';

export type BankInfo = {
  bank_bin: string;
  bank_account_number: string;
  bank_account_name: string;
  amount?: number;
  description?: string;
};

const vietnameseBanks: { bin: string; name: string; short: string }[] = [
  { bin: '970418', name: 'BIDV', short: 'BIDV' },
  { bin: '970407', name: 'Techcombank', short: 'TCB' },
  { bin: '970436', name: 'Vietcombank', short: 'VCB' },
  { bin: '970422', name: 'MB Bank', short: 'MB' },
  { bin: '970428', name: 'VPBank', short: 'VPB' },
  { bin: '970432', name: 'VietinBank', short: 'VTB' },
  { bin: '970448', name: 'OCB', short: 'OCB' },
  { bin: '970423', name: 'TPBank', short: 'TPB' },
  { bin: '970452', name: 'VIB', short: 'VIB' },
  { bin: '970415', name: 'Sacombank', short: 'STB' },
  { bin: '970427', name: 'Vietbank', short: 'VAB' },
  { bin: '970443', name: 'SHB', short: 'SHB' },
  { bin: '970405', name: 'Agribank', short: 'AGR' },
  { bin: '970411', name: 'Nam A Bank', short: 'NAB' },
  { bin: '970412', name: 'Bac A Bank', short: 'BAB' },
  { bin: '970426', name: 'BaoViet Bank', short: 'BVB' },
  { bin: '970431', name: 'PG Bank', short: 'PGB' },
  { bin: '970414', name: 'Saigon Bank', short: 'SCB' },
  { bin: '970429', name: 'Nam Viet Bank', short: 'NVB' },
  { bin: '970419', name: 'PVP Bank', short: 'PVB' },
  { bin: '970425', name: 'ABBank', short: 'ABB' },
  { bin: '970463', name: 'Viet Capital Bank', short: 'VCB2' },
  { bin: '970421', name: 'Viet A Bank', short: 'VAB2' },
  { bin: '970417', name: 'GP Bank', short: 'GPB' },
  { bin: '970433', name: 'SeA Bank', short: 'SEAB' },
  { bin: '970442', name: 'Co-op Bank', short: 'COOP' },
  { bin: '970406', name: 'Dong A Bank', short: 'DAB' },
  { bin: '970434', name: 'Nam A Bank', short: 'NAB2' },
  { bin: '970437', name: 'HD Bank', short: 'HDB' },
  { bin: '970416', name: 'ACB', short: 'ACB' },
  { bin: '970424', name: 'Ocean Bank', short: 'OCB2' },
  { bin: '970438', name: 'Eximbank', short: 'EIB' },
  { bin: '970454', name: 'KB Bank', short: 'KBB' },
  { bin: '970430', name: 'Lien Viet Post Bank', short: 'LPB' },
  { bin: '970403', name: 'An Binh Bank', short: 'ABB2' },
  { bin: '970409', name: 'BVB Bank', short: 'BVB2' },
];

export function getBankName(bin: string): string {
  const bank = vietnameseBanks.find((b) => b.bin === bin);
  return bank ? bank.name : '';
}

export { vietnameseBanks };

/*
 * Generate a VietQR-compatible string for Vietnamese bank transfers.
 * Uses the standard EMV-like format: 00020101021238...A000000727012...
 */
export function buildVietQRString(info: BankInfo): string {
  const { bank_bin, bank_account_number, amount, description } = info;
  if (!bank_bin || !bank_account_number) return '';

  // Merchant Account Information
  // GUID: A000000727
  // Sub-fields: 01 = BIN, 02 = Account Number
  const binPart = `01${bank_bin.length.toString().padStart(2, '0')}${bank_bin}`;
  const acctPart = `02${bank_account_number.length.toString().padStart(2, '0')}${bank_account_number}`;
  const merchantValue = binPart + acctPart;
  const merchant = `A000000727` + `${merchantValue.length.toString().padStart(3, '0')}` + merchantValue;

  // Add amount and description if provided
  let additional = '';

  if (amount && amount > 0) {
    // Field 54: Amount (VND, no decimal)
    const amountStr = Math.round(amount).toString();
    additional += `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  }

  // Field 62: Additional Data (description in sub-field 08)
  let descPart = '';
  if (description) {
    const desc = description.slice(0, 25);
    descPart = `08${desc.length.toString().padStart(2, '0')}${desc}`;
  }
  const additionalData = descPart ? `62${descPart.length.toString().padStart(2, '0')}${descPart}` : '';
  const crcPart = '6304';

  const fullString =
    `00020101021238` +
    merchant.length.toString().padStart(2, '0') + merchant +
    `0208QRIBFTTA` +
    additional +
    additionalData +
    crcPart;

  const crc = crc16(fullString);
  return fullString + crc;
}

/* CRC-16/CCITT-FALSE for VietQR */
function crc16(str: string): string {
  let crc = 0xffff;
  const bytes = new TextEncoder().encode(str);
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export async function generateQRDataURL(info: BankInfo): Promise<string | null> {
  const qrString = buildVietQRString(info);
  if (!qrString) return null;
  try {
    return await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch {
    return null;
  }
}
