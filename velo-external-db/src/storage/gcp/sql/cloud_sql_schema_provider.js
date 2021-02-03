
const SystemFields = [
    {
        name: '_id', type: 'varchar(256)', isPrimary: true
    },
    {
        name: '_createdDate', type: 'timestamp'
    },
    {
        name: '_updatedDate', type: 'timestamp'
    },
    {
        name: '_owner', type: 'varchar(256)'
    }]

class SchemaProvider {
    constructor(pool) {
        this.pool = pool

        this.systemFields = SystemFields
    }

    async list() {
        const tables = await this.pool.query('SHOW TABLES')
        const columnName = tables[1][0].name

        return Promise.all(tables[0].map(r => r[columnName])
                                    .map( this.describeCollection.bind(this) ))
    }

    async create(collectionName, columns) {
        const dbColumnsSql = this.systemFields.concat(columns || [])
                                 .map( this.columnToDbColumnSql.bind(this) )
                                 .join(', ')
        const primaryKeySql = this.systemFields.filter(f => f.isPrimary).map(f => `\`${f.name}\``).join(', ')

        await this.pool.query(`CREATE TABLE IF NOT EXISTS ?? (${dbColumnsSql}, PRIMARY KEY (${primaryKeySql}))`,
                              [collectionName].concat((columns || []).map(c => c.name)))
    }

    async addColumn(collectionName, column) {
        return await this.validateSystemFields(column.name)
                         .then(() => this.pool.query(`ALTER TABLE ?? ADD ?? ${column.type}`, [collectionName, column.name]))
                         .catch(err => console.log(err))
        /*
        code: 'ER_NO_SUCH_TABLE',
  errno: 1146,
  sqlState: '42S02',
  sqlMessage: "Table 'test-db.ew' doesn't exist"
         */

    }

    async removeColumn(collectionName, columnName) {
        return await this.validateSystemFields(columnName)
                         .then(() => this.pool.query(`ALTER TABLE ?? DROP COLUMN ??`, [collectionName, columnName]))
                         .catch(err => console.log(err))

        /*
        code: 'ER_CANT_DROP_FIELD_OR_KEY',
  errno: 1091,
  sqlState: '42000',
  sqlMessage: "Can't DROP 'tod'; check that column/key exists"
         */
    }

    async describeCollection(collectionName) {
        const res = await this.pool.query('DESCRIBE ??', [collectionName])
        return {
            id: collectionName,
            fields: res[0].map(r => ({ name: r.Field, type: r.Type, isPrimary: r.Key === 'PRI' }))
        }
    }

    defaultForColumnType(type) {
        if (type === 'timestamp') {
            return 'DEFAULT CURRENT_TIMESTAMP'
        }
        return ''
    }

    columnToDbColumnSql(f) {
        return `${f.name} ${f.type} ${this.defaultForColumnType(f.type)}`
    }


    validateSystemFields(columnName) {
        if (SystemFields.find(f => f.name === columnName)) {
            return Promise.reject('ERR: system field')
        }
        return Promise.resolve()
    }
}

/*
{
displayName: table.table,
id: table.table,
allowedOperations: allowedOperations,
maxPageSize: 50,
ttl: 3600,
fields: convertFields(table.columns)
}

{
displayName: field.name,
type: extractFieldType(field.type),


const extractFieldType = dbType => {
const type = dbType
.toLowerCase()
.split('(')
.shift()

switch (type) {
case 'varchar':
case 'text':
return 'text'
case 'decimal':
case 'bigint':
case 'int':
return 'number'
case 'tinyint':
return 'boolean'
case 'date':
case 'datetime':
case 'time':
return 'datetime'
case 'json':
default:
return 'object'
}
}

 */


module.exports = {SchemaProvider, SystemFields}