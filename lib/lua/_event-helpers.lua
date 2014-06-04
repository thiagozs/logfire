local eventHelpers = {}

-- Find events by given ids and fields
-- @param {string} prefix
-- @param {table} ids
-- @param {table} [fields]
-- @returns {table} events
function eventHelpers.findEventsByIds(prefix, ids, fields)
  local events = {}

  for _, id in ipairs(ids) do
    local eventKey = prefix .. 'events:' .. id
    local event

    if fields ~= nil and #fields > 0 then
      event = hmget(eventKey, unpack(fields))
    else
      event = hgetall(eventKey)
    end

    table.insert(events, event)
  end

  return events
end
