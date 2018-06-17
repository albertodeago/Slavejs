import WebWorkerWrapper from './worker-utils';

describe('Web Worker Wrapper', () => {
    it('Create a WebWorkerWrapper', () => {
        const obj = {}
        const www = new WebWorkerWrapper(obj)
        
        expect(www instanceof WebWorkerWrapper).to.equal(true)
    });

    it('Accept a function that expect more than 1 parameter', () => {
        const obj = {
            sum: (a,b) => {
                return  a + b
            }
        }
        const www = new WebWorkerWrapper(obj)

        return www.sum(1,2).then( (result) => {
            expect(result).to.equal(3)
        });
    });

    it('Accept an array as argument in one method', () => {
        const obj = {
            reduce: (arr) => {
                return  arr.reduce((a, b) => a + b)
            }
        }
        const www = new WebWorkerWrapper(obj)

        return www.reduce([1,2,3,4]).then( (result) => {
            expect(result).to.equal(10)
        });
    });

    it('Accept an object as argument in one method', () => {
        const obj = {
            obj: (obj) => obj
        }
        const www = new WebWorkerWrapper(obj)

        return www.obj({a:1}).then( (result) => {
            expect(typeof result).to.equal('object');
            expect(result.a).to.equal(1);
        });
    });

    /*** GETTER / SETTER ***/
    it('Set a property in the worker', () => {
        const www = new WebWorkerWrapper({})

        return www.set('prop', 42).then( result => {
            expect(result).to.equal(42);
        })
    });

    it('Get a property from the worker', () => {
        const www = new WebWorkerWrapper({});

        return www.set('prop', 42).then( r => {
            return www.get('prop').then( result => {
                expect(result).to.equal(42);
            })
        })
    });

    it('Get a property and use the fallback value if not defined in the worker', () => {
        const www = new WebWorkerWrapper({});

        return www.get('prop', 'fallback').then( result => {
            expect(result).to.equal('fallback');
        })
    });

    it('Get a property and don\'t use the fallback value if not defined in the worker', () => {
        const www = new WebWorkerWrapper({});

        return www.set('prop', 42).then( r => {
            return www.get('prop', 'fallback').then( result => {
                expect(result).to.equal(42);
            })
        })
    });

    it('Set a property and don\'t overwrite it if already defined in the worker', () => {
        const www = new WebWorkerWrapper({});

        return www.set('prop', 42).then( r => {
            return www.set('prop', 'newVal').then( result => {
                expect(result).to.equal(42);
            })
        })
    });

    it('Set a property and overwrite the one in the worker if asked to', () => {
        const www = new WebWorkerWrapper({});

        return www.set('prop', 42).then( r => {
            return www.set('prop', 'newVal', true).then( result => {
                expect(result).to.equal('newVal');
            })
        })
    })
    /*** END GETTER / SETTER ***/
    
    /*** ASYNC FUNCTIONALITIES ***/
    it('Handle correctly a simple async task', () => {
        const obj = {
            asyncTask: (a) => {
                return new Promise((resolve,reject) => {
                    setTimeout( () => {
                        resolve(a);
                    }, 1000);
                })
            }
        }
        const www = new WebWorkerWrapper(obj)

        return www.asyncTask('Godzilla').then( (result) => {
            expect(result).to.equal('Godzilla');
        });
    });
    
    it('Can use Fetch API in the worker making a simple GET request', () => {
        const obj = {};
        const www = new WebWorkerWrapper(obj)

        return www.fetch('https://jsonplaceholder.typicode.com/posts/1').then( (result) => {
            expect(result.id).to.equal(1);
        });
    });
    
    it('Can use Fetch API in the worker making a POST request with some headers set', () => {
        const obj = {}
        const www = new WebWorkerWrapper(obj)

        const opt = {
            method: 'POST',
            body: JSON.stringify({
                title: 'foo',
                body: 'bar',
                userId: 13
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        }

        return www.fetch('https://jsonplaceholder.typicode.com/posts/', opt).then( (result) => {
            expect(result.userId).to.equal(13);
        });
    });
    
    it('Can use Fetch API in the worker making a PUT request', () => {
        const obj = {}
        const www = new WebWorkerWrapper(obj)
        const opt = {
            method: 'PUT',
            body: JSON.stringify({
                title: 'foo',
                body: 'Modified body'
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        }

        return www.fetch('https://jsonplaceholder.typicode.com/posts/1', opt).then( (result) => {
            expect(result.body).to.equal("Modified body");
        });
    });

    it('Can set default Fetch options and use those in every request', () => {
        const obj = {}
        const www = new WebWorkerWrapper(obj)
        const opt = {
            method: 'POST',
            body: JSON.stringify({
                title: 'Awesome title',
                body: 'Pretty awesome body'
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        }

        return www.setFetchOpt(opt).then( r => {
            return www.fetch('https://jsonplaceholder.typicode.com/posts/').then( result => {
                expect(result.body).to.equal("Pretty awesome body");
                return www.fetch('https://jsonplaceholder.typicode.com/posts/').then( result2 => {
                    expect(result2.title).to.equal("Awesome title");
                });
            });
        });
    });

    it('Can set default Fetch options and then override some by specifying them', () => {
        const obj = {}
        const www = new WebWorkerWrapper(obj)
        const opt = {
            method: 'POST',
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        }

        return www.setFetchOpt(opt).then( r => {
            const innerOpt = {
                body: JSON.stringify({
                    title: 'new title',
                    body: 'new body'
                })
            }
            return www.fetch('https://jsonplaceholder.typicode.com/posts/', innerOpt).then( result => {
                expect(result.body).to.equal("new body");
            });
        });
    });
    /*** END ASYNC FUNCTIONALITIES ***/

    /*** ERROR HANDLING ***/
    it('Handle simple exceptions', () => {
        const obj = {
            fun: function() {
                throw new Error("something's wrong");
            }
        }
        const www = new WebWorkerWrapper(obj)
        
        return www.fun().then( r => {
            expect("To never").to.equal("pass here"); // it should never pass here
        }).catch( err => {
            expect(err).to.equal("Error: something's wrong");
        });
    });

    it('Handle errors code 4** in fetch requests', () => {
        const obj = {}
        const www = new WebWorkerWrapper(obj)
        
        return www.fetch('http://httpstat.us/400')
            .then( res => expect("To never").to.equal("pass here"))
            .catch( err =>  expect(err).to.equal('Error: Bad Request'))
    });

    it('Handle errors code 404 in fetch requests', () => {
        const obj = {}
        const www = new WebWorkerWrapper(obj)
        
        return www.fetch('http://httpstat.us/404')
            .then( res => expect("To never").to.equal("pass here"))
            .catch( err =>  expect(err).to.equal('Error: Not Found'))
    });

    it('Handle errors code 5** in fetch requests', () => {
        const obj = {}
        const www = new WebWorkerWrapper(obj)
        
        return www.fetch('http://httpstat.us/500')
            .then( res => expect("To never").to.equal("pass here"))
            .catch( err =>  expect(err).to.equal('Error: Internal Server Error'))
    });
    /*** END ERROR HANDLING ***/
});