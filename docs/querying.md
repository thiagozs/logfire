# Querying and Query Operators

The heart of logfire are its querying capabilities. With the `/query` route you can run 
sophisticated queryies on your data set, including counting, grouping and filtering
events.

Here are some examples on what is possible with logfire's querying engine:

## Counting events

Query:
```json
{
  events: ['cache.hit', 'cache.miss'],
  select: ['$count']
}
```

Result:
```json
1423
```

## Grouping events by event name

Query:
```json
{
  events: ['cache.hit', 'cache.miss'],
  select: ['$count'],
  group: '$event'
}
```

Result:
```json
{
  "cache.hit": 1211,
  "cache.miss": 212
}
```

## Grouping events by field value

Query:
```json
{
  events: ['cache.miss'],
  select: ['$count'],
  group: 'file_type'
}
```

Result:
```json
{
  "html": 103,
  "css": 34,
  "png": 75
}
```

## Grouping events by creation date (with group sizing)

Query:
```json
{
  events: ['cache.miss'],
  select: ['$count'],
  group: '$date[minute]'
}
```

Result:
```json
[
   {
      "date":"1401998400",
      "events":28
   },
   {
      "date":"1402001880",
      "events":52
   },
   {
      "date":"1402001940",
      "events":132
   }
]
```

> :exclamation: Group sizing is only available for fields of type `timestamp`

## Filtering

Query:
```json
{
  events: ['cache.miss'],
  select: ['$count'],
  where: {
    file_type: 'html'
  }
}
```

Result:
```json
103
```

## Filtering with conditions

Every field in the `where` object can take an object with search operators as keys. 
logfire supports the following search operators:

### `$ne`

`$ne` selects the events where the value of the field is not equal to the specified value.

Query:
```json
{
  events: ['cache.miss'],
  select: ['$count'],
  where: {
    file_type: {
      $ne: 'html'
    }
  }
}
```

Result:
```json
109
```
