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
        value = tostring(value)

        -- Numeric and universal operators
        if (operator == '$ne' and eventValue == value) or
          (operator == '$gt' and eventValue <= value) or
          (operator == '$gte' and eventValue < value) or
          (operator == '$lt' and eventValue >= value) or
          (operator == '$lte' and eventValue > value) then
            return false
        end

        -- Array operators
        if (operator == '$in' and not utils.tableContains(value, eventValue)) or
          (operator == '$nin' and utils.tableContains(value, eventValue)) then
            return false
        end
      end

    end
  end
  return true
end
