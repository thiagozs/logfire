require "_utils"
require "_event-matcher"
require "_event-helpers"

local args = utils.getArgs()
local prefix = args['prefix']
local eventNames = utils.decode(args['events'])
local selectedFields = utils.decode(args['select'])
local where = utils.decode(args['where'])
local response = {}

-- Find event ids for all events by (optional) range of $date
local idsByEvent = {}
local minValue = args['start'] or '-inf'
local maxValue = args['end'] or '+inf'
for _, eventName in ipairs(eventNames) do
  local zsetKey = prefix .. 'indexes:' .. eventName .. ':$date'
  local ids = redis.call('zrangebyscore', zsetKey, minValue, maxValue)
  idsByEvent[eventName] = ids
end

-- Concatenate all id tables
local allIds = {}
for eventName, ids in pairs(idsByEvent) do
  for _, id in ipairs(ids) do
    table.insert(allIds, id)
  end
end

if args['group'] == '$event' then

  -- Grouping by event - response is a hash (eventName => data) where
  -- data is either a number (in case `select` is set to '$count') or
  -- an array containing the events
  for eventName, ids in pairs(idsByEvent) do
    local groupValues

    if selectedFields[1] == '$count' then
      if #where == 0 then
        groupValues = #ids
      else
        local events = eventHelpers.findEventsByIds(prefix, ids, selectedFields, where)
        groupValues = #events
      end
    else
      groupValues = eventHelpers.findEventsByIds(prefix, ids, selectedFields, where)
    end

    response[eventName] = groupValues
  end

elseif args['group'] then
  -- If `select` is defined, make sure that the `group`
  -- field is in the selected fields
  local originalSelectedFields = selectedFields
  if #selectedFields > 0 then
    table.insert(selectedFields, args['group'])
    selectedFields = utils.uniqueTable(selectedFields)
  end

  -- Get all events
  local events = eventHelpers.findEventsByIds(prefix, allIds, selectedFields, where)

  -- Group by `group`
  for _, event in ipairs(events) do
    local groupValue = event[args['group']]

    if selectedFields[1] == '$count' then
      response[groupValue] = (response[groupValue] or 0) + 1
    else
      if not response[groupValue] then
        response[groupValue] = {}
      end

      -- Delete the `group` field from the event if it was not
      -- in `select`
      local groupFieldWasSelected = utils.tableContains(originalSelectedFields, args['group'])
      if #selectedFields > 0 and groupFieldWasSelected then
        event[args['group']] = nil
      end

      table.insert(response[groupValue], event)
    end
  end

else

  -- In case we're not grouping and we're asked for the amount
  -- of events, just return the length of `allIds`. If `select`
  -- is not set to '$count', return all events.
  if selectedFields[1] == '$count' then
    if #where == 0 then
      response = #allIds
    else
      local events = eventHelpers.findEventsByIds(prefix, allIds, selectedFields, where)
      response = #events
    end
  else
    response = eventHelpers.findEventsByIds(prefix, allIds, selectedFields, where)
  end

end

-- Return a JSON encoded response
return cjson.encode(response)
