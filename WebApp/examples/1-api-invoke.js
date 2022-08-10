const { configuration }  = require('../configuration.js');
const { BPMNServer, Logger } = require('bpmn-server');
// import {configuration} from '../WebApp/configuration'
// import {BPMNServer, Logger} from '../dist'

async function main() {


    const logger = new Logger({ toConsole: true });

    const server = new BPMNServer(configuration, logger);

    let response = await server.engine.start('Buy Used Car');

    const items = response.items.filter(item => {
        return (item.status == 'wait');
    });

    items.forEach(item => {
        console.log(`  waiting for <${item.name}> -<${item.elementId}> id: <${item.id}> `);
    });
    const itemId = items[0].id;

    console.log(`Invoking Buy id: <${itemId}>`);

    const input={ model: 'Thunderbird', needsRepairs: false, needsCleaning: false };
    response = await server.engine.invoke({items: { id: itemId } }, input );

    console.log("Ready to drive");
}

main()
