-- Finds all keys with the given prefix and deletes them
local keys = redis.pcall('keys', args['prefix'] .. '*')
for key in pairs(keys) do
  redis.pcall('del', key)
end
