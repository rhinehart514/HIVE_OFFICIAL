/**
 * GraduationYear Value Object
 * Represents a valid graduation year with business rules
 */

import { Result } from '../../shared/base/Result';
import { ValueObject } from '../../shared/base/ValueObject.base';

interface GraduationYearProps {
  value: number;
}

export class GraduationYear extends ValueObject<GraduationYearProps> {
  // Business rules: valid graduation years
  private static readonly MIN_YEAR = 2015; // Historical limit
  private static readonly MAX_YEAR_OFFSET = 8; // Max years in future from current year

  get value(): number {
    return this.props.value;
  }

  private constructor(props: GraduationYearProps) {
    super(props);
  }

  /**
   * Create a GraduationYear from a number
   */
  public static create(year: number): Result<GraduationYear> {
    if (!Number.isInteger(year)) {
      return Result.fail<GraduationYear>('Graduation year must be a whole number');
    }

    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + GraduationYear.MAX_YEAR_OFFSET;

    if (year < GraduationYear.MIN_YEAR) {
      return Result.fail<GraduationYear>(
        `Graduation year cannot be before ${GraduationYear.MIN_YEAR}`
      );
    }

    if (year > maxYear) {
      return Result.fail<GraduationYear>(
        `Graduation year cannot be more than ${GraduationYear.MAX_YEAR_OFFSET} years in the future`
      );
    }

    return Result.ok<GraduationYear>(new GraduationYear({ value: year }));
  }

  /**
   * Create from string (handles form input)
   */
  public static createFromString(yearStr: string): Result<GraduationYear> {
    const parsed = parseInt(yearStr, 10);
    if (isNaN(parsed)) {
      return Result.fail<GraduationYear>('Invalid graduation year format');
    }
    return GraduationYear.create(parsed);
  }

  /**
   * Check if this is a past graduation (alumni)
   */
  public isPast(): boolean {
    return this.props.value < new Date().getFullYear();
  }

  /**
   * Check if graduating this year
   */
  public isCurrentYear(): boolean {
    return this.props.value === new Date().getFullYear();
  }

  /**
   * Check if this is a future graduation (current student)
   */
  public isFuture(): boolean {
    return this.props.value > new Date().getFullYear();
  }

  /**
   * Get academic standing label
   */
  public getStandingLabel(): 'Alumni' | 'Senior' | 'Junior' | 'Sophomore' | 'Freshman' | 'Incoming' {
    const currentYear = new Date().getFullYear();
    const yearsUntilGrad = this.props.value - currentYear;

    if (yearsUntilGrad < 0) return 'Alumni';
    if (yearsUntilGrad === 0) return 'Senior';
    if (yearsUntilGrad === 1) return 'Senior';
    if (yearsUntilGrad === 2) return 'Junior';
    if (yearsUntilGrad === 3) return 'Sophomore';
    if (yearsUntilGrad === 4) return 'Freshman';
    return 'Incoming';
  }

  /**
   * Get display format
   */
  public toDisplayString(): string {
    return `Class of ${this.props.value}`;
  }

  public toString(): string {
    return this.props.value.toString();
  }
}
