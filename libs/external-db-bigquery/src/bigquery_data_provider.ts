import { Dataset } from '@google-cloud/bigquery'
import { IDataProvider, AdapterFilter as Filter, Item, AdapterAggregation as Aggregation } from '@wix-velo/velo-external-db-types'
import { asParamArrays, updateFieldsFor } from '@wix-velo/velo-external-db-commons'
import { unPatchDateTime, patchDateTime, escapeIdentifier } from './bigquery_utils'
import FilterParser from './sql_filter_transformer'
import { translateErrorCodes } from './sql_exception_translator'

export default class DataProvider implements IDataProvider {
    filterParser: FilterParser
    pool: Dataset
    constructor(pool: Dataset, filterParser: FilterParser) {
        this.filterParser = filterParser
        this.pool = pool
    }

    async find(collectionName: string, filter: Filter, sort: any, skip: any, limit: any, projection: any) {
        const { filterExpr, parameters } = this.filterParser.transform(filter)
        const { sortExpr } = this.filterParser.orderBy(sort)
        const projectionExpr = this.filterParser.selectFieldsFor(projection)

        const sql = `SELECT ${projectionExpr} FROM ${escapeIdentifier(collectionName)} ${filterExpr} ${sortExpr} LIMIT ${limit} OFFSET ${skip}`

        const resultSet = await this.pool.query({ query: sql, params: parameters })
                                         .catch( translateErrorCodes )

        return resultSet[0].map( unPatchDateTime )
    }

    async count(collectionName: string, filter: Filter) {
        const { filterExpr, parameters } = this.filterParser.transform(filter)
        const sql = `SELECT COUNT(*) AS num FROM ${escapeIdentifier(collectionName)} ${filterExpr}`

        const resultSet = await this.pool.query({
            query: sql,
            params: parameters
        })
    
        return resultSet[0][0]['num']
    }

    async insert(collectionName: string, items: Item[]) {
        const table = await this.pool.table(collectionName)
        await table.insert(items)

        return items.length
    }

    async update(collectionName: string, items: Item[]) {        
        const updateFields = updateFieldsFor(items[0])
        const queries = items.map(() => `UPDATE ${escapeIdentifier(collectionName)} SET ${updateFields.map(f => `${escapeIdentifier(f)} = ?`).join(', ')} WHERE _id = ?` )
                             .join(';')
        const updateTables = items.map((i: Item) => [...updateFields, '_id'].reduce((obj, key) => ({ ...obj, [key]: i[key] }), {}))
                                .map((u: any) => asParamArrays( patchDateTime(u) ))
                                
                                    
        const resultSet = await this.pool.query({ query: queries, params: updateTables.flatMap(i => i) })
                                    .catch( translateErrorCodes )

        return resultSet[0].length
    }

    async delete(collectionName: string, itemIds: string[]) {
        const sql = `DELETE FROM ${escapeIdentifier(collectionName)} WHERE _id IN UNNEST(@idsList)`

        const rs = await this.pool.query({ query: sql, params: { idsList: itemIds }, types: { idsList: ['STRING'] } })
                             .catch( translateErrorCodes )
         
        return rs[0].length
    }

    async truncate(collectionName: string) {
        await this.pool.query(`TRUNCATE TABLE ${escapeIdentifier(collectionName)}`)
                  .catch( translateErrorCodes )
    }

    async aggregate(collectionName: string, filter: Filter, aggregation: Aggregation) {
        const { filterExpr: whereFilterExpr, parameters: whereParameters } = this.filterParser.transform(filter)
        const { fieldsStatement, groupByColumns, havingFilter, parameters } = this.filterParser.parseAggregation(aggregation)

        const sql = `SELECT ${fieldsStatement} FROM ${escapeIdentifier(collectionName)} ${whereFilterExpr} GROUP BY ${groupByColumns.map( escapeIdentifier ).join(', ')} ${havingFilter}`

        const resultSet = await this.pool.query({ query: sql, params: [...whereParameters, ...parameters] })
                                    .catch( translateErrorCodes )

        return resultSet[0].map( unPatchDateTime )
    }
}

