require "_utils"

local args = utils.getArgs()
local prefix = args['prefix']
local id = args['id'];
local fieldTypes = utils.decode(args['fieldTypes'])
local eventKey = prefix .. 'events:' .. id
local event = utils.hgetall(eventKey)
utils.fixFieldTypes({event}, fieldTypes[event['$event']])
return cjson.encode(event)
