/**
 * @description 接口代理转发（临时方案，保障新接口开发完成前的演示需求）
 * @param {object} app      express app
 */
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({
  changeOrigin: true // changes the origin of the host header to the target URL
});
const proxyDomain = 'http://www.cdaylm.com';

const proxyConfig = (app) => {
  // 代理请求发送前事件句柄
  proxy.on('proxyReq', function (proxyReq, req, res, options) {
    // debugger;
    console.log('接口代理转发:', proxyReq.method, 'http://' + proxyReq._headers.host + proxyReq.path);
  });

  console.log('代理地址:', proxyDomain);

  app.get(/^\/glass\/wx\/./, function (req, res) {
    proxy.web(req, res, {
      target: proxyDomain
    });
  });

  app.post(/^\/glass\/wx\/./, function (req, res) {
    proxy.web(req, res, {
      target: proxyDomain
    });
  });

  app.get(/^\/static\/*\/./, function (req, res) {
    proxy.web(req, res, {
      target: 'http://localhost:8080',
    });
  });

};

module.exports = proxyConfig;