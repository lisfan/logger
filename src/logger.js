/**
 * @file 日志打印器
 */

import validation from '@~lisfan/validation'

/**
 * 从`localStorage`的`LOGGER_RULES`键中读取**打印规则**配置，以便可以在生产环境开启日志打印调试
 */
const LOGGER_RULES = JSON.parse(global.localStorage.getItem('LOGGER_RULES')) || {}

/**
 * 从`localStorage`的`IS_DEV`键中读取是否为**开发环境**配置，以便可以在生产环境开启日志打印调试
 */
const IS_DEV = JSON.parse(global.localStorage.getItem('IS_DEV')) || process.env.NODE_ENV === 'development'

// 私有方法
const _actions = {
  /**
   * 打印器工厂函数
   * 查找ls中是否存在打印命名空间配置项，若存在，则进行替换覆盖
   * 判断是否存在子命名空间，依次判断子命名空间的长度
   *
   * @since 1.3.0
   *
   * @param {Logger} self - Logger实例
   * @param {string} method - 打印方法
   * @param {string} color - 颜色值，web安全色 http://www.w3school.com.cn/tiy/color.asp?color=LightGoldenRodYellow
   *
   * @returns {function}
   */
  logFactory(self, method, color) {
    return (...args) => {
      return _actions.logProxyRun(self, method, color, ...args)
    }
  },
  /**
   * 代理运行打印方法
   *
   * @since 1.3.0
   *
   * @param {Logger} self - Logger实例
   * @param {string} method - 打印方法
   * @param {string} color - 打印颜色，颜色值，web安全色 http://www.w3school.com.cn/tiy/color.asp?color=LightGoldenRodYellow
   * @param {...*} args - 其他参数
   *
   * @returns {Logger}
   */
  logProxyRun(self, method, color, ...args) {
    // 处于非激活状态的话则不输出日志
    if (!self.isActivated(method)) {
      return self
    }

    let formatStr = `%c[${self.$name}]:%c`

    // 遍历参数列表，找出dom元素，进行转换
    args = args.map((arg) => {
      return validation.isElement(arg)
        ? [arg]
        : arg
    })

    /* eslint-disable no-console */
    console[method](formatStr, `color: ${color}`, '', ...args)
    /* eslint-enable no-console */

    return self
  },
  /**
   * 代理运行console方法
   * [注] 内部会进行判断是否允许日志输出
   *
   * @since 1.3.0
   *
   * @param {Logger} self - Logger实例
   * @param {string} method - 打印方法
   * @param {...*} args - 其他参数
   *
   * @returns {Logger}
   */
  proxyRun(self, method, ...args) {
    /* eslint-disable no-console */
    self.isActivated(method) && console[method](...args)
    /* eslint-enable no-console */

    return self
  }
}

/**
 * @classdesc 日志打印类
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
   *
   * @static
   * @readonly
   * @memberOf Logger
   *
   * @type {object}
   * @property {object} rules - 打印器命名空间规则配置集合
   */
  static rules = LOGGER_RULES

  /**
   * 更改命名空间规则配置项
   * [注]从`localStorage`的`LOGGER_RULES`键中读取规则配置优先级最高，始终会覆盖其他规则
   *
   * @since 1.2.0
   *
   * @param {object} rules - 配置参数
   * @param {string} [rules.name] - 日志器命名空间
   * @param {boolean} [rules.debug] - 调试模式是否开启
   *
   * @returns {Logger}
   *
   * @example
   * // 定义规则
   * Logger.configRules = {
   *    utils-http:false // 整个utils-http不可打印输出
   *    utils-calc.log=true // utils-calc打印器的log方法不支持打印输出
   * }
   */
  static configRules(rules) {
    const ctr = self
    ctr.rules = {
      ...ctr.rules,
      ...rules,
      ...LOGGER_RULES,
    }

    return ctr
  }

  /**
   * 默认配置选项
   * 为了在生产环境能开启调试模式
   * 提供了从localStorage获取默认配置项的措施
   *
   * @since 1.0.0
   *
   * @static
   * @readonly
   * @memberOf Logger
   *
   * @type {object}
   * @property {string} name='logger' - 日志器命名空间，默认为'logger'
   * @property {boolean} debug=true - 调试模式是否开启，默认开启
   */
  static options = {
    name: 'logger',
    debug: true,
  }

  /**
   * 更新默认配置选项
   *
   * @since 1.0.0
   *
   * @see Logger.options
   *
   * @param {object} options - 配置选项见{@link Logger.options}
   *
   * @returns {Logger}
   */
  static config(options) {
    const ctr = self
    // 以内置配置为优先
    ctr.options = {
      ...ctr.options,
      ...options
    }

    return this
  }

  /**
   * 构造函数
   *
   * @see Logger.options
   *
   * @param {object} options - 配置选项见{@link Logger.options}，若参数为`string`类型，则表示设定为`options.name`的值
   */
  constructor(options) {
    const ctr = this.constructor

    this.$options = validation.isString(options)
      ? {
        ...ctr.options,
        name: options
      }
      : {
        ...ctr.options,
        ...options
      }
  }

  /**
   * 实例初始配置项
   *
   * @since 1.0.0
   *
   * @readonly
   *
   * @type {object}
   */
  $options = undefined

  /**
   * 获取实例的命名空间配置项
   *
   * @since 1.1.0
   *
   * @getter
   * @readonly
   *
   * @type {string}
   */
  get $name() {
    return this.$options.name
  }

  /**
   * 获取实例的调试模式配置项
   *
   * @since 1.1.0
   *
   * @getter
   * @readonly
   *
   * @type {boolean}
   */
  get $debug() {
    return this.$options.debug
  }

  /**
   * 检测当前是否调试模式是否激活：可以打印日志
   *
   * @since 1.1.0
   *
   * @param {string} [method] - 若指定了该参数，则精确检测具体的实例方法
   *
   * @returns {boolean}
   */
  isActivated(method) {
    const ctr = this.constructor
    // 如果不是开发模式
    if (!IS_DEV) {
      return false
    }

    // 以子命名空间的状态优先
    let status = ctr.rules[this.$name]
    // 先判断其子命名空间的状态

    // 如果存在放法名，则判断子命名空间
    // 当前方法名存在子命名空间里且明确设置为false时，则不打印
    // 当前子命名空间如果明确false，则不打印
    if (method) {
      const subStatus = ctr.rules[`${this.$name}.${method}`]

      if (validation.isBoolean(subStatus)) status = subStatus
    }

    // 如果明确指定该命名空间不开启日志打印，则不打印
    if (status === false) {
      return false
    }

    // 最后才判断实例是否禁用了调试
    if (!this.$debug) {
      return false
    }

    return true
  }

  /**
   * 创建一个指定颜色的打印方法
   *
   * @since 1.1.0
   *
   * @param {string} color - 颜色值
   *
   * @returns {Function}
   */
  color(color) {
    return _actions.logFactory(this, 'log', `${color}`)
  }

  /**
   * 启用日志输出
   *
   * @since 1.1.0
   *
   * @returns {Logger}
   */
  enable() {
    this.$options.debug = true

    return this
  }

  /**
   * 禁用日志输出
   *
   * @since 1.1.0
   *
   * @returns {Logger}
   */
  disable() {
    this.$options.debug = false

    return this
  }

  /**
   * 常规日志打印
   *
   * @since 1.0.0
   *
   * @param {...*} args - 任意数据
   *
   * @returns {Logger}
   */
  log(...args) {
    return _actions.logProxyRun(this, 'log', 'lightseagreen', ...args)
  }

  /**
   * 警告日志打印
   *
   * @since 1.0.0
   *
   * @param {...*} args - 任意数据
   *
   * @returns {Logger}
   */
  warn(...args) {
    return _actions.logProxyRun(this, 'warn', 'goldenrod', ...args)
  }

  /**
   * 调用栈日志打印
   *
   * @since 1.0.1
   *
   * @param {...*} args - 任意数据
   *
   * @returns {Logger}
   */
  trace(...args) {
    return _actions.logProxyRun(this, 'trace', 'lightseagreen', ...args)
  }

  /**
   * 错误日志打印，同时会抛出错误，阻塞后续逻辑
   *
   * @since 1.0.0
   *
   * @param {...*} args - 参数列表
   *
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
   *
   * @see Logger#log
   *
   * @param {...*} args - 任意数据
   *
   * @returns {Logger}
   */
  info(...args) {
    return this.log(...args)
  }

  /**
   * log的同名方法，使用方法请参考{@link Logger#log}
   *
   * @since 1.1.0
   *
   * @see Logger#log
   *
   * @param {...*} args - 任意数据
   *
   * @returns {Logger}
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
   *
   * @param {*} data - 任意数据
   *
   * @returns {Logger}
   */
  table(data) {
    return validation.isArray(data) && validation.isPlainObject(data)
      ? this.log(data)
      : _actions.proxyRun(this, 'table', data)
  }

  /**
   * 打印纯对象数据
   *
   * @since 1.1.0
   *
   * @param {...*} args - 任意数据
   *
   * @returns {Logger}
   */
  dir(...args) {
    return _actions.proxyRun(this, 'dir', ...args)
  }

  /**
   * 打印纯对象数据
   *
   * @since 1.1.0
   *
   * @param {...*} args - 任意数据
   *
   * @returns {Logger}
   */
  dirxml(...args) {
    return _actions.proxyRun(this, 'dirxml', ...args)
  }

  /**
   * 创建一个组，接下来所有的打印内容，都会包裹在组内，直到调用groupEnd()方法结束，退出组
   *
   * @since 1.1.0
   *
   * @param {string} label - 标签名称
   *
   * @returns {Logger}
   */
  group(label) {
    return _actions.proxyRun(this, 'group', label)
  }

  /**
   * 类似group()方法，区别在于调用该方法后打印的内容都是折叠的，需要手动展开
   *
   * @since 1.1.0
   *
   * @param {string} label - 标签名称
   *
   * @returns {Logger}
   */
  groupCollapsed(label) {
    return _actions.proxyRun(this, 'groupCollapsed', label)
  }

  /**
   * 关闭组
   *
   * @since 1.1.0
   *
   * @returns {Logger}
   */
  groupEnd() {
    return _actions.proxyRun(this, 'groupEnd')
  }

  /**
   * 统计被执行的次数
   *
   * @since 1.1.0
   *
   * @param {string} label - 标签名称
   *
   * @returns {Logger}
   */
  count(label) {
    return _actions.proxyRun(this, 'count', label)
  }

  /**
   * 开始设置一个timer追踪操作任意的消耗时间，直到调用timeEnd()结束追踪，消耗时间单位为毫秒
   *
   * @since 1.1.0
   *
   * @param {string} label - 标签名称
   *
   * @returns {Logger}
   */
  time(label) {
    return _actions.proxyRun(this, 'time', label)
  }

  /**
   * 结束追踪
   *
   * @since 1.1.0
   *
   * @returns {Logger}
   */
  timeEnd() {
    return _actions.proxyRun(this, 'timeEnd')
  }

  /**
   * 结束追踪
   *
   * @since 1.1.0
   *
   * @returns {Logger}
   */
  timeStamp(...args) {
    return _actions.proxyRun(this, 'timeStamp', ...args)
  }

  /**
   * 开始记录一个性能分析简报，直到调用profileEnd()结束记录
   *
   * @since 1.1.0
   *
   * @param {string} label - 标签名称
   *
   * @returns {Logger}
   */
  profile(label) {
    return _actions.proxyRun(this, 'profile', label)
  }

  /**
   * 结束记录
   *
   * @since 1.1.0
   *
   * @returns {Logger}
   */
  profileEnd() {
    return _actions.proxyRun(this, 'profileEnd')
  }

  /**
   * 断言表达式，若结果为false，是抛出失败输出
   *
   * @since 1.1.0
   *
   * @param {boolean}  assertion - 表达式
   * @param {...*} args - 断言失败输出
   *
   * @returns {Logger}
   */
  assert(assertion, ...args) {
    return _actions.proxyRun(this, 'assert', assertion, ...args)
  }

  /**
   * 清空控制台
   *
   * @since 1.1.0
   *
   * @returns {Logger}
   */
  clear() {
    return _actions.proxyRun(this, 'clear')
  }
}

export default Logger
