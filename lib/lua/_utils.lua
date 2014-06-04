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

-- Return a unique representation of the given table
function utils.uniqueTable(tbl)
  -- Convert to dict
  local tempDict = {}
  for _, value in ipairs(tbl) do
    tempDict[value] = true
  end

  -- Convert to table
  local uniqueTable = {}
  for key, _ in pairs(tempDict) do
    table.insert(uniqueTable, key)
  end
  return uniqueTable
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
