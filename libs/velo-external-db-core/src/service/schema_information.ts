import { errors } from '@wix-velo/velo-external-db-commons'
import { ISchemaProvider, ResponseField } from '@wix-velo/velo-external-db-types'
const { CollectionDoesNotExists } = errors
import * as NodeCache from 'node-cache'

const FiveMinutes = 5 * 60

export default class CacheableSchemaInformation {
    schemaProvider: ISchemaProvider
    cache: NodeCache
    constructor(schemaProvider: any) {
        this.schemaProvider = schemaProvider
        this.cache = new NodeCache( { checkperiod: FiveMinutes + 10 } )
    }
    
    async schemaFieldsFor(collectionName: string): Promise<ResponseField[]> {
        const schema = this.cache.get(collectionName)
        if ( !schema ) {
            await this.update(collectionName)
            return this.cache.get(collectionName) as ResponseField[] 
        }
        return schema as ResponseField[]
    }

    async update(collectionName: string) {
        const collection = await this.schemaProvider.describeCollection(collectionName)
        if (!collection) throw new CollectionDoesNotExists('Collection does not exists')
        this.cache.set(collectionName, collection, FiveMinutes)
    }

    async refresh() {
        const schema = await this.schemaProvider.list()
        if (schema && schema.length) 
            schema.forEach((collection: { id: any; fields: any }) => {
                this.cache.set(collection.id, collection.fields, FiveMinutes)
            })
    }

    async clear() {
        this.cache.flushAll()
    }

}
