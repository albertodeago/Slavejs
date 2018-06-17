# Slavejs

Slavejs is a wrapper of Web Workers to make it more "natural" to work with. Support both sync and async operation and return a promise 'hiding' the postMessage and onMessage that Web Workers works with.

## How to use it

```
    let workerObj =  {
        funToExecuteByWorker: function(param) {
            return 'The answer of life is ' + param || 42
        },
        asyncTask: function(param) {
            return new Promise( (resolve, reject) => {
                setTimeout( () => {
                    resolve(param)
                }, 2500)
            })
        },
        errorExample: function() {
            throw new Error('oops')
        }
    };

    const www = new WorkerHandler(workerObj)
    
    www.funToExecuteByWorker(41)
        .then( res => console.log(res))         // The answer of life is 41
        .catch( err => console.error(err))

    www.asyncTask('myParam')
        .then( res => console.log(res))         // myParam (after 2,5 seconds)
        .catch( err => console.error(err))
```
### Get / Set properties
```
// API
// get(prop, defaultValue)
// set(prop, value, overwrite)

www.get('myProp').then( r => console.log(r))                             // undefined
www.get('myProp', 'my-default-value').then( r => console.log(r))         // 'my-default-value'
www.set('myProp', 'my-setted-value').then( r => console.log(r))          // 'my-setted-value'
www.get('myProp', 'my-default-value').then( r => console.log(r))         // 'my-setted-value'
www.set('myProp', 'second-value', false).then( r => console.log(r))      // 'my-setted-value'
www.get('myProp').then( r => console.log(r))                             // 'my-setted-value'
www.set('myProp', 'overrider-value', true).then( r => console.log(r))    // 'overrider-value'
www.get('myProp').then( r => console.log(r))                             // 'overrider-value'

// You can set also objects or arrays as properties.
www.set('objProp', {a: 'foo', bar: 'baz', answer: 42})
www.set('arrayProp', [1,2,3,4,5])

// let's do something more useful. (Code for the Demo TODO)


```

### Error handling
```
    www.errorExample()
        .then( () => {})
        .catch( err => console.error(err))      // "Error: oops" -> error are returned as Strings
```

### You can also use fetch in the webworker
```
    www.fetch('https://jsonplaceholder.typicode.com/posts/1')
        .then( res => console.log(res))         // res will be the response already parsed by .json(), so the object we are expecting
        .catch( err => console.error(err))

    www.fetch('http://httpstat.us/400')
        .then( res => console.log(res))
        .catch( err => console.error(err))      // err will be the string that contains the status code of the response. In this case "Error: Internal Server Error"
```

### You can pass an optional object with the options for fetch like this
```
    const opt = { 
        method: 'POST',
        body: JSON.stringify({
            title: 'foo',
            body: 'bar',
            userId: 'awesomeId'
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    }
    www.fetch(myUrl, opt)
        .then( res => console.log(res))
```

### or you can even set the default options for fetch and always use that ones
```
    const opt = {
        method: 'POST',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    }
    www.setFetchOpt(myOpt)
        .then( () => {
            www.fetch(myUrl)    // will be a POST with Content-type header
                .then( res => console.log(res))
        })
```

### If you set the default ones you can always pass the options to override or extend the default setted before
```
    www.setFetchOpt(myOpt)
        .then( () => {
            www.fetch(myUrl, {method: 'GET'})    // will be a GET with Content-type header
                .then( res => console.log(res))
        })

```

## Installation

Clone this repository locally...

```
$ git clone https://github.com/albertodeago/slavejs
$ cd slavejs
```

...and install the required NPM packages.

```
$ npm install
```

then build it and test it

```
$ npm run build
open in a browser index.test.html
```

## Start Dev Server

Start a local Web Server.

```
$ npm run dev
```

## Build Prod Version

Create a Production version of your project.

```
$ npm run build
```

## Limitations

Does not work with Classes, only object containing functions. (You can use getter and setter methods exposed to get and set property in the web worker. This will retrieve or set this[property] in the web worker itself. Can be useful to use that property in the methods you pass to him.)
The prototype of the object passed in the constructor will be ignored and not 'proxied' to the Web Worker
A lot more... If you find a feature that you would like it open an issue or make a PR

## Test

Open up the index.test.html file in the browser, test are ran with Mocha in the browser.

## Compatibility

Any modern browser.