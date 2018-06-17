import createWorker from "./createWorker";
import Deferred from "./Deferred";

let strHeader = `
	function({data}) {
		// console.log("received", data);
		this.setFetchOpt = function() {
			this.fetchOptions = data.args
		}.bind(this);
		this.set = function(obj) {
			return this[obj.property] = obj.overwrite ? obj.value : ( this[obj.property] ? this[obj.property] : obj.value )
		}.bind(this);
		this.get = function(obj) {
			return (this[obj.property] !== undefined ? this[obj.property] : obj.fallbackValue)
		}.bind(this);
`;
let endStr = `
		if(!data.method || typeof this[data.method] !== 'function' && data.method !== 'fetch' && data.method !== 'setFetchOpt') {
			postMessage({__responseId__: data.__requestId__, result: null, error: 'unknown method ' + data.method})
		} else {
			if(data.method === 'fetch') {
				const url = data.args.url
				if(url.indexOf('http') > 0) {   // fetch doesn't accept urls without protocol
					Promise.resolve()
						.then( () => postMessage({__responseId__: data.__requestId__, result: null, error: 'url must start with "http://"'}))
					
					return
				}
				const options = Object.assign({}, this.fetchOptions, data.args.options)
				Promise.resolve()
					.then( () => fetch(url, options))
					.then( result => { 
						if(result.ok)
							return result.json()
						else 
							throw new Error(result.statusText)
					})
					.then( jsonRes => { postMessage({__responseId__: data.__requestId__, result: jsonRes}) })
					.catch( err => { postMessage({__responseId__: data.__requestId__, result: null, error: ''+err }) })
			} else if(data.method === 'set' || data.method === 'get' || data.method === 'setFetchOpt') {
				Promise.resolve()
					.then( () => this[data.method](data.args) )
					.then( result => { postMessage({__responseId__: data.__requestId__, result: result}) })
					.catch( err => { postMessage({__responseId__: data.__requestId__, result: null, error: ''+err }) })
			} else {
				Promise.resolve()
					.then( () => this[data.method].apply(this, data.args) )
					.then( result => { postMessage({__responseId__: data.__requestId__, result: result}) })
					.catch( err => { postMessage({__responseId__: data.__requestId__, result: null, error: ''+err }) })
			}
		}
	}   // end of function({data})
`;

class WorkerHandler {

	constructor(workerFun) {
		Object.keys(workerFun).forEach(key => {
			// console.log("Proxying " + key);
			this[key] = this._proxyMethod.bind(this, key, workerFun[key]);
		});

		let megaString = "";
		Object.keys(this).forEach(key => {
			if (typeof workerFun[key] === "function") {
				megaString += "this." + key + " = " + workerFun[key].toString() + ",";
			}
		});
		megaString = megaString.substring(0, megaString.length - 1);

		let finalStr = strHeader + megaString + endStr;

		this.requests = {};
		this.worker = createWorker(finalStr);

		this.worker.onmessage = (message) => {
			const promise = this.requests[message.data.__responseId__];
			if (promise == null) {
				// TODO: what do we do? should be impossible
			} else {
				if (message.data.result === null && message.data.error) {
					promise.reject(message.data.error);
				} else {
					promise.resolve(message.data.result);
				}
			}
		};
	}

	get(property, fallbackValue) {
		const requestId = this.createRandomUId();
		this.requests[requestId] = new Deferred();

		this.worker.postMessage({
			__requestId__: requestId,
			method: "get",
			args: {
				property,
				fallbackValue
			}
		});

		return this.requests[requestId].promise;
	}

	set(property, value, overwrite) {
		const requestId = this.createRandomUId();
		this.requests[requestId] = new Deferred();

		this.worker.postMessage({
			__requestId__: requestId,
			method: "set",
			args: {
				property,
				value,
				overwrite
			}
		});

		return this.requests[requestId].promise;
	}

	fetch(url, options) {
		const requestId = this.createRandomUId();
		this.requests[requestId] = new Deferred();

		this.worker.postMessage({
			__requestId__: requestId,
			method: "fetch",
			args: {
				url,
				options
			}
		});

		return this.requests[requestId].promise;
	}

	setFetchOpt(options) {
		const requestId = this.createRandomUId();
		this.requests[requestId] = new Deferred();

		this.worker.postMessage({
			__requestId__: requestId,
			method: "setFetchOpt",
			args: options
		});

		return this.requests[requestId].promise;
	}

	_proxyMethod(originalMethodName, callback, ...args) {
		const requestId = this.createRandomUId();
		this.requests[requestId] = new Deferred();

		this.worker.postMessage({
			__requestId__: requestId,
			method: originalMethodName,
			args: args
		});

		return this.requests[requestId].promise;
	}

	terminate() {
		this.worker.terminate();
	}

	createRandomUId() {
		let id = Math.random().toString(36).slice(2);
		while (this.requests[id]) {
			id = Math.random().toString(36).slice(2);
		}
		return id;
	}
}

export default WorkerHandler;