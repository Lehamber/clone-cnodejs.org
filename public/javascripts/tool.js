

// 发送ajax 请求
const sendAjax = function( type, url, data, exOptions ) {

    return new Promise( function( resolve, reject ) {
        $.ajax({
            type, 
            url, 
            data,
            ... exOptions,
            timout: 3000,
            success(ret) {
                resolve(ret);
            },

            error() {
                alert(' 网络出现问题或服务端处理出错!');
            }
        });
    });
}
