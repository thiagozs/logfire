local utils = {}

-- Turn KEYS and ARGS into a table
function utils.getArgs()
  local args = {}
  for i, v in ipairs(KEYS) do
    args[ v ] = ARGV[ i ]
  end
  return args
end

-- Split the given string at every comma and return a table
function utils.splitList(str)
  if str == nil then
    return {}
  end

  local list = {}
  for part in string.gmatch(str, '([^,]+)') do
    table.insert(list, part)
  end
  return list
end

-- Add all items of table2 to table1
function utils.concatTables(table1, table2)
  for _, value in ipairs(table2) do
    table.insert(table1, value)
  end
end

-- Check whether the given table contains the given value
function utils.tableContains(tbl, value)
  -- Convert to dict
  local tempDict = {}
  for _, value in ipairs(tbl) do
    tempDict[value] = true
  end
  return tempDict[value]
end

-- Returns a dict (value => true) of the given table
function utils.tableToDict(tbl)
  local dict = {}
  for _, value in ipairs(tbl) do
    dict[value] = true
  end
  return dict
end

-- Returns a table of keys for the given dict
function utils.dictToTable(dict)
  local tbl = {}
  for key, _ in pairs(dict) do
    table.insert(tbl, key)
  end
  return tbl
end

-- Return a unique representation of the given table
function utils.uniqueTable(tbl)
  return utils.dictToTable(utils.tableToDict(tbl))
end

-- Returns a shallow copy of the given tbale
function utils.copyTable(tbl)
  local newTable = {}
  for _, value in ipairs(tbl) do
    table.insert(newTable, value)
  end
  return newTable
end

-- Returns a shallow copy of the given table with all
-- its values casted to string
function utils.stringifyTableValues(tbl)
  local newTable = {}
  for _, value in ipairs(tbl) do
    table.insert(newTable, tostring(value))
  end
  return newTable
end

-- Iterates through the given events, makes sure that
-- fields specified as numeric are converted to numeric
function utils.fixFieldTypes(events, fieldTypes)
  for _, event in ipairs(events) do
    for key, _ in pairs(event) do
      local fieldType = fieldTypes[key]
      if utils.tableContains({'number', 'timestamp'}, fieldType) then
        event[key] = tonumber(event[key])
      end
    end
  end
end

-- Return a decode representation of the given value (if not nil)
function utils.decode(value)
  if not value then
    return {}
  end

  return cjson.decode(value)
end

-- Gets all fields from a hash as a dictionary
function utils.hgetall(key)
  local bulk = redis.call('HGETALL', key)
  local result = {}
  local nextkey
  for i, v in ipairs(bulk) do
    if i % 2 == 1 then
      nextkey = v
    else
      result[nextkey] = v
    end
  end
  return result
end

-- Gets multiple specific fields from a hash as a dictionary
function utils.hmget(key, ...)
  if next(arg) == nil then return {} end
  local bulk = redis.call('HMGET', key, unpack(arg))
  local result = {}
  for i, v in ipairs(bulk) do result[ arg[i] ] = v end
  return result
end
