/**
 * 日志打印器
 * 解决eslint提交时，无法提交console的语句
 * 同时可以通过配置做到仅在开发环境打印日志，生产环境不打印日志
 *
 * 模块性质：工具模块
 * 作用范围：pc、mobile
 * 依赖模块：utils/env
 * 来源项目：扫码点单H5
 * 初始发布日期：2017-05-24
 * 最后更新日期：2017-18-16
 *
 * ## 特性
 * - 只会在开发模式下打印日志内容
 * - 支持配置切换开关的命名空间下的日志打印
 * - 支持配置切换开关的命名空间下的子命名日志打印，即指定某个实例方法名才可打印
 * - 支持console方法的所有的方法（包含部分非标准APi，不包含未被废弃的API），部分api做了变化和新增加，未提及的保持原效果不变，只是在原api上封装了一层进行代理运行
 *    - 新增的isActivated、color、enable、disable方法
 *    - 调整error()方法的作用：打印时会抛出错误，阻止脚本执行
 *    - 调整table()方法的作用：如果数据非array或object类型，则使用this.log打印
 * - 若需要在生产环境下调式日志，可以更改或设置LS离线存储的值
 *    - 设置`IS_DEV`为true
 *    - 设置`LOGGER`配置对象（字典格式）
 * ## Changelog
 * ### 2017-05-18
 * - 改成类定义方式
 *
 * ### 2017-06-10
 * - 日志打印器的启用方式增加localstoreage热开启
 * - 支持子命名空间打印
 *
 * ### 2017-06-19
 * - 将打印中涉及dom的打印，都转换成打印其dom属性，而不是dom字符串
 * - 增加group()打印方法，按组打印，如果第一个参数是字符串类型，则作为组名称标识，之后的每一个参数都会作为一个单独的打印项，并打印出其数据类型字符串标识
 *
 * ### 2017-08-21
 * - 从先以**父**命名空间为主判断依据更改为以**子**命名空间为主判断依据
 * - 例如关闭全局命名空间`util-http`的日志，但独立开启`utils-http.error`http的错误日志
 *
 * ### 2017-10-16
 * - 移除是否对生产环境的依赖，从离线存储中取值时只判断该值是否已存在
 *
 * ### 2017-10-17
 * - [refactor] 小重构
 * - [feature] 增加实例化时新的配置选项：debug，若设置debug为false，则当前实例不打印日志
 * - [feature] 增加新API，开启日志输出功能(enable)，和关闭日志输出功能(disable)
 *
 *
 * ## Usage
 * ``` js
 *
 * import Logger from 'utils/logger'
 *
 * Logger.config({
 *    request:true,
 *    request.error:false,
 *    response:false // 该命名空间禁止打印
 * })
 *
 * const loggerRequest = new Logger('request')
 * const loggerResponse = new Logger('response')
 *
 * loggerRequest.log('请求url')    =>    [request]: 请求url
 * loggerRequest.error('请求url')    =>    // 无内容打印
 * loggerResponse.error('响应数据')    =>    // 无内容打印
 *
 * // 实例关闭日志打印功能
 * const loggerDebug = new Logger({
 *    name: 'debug',
 *    debug: false
 *  })
 *
 * loggerDebug.log('请求url')    =>     // 无内容打印
 * loggerDebug.error('请求url')    =>    // 无内容打印
 * loggerDebug.error('响应数据')    =>    // 无内容打印
 *
 * ```
 *
 * @version 1.1.0
 */

import valid from '@~lisfan/validation'
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
          if (valid.isElement(arg)) {
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

    if (valid.isString(options)) {
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
   * @param {string} value - 值
   */
  set $name(value) {
    this.$options.name = value
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

      if (valid.isBoolean(subStatus)) {
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
    if (valid.isArray(data) && valid.isPlainObject(data)) {
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
