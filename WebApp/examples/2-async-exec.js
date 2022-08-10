const { configuration }  = require('../configuration.js');
const { BPMNServer, Logger } = require('bpmn-server');
const {EventEmitter} = require('events')

async function main() {
const logger = new Logger({ toConsole: false });

const listener = new EventEmitter();

listener.on('all', function ({ context, event, }) {
    let msg = '';
    if (context.instance.id)
        msg = ' instanceId: ' + context.instance.id;
    if (context.item)
        msg += ' Item: ' + context.item.elementId + " itemId: "+ context.item.id;
    console.log('---Event: -->' + event + msg );
});

const server = new BPMNServer(configuration, logger, { cron: false });

// notice no await for next line
server.engine.start('serviceTask', { v1: 1, v2: 2 });

}

main()