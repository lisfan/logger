# logger 日志打印器

解决eslint提交时，无法提交console的语句
同时可以通过配置做到仅在开发环境打印日志，生产环境不打印日志


## Feature 特性
- 只会在开发模式下打印日志内容
- 支持配置切换开关的命名空间下的日志打印
- 支持配置切换开关的命名空间下的子命名日志打印，即指定某个实例方法名才可打印
- 支持console方法的所有的方法（包含部分非标准APi，不包含未被废弃的API），部分api做了变化和新增加，未提及的保原效果不变，只是在原api上封装了一层进行代理运行
   - 新增的isActivated、color、enable、disable方法
   - 调整error()方法的作用：打印时会抛出错误，阻止脚本执行
   - 调整table()方法的作用：如果数据非array或object类型，则使用this.log打印
- 若需要在生产环境下调式日志，可以更改或设置LS离线存储的值
   - 设置`IS_DEV`为true
   - 设置`LOGGER`配置对象（字典格式）

## Usage 起步

``` js
import Logger from '@~lisfan/logger'

Logger.config({
   request:true,
   request.error:false,
   response:false // 该命名空间禁止打印
})

const loggerRequest = new Logger('request')
const loggerResponse = new Logger('response')

loggerRequest.log('请求url')    =>    [request]: 请求url
loggerRequest.error('请求url')    =>    // 无内容打印
loggerResponse.error('响应数据')    =>    // 无内容打印

// 实例关闭日志打印功能
const loggerDebug = new Logger({
   name: 'debug',
   debug: false
 })

loggerDebug.log('请求url')    =>     // 无内容打印
loggerDebug.error('请求url')    =>    // 无内容打印
loggerDebug.error('响应数据')    =>    // 无内容打印

```