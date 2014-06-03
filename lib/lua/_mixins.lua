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
