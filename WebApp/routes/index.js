"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workflow = void 0;
const express = require("express");
const FS = require('fs');
const __1 = require("../");
const common_1 = require("./common");
var caseId = Math.floor(Math.random() * 10000);
const docsFolder = __dirname + '/../bpmnServer/docs/';
// main functions
function awaitAppDelegateFactory(middleware) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield middleware(req, res, next);
        }
        catch (err) {
            next(err);
        }
    });
}
//   
var bpmnServer;
var definitions;
class Workflow extends common_1.Common {
    config() {
        var router = express.Router();
        bpmnServer = this.webApp.bpmnServer;
        definitions = bpmnServer.definitions;
        router.get('/home', home);
        router.get('/', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            let output = [];
            output = show(output);
            //NOPASSPORT             console.log("isAuthenticated", request.isAuthenticated(), 'user', request.user);
            if (request.session.views) {
                request.session.views++;
            }
            else {
                request.session.views = 1;
            }
            console.log('Session:', request.session);
            display(response, 'Show', output);
        })));
        router.get('/readme_md', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            let processName = request.params.process;
            let fileName = docsFolder + '../README.md';
            let file = FS.readFileSync(fileName, { encoding: 'utf8', flag: 'r' });
            response.send(file);
        })));
        router.get('/example', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            /* Testing only
             *
            */
            var test;
            let file = '../tests/bpmn-engine/getFields.js';
            if (test)
                delete require.cache[require.resolve(file)];
            test = require(file);
            //        const test = require('../examples/example.js');
            /* */
        })));
        /*
         *  3 methods for execute:
         *      get: /execute       fires execute without input
         *      get: /executeInput  redirect to executeInput page -> call post: execute
         *      post:/execute       from form with input data
         *
         */
        router.get('/executeInput/:processName', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            let processName = request.params.processName;
            response.render('executeInput', { processName });
        })));
        router.get('/execute/:processName', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            let processName = request.params.processName;
            let context = yield bpmnServer.engine.start(processName, { caseId: caseId++ });
            if (context.errors) {
                displayError(response, context.errors);
            }
            let execution = context.execution;
            console.log(" insance id " + execution.id);
            response.redirect('/instanceDetails?id=' + execution.id);
            /*
            let output = ['run ' + processName];
            output = show(output);
            display(response, 'Run Prcesses', output, instance.logs, instance.getItems({}));
            */
        })));
        router.post('/execute', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            console.log(request.body);
            let process = request.body.processName;
            let data = {};
            parseField(request.body.field1, request.body.value1, data);
            parseField(request.body.field2, request.body.value2, data);
            let startNodeId = request.body.startNodeId;
            console.log(data);
            data['caseId'] = caseId++;
            let context = yield bpmnServer.engine.start(process, data, null, startNodeId);
            if (context.errors) {
                displayError(response, context.errors);
            }
            let instance = context.execution;
            response.redirect('/instanceDetails?id=' + instance.id);
            /*
            console.log(" insance id " + instance.id);
            let output = ['run ' + process];
            output = show(output);
            display(response, 'Run Prcesses', output, instance.logs, instance.getItems({})); */
        })));
        router.get('/listDefinitions', function (req, res) {
            let output = ['Data Reset'];
            output = show(output);
            display(res, 'Show', output);
        });
        router.get('/resetData', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            yield bpmnServer.dataStore.deleteInstances();
            console.log(" Data Reset");
            let output = ['Data Reset'];
            output = show(output);
            display(response, 'Show', output);
        })));
        router.get('/refresh', function (req, res) {
            let output = [];
            output = show(output);
            display(res, 'Show', output);
        });
        router.get('/clearDebug', function (req, res) {
            //    Logger.clear();
            let output = [];
            output = show(output);
            display(res, 'Show', output);
        });
        router.get('/invokeItem', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            let id = request.query.id;
            let processName = request.query.processName;
            let elementId = request.query.elementId;
            let fields = yield getFields(processName, elementId);
            if (fields && fields.length > 0) {
                response.render('invokeItem', {
                    id, fields, processName, elementId
                });
                return;
            }
            let result = yield bpmnServer.engine.invoke({ "items.id": id }, {});
            console.log("redirecting");
            response.redirect('/instanceDetails?id=' + result.execution.id);
            /*
            let output = ['save' + id];
            display(response, 'Save Instance', output); */
        })));
        router.post('/invokeItem', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            console.log('invoke');
            console.log(request.body);
            let id = request.body.itemId;
            let data = {};
            console.log(id);
            Object.entries(request.body).forEach(entry => {
                if (entry[0] == 'itemId') { }
                else {
                    data[entry[0]] = entry[1];
                }
            });
            console.log(data);
            let result = yield bpmnServer.engine.invoke({ "items.id": id }, data);
            response.redirect('/instanceDetails?id=' + result.execution.id);
        })));
        router.get('/mocha', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            const mocha = require('../node_modules/mocha/bin/mocha');
        })));
        router.get('/run/:process', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            let process = request.params.process;
            let exec = yield bpmnServer.engine.start(process, { caseId: caseId++ });
            if (exec.errors) {
                displayError(response, exec.errors);
            }
            console.log(" insance id " + exec.id);
            let output = ['run ' + process];
            output = show(output);
            display(response, 'Run Prcesses', output, exec.instance.logs, exec.instance.items);
        })));
        router.get('/instanceDetails', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            let imageId = request.query.id;
            console.log("id: " + imageId);
            yield instanceDetails(response, imageId);
        })));
        router.get('/deleteInstance', deleteInstance);
        router.get('/shutdown', shutdown);
        router.get('/restart', restart);
        router.get('/manage', manage);
        return router;
    }
}
exports.Workflow = Workflow;
function home(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        let output = [];
        output = show(output);
        //NOPASSPORT         console.log("isAuthenticated", request.isAuthenticated(), 'user', request.user);
        if (request.session.views) {
            request.session.views++;
        }
        else {
            request.session.views = 1;
        }
        console.log('Session:', request.session);
        display(response, 'Show', output);
    });
}
function deleteInstance(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let instanceId = req.query.id;
        yield bpmnServer.dataStore.deleteInstances({ id: instanceId });
        let output = ['Complete ' + instanceId];
        console.log(" deleted");
        display(res, 'Show', output);
    });
}
function shutdown(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let instanceId = req.query.id;
        yield bpmnServer.cache.shutdown();
        let output = ['Complete ' + instanceId];
        console.log(" deleted");
        display(res, 'Show', output);
    });
}
function restart(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let instanceId = req.query.id;
        yield bpmnServer.cache.restart();
        let output = ['Complete ' + instanceId];
        console.log(" deleted");
        display(res, 'Show', output);
    });
}
function manage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.render('manageProcesses', {
            procs: yield bpmnServer.definitions.getList(),
        });
    });
}
function displayError(res, error) {
    return __awaiter(this, void 0, void 0, function* () {
        let msg = '';
        if (typeof error === 'object') {
            if (error.message) {
                //            msg += error.message;
                msg += '<br/>Error Message: ' + error.message;
            }
            if (error.stack) {
                msg += '<br/>Stacktrace:';
                msg += '<br/>====================<br/>';
                msg += error.stack.split('\n').join('<br/>');
            }
        }
        else {
            msg += error;
        }
        res.send(msg);
    });
}
function display(res, title, output, logs = [], items = []) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(" Display Started");
        var instances = yield bpmnServer.dataStore.findInstances({}, 'summary');
        let waiting = yield bpmnServer.dataStore.findItems({ "items.status": 'wait' });
        waiting.forEach(item => {
            item.fromNow = __1.dateDiff(item.startedAt);
        });
        let engines = bpmnServer.cache.list();
        engines.forEach(engine => {
            engine.fromNow = __1.dateDiff(engine.startedAt);
            engine.fromLast = __1.dateDiff(engine.lastAt);
        });
        instances.forEach(item => {
            item.fromNow = __1.dateDiff(item.startedAt);
            if (item.endedAt)
                item.endFromNow = __1.dateDiff(item.endedAt);
            else
                item.endFromNow = '';
        });
        res.render('index', {
            title: title, output: output,
            engines,
            procs: yield bpmnServer.definitions.getList(),
            debugMsgs: [],
            waiting: waiting,
            instances,
            logs, items
        });
    });
}
function show(output) {
    return output;
}
function instanceDetails(response, instanceId) {
    return __awaiter(this, void 0, void 0, function* () {
        let instance = yield bpmnServer.dataStore.findInstance({ id: instanceId }, 'Full');
        let logs = instance.logs;
        let svg = null;
        try {
            svg = yield definitions.getSVG(instance.name);
        }
        catch (ex) {
        }
        const lastItem = instance.items[instance.items.length - 1];
        const def = yield bpmnServer.definitions.load(instance.name);
        yield def.load();
        const defJson = def.getJson();
        console.log('def access rules', def.accessRules);
        let output = ['View Process Log'];
        output = show(output);
        let vars = [];
        Object.keys(instance.data).forEach(function (key) {
            let value = instance.data[key];
            if (Array.isArray(value))
                value = JSON.stringify(value);
            if (typeof value === 'object' && value !== null)
                value = JSON.stringify(value);
            vars.push({ key, value });
        });
        let decorations = JSON.stringify(calculateDecorations(instance.items));
        response.render('InstanceDetails', {
            instance, vars,
            accessRules: def.accessRules,
            title: 'Instance Details',
            logs, items: instance.items, svg,
            decorations, definition: defJson, lastItem,
        });
    });
}
function getFields(processName, elementId) {
    return __awaiter(this, void 0, void 0, function* () {
        let definition = yield bpmnServer.definitions.load(processName);
        let node = definition.getNodeById(elementId);
        let extName = __1.Behaviour_names.CamundaFormData;
        console.log("ext name:" + extName);
        let ext = node.getBehaviour(extName);
        if (ext) {
            console.log('fields:' + ext.fields.length);
            return ext.fields;
        }
        else
            return null;
    });
}
function parseField(field, value, data) {
    if (field) {
        if (value.substring(0, 1) == '[') {
            value = value.substring(1);
            value = value.substring(0, value.length - 1);
            console.log('array' + value);
            let array = value.split(',');
            value = array;
        }
        data[field] = value;
    }
}
function calculateDecorations(items) {
    let decors = [];
    let seq = 1;
    items.forEach(item => {
        let color = 'red';
        if (item.status == 'end')
            color = 'black';
        let decor = { id: item.elementId, color, seq };
        decors.push(decor);
        seq++;
    });
    return decors;
}
//export default router;
//# sourceMappingURL=index.js.map