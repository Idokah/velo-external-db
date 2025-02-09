import { CannotModifySystemField } from './errors'

import { ResponseField, FieldWithQueryOperators, AsWixSchemaHeaders, AsWixSchema } from '@wix-velo/velo-external-db-types'

export const SystemFields = [
    {
        name: '_id', type: 'text', subtype: 'string', precision: '50', isPrimary: true
    },
    {
        name: '_createdDate', type: 'datetime', subtype: 'datetime'
    },
    {
        name: '_updatedDate', type: 'datetime', subtype: 'datetime'
    },
    {
        name: '_owner', type: 'text', subtype: 'string', precision: '50'
    }]

export const QueryOperatorsByFieldType = {
    number: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'hasSome'],
    text: ['eq', 'ne', 'contains', 'startsWith', 'endsWith', 'hasSome', 'matches', 'gt', 'gte', 'lt', 'lte'],
    boolean: ['eq'],
    url: ['eq', 'ne', 'contains', 'hasSome'],
    datetime: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'],
    image: [],
    object: ['eq', 'ne'],
}

const QueryOperationsByFieldType: {[x: string]: any} = {
    number: [...QueryOperatorsByFieldType.number, 'urlized'],
    text: [...QueryOperatorsByFieldType.text, 'urlized', 'isEmpty', 'isNotEmpty'],
    boolean: QueryOperatorsByFieldType.boolean,
    url: [...QueryOperatorsByFieldType.url, 'urlized'],
    datetime: [...QueryOperatorsByFieldType.datetime],
    image: QueryOperatorsByFieldType.image,
    object: [...QueryOperatorsByFieldType.object, 'isEmpty', 'isNotEmpty'],
}


export enum SchemaOperations {
    List = 'list',
    ListHeaders = 'listHeaders',
    Create = 'createCollection',
    Drop = 'dropCollection',
    AddColumn = 'addColumn',
    RemoveColumn = 'removeColumn',
    Describe = 'describeCollection',
    FindWithSort = 'findWithSort',
    Aggregate = 'aggregate',
    BulkDelete = 'bulkDelete',
    Truncate = 'truncate',
    UpdateImmediately = 'updateImmediately',
    DeleteImmediately = 'deleteImmediately',
    StartWithCaseSensitive = 'startWithCaseSensitive',
    StartWithCaseInsensitive = 'startWithCaseInsensitive',
    Projection = 'projection',
    FindObject = 'findObject',
    Matches = 'matches',
    NotOperator = 'not',
    IncludeOperator = 'include',
}

export const AllSchemaOperations = Object.values(SchemaOperations)

export const ReadWriteOperations = ['get', 'find', 'count', 'update', 'insert', 'remove']
export const ReadOnlyOperations = ['get']

export const asWixSchema = ({ id, allowedOperations, allowedSchemaOperations, fields }: { id: string, allowedOperations: string[], fields: FieldWithQueryOperators[], [x: string]: any }): AsWixSchema => {
    return {
        id,
        displayName: id,
        allowedOperations,
        allowedSchemaOperations,
        maxPageSize: 50,
        ttl: 3600,
        fields: fields.reduce((o: any, r: FieldWithQueryOperators) => ({
            ...o, [r.field]: {
                displayName: r.field,
                type: r.type,
                queryOperators: r.queryOperators,
            }
        }), {})
    }
}

export const asWixSchemaHeaders = (collectionName: string): AsWixSchemaHeaders => {
    return {
        id: collectionName,
        displayName: collectionName,
        maxPageSize: 50,
        ttl: 3600,
    }
}

export const validateSystemFields = (columnName: string) => {
    if (SystemFields.find(f => f.name === columnName)) {
        throw new CannotModifySystemField('Cannot modify system field')
    }
    return Promise.resolve()
}

export const parseTableData = (data: any[]) => data.reduce((o: { [x: string]: any }, r: { table_name: string, [x: string]: any }) => {
    const arr = o[r.table_name] || []
    arr.push(r)
    o[r.table_name] = arr
    return o
}, {}) as {[x:string]: {table_name: string, field: string, type: string}[]}

export const allowedOperationsFor = ({ fields }: {fields: ResponseField[]}) => fields.find((c: ResponseField) => c.field === '_id') ? ReadWriteOperations : ReadOnlyOperations

export const appendQueryOperatorsTo = (fields: ResponseField[]) => fields.map((f: ResponseField) => ({ ...f, queryOperators: QueryOperationsByFieldType[f.type] }))
