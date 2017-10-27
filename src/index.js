/**
 * @file 日志打印器
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.1.0
 * @licence MIT
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
 * 日志打印器
 *
 * @class
 */
class Logger {
  /**
   * 日志打印命名空间启用输出开关，默认命名空间自动输出日志，设置为false时，可以关才输出
   * @memberOf Logger
   * @static
   */
  static options = JSON.parse(global.localStorage.getItem('LOGGER')) || {}

  /**
   * 更改全局配置参数
   * @static
   * @param {object} options - 配置参数
   */
  static config(options) {
    // 以内置配置为优先
    Logger.options = {
      ...options,
      ...Logger.options
    }
  }

  /**
   * 构造函数器
   *
   * @param {object|string} options - 配置选项，若为`string`类型，表示指定为`name`属性
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
   * @readonly
   * @returns {string}
   */
  get $name() {
    return this.$options.name
  }

  /**
   * 设置实例命名空间值
   *
   * @ignore
   * @param {string} value - 值
   */
  set $name(value) {
    // this.$options.name = value
  }

  /**
   * 获取实例调试模式值
   *
   * @returns {string}
   */
  get $debug() {
    return this.$options.debug
  }

  /**
   * 设置实例调试模式值
   *
   * @ignore
   * @param {boolean} value - 值
   */
  set $debug(value) {
    this.$options.debug = value
  }

  /**
   * 检测当前实例是否可以打印
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

  /**
   * 常规日志打印
   *
   * @function
   * @param {...*} args - 任意数据
   * @return {Logger}
   */
  log = _actions.factory(this, 'log', 'lightseagreen')

  /**
   * 警告日志打印
   *
   * @function
   * @param {...*} args - 任意数据
   * @return {Logger}
   */
  warn = _actions.factory(this, 'warn', 'goldenrod')

  /**
   * 调用栈日志打印
   *
   * @function
   * @param {...*} args - 任意数据
   * @return {Logger}
   */
  trace = _actions.factory(this, 'trace', 'lightseagreen')

  /**
   * 错误日志打印，同时会抛出错误，阻塞后续逻辑
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
   * 创建一个指定颜色的打印方法
   * @param {string} color - 颜色值
   * @returns {Function} - 返回自定义颜色的打印方法
   */
  color(color) {
    return _actions.factory(this, 'log', `${color}`)
  }

  /**
   * 启用日志输出
   * @returns {Logger}
   */
  enable() {
    this.$debug = true
    return this
  }

  /**
   * 禁用日志输出
   * @returns {Logger}
   */
  disable() {
    this.$debug = false
    return this
  }

  /**
   * log的同名方法，请参考{@link Logger#log}
   * @function
   * @see Logger#log
   */
  info = this.log
  /**
   * log的同名方法，请参考{@link Logger#log}
   * @function
   * @see Logger#log
   */
  debug = this.log

  /**
   * 区别于console.table
   * - 对象或数组类型数据以表格的方式打印
   * - 若非这两种数据类型，则调用log方法打印
   *
   * @param {*} data - 任意数据
   * @returns {Logger}
   */
  table(data) {
    if (validation.isArray(data) && validation.isPlainObject(data)) {
      return this.log(data)
    }

    return _actions.proxyRun(this, 'table')(data)
  }

  /**
   * 打印纯对象数据
   *
   * @function
   * @param {object} obj - 纯对象数据
   * @return {Logger}
   */
  dir = _actions.proxyRun(this, 'dir')

  /**
   * 打印纯对象数据
   *
   * @function
   * @param {object} obj - 纯对象数据
   * @return {Logger}
   */
  dirxml = _actions.proxyRun(this, 'dirxml')

  /**
   * 创建一个组，接下来所有的打印内容，都会包裹在组内，直到调用groupEnd()方法结束，退出组
   *
   * @function
   * @param {string} [label] - 标签名称
   * @return {Logger}
   */
  group = _actions.proxyRun(this, 'group')
  /**
   * 类似group()方法，区别在于调用该方法后打印的内容都是折叠的，需要手动展开
   *
   * @function
   * @param {string} [label] - 标签名称
   * @return {Logger}
   */
  groupCollapsed = _actions.proxyRun(this, 'groupCollapsed')

  /**
   * 关闭组
   *
   * @function
   * @return {Logger}
   */
  groupEnd = _actions.proxyRun(this, 'groupEnd')

  /**
   * 统计被执行的次数
   *
   * @function
   * @param {string} [label] - 标签名称
   * @return {Logger}
   */
  count = _actions.proxyRun(this, 'count')

  /**
   * 开始设置一个timer追踪操作任意的消耗时间，直到调用timeEnd()结束追踪，消耗时间单位为毫秒
   *
   * @function
   * @param {string} label - 标签名称
   * @return {Logger}
   */
  time = _actions.proxyRun(this, 'time')

  /**
   * 结束追踪
   *
   * @function
   * @return {Logger}
   */
  timeEnd = _actions.proxyRun(this, 'timeEnd')

  /**
   * 结束追踪
   *
   * @function
   * @return {Logger}
   */
  timeStamp = _actions.proxyRun(this, 'timeStamp')

  /**
   * 开始记录一个性能分析简报，直到调用profileEnd()结束记录
   *
   * @function
   * @return {Logger}
   */
  profile = _actions.proxyRun(this, 'profile')
  /**
   * 结束记录
   *
   * @function
   * @return {Logger}
   */
  profileEnd = _actions.proxyRun(this, 'profileEnd')

  /**
   * 断言表达式，若结果为false，是抛出失败输出
   *
   * @function
   * @param {boolean}  assertion - 表达式
   * @param {...*} - 断言失败输出
   * @return {Logger}
   */
  assert = _actions.proxyRun(this, 'assert')

  /**
   * 清空控制台
   *
   * @function
   * @return {Logger}
   */
  clear = _actions.proxyRun(this, 'clear')
}

export default Logger