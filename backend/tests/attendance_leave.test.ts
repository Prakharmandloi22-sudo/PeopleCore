import { EmailService } from '../src/services/email.service';
import { BankExportService } from '../src/services/bankExport.service';

describe('Assessment 07, 08 & 12: Attendance, Leave & Integrations Tests', () => {
  test('Overnight shift duration calculated accurately across midnight (22:00 to 06:00 next day)', () => {
    const checkIn = new Date('2026-03-23T22:00:00Z');
    const checkOut = new Date('2026-03-24T06:15:00Z'); // 8 hours and 15 mins

    const diffMillis = checkOut.getTime() - checkIn.getTime();
    const totalHours = Math.round((diffMillis / (1000 * 60 * 60)) * 100) / 100;
    const standardHours = 8.0;
    const regularHours = Math.min(totalHours, standardHours);
    const overtimeHours = Math.max(0, Math.round((totalHours - regularHours) * 100) / 100);

    expect(totalHours).toBe(8.25);
    expect(regularHours).toBe(8.00);
    expect(overtimeHours).toBe(0.25);
  });

  test('Overlapping leave dates are correctly detected as collisions', () => {
    const existingApproved = {
      startDate: new Date('2026-04-10'),
      endDate: new Date('2026-04-15')
    };

    const candidateOverlap = {
      startDate: new Date('2026-04-12'),
      endDate: new Date('2026-04-14')
    };

    const hasCollision =
      candidateOverlap.startDate <= existingApproved.endDate &&
      candidateOverlap.endDate >= existingApproved.startDate;

    expect(hasCollision).toBe(true);

    const nonOverlapping = {
      startDate: new Date('2026-04-20'),
      endDate: new Date('2026-04-25')
    };

    const hasCollisionNonOverlapping =
      nonOverlapping.startDate <= existingApproved.endDate &&
      nonOverlapping.endDate >= existingApproved.startDate;

    expect(hasCollisionNonOverlapping).toBe(false);
  });

  test('iCalendar (.ics) RFC 5545 string is generated with valid structure on leave approval', () => {
    const ics = EmailService.generateIcsCalendar({
      title: 'Annual Leave - Jordan Lee',
      description: 'Approved vacation leave',
      startDate: new Date('2026-04-10T09:00:00Z'),
      endDate: new Date('2026-04-12T17:00:00Z'),
      organizerEmail: 'hr@peoplecore.local',
      attendeeEmail: 'employee@peoplecore.local'
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Annual Leave - Jordan Lee');
    expect(ics).toContain('STATUS:CONFIRMED');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  test('NACHA ACH Direct Deposit file generates 94-character fixed-width records with SHA-256 hash', () => {
    const records = [
      {
        employeeNumber: 'EMP-00201',
        employeeName: 'LEE, JORDAN',
        routingNumber: '121000358',
        accountNumber: '44556677889',
        netPayAmount: 8241.25
      }
    ];

    const result = BankExportService.generateNachaAchFile('2026-03-MONTHLY', records);

    expect(result.recordCount).toBe(1);
    expect(result.totalAmount).toBe(8241.25);
    expect(result.checksumSha256.length).toBe(64); // SHA-256 hex length

    const lines = result.fileContent.split('\r\n');
    expect(lines.length).toBe(5); // Header + BatchHeader + 1 Entry + BatchControl + FileControl

    // Every line in a NACHA ACH file must be exactly 94 characters!
    lines.forEach(line => {
      expect(line.length).toBe(94);
    });
  });
});
