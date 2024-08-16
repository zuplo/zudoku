export type Result<V = null, E = Error> =
  | { ok: true; error?: V }
  | { ok: false; error: E };

export interface ValidationRule<W, V = null, E = Error> {
  validate(what: W): Promise<Result<V, E>> | Result<V, E>;
}

export class CompositeValidator<W> implements ValidationRule<W> {
  private readonly validators = new Array<ValidationRule<W>>();

  constructor(...validators: Array<ValidationRule<W>>) {
    this.validators = validators;
  }

  async validate(what: W): Promise<Result> {
    for (const rule of this.validators) {
      const result = await rule.validate(what);
      if (!result.ok) {
        return result;
      }
    }

    return { ok: true };
  }
}

export class YargsChecker<W> {
  private readonly validator: ValidationRule<W>;

  constructor(validator: ValidationRule<W>) {
    this.validator = validator;
  }

  async check(what: W) {
    const result = await this.validator.validate(what);
    if (!result.ok) {
      return result.error.message;
    } else {
      return true;
    }
  }
}
