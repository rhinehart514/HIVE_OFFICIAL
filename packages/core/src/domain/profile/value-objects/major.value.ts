/**
 * Major Value Object
 * Represents an academic major with validation against catalog
 */

import { Result } from '../../shared/base/Result';
import { ValueObject } from '../../shared/base/ValueObject.base';

/**
 * Academic school/college classification
 */
export enum AcademicSchool {
  ENGINEERING = 'School of Engineering and Applied Sciences',
  ARTS_SCIENCES = 'College of Arts and Sciences',
  MANAGEMENT = 'School of Management',
  NURSING = 'School of Nursing',
  PHARMACY = 'School of Pharmacy',
  SOCIAL_WORK = 'School of Social Work',
  EDUCATION = 'Graduate School of Education',
  ARCHITECTURE = 'School of Architecture and Planning',
  PUBLIC_HEALTH = 'School of Public Health',
  LAW = 'School of Law',
  MEDICINE = 'Jacobs School of Medicine',
  DENTAL = 'School of Dental Medicine',
  OTHER = 'Other'
}

/**
 * UB Major catalog (subset - expandable)
 */
export const MAJOR_CATALOG: Record<string, { school: AcademicSchool; aliases: string[] }> = {
  // Engineering
  'Computer Science': { school: AcademicSchool.ENGINEERING, aliases: ['CS', 'CompSci', 'Comp Sci'] },
  'Computer Engineering': { school: AcademicSchool.ENGINEERING, aliases: ['CE', 'CompE'] },
  'Electrical Engineering': { school: AcademicSchool.ENGINEERING, aliases: ['EE', 'Elec Eng'] },
  'Mechanical Engineering': { school: AcademicSchool.ENGINEERING, aliases: ['ME', 'Mech Eng'] },
  'Civil Engineering': { school: AcademicSchool.ENGINEERING, aliases: ['CivE'] },
  'Aerospace Engineering': { school: AcademicSchool.ENGINEERING, aliases: ['AE', 'Aero'] },
  'Biomedical Engineering': { school: AcademicSchool.ENGINEERING, aliases: ['BME', 'BioMed'] },
  'Chemical Engineering': { school: AcademicSchool.ENGINEERING, aliases: ['ChemE'] },
  'Industrial Engineering': { school: AcademicSchool.ENGINEERING, aliases: ['IE'] },
  'Environmental Engineering': { school: AcademicSchool.ENGINEERING, aliases: ['EnvE'] },

  // Arts & Sciences
  'Biology': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Bio'] },
  'Chemistry': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Chem'] },
  'Physics': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Phys'] },
  'Mathematics': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Math', 'Maths'] },
  'Psychology': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Psych'] },
  'English': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Eng'] },
  'History': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Hist'] },
  'Political Science': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['PoliSci', 'Poli Sci'] },
  'Economics': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Econ'] },
  'Sociology': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Soc'] },
  'Philosophy': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Phil'] },
  'Communication': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Comm', 'Communications'] },
  'Media Study': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Media'] },
  'Linguistics': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Ling'] },
  'Anthropology': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Anthro'] },
  'Geography': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Geo'] },
  'Art': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Fine Arts', 'Studio Art'] },
  'Music': { school: AcademicSchool.ARTS_SCIENCES, aliases: [] },
  'Theatre': { school: AcademicSchool.ARTS_SCIENCES, aliases: ['Theater', 'Drama'] },
  'Dance': { school: AcademicSchool.ARTS_SCIENCES, aliases: [] },

  // Management
  'Business Administration': { school: AcademicSchool.MANAGEMENT, aliases: ['Business', 'BA', 'BBA'] },
  'Accounting': { school: AcademicSchool.MANAGEMENT, aliases: ['Acct'] },
  'Finance': { school: AcademicSchool.MANAGEMENT, aliases: ['Fin'] },
  'Marketing': { school: AcademicSchool.MANAGEMENT, aliases: ['Mkt', 'Mktg'] },
  'Management Information Systems': { school: AcademicSchool.MANAGEMENT, aliases: ['MIS'] },

  // Health Sciences
  'Nursing': { school: AcademicSchool.NURSING, aliases: ['BSN', 'RN'] },
  'Pharmacy': { school: AcademicSchool.PHARMACY, aliases: ['PharmD'] },
  'Public Health': { school: AcademicSchool.PUBLIC_HEALTH, aliases: ['PH'] },
  'Exercise Science': { school: AcademicSchool.PUBLIC_HEALTH, aliases: ['ExSci', 'Kinesiology'] },

  // Other
  'Architecture': { school: AcademicSchool.ARCHITECTURE, aliases: ['Arch'] },
  'Urban Planning': { school: AcademicSchool.ARCHITECTURE, aliases: [] },
  'Social Work': { school: AcademicSchool.SOCIAL_WORK, aliases: ['SW', 'MSW'] },
  'Law': { school: AcademicSchool.LAW, aliases: ['JD'] },
  'Medicine': { school: AcademicSchool.MEDICINE, aliases: ['MD', 'Pre-Med'] },
  'Dental Medicine': { school: AcademicSchool.DENTAL, aliases: ['DDS', 'Dentistry'] },

  // Undeclared
  'Undeclared': { school: AcademicSchool.OTHER, aliases: ['Undecided', 'Exploring'] },
};

interface MajorProps {
  value: string;
  school: AcademicSchool;
  isValidated: boolean;
}

export class Major extends ValueObject<MajorProps> {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 100;

  get value(): string {
    return this.props.value;
  }

  get school(): AcademicSchool {
    return this.props.school;
  }

  get isValidated(): boolean {
    return this.props.isValidated;
  }

  private constructor(props: MajorProps) {
    super(props);
  }

  /**
   * Create a Major from input string
   * Attempts to match against catalog, falls back to custom major
   */
  public static create(input: string): Result<Major> {
    if (!input || input.trim().length === 0) {
      return Result.fail<Major>('Major cannot be empty');
    }

    const trimmed = input.trim();

    if (trimmed.length < Major.MIN_LENGTH) {
      return Result.fail<Major>(`Major must be at least ${Major.MIN_LENGTH} characters`);
    }

    if (trimmed.length > Major.MAX_LENGTH) {
      return Result.fail<Major>(`Major must be no more than ${Major.MAX_LENGTH} characters`);
    }

    // Try to match against catalog
    const match = Major.findInCatalog(trimmed);

    if (match) {
      return Result.ok<Major>(new Major({
        value: match.name,
        school: match.school,
        isValidated: true
      }));
    }

    // Allow custom majors but mark as unvalidated
    return Result.ok<Major>(new Major({
      value: trimmed,
      school: AcademicSchool.OTHER,
      isValidated: false
    }));
  }

  /**
   * Create a validated major (must exist in catalog)
   */
  public static createValidated(input: string): Result<Major> {
    const match = Major.findInCatalog(input.trim());

    if (!match) {
      return Result.fail<Major>(
        `"${input}" is not a recognized major. Please select from the catalog.`
      );
    }

    return Result.ok<Major>(new Major({
      value: match.name,
      school: match.school,
      isValidated: true
    }));
  }

  /**
   * Find major in catalog by name or alias
   */
  private static findInCatalog(input: string): { name: string; school: AcademicSchool } | null {
    const normalized = input.toLowerCase();

    for (const [name, data] of Object.entries(MAJOR_CATALOG)) {
      // Check exact name match
      if (name.toLowerCase() === normalized) {
        return { name, school: data.school };
      }

      // Check aliases
      for (const alias of data.aliases) {
        if (alias.toLowerCase() === normalized) {
          return { name, school: data.school };
        }
      }
    }

    return null;
  }

  /**
   * Get all majors for a specific school
   */
  public static getMajorsBySchool(school: AcademicSchool): string[] {
    return Object.entries(MAJOR_CATALOG)
      .filter(([, data]) => data.school === school)
      .map(([name]) => name)
      .sort();
  }

  /**
   * Get all available majors
   */
  public static getAllMajors(): string[] {
    return Object.keys(MAJOR_CATALOG).sort();
  }

  /**
   * Check if input matches a catalog major
   */
  public static isValidMajor(input: string): boolean {
    return Major.findInCatalog(input) !== null;
  }

  /**
   * Check if this major is STEM
   */
  public isSTEM(): boolean {
    const stemSchools = [AcademicSchool.ENGINEERING];
    const stemMajors = ['Biology', 'Chemistry', 'Physics', 'Mathematics'];

    return stemSchools.includes(this.props.school) ||
           stemMajors.includes(this.props.value);
  }

  /**
   * Get display string with school
   */
  public toDisplayString(): string {
    if (this.props.school === AcademicSchool.OTHER) {
      return this.props.value;
    }
    return `${this.props.value} (${this.props.school})`;
  }

  public toString(): string {
    return this.props.value;
  }
}
