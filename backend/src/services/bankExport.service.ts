import crypto from 'crypto';
import { config, logger } from '../config';

export interface BankDirectDepositRecord {
  employeeNumber: string;
  employeeName: string;
  routingNumber: string;
  accountNumber: string;
  netPayAmount: number; // in Dollars
}

/**
 * Assessment 08: Mock Payroll & Banking Export (NACHA / Direct Deposit File)
 * Implements NACHA 94-character fixed-width standard with cryptographic validation checksums.
 * Do NOT send real banking instructions.
 */
export class BankExportService {
  /**
   * Generates a 94-character standard NACHA-formatted ACH file with batch control
   */
  public static generateNachaAchFile(
    periodCode: string,
    records: BankDirectDepositRecord[]
  ): { fileContent: string; recordCount: number; totalAmount: number; checksumSha256: string } {
    const today = new Date();
    const fileCreationDate = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const fileCreationTime = today.toTimeString().slice(0, 5).replace(/:/g, ''); // HHMM

    let totalAmountCents = 0;
    let entryHash = 0;

    // 1. File Header Record (Record Type 1) - 94 chars
    const fileHeader = [
      '1',                                              // Record Type
      '01',                                             // Priority Code
      ` ${config.bankExport.routingNumber.padEnd(9)}`,  // Immediate Destination (Routing with leading space)
      ` ${config.bankExport.companyId.padEnd(9)}`,      // Immediate Origin
      fileCreationDate,                                 // File Creation Date (YYMMDD)
      fileCreationTime,                                 // File Creation Time (HHMM)
      'A',                                              // File ID Modifier
      '094',                                            // Record Size
      '10',                                             // Blocking Factor
      '1',                                              // Format Code
      config.bankExport.legalName.padEnd(23).slice(0, 23), // Immediate Destination Name
      'PEOPLECORE HRMS'.padEnd(23),                     // Immediate Origin Name
      '00000001'                                        // Reference Code
    ].join('').slice(0, 94).padEnd(94, ' ');

    // 2. Company / Batch Header Record (Record Type 5) - 94 chars
    const batchHeader = [
      '5',                                              // Record Type
      '220',                                            // Service Class Code (220 = Credits Only)
      'PEOPLECORE'.padEnd(16),                          // Company Name
      'DISBURSEMENT'.padEnd(20),                        // Company Discretionary Data
      config.bankExport.companyId.slice(0, 10).padEnd(10), // Company Identification
      'PPD',                                            // Standard Entry Class (PPD for consumer payroll)
      'PAYROLL   ',                                     // Company Entry Description
      fileCreationDate,                                 // Company Descriptive Date
      fileCreationDate,                                 // Effective Entry Date
      '   ',                                            // Settlement Date (Julian, left blank by ODFI)
      '1',                                              // Originator Status Code
      config.bankExport.routingNumber.slice(0, 8),      // Originating DFI ID
      '0000001'                                         // Batch Number
    ].join('').slice(0, 94).padEnd(94, ' ');

    const detailLines: string[] = [];

    // 3. Entry Detail Records (Record Type 6) - 94 chars each
    records.forEach((rec, idx) => {
      const amountCents = Math.round(rec.netPayAmount * 100);
      totalAmountCents += amountCents;

      // Extract first 8 digits of destination routing number for entry hash calculation
      const routing8 = rec.routingNumber.replace(/\D/g, '').slice(0, 8);
      entryHash += parseInt(routing8 || '0', 10);

      const traceNumber = `${config.bankExport.routingNumber.slice(0, 8)}${String(idx + 1).padStart(7, '0')}`;

      const detail = [
        '6',                                            // Record Type
        '22',                                           // Transaction Code (22 = Checking Credit)
        rec.routingNumber.slice(0, 8).padStart(8, '0'), // Receiving DFI Identification
        rec.routingNumber.slice(8, 9) || '1',           // Check Digit
        rec.accountNumber.slice(0, 17).padEnd(17, ' '), // DFI Account Number
        String(amountCents).padStart(10, '0'),          // Amount in cents
        rec.employeeNumber.slice(0, 15).padEnd(15, ' '),// Individual Identification Number
        rec.employeeName.slice(0, 22).padEnd(22, ' '),  // Individual Name
        '  ',                                           // Discretionary Data
        '0',                                            // Addenda Record Indicator
        traceNumber.slice(0, 15)                        // Trace Number
      ].join('').slice(0, 94).padEnd(94, ' ');

      detailLines.push(detail);
    });

    // 4. Batch Control Record (Record Type 8) - 94 chars
    const entryHashString = String(entryHash).slice(-10).padStart(10, '0');
    const batchControl = [
      '8',                                              // Record Type
      '220',                                            // Service Class Code
      String(records.length).padStart(6, '0'),          // Entry/Addenda Count
      entryHashString,                                  // Entry Hash
      '000000000000',                                   // Total Debit Entry Dollar Amount
      String(totalAmountCents).padStart(12, '0'),       // Total Credit Entry Dollar Amount
      config.bankExport.companyId.slice(0, 10).padEnd(10), // Company ID
      '                         ',                      // Message Authentication Code
      '      ',                                         // Reserved
      config.bankExport.routingNumber.slice(0, 8),      // Originating DFI ID
      '0000001'                                         // Batch Number
    ].join('').slice(0, 94).padEnd(94, ' ');

    // 5. File Control Record (Record Type 9) - 94 chars
    const totalLines = 1 + 1 + detailLines.length + 1 + 1; // Header + BatchHeader + Details + BatchControl + FileControl
    const blockCount = Math.ceil(totalLines / 10);
    const fileControl = [
      '9',                                              // Record Type
      '000001',                                         // Batch Count
      String(blockCount).padStart(6, '0'),              // Block Count
      String(records.length).padStart(8, '0'),          // Total Entry/Addenda Count
      entryHashString,                                  // Entry Hash
      '000000000000',                                   // Total Debit Dollar Amount
      String(totalAmountCents).padStart(12, '0'),       // Total Credit Dollar Amount
      '                                       '         // Reserved (39 blanks)
    ].join('').slice(0, 94).padEnd(94, ' ');

    const fileContent = [
      fileHeader,
      batchHeader,
      ...detailLines,
      batchControl,
      fileControl
    ].join('\r\n');

    // Generate SHA-256 integrity checksum
    const checksumSha256 = crypto.createHash('sha256').update(fileContent).digest('hex');

    logger.info(`[BankExport] Generated NACHA ACH direct deposit file for period ${periodCode}`, {
      recordCount: records.length,
      totalAmount: totalAmountCents / 100,
      checksum: checksumSha256,
    });

    return {
      fileContent,
      recordCount: records.length,
      totalAmount: totalAmountCents / 100,
      checksumSha256,
    };
  }
}
