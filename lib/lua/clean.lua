require "_utils"
local args = utils.getArgs()

-- Finds all keys with the given prefix and deletes them
local keys = redis.call('keys', args['prefix'] .. '*')
for i, key in pairs(keys) do
  redis.call('del', key)
end
