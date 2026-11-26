import { logger } from '../config';

export interface CalendarEventPayload {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  organizerEmail: string;
  attendeeEmail: string;
}

export class EmailService {
  /**
   * Generates a standard RFC 5545 iCalendar (.ics) string for leave bookings
   */
  public static generateIcsCalendar(event: CalendarEventPayload): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const uid = `leave-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@peoplecore.local`;
    const now = formatDate(new Date());

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PeopleCore HRMS//Leave Calendar Engine//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `ORGANIZER;CN=PeopleCore HRMS:mailto:${event.organizerEmail}`,
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:${event.attendeeEmail}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  /**
   * Sends transactional email notification (simulated with structured logging for sandbox)
   */
  public static async sendLeaveApprovalNotification(recipientEmail: string, leaveDetails: {
    employeeName: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    approverName: string;
  }): Promise<{ sent: boolean; messageId: string; icsCalendar: string }> {
    const icsContent = this.generateIcsCalendar({
      title: `Approved Leave: ${leaveDetails.leaveType} - ${leaveDetails.employeeName}`,
      description: `Leave request approved by ${leaveDetails.approverName}`,
      startDate: leaveDetails.startDate,
      endDate: leaveDetails.endDate,
      organizerEmail: 'hr@peoplecore.local',
      attendeeEmail: recipientEmail,
    });

    logger.info(`[EmailService] Transactional Email Dispatched to: ${recipientEmail}`, {
      subject: `Your leave request for ${leaveDetails.leaveType} has been approved`,
      hasCalendarAttachment: true,
    });

    return {
      sent: true,
      messageId: `msg-${Date.now()}`,
      icsCalendar: icsContent,
    };
  }
}
