/* global Worker, Blob */
/* https://github.com/zevero/worker-create
* Create a worker without using a seperate worker.js file either from function or from string
*/
const createURL = function(func_or_string) {
	var str = (typeof func_or_string === "function") ? func_or_string.toString() : func_or_string;
	var blob = new Blob(["\"use strict\";\nself.onmessage =" + str], { type: "text/javascript" });
	return window.URL.createObjectURL(blob);
};

const createWorker = function(func_or_string) {
	return new Worker(createURL(func_or_string));
};

export { createURL };
export { createWorker };

export default createWorker;