/* eslint-disable */

/**
 * 日志打印器 基于大哥 的log改版
 *
 * 模块性质：工具模块
 * 作用范围：pc、mobile
 * 依赖模块：utils/env
 * 来源项目：扫码点单H5
 * 初始发布日期：2017-05-24 20:00
 * 最后更新日期：2017-10-16 13:46
 *
 * ## 特性
 * - [注]只会在开发模式下打印日志内容
 * - 若需要在生产环境下调式日志，可以更改或设置LS离线存储的值：如设置为开发环境，并配置哪些命名空间的日志需要打印
 * - 所以当你在生产环境时，你可以将当前的开发模式开启，然后通过再更改对应的日志打印器命名空间来开启日志打印 * - 可以配置指定的命名空间是否打印内容
 * - 支持配置子命名空间，指定某个方法名才打印
 * - 提供四个方法，打印不同级别的日志内容：log，warn，error，trace
 * - 如果在开发模式则不支持打印，可以通过localstorage更改为开发模式
 *
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
 * ```
 *
 * @version 1.1.0
 */

import IS_DEV from './env'

// // 变量类型简写对应
// const TYPE_ABBR = {
//   'undefined': 'undef.',
//   'null': 'null',
//   'number': 'num.',
//   'string': 'str.',
//   'boolean': 'bool.',
//   'array': 'arr.',
//   'object': 'obj.',
//   'function': 'fun.',
//   'date': 'date',
//   'regexp': 'reg.',
//   'error': 'err.',
//   'element': 'dom.'
// }

// 私有方法
const _actions = {
  /**
   * 获取变量值的数据类型名称
   * @param {*} value - 变量值
   * @returns {string} 返回数据类型名称
   */
  'typeof': function (value) {
    return Object.prototype.toString.call(value).slice(8, -1)
  },
  /**
   * 获取变量值的数据类型缩写格式
   * @param {*} value - 变量值
   * @returns {string} 返回缩写格式
   */
  // getTypeAbbrStr (value) {
  //   let type = _actions.typeof(value)
  //   // 如果是dom元素节点，只则输出element
  //   if (type.indexOf('element') >= 0) {
  //     type = 'element'
  //   }
  //
  //   return TYPE_ABBR[type]
  // }
}

// 所有日志打印器的命名空间
const LOG_MAP = {
  group: 'color: lightseagreen',
  trace: 'color: lightseagreen',
  log: 'color: lightseagreen',
  warn: 'color: goldenrod',
  error: 'color: red',
}

/**
 * 日志打印类
 * @class Logger 日志打印类
 */
export default class Logger {
  $name = undefined
  $debug = undefined

  /**
   * 构造函数器
   * @constructor
   * @param {object|string} options - 日志器命名空间
   * @param {string} name - 日志器命名空间
   */
  constructor(options) {
    let $options = {
      name: 'logger',
      debug: true
    }

    if (typeof options === 'string') {
      $options.name = options
    } else {
      $options = {
        ...$options,
        ...options
      }
    }

    this.$name = $options.name
    this.$debug = $options.debug
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
    Logger.options = Object.assign(options, Logger.options)
  }
}

/**
 * 在原型上增加实例方法
 */
Object.entries(LOG_MAP).forEach(([method, color]) => {
  // 查找ls中是否存在打印命名空间配置项，若存在，则进行替换覆盖
  // 判断是否存在子命名空间，依次判断子命名空间的长度
  Logger.prototype[method] = function (...args) {
    // 如果实例未开启调试模式
    if (!this.$debug) {
      return false
    }

    // 如果不是开发模式
    if (!IS_DEV) {
      return false
    }

    // 以子命名空间的状态优先
    let status = Logger.options[this.$name]
    // 先判断其子命名空间的状态

    // 当前方法名存在子命名空间里且明确设置为false时，则不打印
    // 当前子命名空间如果明确false，则不打印
    const subStatus = Logger.options[`${this.$name}.${method}`]

    if (typeof subStatus === 'boolean') {
      status = subStatus
    }

    // 如果明确指定该命名空间不开启日志打印，则不打印
    if (status === false) {
      return false
    }

    let formatStr = `%c[${this.$name}]:%c`
    /* eslint-disable no-console */
    if (method === 'group') {
      // 第一个参数为字符串格式时将作为组名
      if (_actions.typeof(args[0]) === 'String') {
        console.group(formatStr, color, '', args[0])
        args.splice(0, 1)
      } else {
        console.group(formatStr, color, '')
      }

      // 换了一种方式，使用group
      // [msl] dir方法需要特殊处理，内部使用console.groupCollapsed实现
      // 参数逐个打印

      const typeStyle = 'color:white;font-size:x-small;background-color:black'
      // 组成新的格式化字符串
      // 和占位参数值数组

      // 数组和对象就不需要打印类型名称了
      args.forEach((arg) => {
        // 提前求得类型缩写
        const typeAbbr = _actions.typeof(arg)
        // 如果参数值是dom节点，则转换成json对象格式输出
        if (_actions.typeof(arg).indexOf('Element') >= 0) {
          arg = [arg]
        }
        console.log('%c%s', typeStyle, typeAbbr, arg)
      })

      console.groupEnd()
    } else {
      // 遍历参数列表，找出dom元素，进行转换
      args = args.map((arg) => {
        if (_actions.typeof(arg).indexOf('Element') >= 0) {
          return [arg]
        }
        return arg
      })

      console[method](formatStr, color, '', ...args)
    }
    /* eslint-enable */
  }
})
