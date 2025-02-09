
// Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
export const escapeIdentifier = (str: string) => str === '*' ? '*' : `"${(str || '').replace(/"/g, '""')}"`

export const prepareStatementVariables = (n: number) => {
    return Array.from({ length: n }, (_, i) => i + 1)
        .map(i => `$${i}`)
        .join(', ')
}
