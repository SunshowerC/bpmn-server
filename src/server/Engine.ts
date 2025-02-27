
import { Execution } from '../..';
import { ServerComponent } from '../server/ServerComponent';
import { IEngine} from "../interfaces";

import { DataStore } from '../datastore';


class Engine extends ServerComponent implements IEngine{


	constructor(server) {
		super(server);
    }

	/**
	 *	loads a definitions  and start execution
	 *
	 * @param name		name of the process to start
	 * @param data		input data 
	 * @param startNodeId	in process has multiple start node; you need to specify which one
	 */
	async start(name: any,
		data: any = {}, 
		startNodeId: string = null,
		userKey: string=null,
		options = {}): Promise<Execution> {

		this.logger.log(`Action:engine.start ${name}`);


		const definitions = this.definitions;
		const source = await definitions.getSource(name);

		const execution = new Execution(this.server,name, source);
		if (userKey) {
			execution.currentUser = this.iam.getCurrentUser(userKey);
		}

		// new dataStore for every execution to be monitored 
		const newDataStore =new DataStore(this.server);
		this.server.dataStore = newDataStore;

		newDataStore.monitorExecution(execution);
		this.cache.add(execution);

		execution.worker = execution.execute(startNodeId, data, options);

		if (options['noWait'] == true) {
			return execution;
		}
		else {
			const waiter = await execution.worker;
			this.logger.log(`.engine.start ended for ${name}`);
			return execution;
		}

		
	}
	/**
	 * restores an instance into memeory or provides you access to a running instance
	 * 
	 * this will also resume execution
	 * 
	 * @param instanceQuery		criteria to fetch the instance
	 * 
	 * query example:	{ id: instanceId}
	 *					{ data: {caseId: 1005}}
	 *					{ items.item.id : 'abcc111322'}
	 *					{ items.item.itemKey : 'businesskey here'}
	 *					
	 */
	async get(instanceQuery): Promise<Execution> {

		return  await this.restore(instanceQuery);
		
	}
	async restore(instanceQuery): Promise<Execution> {

		// need to load instance first
		let execution;
		const instance = await this.dataStore.findInstance(instanceQuery, 'Full');


		const live = this.cache.getInstance(instance.id);
		if (live) {

			execution = live;
		}
		else {
			execution = await Execution.restore(this.server,instance);


			// new dataStore for every execution to be monitored 
			const newDataStore = new DataStore(execution.server);
			execution.server.dataStore = newDataStore;

			newDataStore.monitorExecution(execution);


			this.cache.add(execution);
			this.logger.log("restore completed");

		}

		return execution;
	}
	async invokeItem(itemQuery, data = {}): Promise<Execution> {

		return await this.invoke(itemQuery, data);
	}
	/**
	 * Continue an existing item that is in a wait state
	 * 
	 * -------------------------------------------------
	 * scenario:
	 *		itemId			{itemId: value }
	 *		itemKey			{itemKey: value}
	 *		instance,task	{instanceId: instanceId, elementId: value }
	 *		
	 * @param itemQuery		criteria to retrieve the item
	 * @param data
	 */
	async invoke(itemQuery, data = {}, userKey: string = null): Promise<Execution> {

		this.logger.log(`Action:engine.invoke`);
		console.log(itemQuery);
		this.logger.log(itemQuery);

		try {

			const items = await this.server.dataStore.findItems(itemQuery);
			if (items.length > 1) {
				this.logger.error(`query produced more than ${items.length} items expecting only one`);
			}
			const item = items[0];
			if (!item) {
				this.logger.error(`query produced no items for ${itemQuery}`);
			}

			const execution = await this.restore({ "id": item.instanceId });

			if (userKey) {
				execution.currentUser = this.iam.getCurrentUser(userKey);
			}
			execution.log("Action:engineInvoke " + JSON.stringify(itemQuery));

			await execution.signal(item.id, data);

			this.logger.log(`..engine.continue execution ended saving.. `);

			await this.server.dataStore.save();

			this.logger.log(`.engine.continue ended`);

			return execution;
		}
		catch (exc) {
			return this.logger.error(exc);

		}
	}
	/**
	 * 
	 * Invoking an event (usually start event of a secondary process) against an existing instance
	 * or
	 * Invoking a start event (of a secondary process) against an existing instance
	 * ----------------------------------------------------------------------------
	 *	 instance,task 
	 *```
	 *	{instanceId: instanceId, elementId: value } 
	 *```
	 *		
	 * @param instanceId
	 * @param elementId
	 * @param data
	 */
	async startEvent(instanceId, elementId, data = {}) : Promise<Execution> {

		// need to load instance first
		this.logger.log('serverinvokeSignal');

		try {

			const execution= await this.restore({ "id": instanceId });

			await execution.signal(elementId, data);

			await this.server.dataStore.save();

			this.logger.log("invoke completed");

			return execution;
		}
		catch (exc) {
			return this.logger.error(exc);

		}
	}
	async throwMessage(messageId, data = {}, matchingQuery = {}): Promise<Execution> {

		this.logger.log('Action:engine.throwMessage ' + messageId);

		// need to load instance first
		const eventsQuery = { "events.messageId": messageId };
		const events = await this.definitions.findEvents(eventsQuery);

		this.logger.log('..findEvents ' + events.length);
		console.log(events);
		if (events.length > 0) {

			const event = events[0];
			return await this.start(event.modelName, data, null, event.elementId);
		}
		let itemsQuery;
		if (matchingQuery)
			itemsQuery = Object.assign({}, matchingQuery);

		itemsQuery["items.messageId"] = messageId;

		const items = await this.dataStore.findItems(itemsQuery);
		console.log(items);
		if (items.length > 0) {

			const item = items[0];
			return await this.invoke({ "items.id": item.id }, data);
		}
		return null;

	}
	/**
	 * 
	 * signal/message raise a signal or throw a message 
	 * 
	 * will seach for a matching event/task given the signalId/messageId
	 * 
	 * that can be againt a running instance or it may start a new instance 
	 * ----------------------------------------------------------------------------
	 * @param messageId		the id of the message or signal as per bpmn definition
	 * @param matchingQuery	should match the itemKey (if specified)
	 * @param data			message data
	 */
	async throwSignal(messageId, data = {}, matchingQuery = {} ) : Promise<Execution>{

		this.logger.log('Action:engine.signal '+messageId);

		// need to load instance first
		const eventsQuery = { "events.messageId": messageId };
		const events = await this.definitions.findEvents(eventsQuery);
		this.logger.log('..findEvents '+events.length);
		console.log(events);
		if (events.length > 0) {

			const event = events[0];
			return await this.start(event.modelName, data, null, event.elementId);
        }
		let itemsQuery;
		if (matchingQuery)
			itemsQuery = Object.assign({}, matchingQuery);

		itemsQuery["items.messageId"] = messageId;

		const items = await this.dataStore.findItems(itemsQuery);
		console.log(items);
		if (items.length > 0) {

			const item = items[0];
			return await this.invoke({ "items.id": item.id }, data);
		}
		return null;
	}



}


export { Engine};
