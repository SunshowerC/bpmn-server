import { configuration } from "./configuration";

const { BPMNServer} = require('../index')


async function main() {
  const bpmnServer = new BPMNServer(configuration);
  let context = await bpmnServer.engine.start('serviceTask', { caseId: 12222 });

  console.log('zz')

}

main()