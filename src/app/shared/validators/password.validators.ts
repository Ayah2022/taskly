// shared/validators/password.validators.ts
import { validate } from '@angular/forms/signals';

type StringFieldPath = Parameters<typeof validate<string>>[0];

// Only tags a `kind` on each error — no message text here.
// The template owns the copy so it can be localized independently
// of this shared logic. Used by both Sign Up and Reset Password.
export function passwordStrengthValidators(path: StringFieldPath): void {
    // Empty value → let `required` own that error alone.
    // Nothing else here should fire until there's something to actually judge.
    validate(path, ({ value }) => {
        if (!value()) {
            return null;
        }

        return value().length >= 8 && value().length <= 64 ? null : { kind: 'length' };
    });

    validate(path, ({ value }) =>
        value() && /\s/.test(value()) ? { kind: 'whitespace' } : null,
    );

    validate(path, ({ value }) =>
        !value() || /[a-z]/.test(value()) ? null : { kind: 'lowercase' },
    );

    validate(path, ({ value }) =>
        !value() || /[A-Z]/.test(value()) ? null : { kind: 'uppercase' },
    );

    validate(path, ({ value }) => (!value() || /\d/.test(value()) ? null : { kind: 'digit' }));

    validate(path, ({ value }) =>
        !value() || /[!@#$%^&*]/.test(value()) ? null : { kind: 'specialChar' },
    );
}