require "_mixins"
local args = mixins.getArgs()
local prefix = args['prefix']
local eventNames = mixins.splitList(args['events'])
local selectedFields = mixins.splitList(args['select'])

-- Find event ids for all events by (optional) range of $date,
-- and concatenate the tables
local allIds = {}
local minValue = args['start'] or '-inf'
local maxValue = args['end'] or '+inf'
for _, eventName in ipairs(eventNames) do
  local zsetKey = prefix .. 'indexes:' .. eventName .. ':$date'
  local ids = redis.call('zrangebyscore', zsetKey, minValue, maxValue)
  mixins.concatTables(allIds, ids)
end

local response
if selectedFields[1] == '$count' then
  -- In case we only want to know about the amount of events
  -- tracked, we can use the redis `zcard` command.
  response = #allIds
else
  -- Fetch events for all ids
  response = {}
  for _, id in ipairs(allIds) do
    local eventKey = prefix .. 'events:' .. id

    -- Select only the fields passed via `select` (if present)
    local event
    if #selectedFields > 0 then
      event = hmget(eventKey, unpack(selectedFields))
    else
      event = hgetall(eventKey)
    end

    -- Add the event to the list
    table.insert(response, event)
  end
end

return cjson.encode(response)
