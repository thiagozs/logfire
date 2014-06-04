local prefix = args['prefix']

local findEventsByIds = function (tbl, ids, fields)
  for i, id in pairs(ids) do
    if #fields ~= 0 then
      local data = hmget(prefix .. 'events:' .. id, unpack(fields))
      table.insert(tbl, data)
    else
      local data = hgetall(prefix .. 'events:' .. id)
      table.insert(tbl, data)
    end
  end
end

local findEventsByIdsAndGroupByField = function (tbl, ids, fields, groupField)
  -- Turn fields into a dict, add group field, turn back
  -- into a table. We do that to make sure that the group
  -- field only occurs once in the table of fields.
  local originalFields = fields
  if fields then
    local fieldsDict = table.todict(fields)
    fieldsDict[groupField] = true
    fields = dict.totable(fieldsDict)
  end

  -- Get all events
  local eventsList = {}
  findEventsByIds(eventsList, ids, fields)

  -- Iterate over all events and group them
  for i, event in pairs(eventsList) do
    if not tbl[event[groupField]] then
      tbl[event[groupField]] = {}
    end
    local key = tbl[event[groupField]]

    -- If the groupField is not in the selected fields,
    -- then remove it from the event (we fetched it to
    -- be able to group)
    local fieldsDict = table.todict(fields)
    local originalFieldsDict = table.todict(originalFields)

    if fieldsDict[groupField] and not originalFieldsDict[groupField] then
      event[groupField] = nil
    end
    table.insert(key, event)
  end
end

local groupEventCountsByField = function (tbl, ids, groupField)
  -- Get all events
  local eventsList = {}
  findEventsByIds(eventsList, ids, {groupField})

  -- Iterate over all events and group them
  for i, event in pairs(eventsList) do
    tbl[event[groupField]] = (tbl[event[groupField]] or 0) + 1
  end
end

-- Split events string into a table of strings
local eventNames = {}
for eventName in string.gmatch(args['events'], '([^,]+)') do
  table.insert(eventNames, eventName)
end

-- Split select string into a table of field names
local selectedFields = {}
if args['select'] then
  for fieldName in string.gmatch(args['select'], '([^,]+)') do
    table.insert(selectedFields, fieldName);
  end
end

local response = {}
if args['start'] or args['end'] then
  -- Find all events in the given timespan
  local minValue = '-inf'
  if args['start'] then minValue = args['start'] end
  local maxValue = '+inf'
  if args['end'] then maxValue = args['end'] end

  for i, eventName in pairs(eventNames) do
    local zsetKey = prefix .. 'indexes:' .. eventName .. ':$date'
    if args['select'] == '$count' then

      -- If we only need the amount of events, we can make use of redis
      -- `zcount` command
      local count = redis.call('zcount', zsetKey, minValue, maxValue)
      if args['group'] == '$event' then
        response[eventName] = (response[eventName] or 0) + count
      elseif args['group'] then
        findEventsByIdsAndGroupByField(response, ids, {}, args['group'])
      else
        response[0] = (response[0] or 0) + count
      end

    else

      -- Find all events in the given timespan
      local ids = redis.call('zrangebyscore', zsetKey, minValue, maxValue)
      if args['group'] == '$event' then
        response[eventName] = {}
        findEventsByIds(response[eventName], ids, selectedFields)
      elseif args['group'] then
        findEventsByIdsAndGroupByField(response, ids, selectedFields, args['group'])
      else
        findEventsByIds(response, ids, selectedFields)
      end

    end
  end
else
  -- Find all events for each given event name
  for i, eventName in pairs(eventNames) do
    local setKey = prefix .. 'set:' .. eventName

    if args['select'] == '$count' then

      local count = redis.call('scard', setKey)
      if args['group'] == '$event' then
        response[eventName] = (response[eventName] or 0) + count
      elseif args['group'] then
        local ids = redis.call('smembers', setKey)
        groupEventCountsByField(response, ids, args['group'])
      else
        response[0] = (response[0] or 0) + count
      end

    else

      local ids = redis.call('smembers', setKey)
      if args['group'] == '$event' then
        response[eventName] = {}
        findEventsByIds(response[eventName], ids, selectedFields)
      elseif args['group'] then
        findEventsByIdsAndGroupByField(response, ids, selectedFields, args['group'])
      else
        findEventsByIds(response, ids, selectedFields)
      end

    end
  end
end
return cjson.encode(response)
