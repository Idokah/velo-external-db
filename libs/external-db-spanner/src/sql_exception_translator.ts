import { errors } from '@wix-velo/velo-external-db-commons'
const { CollectionDoesNotExists, FieldAlreadyExists, FieldDoesNotExist, DbConnectionError, CollectionAlreadyExists, ItemAlreadyExists, InvalidQuery, UnrecognizedError } = errors

export const notThrowingTranslateErrorCodes = (err: any) => {
    switch (err.code) {
        case 9:
            if (err.details.includes('column')) {
                return new FieldAlreadyExists(err.details)
            } else {
                return new CollectionAlreadyExists(err.details)
            }
        case 5:
            if (err.details.includes('Column')) {
                return new FieldDoesNotExist(err.details)
            } else if (err.details.includes('Instance')) {
                return new DbConnectionError(`Access to database denied - wrong credentials or host is unavailable, sql message:  ${err.details} `)
            } else if (err.details.includes('Database')) {
                return new DbConnectionError(`Database does not exists or you don't have access to it, sql message: ${err.details}`)
            } else if (err.details.includes('Table')) {
                return new CollectionDoesNotExists(err.details)
            } else {
                return new InvalidQuery(`${err.details}`)
            }
        case 6:
            if (err.details.includes('already exists')) 
                return new ItemAlreadyExists(`Item already exists: ${err.details}`)
            else
                return new InvalidQuery(`${err.details}`)
        case 7:
            return new DbConnectionError(`Access to database denied - host is unavailable or wrong credentials, sql message:  ${err.details} `)

        default :
            console.error(err)
            return new UnrecognizedError(`${err.details}`)
    }
}

export const translateErrorCodes = (err: any) => {
    throw notThrowingTranslateErrorCodes(err)
}
