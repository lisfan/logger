/**
 * 日志打印器
 *
 * @version 1.1.0
 */

import validation from '@~lisfan/validation'
import IS_DEV from './utils/env'

// 私有方法
const _actions = {
  /**
   * 打印方法工厂
   * 查找ls中是否存在打印命名空间配置项，若存在，则进行替换覆盖
   * 判断是否存在子命名空间，依次判断子命名空间的长度
   * @param {Logger} self - Logger实例
   * @param {string} method - 打印方法
   * @param {string} color - 颜色值，web安全色 http://www.w3school.com.cn/tiy/color.asp?color=LightGoldenRodYellow
   * @returns {function} - 返回封装后的的方法
   */
  factory(self, method, color) {
    return function (...args) {
      if (self.isActivated(method)) {
        let formatStr = `%c[${self.$name}]:%c`

        // 遍历参数列表，找出dom元素，进行转换
        args = args.map((arg) => {
          if (validation.isElement(arg)) {
            return [arg]
          }
          return arg
        })

        /* eslint-disable no-console */
        console[method](formatStr, `color: ${color}`, '', ...args)
        /* eslint-enable no-console */
      }

      return self
    }
  },
  /**
   * 代理运行console方法
   * [注] 内部会进行判断是否允许日志输出
   * @param {Logger} self - Logger实例
   * @param {string} method - 打印方法
   * @returns {function} - 返回封装后的的方法
   */
  proxyRun(self, method) {
    return function (...args) {
      if (self.isActivated(method)) {
        /* eslint-disable no-console */
        console[method](...args)
        /* eslint-enable no-console */
      }

      return self
    }
  }
}

/**
 * 日志打印类
 *
 * @class
 */
export default class Logger {
  /**
   * 日志打印命名空间启用输出开关，默认命名空间自动输出日志，设置为false时，可以关才输出
   * @static
   * @enum
   */
  static options = JSON.parse(global.localStorage.getItem('LOGGER')) || {}

  /**
   * 更改全局配置参数
   * @static
   * @param {object} [options={}] - 配置参数
   */
  static config(options = {}) {
    // 以内置配置为优先
    Logger.options = {
      ...options,
      ...Logger.options
    }
  }
  
  /**
   * 构造函数器
   *
   * @constructor
   * @param {object|string} options - 配置选项
   * @param {string} [options.name='logger'] - 日志器命名空间
   * @param {string} [options.debug=true] - 日志器命名空间
   */
  constructor(options) {
    let $options = {
      name: 'logger',
      debug: true
    }

    if (validation.isString(options)) {
      $options.name = options
    } else {
      $options = {
        ...$options,
        ...options
      }
    }

    this.$options = $options
  }

  /**
   * 获取实例命名空间值
   *
   * @returns {string} - 返回实例命名空间值
   */
  get $name() {
    return this.$options.name
  }

  /**
   * 设置实例命名空间值
   *
   * @readonly
   * @param {string} value - 值
   */
  set $name(value) {
    // this.$options.name = value
  }

  /**
   * 获取实例调试模式值
   *
   * @returns {string} - 返回实例调试模式值
   */
  get $debug() {
    return this.$options.debug
  }

  /**
   * 设置实例调试模式值
   *
   * @param {boolean} value - 值
   */
  set $debug(value) {
    this.$options.debug = value
  }

  /**
   * 检测当前实例是否可以打印
   * @param {string} [method] - 若指定了该参数，则精确检测具体的实例方法
   * @returns {boolean} - 返回是否可以打印标记
   */
  isActivated(method) {
    // 如果不是开发模式
    if (!IS_DEV) {
      return false
    }

    // 如果实例禁用调试
    if (!this.$debug) {
      return false
    }

    // 以子命名空间的状态优先
    let status = Logger.options[this.$name]
    // 先判断其子命名空间的状态

    // 如果存在放法名，则判断子命名空间
    // 当前方法名存在子命名空间里且明确设置为false时，则不打印
    // 当前子命名空间如果明确false，则不打印
    if (method) {
      const subStatus = Logger.options[`${this.$name}.${method}`]

      if (validation.isBoolean(subStatus)) {
        status = subStatus
      }
    }

    // 如果明确指定该命名空间不开启日志打印，则不打印
    if (status === false) {
      return false
    }

    return true
  }

  log = _actions.factory(this, 'log', 'lightseagreen')
  warn = _actions.factory(this, 'warn', 'goldenrod')
  trace = _actions.factory(this, 'trace', 'lightseagreen')

  /**
   * 抛出错误日志
   * @param {array} args - 参数列表
   */
  error(...args) {
    const message = args.map((value) => {
      return value.toString()
    }).join(' ')

    throw new Error(message)
  }

  /**
   * 创建一个指定颜色的打印方法
   * @param {string} color - 颜色值
   * @returns {Function} - 返回指定颜色的打印方法
   */
  color(color) {
    return _actions.factory(this, 'log', `${color}`)
  }

  /**
   * 启用日志打印功能
   * @returns {Logger} - 返回实例自身
   */
  enable() {
    this.$debug = true
    return this
  }

  /**
   * 禁用日志打印功能
   * @returns {Logger} - 返回实例自身
   */
  disable() {
    this.$debug = false
    return this
  }

  info = this.log
  debug = this.log

  /**
   * 对象或数组类型数据以表格的方式打印，若非这两种数据类型，则调用log方法打印
   * @param {*} data - 需要打印的数据1
   * @returns {Logger} - 返回实例自身
   */
  table(data) {
    if (validation.isArray(data) && validation.isPlainObject(data)) {
      return this.log(data)
    }

    return _actions.proxyRun(this, 'table')(data)
  }

  dir = _actions.proxyRun(this, 'dir')
  dirxml = _actions.proxyRun(this, 'dirxml')

  group = _actions.proxyRun(this, 'group')
  groupCollapsed = _actions.proxyRun(this, 'groupCollapsed')
  groupEnd = _actions.proxyRun(this, 'groupEnd')

  count = _actions.proxyRun(this, 'count')

  time = _actions.proxyRun(this, 'time')
  timeEnd = _actions.proxyRun(this, 'timeEnd')
  timeStamp = _actions.proxyRun(this, 'timeStamp')
  profile = _actions.proxyRun(this, 'profile')
  profileEnd = _actions.proxyRun(this, 'profileEnd')

  assert = _actions.proxyRun(this, 'assert')

  clear = _actions.proxyRun(this, 'clear')
}
