/*
 * @Author: halo
 * @Date: 2019-06-21 13:36:10 
 * @Description: 这里写描述 
 */
const rp = require('request-promise');
const request = require('request');
const qs = require('qs');
const sha1 = require('sha1');
const bluebird = require('bluebird');
const redis = require('redis');
const client = redis.createClient({
  host: '127.0.0.1',
  port: 6379,
});
bluebird.promisifyAll(redis.RedisClient.prototype);
const wechat = {
  appid: 'wx8863554644b57e1a',
  appsecret: '12ee455b52cc8f4ba257ad6117f5d4ff',
  token: 'test',
};

const WechatController = {
  //从redis获取accesss_token
  async getAccessTokenFromRedis(name) {
    return await client.getAsync(name).then(res => {
      return res;
    });
  },
  //从微信获取access_token
  async getAccessTokenFromWechat() {
    const {
      appid,
      appsecret: secret,
    } = wechat;
    const opts = {
      uri: 'https://api.weixin.qq.com/cgi-bin/token',
      qs: {
        grant_type: 'client_credential',
        appid,
        secret,
      },
      json: true,
    };
    return rp(opts).then(data => {
      const {
        access_token,
      } = data;
      if (data.access_token) {
        client.set("wx_access_token", access_token, 'EX', 7200, (err, reply) => {
          console.log(err);
          console.log(reply);
        });
        return access_token;
      } else {
        console.log('从微信获取access_token出错了~~~', data);
        return '';
      }
    }).catch(err => {
      console.log(err);
      return '';
    });
  },
  async getAccessToken() {
    //这里的access_token需要缓存到redis里面去，有效期7200秒，微信端缓存的时间是7200秒
    //先判断缓存里面有没有access_token，没有就调接口到微信去，反之，直接使用
    try {
      const access_token_from_redis = await WechatController.getAccessTokenFromRedis('wx_access_token');
      if (!access_token_from_redis) {
        const wx_access_token = await WechatController.getAccessTokenFromWechat();
        return wx_access_token;
      } else {
        return access_token_from_redis;
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },
  //从redis获取ticket
  async getTicketFromRedis(name) {
    return await client.getAsync(name).then(res => {
      return res;
    });
  },
  //从微信获取jsapi_ticket
  async getTicketFromWechat() {
    //这里的jsapi_ticket需要缓存到redis里面去，有效期7200秒，微信端缓存的时间是7200秒
    //先判断缓存里面有没有jsapi_ticket，没有就调接口到微信去，反之，直接使用
    const access_token = await WechatController.getAccessToken();
    const opts = {
      uri: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
      qs: {
        access_token,
        type: 'jsapi',
      },
      json: true,
    };
    return rp(opts).then(data => {
      const {
        errcode,
        ticket,
      } = data;
      if (errcode === 0) {
        client.set("wx_jsapi_ticket", ticket, 'EX', 7200, (err, reply) => {
          console.log(err);
          console.log(reply);
        });
        return ticket;
      } else {
        console.log('从微信获取jsapi_ticket出错了~~~', data);
        return '';
      }
    }).catch(err => {
      console.log(err);
      return '';
    });
  },
  async getTicket() {
    try {
      const ticket_from_redis = await WechatController.getTicketFromRedis('wx_jsapi_ticket');
      if (!ticket_from_redis) {
        const wx_ticket= await WechatController.getTicketFromWechat();
        return wx_ticket;
      } else {
        return ticket_from_redis;
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },
  //微信js签名
  async wxJsAuth(req, res) {
    try {
      const jsapi_ticket = await WechatController.getTicket();
      const nonceStr = 'test';
      const timestamp = new Date().getTime();
      const opts = {
        jsapi_ticket,
        noncestr: nonceStr,
        timestamp,
        url: 'http://www.cdaylm.com/wxui/wx/usercenter/bind_store?openid=omrQz5okt7k0mO0T7kbO4LY4VKAA', //从前端传过来的
      };
      const json = {
        appId: wechat.appid, // 必填，公众号的唯一标识
        timestamp, // 必填，生成签名的时间戳
        nonceStr, // 必填，生成签名的随机串
        signature: sha1(qs.stringify(opts)), // 必填，签名
      };
      console.log(json);
      res.json(json);
    } catch (err) {
      console.log(err);
    }
  },
  //校验是否来自微信
  async init(req, res) {
    // console.log(req.query);
    const {
      signature,
      nonce,
      timestamp,
      echostr,
    } = req.query;
    const {
      token,
    } = wechat;
    let str = await [token, timestamp, nonce].sort().join('');
    const sha = await sha1(str);
    const result = sha === signature ? echostr + '' : 'failed';
    // console.log(sha);
    // console.log(signature);
    // console.log(result);
    res.send(result);
  },
  //微信一系列操作的回调
  async message(req, res) {
    // console.log(req.body.xml);
    const eventArr = ['subscribe', 'unsubscribe'];
    const {
      CreateTime,
      Event,
      EventKey,
      FromUserName,
      MsgType,
      ToUserName,
      Content,
    } = req.body.xml;
    console.log('消息创建时间为：' + CreateTime);
    console.log('事件类型为：' + Event);
    console.log('事件类型值为：' + EventKey);
    console.log('消息类型为：' + MsgType);
    console.log('用户openid为：' + FromUserName);
    console.log('开发者微信号为：' + ToUserName);
    if (eventArr.includes(Event)) { //事件类型
      const context = Event === 'subscribe' ? '关注成功~~~' : '取消关注成功~~~';
      const xml = `
        <xml>
          <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
          <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
          <CreateTime>${new Date().getTime()}</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[${context}]]></Content>
        </xml>
      `;
      console.log(xml);
      res.header('Content-Type', 'application/xml').send(xml);
    } else {
      const xml = `
        <xml>
          <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
          <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
          <CreateTime>${new Date().getTime()}</CreateTime>
          <MsgType><![CDATA[${MsgType}]]></MsgType>
          <Content><![CDATA[${EventKey}]]></Content>
        </xml>`;
      console.log(xml);
      res.header('Content-Type', 'application/xml').send(xml);
    }
  },
  //创建微信菜单
  async createWxMenu() {
    const access_token = await WechatController.getAccessToken();
    const url = 'https://open.weixin.qq.com/connect/oauth2/authorize?';
    const opts = {
      appid: wechat.appid,
      redirect_uri: 'https://9dba4cb7.ngrok.io/static/wx/usercenter',
      response_type: 'code',
      //scope 应用授权作用域
      //snsapi_base （不弹出授权页面，直接跳转，只能获取用户openid）;
      //snsapi_userinfo （弹出授权页面，可通过openid拿到昵称、性别、所在地。并且， 即使在未关注的情况下，只要用户授权，也能获取其信息 ）
      scope: 'snsapi_base',
      state: 'STATE',
    }
    const menu = {
      button: [{
        type: 'view',
        name: '个人中心',
        url: url + qs.stringify(opts),
      }, ],
    };

    console.log(url + qs.stringify(opts));

    request({
      url: `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${access_token}`,
      method: 'POST',
      body: menu,
      json: true,
    }, (err, res, body) => {
      console.log(body);
    });
  },
};

module.exports = WechatController;