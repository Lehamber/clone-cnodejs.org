/**
 * 获取从date 开始 到现在间隔时间
 * @param { Date } date 开始时间
 * 
 * @param { String } ret 返回结果
 */
const getIntervalTime = function (date) {
    let nowDate = new Date();

    // 站在用户角度，来理解这个时间的显示：比如昨天，前天和 1天前 2天前，用户更习惯看到那个？
    // 30分钟前好 还是 半个小时前好， 半年前好 还是  6个月前好？
    // 半年 半小时 可能更口头一点，但是 6个月 和 30分钟 比较精确一点

    let newMs = nowDate.getTime();
    let dateMs = date.getTime();

    if (newMs - dateMs < 1000) {
        return '刚刚';
    }

    let arr = [{
            ms: 1000 * 60 * 60 * 24 * 30 * 12,
            name: '年'
        },
        {
            ms: 1000 * 60 * 60 * 24 * 30,
            name: '月'
        },
        {
            ms: 1000 * 60 * 60 * 24,
            name: '天'
        },
        {
            ms: 1000 * 60 * 60,
            name: '小时'
        },
        {
            ms: 1000 * 60,
            name: '分钟'
        },
        {
            ms: 1000,
            name: '秒'
        }
    ];

    for (var i = 0; i < arr.length; i++) {
        if (newMs - dateMs >= arr[i].ms) {
            let rest = (newMs - dateMs) % arr[i].ms;
            let ret = parseInt((newMs - dateMs) / arr[i].ms);
            ret = rest >= arr[i].ms / 2 ? ret + 1 : ret;
            return ret + arr[i].name + '前';
        }
    }
}

const sort = function (arr, callback) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            let temp;
            if (callback(arr[i], arr[j])) {
                temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
    }
    return arr;
}

exports.getIntervalTime = getIntervalTime;
exports.sort = sort;