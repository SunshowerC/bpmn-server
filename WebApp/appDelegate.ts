
import {  Item, FLOW_ACTION , NODE_ACTION, IExecution  } from './';
import { DefaultAppDelegate } from './index';

const fs = require('fs');

var seq = 1;

class MyAppDelegate extends DefaultAppDelegate{
    constructor(server) {
        super(server);
        this.servicesProvider = new MyServices();
    }
    sendEmail(to, msg, body) {

        console.log(`Sending email to ${to}`);

        const key = process.env.SENDGRID_API_KEY;

        if (key && (key != '')) {
            const sgMail = require('@sendgrid/mail')
            sgMail.setApiKey(process.env.SENDGRID_API_KEY)

            const email = {
                to: to,
                from: 'ralphhanna@hotmail.com', // Change to your verified sender
                subject: msg,
                text: body,
                html: body
            }

            sgMail
                .send(email)
                .then((response) => {
                    this.server.logger.log('responseCode', response[0].statusCode)
                    this.server.logger.log('responseHeaders', response[0].headers)
                })
                .catch((error) => {
                    console.error('Email Error:' + error)
                })

        }
        else {
            console.log(`email is disabled`);
        }

    }

    async executionStarted(execution: IExecution) {
        await super.executionStarted(execution);}
    async executionEvent({ event, item, execution }) {
        let object;
        if (event.startsWith('execution.'))
            object = execution;
        else
            object = item;
    }
    async messageThrown(messageId, data, matchingQuery, item: Item) {
        await super.messageThrown(messageId, data, matchingQuery,item);
    }
    async signalThrown(signalId, data, matchingQuery, item: Item) {
        await super.signalThrown(signalId, data, matchingQuery, item);
    }
    async serviceCalled(input, context) {
        this.server.logger.log("service called");

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
    async add({ v1, v2 }) {
        console.log("Add Service");
        console.log(v1, v2);
        return v1 + v2;
    }
    async service1(input, context) {
        let item = context.item;
        seq++;
        await delay(3000 - (seq * 100), 'test');
        item.token.log("SERVICE 1" + item.token.currentNode.id);
    }
}
export {MyAppDelegate}