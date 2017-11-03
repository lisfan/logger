/**
 * @file 日志打印器
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.2.0
 * @licence MIT
 */

import validation from '@~lisfan/validation'
import IS_DEV from './utils/env'

/**
 * 从`localStorage`的`LOGGER_RULES`键中读取规则配置，以便可以在生产环境开启日志打印调试
 */
const LOGGER_RULES = JSON.parse(global.localStorage.getItem('LOGGER_RULES')) || {}

// 私有方法
const _actions = {
  /**
   * 打印器工厂函数
   * 查找ls中是否存在打印命名空间配置项，若存在，则进行替换覆盖
   * 判断是否存在子命名空间，依次判断子命名空间的长度
   * @param {Logger} self - Logger实例
   * @param {string} method - 打印方法
   * @param {string} color - 颜色值，web安全色 http://www.w3school.com.cn/tiy/color.asp?color=LightGoldenRodYellow
   * @returns {function} - 返回封装后的的打印方法
   */
  logFactory(self, method, color) {
    return function (...args) {
      return _actions.logProxyRun(self, method, color, ...args)
    }
  },
  /**
   * 代理运行打印方法
   * @param {Logger} self - Logger实例
   * @param {string} method - 打印方法
   * @param {string} color - 打印颜色，颜色值，web安全色 http://www.w3school.com.cn/tiy/color.asp?color=LightGoldenRodYellow
   * @param {...*} args - 其他参数
   * @returns {Logger} - 返回实例自身
   */
  logProxyRun(self, method, color, ...args) {
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
  },
  /**
   * 代理运行console方法
   * [注] 内部会进行判断是否允许日志输出
   * @param {Logger} self - Logger实例
   * @param {string} method - 打印方法
   * @param {...*} args - 其他参数
   * @returns {Logger} - 返回实例自身
   */
  proxyRun(self, method, ...args) {
    if (self.isActivated(method)) {
      /* eslint-disable no-console */
      console[method](...args)
      /* eslint-enable no-console */
    }

    return self
  }
}

// 默认规则配置
let _rules = {}
// 默认实例配置
let _options = {
  name: 'logger',
  debug: true,
}

/**
 * @classdesc
 * 日志打印类
 *
 * @class
 */
class Logger {
  /**
   * 打印器命名空间规则配置项
   * - 可以配置整个命名空间是否输出日志
   * - 也可以配置命名空间下某个实例方法是否输出日志
   *
   * @since 1.2.0
   * @memberOf Logger
   * @static
   * @readonly
   * @property {object} rules - 打印器命名空间规则配置集合
   */
  static get rules() {
    return _rules
  }

  /**
   * 更改命名空间规则配置项
   * [注]从`localStorage`的`LOGGER_RULES`键中读取规则配置优先级最高，始终会覆盖其他规则
   *
   * @since 1.2.0
   * @static
   * @param {object} rules - 配置参数
   * @param {string} [rules.name] - 日志器命名空间
   * @param {boolean} [rules.debug] - 调试模式是否开启
   * @returns {Logger}
   * @example
   * // 定义规则
   * Logger.configRules = {
   *    utils-http:false // 整个utils-http不可打印输出
   *    utils-calc.log=true // utils-calc打印器的log方法不支持打印输出
   * }
   */
  static configRules(rules) {
    const ctor = this

    _rules = {
      ..._rules,
      ...rules,
      ...LOGGER_RULES,
    }

    return ctor
  }

  /**
   * 默认配置选项
   * 为了在生产环境能开启调试模式
   * 提供了从localStorage获取默认配置项的措施
   *
   * @since 1.0.0
   * @memberOf Logger
   * @readonly
   * @static
   * @property {string} name='logger' - 日志器命名空间，默认为'logger'
   * @property {boolean} debug=true - 调试模式是否开启，默认开启
   */
  static get options() {
    return _options
  }

  /**
   * 更新默认配置选项
   *
   * @since 1.0.0
   * @static
   * @param {object} options - 配置参数
   * @param {string} [options.name] - 日志器命名空间
   * @param {boolean} [options.debug] - 调试模式是否开启
   * @return {Logger}
   */
  static config(options) {
    const ctor = this

    // 以内置配置为优先
    _options = {
      ..._options,
      ...options
    }

    return ctor
  }

  /**
   * 构造函数
   *
   * @param {object} [options] - 实例配置选项，若参数为`string`类型，则表示设定为`options.name`的值
   * @param {string} [options.name] - 日志器命名空间
   * @param {boolean} [options.debug] - 调试模式是否开启
   */
  constructor(options) {
    const ctor = this.constructor

    if (validation.isString(options)) {
      this._options = {
        ...ctor.options,
        name: options
      }
    } else {
      this._options = {
        ...ctor.options,
        ...options
      }
    }
  }

  // 实例配置项
  _options = {}

  /**
   * 实例的配置项
   *
   * @since 1.0.0
   * @readonly
   * @returns {object}
   */
  get $options() {
    return this._options
  }

  /**
   * 获取实例的命名空间配置项
   *
   * @since 1.1.0
   * @readonly
   * @returns {string}
   */
  get $name() {
    return this.$options.name
  }

  /**
   * 获取实例的调试模式配置项
   *
   * @since 1.1.0
   * @returns {string}
   */
  get $debug() {
    return this.$options.debug
  }

  // /**
  //  * 设置实例的调试配置项
  //  *
  //  * @since 1.1.0
  //  * @setter
  //  * @param {boolean} value - 启用或关闭
  //  */
  // set $debug(value) {
  //   this.$options.debug = value
  // }

  /**
   * 检测当前是否调试模式是否激活：可以打印日志
   *
   * @since 1.1.0
   * @param {string} [method] - 若指定了该参数，则精确检测具体的实例方法
   * @returns {boolean}
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

    const ctor = this.constructor
    // 以子命名空间的状态优先
    let status = ctor.rules[this.$name]
    // 先判断其子命名空间的状态

    // 如果存在放法名，则判断子命名空间
    // 当前方法名存在子命名空间里且明确设置为false时，则不打印
    // 当前子命名空间如果明确false，则不打印
    if (method) {
      const subStatus = ctor.rules[`${this.$name}.${method}`]

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

  /**
   * 创建一个指定颜色的打印方法
   *
   * @since 1.1.0
   * @param {string} color - 颜色值
   * @returns {Function} - 返回自定义颜色的打印方法
   */
  color(color) {
    return _actions.logFactory(this, 'log', `${color}`)
  }

  /**
   * 启用日志输出
   *
   * @since 1.1.0
   * @returns {Logger}
   */
  enable() {
    this._options.debug = true
    return this
  }

  /**
   * 禁用日志输出
   *
   * @since 1.1.0
   * @returns {Logger}
   */
  disable() {
    this._options.debug = false
    return this
  }

  /**
   * 常规日志打印
   *
   * @since 1.0.0
   * @function
   * @param {...*} args - 任意数据
   * @return {Logger}
   */
  log(...args) {
    return _actions.logProxyRun(this, 'log', 'lightseagreen', ...args)
  }

  /**
   * 警告日志打印
   *
   * @since 1.0.0
   * @function
   * @param {...*} args - 任意数据
   * @return {Logger}
   */
  warn(...args) {
    return _actions.logProxyRun(this, 'warn', 'goldenrod', ...args)
  }

  /**
   * 调用栈日志打印
   *
   * @since 1.0.1
   * @function
   * @param {...*} args - 任意数据
   * @return {Logger}
   */
  trace(...args) {
    return _actions.logProxyRun(this, 'trace', 'lightseagreen', ...args)
  }

  /**
   * 错误日志打印，同时会抛出错误，阻塞后续逻辑
   *
   * @since 1.0.0
   * @param {...*} args - 参数列表
   * @throws Error - 抛出错误提示
   */
  error(...args) {
    const message = args.map((value) => {
      return value.toString()
    }).join(' ')

    throw new Error(message)
  }

  /**
   * log的同名方法，使用方法请参考{@link Logger#log}
   *
   * @since 1.1.0
   * @function
   * @param {...*} args - 任意数据
   * @return {Logger}
   * @see Logger#log
   *
   */
  info(...args) {
    return this.log(...args)
  }

  /**
   * log的同名方法，使用方法请参考{@link Logger#log}
   *
   * @since 1.1.0
   * @function
   * @param {...*} args - 任意数据
   * @return {Logger}
   * @see Logger#log
   */
  debug(...args) {
    return this.log(...args)
  }

  /**
   * 区别于console.table
   * - 对象或数组类型数据以表格的方式打印
   * - 若非这两种数据类型，则调用log方法打印
   *
   * @since 1.1.0
   * @param {*} data - 任意数据
   * @returns {Logger}
   */
  table(data) {
    if (validation.isArray(data) && validation.isPlainObject(data)) {
      return this.log(data)
    }

    return _actions.proxyRun(this, 'table', data)
  }

  /**
   * 打印纯对象数据
   *
   * @since 1.1.0
   * @function
   * @param {object} obj - 纯对象数据
   * @return {Logger}
   */
  dir(...args) {
    return _actions.proxyRun(this, 'dir', ...args)
  }

  /**
   * 打印纯对象数据
   *
   * @since 1.1.0
   * @function
   * @param {object} obj - 纯对象数据
   * @return {Logger}
   */
  dirxml(...args) {
    return _actions.proxyRun(this, 'dirxml', ...args)
  }

  /**
   * 创建一个组，接下来所有的打印内容，都会包裹在组内，直到调用groupEnd()方法结束，退出组
   *
   * @since 1.1.0
   * @function
   * @param {string} [label] - 标签名称
   * @return {Logger}
   */
  group(...args) {
    return _actions.proxyRun(this, 'group', ...args)
  }

  /**
   * 类似group()方法，区别在于调用该方法后打印的内容都是折叠的，需要手动展开
   *
   * @since 1.1.0
   * @function
   * @param {string} [label] - 标签名称
   * @return {Logger}
   */
  groupCollapsed(...args) {
    return _actions.proxyRun(this, 'groupCollapsed', ...args)
  }

  /**
   * 关闭组
   *
   * @since 1.1.0
   * @function
   * @return {Logger}
   */
  groupEnd(...args) {
    return _actions.proxyRun(this, 'groupEnd', ...args)
  }

  /**
   * 统计被执行的次数
   *
   * @since 1.1.0
   * @function
   * @param {string} [label] - 标签名称
   * @return {Logger}
   */
  count(...args) {
    return _actions.proxyRun(this, 'count', ...args)
  }

  /**
   * 开始设置一个timer追踪操作任意的消耗时间，直到调用timeEnd()结束追踪，消耗时间单位为毫秒
   *
   * @since 1.1.0
   * @function
   * @param {string} label - 标签名称
   * @return {Logger}
   */
  time(...args) {
    return _actions.proxyRun(this, 'time', ...args)
  }

  /**
   * 结束追踪
   *
   * @since 1.1.0
   * @function
   * @return {Logger}
   */
  timeEnd(...args) {
    return _actions.proxyRun(this, 'timeEnd', ...args)
  }

  /**
   * 结束追踪
   *
   * @since 1.1.0
   * @function
   * @return {Logger}
   */
  timeStamp(...args) {
    return _actions.proxyRun(this, 'timeStamp', ...args)
  }

  /**
   * 开始记录一个性能分析简报，直到调用profileEnd()结束记录
   *
   * @since 1.1.0
   * @function
   * @return {Logger}
   */
  profile(...args) {
    return _actions.proxyRun(this, 'profile', ...args)
  }

  /**
   * 结束记录
   *
   * @since 1.1.0
   * @function
   * @return {Logger}
   */
  profileEnd(...args) {
    return _actions.proxyRun(this, 'profileEnd', ...args)
  }

  /**
   * 断言表达式，若结果为false，是抛出失败输出
   *
   * @since 1.1.0
   * @function
   * @param {boolean}  assertion - 表达式
   * @param {...*} - 断言失败输出
   * @return {Logger}
   */
  assert(...args) {
    return _actions.proxyRun(this, 'assert', ...args)
  }

  /**
   * 清空控制台
   *
   * @since 1.1.0
   * @function
   * @return {Logger}
   */
  clear(...args) {
    return _actions.proxyRun(this, 'clear', ...args)
  }
}

export default Logger
