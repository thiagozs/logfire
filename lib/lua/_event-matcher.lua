local eventMatcher = {}

-- Checks whether the given event matches the given conditions
-- @param {table/dict} event
-- @param {table/dict} where
-- @returns {boolean}
function eventMatcher.matchesWhere(event, where)
  for fieldName, condition in pairs(where) do
    local eventValue = event[fieldName]

    if type(condition) ~= "table" then
      -- Todo: Identity check
      condition = tostring(condition)

      -- Equality check
      if eventValue ~= condition then
        return false
      end

    else

      -- Condition is a table (e.g. { $gte: 2 })
      -- Iterate over all condition operators and validate
      for operator, value in pairs(condition) do
        -- Todo: Identity check
        local numericEventValue = tonumber(eventValue)
        local stringConditionValue = tostring(value)

        -- Numeric operators
        if (operator == '$gt' and numericEventValue <= value) or
          (operator == '$gte' and numericEventValue < value) or
          (operator == '$lt' and numericEventValue >= value) or
          (operator == '$lte' and numericEventValue > value) then
            return false
        end

        -- Universal operators
        if (operator == '$ne' and eventValue == stringConditionValue) then
          return false
        end

        -- Array operators
        if utils.tableContains({'$in', '$nin'}, operator) then
          local stringValue = utils.stringifyTableValues(value)
          if (operator == '$in' and not utils.tableContains(stringValue, eventValue)) or
            (operator == '$nin' and utils.tableContains(stringValue, eventValue)) then
              return false
          end
        end
      end

    end
  end
  return true
end
