/*
 * @Author: halo.wuhai 
 * @Date: 2018-08-22 09:56:58 
 * @Description: 路由 
 */

//引入文件
const Index = require('./index');
const Wechat = require('./wechat');
const Sign = require('./sign');

//api
//路径声明
const app = (app) => {
  app.use('/', Index);
  app.use('/wechat', Wechat);
  app.use('/sign', Sign);
}

module.exports = app;