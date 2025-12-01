/**
 * CampusEmail Value Object
 * Represents a validated campus email with multi-campus support
 *
 * Supports:
 * - Multiple campus domains
 * - Email type detection (student/faculty/alumni)
 * - Campus identification from email
 */

import { Result } from '../../shared/base/Result';
import { ValueObject } from '../../shared/base/ValueObject.base';

/**
 * Email type based on domain patterns
 */
export enum EmailType {
  STUDENT = 'student',
  FACULTY = 'faculty',
  STAFF = 'staff',
  ALUMNI = 'alumni',
  UNKNOWN = 'unknown'
}

/**
 * Campus configuration for email validation
 */
export interface CampusEmailConfig {
  campusId: string;
  name: string;
  domains: {
    student: string[];
    faculty: string[];
    staff: string[];
    alumni: string[];
  };
}

/**
 * Supported campus configurations
 */
export const CAMPUS_EMAIL_CONFIGS: CampusEmailConfig[] = [
  {
    campusId: 'ub-buffalo',
    name: 'University at Buffalo',
    domains: {
      student: ['buffalo.edu'],
      faculty: ['buffalo.edu'],
      staff: ['buffalo.edu'],
      alumni: ['alumni.buffalo.edu']
    }
  },
  // Future campuses can be added here:
  // {
  //   campusId: 'nyu',
  //   name: 'New York University',
  //   domains: {
  //     student: ['nyu.edu'],
  //     faculty: ['nyu.edu'],
  //     staff: ['nyu.edu'],
  //     alumni: ['alumni.nyu.edu']
  //   }
  // },
];

interface CampusEmailProps {
  value: string;
  localPart: string;
  domain: string;
  campusId: string;
  campusName: string;
  emailType: EmailType;
}

export class CampusEmail extends ValueObject<CampusEmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  get value(): string {
    return this.props.value;
  }

  get localPart(): string {
    return this.props.localPart;
  }

  get domain(): string {
    return this.props.domain;
  }

  get campusId(): string {
    return this.props.campusId;
  }

  get campusName(): string {
    return this.props.campusName;
  }

  get emailType(): EmailType {
    return this.props.emailType;
  }

  private constructor(props: CampusEmailProps) {
    super(props);
  }

  /**
   * Create a CampusEmail from input string
   */
  public static create(email: string): Result<CampusEmail> {
    if (!email || email.trim().length === 0) {
      return Result.fail<CampusEmail>('Email is required');
    }

    const normalized = email.trim().toLowerCase();

    // Validate format
    if (!CampusEmail.EMAIL_REGEX.test(normalized)) {
      return Result.fail<CampusEmail>('Invalid email format');
    }

    // Parse email parts
    const [localPart, domain] = normalized.split('@');
    if (!localPart || !domain) {
      return Result.fail<CampusEmail>('Invalid email format');
    }

    // Find matching campus
    const campusMatch = CampusEmail.findCampus(domain);
    if (!campusMatch) {
      const supportedDomains = CampusEmail.getSupportedDomains();
      return Result.fail<CampusEmail>(
        `Only campus emails are allowed. Supported domains: ${supportedDomains.join(', ')}`
      );
    }

    return Result.ok<CampusEmail>(new CampusEmail({
      value: normalized,
      localPart,
      domain,
      campusId: campusMatch.campusId,
      campusName: campusMatch.campusName,
      emailType: campusMatch.emailType
    }));
  }

  /**
   * Create for a specific campus (validates domain)
   */
  public static createForCampus(email: string, requiredCampusId: string): Result<CampusEmail> {
    const result = CampusEmail.create(email);
    if (result.isFailure) {
      return result;
    }

    const campusEmail = result.getValue();
    if (campusEmail.campusId !== requiredCampusId) {
      const campusConfig = CAMPUS_EMAIL_CONFIGS.find(c => c.campusId === requiredCampusId);
      return Result.fail<CampusEmail>(
        `Email must be from ${campusConfig?.name || requiredCampusId}`
      );
    }

    return result;
  }

  /**
   * Find campus configuration from domain
   */
  private static findCampus(domain: string): {
    campusId: string;
    campusName: string;
    emailType: EmailType;
  } | null {
    for (const config of CAMPUS_EMAIL_CONFIGS) {
      // Check alumni domains first (more specific)
      if (config.domains.alumni.some(d => domain.endsWith(d))) {
        return {
          campusId: config.campusId,
          campusName: config.name,
          emailType: EmailType.ALUMNI
        };
      }

      // Check student domains
      if (config.domains.student.some(d => domain.endsWith(d))) {
        // Default to student for general domains
        // Could be refined with additional heuristics
        return {
          campusId: config.campusId,
          campusName: config.name,
          emailType: EmailType.STUDENT
        };
      }

      // Check faculty domains
      if (config.domains.faculty.some(d => domain.endsWith(d))) {
        return {
          campusId: config.campusId,
          campusName: config.name,
          emailType: EmailType.FACULTY
        };
      }

      // Check staff domains
      if (config.domains.staff.some(d => domain.endsWith(d))) {
        return {
          campusId: config.campusId,
          campusName: config.name,
          emailType: EmailType.STAFF
        };
      }
    }

    return null;
  }

  /**
   * Get all supported domains
   */
  public static getSupportedDomains(): string[] {
    const domains = new Set<string>();

    for (const config of CAMPUS_EMAIL_CONFIGS) {
      config.domains.student.forEach(d => domains.add(d));
      config.domains.faculty.forEach(d => domains.add(d));
      config.domains.staff.forEach(d => domains.add(d));
      config.domains.alumni.forEach(d => domains.add(d));
    }

    return Array.from(domains).sort();
  }

  /**
   * Get supported campuses
   */
  public static getSupportedCampuses(): Array<{ id: string; name: string }> {
    return CAMPUS_EMAIL_CONFIGS.map(c => ({
      id: c.campusId,
      name: c.name
    }));
  }

  /**
   * Check if domain is supported
   */
  public static isDomainSupported(domain: string): boolean {
    return CampusEmail.findCampus(domain) !== null;
  }

  /**
   * Check if this is a student email
   */
  public isStudent(): boolean {
    return this.props.emailType === EmailType.STUDENT;
  }

  /**
   * Check if this is a faculty email
   */
  public isFaculty(): boolean {
    return this.props.emailType === EmailType.FACULTY;
  }

  /**
   * Check if this is an alumni email
   */
  public isAlumni(): boolean {
    return this.props.emailType === EmailType.ALUMNI;
  }

  /**
   * Get masked email for display (j***@buffalo.edu)
   */
  public getMasked(): string {
    const { localPart, domain } = this.props;
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
  }

  /**
   * Check if email matches another (case-insensitive)
   */
  public equals(other: CampusEmail): boolean {
    return this.props.value === other.value;
  }

  public toString(): string {
    return this.props.value;
  }

  public toDisplayString(): string {
    return `${this.props.value} (${this.props.campusName})`;
  }
}
