
import { IExecution, Item, FLOW_ACTION, NODE_ACTION, IExecutionContext } from '../index';
import { DefaultAppDelegate } from '../index';

const fs = require('fs');

var seq = 1;

class MyAppDelegate extends DefaultAppDelegate {
    constructor(logger = null) {
        super(logger);
        this.servicesProvider = new MyServices();
    }

    async executionStarted(execution: IExecutionContext) {
        await super.executionStarted(execution);
    }
    async executionEvent({ event, item, execution }) {
        let object;
        if (event.startsWith('execution.'))
            object = execution;
        else
            object = item;
    }
    async messageThrown(messageId, data, matchingQuery, item: Item) {
        await super.messageThrown(messageId, data, matchingQuery, item);
    }
    async signalThrown(signalId, data, matchingQuery, item: Item) {
        await super.signalThrown(signalId, data, matchingQuery, item);
    }
    async serviceCalled(input, context) {

    }
}

async function delay(time, result) {
    console.log("delaying ... " + time)
    return new Promise(function (resolve) {
        setTimeout(function () {
            console.log("delayed is done.");
            resolve(result);
        }, time);
    });
}
class MyServices {

    async serviceTask(input, context) {
        let item = context.item;
        console.log(" Hi this is the serviceTask from appDelegate");
        console.log(item);
        await delay(5000, 'test');
        console.log(" Hi this is the serviceTask from appDelegate says bye");
    }
    async add(input, context) {
        const { v1, v2 } = input
        console.log("Add Service", input, context, 'wtf');
        console.log(0, v1, v2);
        return v1 + v2;
    }
    async service1(input, context) {
        let item = context.item;
        seq++;
        await delay(3000 - (seq * 100), 'test');
        item.token.log("SERVICE 1" + item.token.currentNode.id);
    }
}
export { MyAppDelegate }