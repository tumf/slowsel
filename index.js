var zaif = require('zaif.jp');
var public_api = zaif.PublicApi;
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

function new_order(api,amount,price) {
    amount = amount > 1.0 ? 1.0 : amount;
    return api.trade('btc_jpy', 'ask',price , amount).then(function(msg){
        console.log("New Order:" + msg.order_id);
    });
}

function make_order(depth) {
    var total_amount = 0;
    var i=0;
    for (;i<9;i++){
        total_amount += depth.asks[i][1];
        if(total_amount > 0.1){
            break;
        }
    }
    console.log(depth.asks[i][0]);
    console.log(depth.asks[i][1]);

    var price = depth.asks[i][0];
    var amount = depth.asks[i][1];

    fs.readFileAsync('./config.json').then(JSON.parse).
        then(function(config){
            var api = zaif.createPrivateApi(config.apikey, config.secretkey, 'user agent is node-zaif');
            // call api
            api.getInfo().then(function(info){
                if (info.funds.btc > 0.1){
                    return api.activeOrders();
                }
                throw "Insufficient Funds: " + info.funds.btc;
            }).then(function(orders){
                if(Object.keys(orders).length>0){
                    for (order_id in orders){
                        console.log(orders[order_id]);
                        if(orders[order_id].price != price || orders[order_id].amount == amount){
                            api.cancelOrder(order_id).then(function(msg){
                                console.log("Cancel Order:" + msg.order_id);
                                return new_order(api,amount,price);
                            });
                        }
                    }
                }else{
                    return new_order(api,amount,price);
                }
            });
        }).catch(console.log);
}

function main(){
    zaif.PublicApi.depth('btc_jpy').then(make_order);
}

setInterval(main,5000);
