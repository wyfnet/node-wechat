const sha1 = require('sha1');
const passwordStr = 'fksds2323dsdf';

const SignController = {
  sign(opts) {
    const str = Object.keys(opts).sort().map(item => `${item}${opts[item]}`).join('');
    return sha1(`${encodeURI(str)}${passwordStr}`);
  }
};
const opts = {
  userAccount: 'admin@qq.com',
  password: '123456',
  validCode: '123456',
  loginType: '1',
}
console.log(SignController.sign(opts));

module.exports = SignController;