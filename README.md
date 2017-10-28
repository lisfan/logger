# logger 日志打印器

## Feature 特性
- 解决提交时因eslint提示console的语句无法通过问题
- 在console上包装了一层，支持console的所有的方法（包含部分非标准APi，但不包含未被废弃的API），部分API做了变化和新增加，未提及的保原效果不变，只是在原api上封装了一层进行代理运行，API使用方法可以参考[console API](https://developer.mozilla.org/en-US/docs/Web/API/Console/group)
  - 新增的isActivated、color、enable、disable方法
  - 调整error方法的作用：打印时会抛出错误，阻止脚本执行
  - 调整table方法的作用：如果数据非array或object类型，则使用this.log打印
- 仅在开发环境打印日志，生产环境不打印日志，若需要在生产环境下调式日志，可以更改或设置LS离线存储的值
   - localStorage设置`IS_DEV`为true
   - localStorage设置`LOGGER_RULES`配置命名空间规则
- 支持配置整个命名空间是否输出日志
- 支持配置命名空间下某个实例方法是否输出日志

## 安装

```bash
npm install -S @~lisfan/logger
```
## Usage 起步

``` js
import Logger from '@~lisfan/logger'

// 配置规则
Logger.configRules({
   request:true, // 该命名空间支持打印输出
   request.error:false, // 该命名空间下的error方法不支持打印输出
   response:false // 该命名空间不支持打印输出
})

const logger = new Logger() // 默认打印器，命名空间为`logger`
const loggerRequest = new Logger('request') // 创建命名空间为`request`的打印器
const loggerResponse = new Logger('response')

// 创建打印器，但关闭调试功能
const loggerDebug = new Logger({
   name: 'debug',
   debug: false
})

loggerRequest.log('请求url')    =>    [request]: 请求url
loggerRequest.error('请求url')    =>    // 无内容打印
loggerResponse.error('响应数据')    =>    // 无内容打印
loggerDebug.log('请求url')    =>     // 无内容打印
```