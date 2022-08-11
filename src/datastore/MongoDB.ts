import knexClient, { Knex } from 'knex'
import {v4 as uuidv4} from 'uuid'

class MongoDB {
    client: Knex<any, any[]>
    dbConfig;
    logger;
    constructor(dbConfig, logger) {
        this.dbConfig = dbConfig;
        this.logger = logger;
        this.client = this.getClient()
    }
    getClient() {

        const knex = knexClient({
            client: 'mysql',
            connection: {
                connTimeout: 10000,
                //   host : '127.0.0.1',
                port: 3306,
                user: 'root',
                //   password : '12345678',

                host: '34.146.111.141',
                password: 'bai1@3',

                database: 'bpmn',
                //   parseJSON: true
                // 将 json column 解析成 json 对象
                typeCast: function (field, next) {
                    if (field.type === 'JSON') {
                        return JSON.parse(field.string())
                    }
                    return next()
                },
            },
        });

        return knex
    }
    async find(dbName, collName, originQry, projection = null) {
        const hasDot = Object.keys(originQry).some(str => str.includes('.'))
        let qry = originQry
        if (hasDot) {
            qry = {}
        }
        const client = await this.getClient();

        const db = client(collName);

        let result = await db.select()
            .where(qry)

        if(hasDot) {
            result = result.filter(item => {
                const match = Object.entries(originQry).every(([k,v])=>{
                    const [key, subKey] = k.split('.')
                    const subObj = item[key]
                    if(Array.isArray(subObj)) {
                        return subObj.every(subItem => subItem?.[subKey] === v)
                    } else {
                        return subObj?.[subKey] === v
                    }
                })
                return match 
            })
        }
        return result
    }

    // db.collection.createIndex( { "a.loc": 1, "a.qty": 1 }, { unique: true } )

    // async createIndex(dbName, collName, index, unique = {}) {

    // }

    stringify(obj) {
        Object.keys(obj).forEach(k => {
            obj[k] = typeof obj[k] === 'object' ? JSON.stringify(obj[k]) : obj[k]
        })
        return obj
    }

    async insert(dbName, collName, docs) {

        const client = await this.getClient();
        if (Array.isArray(docs)) {
            docs.forEach(item => {
                item['id'] = item['id'] || uuidv4()
                this.stringify(item)
            })
        } else if (typeof docs === 'object') {
            docs['id'] = docs['id'] || uuidv4()
            this.stringify(docs)
        }
        
        const insertResult = await client(collName).insert(docs)
        console.log('insertResult', insertResult)

        return insertResult
    }

    async update(dbName, collName, query, updateObject, options = {}) {

        console.log('update', {dbName, collName, query, updateObject, options})
        const client = await this.getClient();
        const qb = client(collName);
        const existed = await qb.select().where(query).limit(1)
        if(existed.length > 0) {
            this.stringify(updateObject)
            const updateResult = await qb.update(updateObject).where(query)
            return updateResult
        } else {
            const insertResult = await this.insert(dbName, collName, [updateObject])
            return insertResult
        }


        // var client = await this.getClient();

        // // Get the documents collection
        // const db = client.db(dbName);
        // const collection = db.collection(collName);
        // // Insert some documents
        // let self = this;
        // return new Promise(function (resolve, reject) {

        //     collection.updateOne(query, updateObject, options, 
        //         function (err, result) {
        //         if (err) {
        //             reject(err);
        //         } else {
        //             console.log('update', {
        //                 req: {
        //                     dbName, collName, query, updateObject, options
        //                 },
        //                 result
        //             })

        //             self.logger.log(" updated " + JSON.parse(result).n );
        //             resolve(JSON.parse(result).n );
        //         }
        //     });
        // });
    }


    async remove(dbName, collName, query) {
        const qb = this.client(collName)
        const delResult = await qb.where(query).delete()
        return delResult
    }


    // async update2(dbName, collName, query, updateObject, options = {}) {

    // }
    // async removeById(dbName, collName, id) {

    // }

    // async connect() {

    // }
}

export { MongoDB };