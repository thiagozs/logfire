local prefix = args['prefix']

-- Split events string into a table of strings
local eventNames = {}
for eventName in string.gmatch(args['events'], '([^,]+)') do
  table.insert(eventNames, eventName)
end

-- Find all events for each given event name
local events = {}
for i, eventName in pairs(eventNames) do
  local setKey = prefix .. 'events:' .. eventName .. ':set'
  local ids = redis.call('smembers', setKey)
  for i, id in pairs(ids) do
    local data = hgetall(prefix .. 'events:' .. id)
    table.insert(events, data)
  end
end

return cjson.encode(events)
