-- Turn KEYS and ARGS into a table
local args = {}
for i, v in ipairs(KEYS) do
  args[ v ] = ARGV[ i ]
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
function dict.totable(dict)
  local tbl = {}
  for k, v in ipairs(tbl) do
    table.insert(tbl, k)
  end
  return dict
end
