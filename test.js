 // promise 三个状态
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class myPromise {
    constructor(executor) {
        this.status = PENDING; // 声明初始状态；
        this.value = undefined; // fulfilled状态时 返回的信息
        this.reason = undefined; // rejected状态时 拒绝的原因；
        this.onFulfilledCallbacks = []; // 存储fulfilled状态对应的onFulfilled函数
        this.onRejectedCallbacks = []; // 存储rejected状态对应的onRejected函数
        //=>执行Excutor
        let resolve = result => { // resolve方法
            if (this.status !== PENDING) return;

            // 为什么resolve 加setTimeout?
            // 2.2.4规范 onFulfilled 和 onRejected 只允许在 execution context 栈仅包含平台代码时运行.
            // 这里的平台代码指的是引擎、环境以及promise的实施代码。实践中要确保onFulfilled 和 onRejected方法异步执行，且应该在then方法被调用的那一轮事件循环之后的新执行栈中执行。

            setTimeout(() => {
                //只能由pending状态=>fulfilled状态(避免调用多次resolve reject)
                this.status = FULFILLED;
                this.value = result;
                this.onFulfilledCallbacks.forEach(cb => cb(this.value));
            }, 0);
        };
        let reject = reason => { // reject方法
            if (this.status !== PENDING) return;
            setTimeout(() => {
                this.status = REJECTED;
                this.reason = reason;
                this.onRejectedCallbacks.forEach(cb => cb(this.reason))
            });
        };
        
        // 捕获在executor执行器中抛出的异常
        try {
            executor(resolveFn, rejectFn);
        }
        catch (err) {
            //=>有异常信息按照rejected状态处理
            reject(err);
        }
    }

    // 添加.then方法
    then(onFullfilled, onRejected) {
        this.onFulfilledCallbacks.push(onFullfilled);
        this.onRejectedCallbacks.push(onRejected);
    }

    // 添加.catch方法
    catch(onRejected) {
        return this.then(null, onRejected);
    }
}

module.exports = myPromise;