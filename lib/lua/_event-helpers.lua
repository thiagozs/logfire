local eventHelpers = {}

-- Makes sure the fields of the given `where` table are
-- included in the given `fields` table
-- @param {table} fields
-- @param {table/dict} where
-- @returns {table} newFields
function eventHelpers.includeWhereFields(fields, where)
  local newFields = utils.copyTable(fields)
  for fieldName, condition in pairs(where) do
    table.insert(newFields, fieldName)
  end
  return utils.uniqueTable(newFields)
end

-- Removes all fields from the given event that are not in the
-- given `originalFields`
-- @param {table/dict} event
-- @param {table} originalFields
-- @returns {table/dict} event
function eventHelpers.removeTempFields(event, originalFields)
  local tempDict = utils.tableToDict(originalFields)
  for field, value in pairs(event) do
    if tempDict[field] == nil then
      event[field] = nil
    end
  end
  return event
end

-- Find events by given ids and fields
-- @param {string} prefix
-- @param {table} ids
-- @param {table} fields
-- @param {table} where
-- @returns {table} events
function eventHelpers.findEventsByIds(prefix, ids, fields, where)
  local events = {}
  local originalFields = fields

  for _, id in ipairs(ids) do
    local eventKey = prefix .. 'events:' .. id
    local event

    if fields ~= nil and #fields > 0 then
      -- Make sure the `where` fields are included in the fields
      local _fields
      if #where > 0 then
        _fields = eventHelpers.includeWhereFields(fields, where)
      else
        _fields = fields
      end
      event = utils.hmget(eventKey, unpack(_fields))
    else
      event = utils.hgetall(eventKey)
    end

    if eventMatcher.matchesWhere(event, where) then
      -- Make sure the `where` fields are not included in the result if
      -- they were not passed as `select` fields
      if #originalFields > 0 then
        eventHelpers.removeTempFields(event, originalFields)
      end
      table.insert(events, event)
    end
  end

  return events
end
