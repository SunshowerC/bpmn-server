import knexClient from 'knex'


class MongoDB {
    client;
    dbConfig;
    logger;
    constructor(dbConfig,logger) {
        this.dbConfig = dbConfig;
        this.logger = logger;
    }
    async getClient() {

        const knex = knexClient({
            client: 'mysql',
            connection: {
            //   host : '127.0.0.1',
              port : 3306,
              user : 'root',
            //   password : '12345678',

            host: '34.146.111.141',  
            password: 'bai1@3',

              database : 'bpmn',
              parseJSON: true
            },
          });

          return knex
    }
    async find( dbName, collName, qry, projection=null) {
        if(Object.keys(qry).some(str => str.includes('.'))) {
            qry = {}
        }
        var client = await this.getClient();

        const db = client(collName);
        const result = await db.select()
        .where(qry)

        return result
    }

    // db.collection.createIndex( { "a.loc": 1, "a.qty": 1 }, { unique: true } )

    async createIndex(dbName, collName, index, unique = {} ) {

    }

    stringify(obj) {
        Object.keys(obj).forEach(k => {
            obj[k] = typeof obj[k] === 'object' ? JSON.stringify(obj[k]): obj[k]
        })
    }
    
    async insert(dbName, collName, docs) {

        var client = await this.getClient();
        if(Array.isArray(docs) ) {
            docs.forEach(item => {
                this.stringify(item)
            })
        } else if(typeof docs === 'object') {
            this.stringify(docs)
        } 

        const insertResult = await client(collName).insert(docs)
        console.log('insertResult', insertResult)
 

    }

    async update(dbName, collName, query, updateObject, options = {}) {

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
    async update2(dbName, collName, query, updateObject, options = {}) {
 
    }

    async remove(dbName, collName, query) {
 
    }

    async removeById(dbName,collName,id) {
 
    }

    async connect() {
    
    }
}

export  { MongoDB };