-- Turn KEYS and ARGS into a table
local args = {}
for i, v in ipairs(KEYS) do
  args[ v ] = ARGV[ i ]
end
