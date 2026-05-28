export function validatePasswordStrength(password: string): boolean {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]{16,}$/;
    return regex.test(password);
}
