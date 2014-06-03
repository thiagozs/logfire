-- Finds all keys with the given prefix and deletes them
local keys = redis.call('keys', args['prefix'] .. '*')
for key in pairs(keys) do
  redis.call('del', key)
end
