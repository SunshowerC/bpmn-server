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
exports.IAM = exports.ACL = void 0;
const fs = require('fs');
const path = require('path');
const Rules_1 = require("../acl/Rules");
const Repository_1 = require("../acl/Repository");
const { v4: uuidv4 } = require('uuid');
class IAM {
    constructor(server) {
        this.server = server;
    }
    addUser(userId, name, email, userGroups, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = new Repository_1.User();
            user.userId = userId;
            user.name = name;
            user.email = email;
            user.userGroups = userGroups;
            user.password = password;
            yield Repository_1.User.Repository(this.server).insert([user]);
            return user;
        });
    }
    /**
     * Returns a key
     * @param userId
     * @param password
     */
    login(userId, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield Repository_1.User.Repository(this.server).find({ userId: userId, password: password });
            const user = users[0];
            const key = uuidv4();
            IAM.currentUsers.set(key, user);
            return key;
        });
    }
    /**
     *
     *
     * @param key
     */
    getCurrentUser(key) {
        const user = IAM.currentUsers.get(key);
        return user;
    }
    getUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield Repository_1.User.Repository(this.server).find({ userId: userId });
            return users[0];
        });
    }
    getUsersForGroup(userGroup) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield Repository_1.User.Repository(this.server).find({ userGroups: userGroup });
            return users;
        });
    }
}
exports.IAM = IAM;
IAM.currentUsers = new Map();
class ACL {
    constructor(server) {
        this.server = server;
        this.listener = server.listener;
        this.listen(this.listener);
    }
    canPerform(operation, object) {
        return true;
    }
    checkEvent(event, context) {
        const definition = context.definition;
        let desc = definition.name;
        if (context.item)
            desc += ':' + context.item.element.id;
        if (!definition.accessRules)
            return;
        definition.accessRules.forEach(rule => {
            if (event == rule.event) {
                if (context.item == null && rule.element == null) {
                    rule.invoke(context);
                }
                else if (context.item && context.item.element.id == rule.element) {
                    rule.invoke(context);
                }
            }
        });
    }
    checkFileExistsSync(filepath) {
        let flag = true;
        try {
            fs.accessSync(filepath, fs.constants.F_OK);
        }
        catch (e) {
            flag = false;
        }
        return flag;
    }
    loadAccessRules(processName) {
        console.log('Loading rules for ' + processName);
        const filePath = this.server.configuration.definitionsPath + '/' + processName + '.json';
        const rules = [];
        if (this.checkFileExistsSync(filePath)) {
            let file = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
            let specs = JSON.parse(file);
            //console.log(file);
            //console.log(specs.accessRules);
            /*        const specs = [
                        { type: 'DesignateRule', user: '$current', event: 'process.start',  assignActor: 'owner'  },
                        { type: 'NotifyRule',  user: 'user1', event: 'wait', element: 'task_Buy', template: 'test'  },
                        { type: 'NotifyRule',  user: 'user1', event: 'end', element: 'task_Buy', template: 'test'  },
                        { type: 'AssignRule',  actor: 'owner', event: 'start', } ,
                        { type: 'AssignRule', userGroup: 'cleaners', event: 'start', element: 'task_Buy'  },
                    ];
            */
            let rule;
            for (let i = 0; i < specs.accessRules.length; i++) {
                let spec = specs.accessRules[i];
                rules.push(ACL.convertRule(spec));
            }
            console.log("Rules loaded", rules.length);
        }
        return rules;
    }
    static convertRule(spec) {
        switch (spec.type) {
            case 'DesignateRule':
                return new Rules_1.DesignateRule(spec);
                break;
            case 'AuthorizeRule':
                return new Rules_1.AuthorizeRule(spec);
                break;
            case 'AssignRule':
                return new Rules_1.AssignRule(spec);
                break;
            case 'NotifyRule':
                return new Rules_1.NotifyRule(spec);
                break;
        }
    }
    listen(listener) {
        var seq = 0;
        const self = this;
        listener.on('process.loaded', function ({ context, event }) {
            console.log('process.loaded', context.constructor.name);
            const definition = context;
            definition.accessRules = self.loadAccessRules(definition.name);
        });
        listener.on('process.restored', function ({ context, event }) {
            return;
            const proc = context.definition;
            console.log('***>' + event + "<***  Process Loaded" + proc.name);
            proc.accessRules = self.loadAccessRules(proc.name);
        });
        listener.on('all', function ({ context, event, }) {
            let desc = context.definition.name;
            if (context.item)
                desc += ':' + context.item.element.id;
            //console.log('   =====>ALL Event:', event, desc);
            self.checkEvent(event, context);
        });
        listener.on('end', function ({ context, event }) {
            seq++;
            setImmediate(self.cancelPendingAssignments, self, context.item.id, seq);
            //            console.dir(context.item.element, { depth: 1 });
        });
    }
    /*
     *
     * setImmediate sets this->Immediate, so we have to pass self
     *
     */
    cancelPendingAssignments(self, id, seq) {
        return __awaiter(this, void 0, void 0, function* () {
            const qry = { "itemId": id };
            /*
            const assigns = await self.dataStore.loadObjects(Assignment, qry)
            if (assigns.length > 0)
                 console.log("found :", assigns[0].itemId, "vs", id);
            */
        });
    }
}
exports.ACL = ACL;
//# sourceMappingURL=ACL.js.map