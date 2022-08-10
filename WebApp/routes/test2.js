
const { BPMNServer,  } = require('bpmn-server') 
const {configuration} = require('../configuration')
async function main() {
const bpmnServer = new BPMNServer(configuration);
let context = await bpmnServer.engine.start('serviceTask', { caseId: 12222 });

console.log('zz')

}

main()