import { Result } from '../../domain/shared/base/Result';

/**
 * Base Mapper class for converting between domain models and DTOs
 * Enforces proper layer separation in DDD
 */
export abstract class Mapper<TDomain, TDTO> {
  abstract toDTO(domain: TDomain): TDTO;

  /**
   * @deprecated Use toDomainSafe() which returns Result<TDomain> for proper error handling.
   * This method throws on validation failures which violates DDD principles.
   */
  abstract toDomain(dto: TDTO): TDomain;

  /**
   * Safe version of toDomain that returns Result<TDomain> instead of throwing.
   * Implementers should override this method with proper validation.
   * Default implementation wraps toDomain in a try-catch.
   */
  toDomainSafe(dto: TDTO): Result<TDomain> {
    try {
      return Result.ok(this.toDomain(dto));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(message);
    }
  }

  toDTOArray(domains: TDomain[]): TDTO[] {
    return domains.map(domain => this.toDTO(domain));
  }

  /**
   * @deprecated Use toDomainArraySafe() for proper error handling
   */
  toDomainArray(dtos: TDTO[]): TDomain[] {
    return dtos.map(dto => this.toDomain(dto));
  }

  /**
   * Safe version that collects all conversion errors
   */
  toDomainArraySafe(dtos: TDTO[]): Result<TDomain[]> {
    const results: TDomain[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dtos.length; i++) {
      const result = this.toDomainSafe(dtos[i]);
      if (result.isFailure) {
        errors.push(`[${i}]: ${result.error}`);
      } else {
        results.push(result.getValue());
      }
    }

    if (errors.length > 0) {
      return Result.fail(`Failed to convert ${errors.length} items: ${errors.join(', ')}`);
    }

    return Result.ok(results);
  }
}