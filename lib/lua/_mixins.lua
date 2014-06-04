local mixins = {}

-- Turn KEYS and ARGS into a table
function mixins.getArgs()
  local args = {}
  for i, v in ipairs(KEYS) do
    args[ v ] = ARGV[ i ]
  end
  return args
end

-- Split the given string at every comma and return a table
function mixins.splitList(str)
  local list = {}
  for part in string.gmatch(str, '([^,]+)') do
    table.insert(list, part)
  end
  return list
end

-- Add all items of table2 to table1
function mixins.concatTables(table1, table2)
  for _, value in ipairs(table2) do
    table.insert(table1, value)
  end
end

-- Gets all fields from a hash as a dictionary
local hgetall = function (key)
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
local hmget = function (key, ...)
  if next(arg) == nil then return {} end
  local bulk = redis.call('HMGET', key, unpack(arg))
  local result = {}
  for i, v in ipairs(bulk) do result[ arg[i] ] = v end
  return result
end

-- Return a dict representation of the given table
function table.todict(tbl)
  local dict = {}
  for k, v in pairs(tbl) do
    dict[v] = true
  end
  return dict
end

-- Return a table representation of the given dict
local dict = {}
function dict.totable(dct)
  local tbl = {}
  for k, v in pairs(dct) do
    table.insert(tbl, k)
  end
  return tbl
end
