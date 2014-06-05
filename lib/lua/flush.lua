require "_utils"
local args = utils.getArgs()
local prefix = args['prefix']
local event = args['event']
local now = tonumber(args['now'])
local ttl = tonumber(args['ttl'])
local fieldTypes = utils.decode(args['fieldTypes'])

-- Specify $date range
local minValue = now - ttl
local maxValue = '+inf'
local zsetKey = prefix .. 'indexes:' .. event .. ':$date'

-- Fetch ids
local ids = redis.call('zrangebyscore', zsetKey, minValue, maxValue)
redis.log(redis.LOG_NOTICE, cjson.encode(ids))

-- Delete events
for _, id in ipairs(ids) do
  -- Delete event key
  redis.call('del', prefix .. 'events:' .. id)

  -- Delete from set
  redis.call('srem', prefix .. 'set:' .. event, id)

  -- Find numeric fields, remove indexes
  for fieldName, fieldType in pairs(fieldTypes[event]) do
    if utils.tableContains({'number', 'timestamp'}, fieldType) then
      redis.call('zrem', prefix .. 'indexes:' .. event .. ':' .. fieldName, id)
    end
  end
end
