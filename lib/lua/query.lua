local prefix = args['prefix']

local findEventsByIds = function (tbl, ids)
  for i, id in pairs(ids) do
    local data = hgetall(prefix .. 'events:' .. id)
    table.insert(tbl, data)
  end
end

-- Split events string into a table of strings
local eventNames = {}
for eventName in string.gmatch(args['events'], '([^,]+)') do
  table.insert(eventNames, eventName)
end

local response = {}
if args['start'] or args['end'] then
  -- Find all events in the given timespan
  local minValue = '-inf'
  if args['start'] then minValue = args['start'] end
  local maxValue = '+inf'
  if args['end'] then maxValue = args['end'] end

  for i, eventName in pairs(eventNames) do
    local zsetKey = prefix .. 'indexes:' .. eventName .. ':created_at'
    if args['select'] == '$count' then
      local count = redis.call('zcount', zsetKey, minValue, maxValue)
      response[eventName] = (response[eventName] or 0) + count
    else
      local ids = redis.call('zrangebyscore', zsetKey, minValue, maxValue)
      findEventsByIds(response, ids)
    end
  end
else
  -- Find all events for each given event name
  for i, eventName in pairs(eventNames) do
    local setKey = prefix .. 'set:' .. eventName

    if args['select'] == '$count' then
      local count = redis.call('scard', setKey)
      response[eventName] = (response[eventName] or 0) + count
    else
      local ids = redis.call('smembers', setKey)
      findEventsByIds(response, ids)
    end
  end
end
return cjson.encode(response)
