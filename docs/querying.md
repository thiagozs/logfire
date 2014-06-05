# Querying and Query Operators

The heart of Logfire are its querying capabilities. With the `/query` route you can run
sophisticated queryies on your data set, including counting, grouping and filtering
events.

Here are some examples on what is possible with Logfire's querying engine:

## Counting events

Query:
```json
{
  "events": ["cache.hit", "cache.miss"],
  "select": ["$count"]
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
  "events": ["cache.hit", "cache.miss"],
  "select": ["$count"],
  "group": "$event"
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
  "events": ["cache.miss"],
  "select": ["$count"],
  "group": "file_type"
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
  "events": ["cache.miss"],
  "select": ["$count"],
  "group": "$date[minute]"
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
  "events": ["cache.miss"],
  "select": ["$count"],
  "where": {
    "file_type": "html"
  }
}
```

Result:
```json
103
```

## Filtering with conditions

Every field in the `where` object can take an object with query operators as keys.
Logfire supports the following query operators:

### `$ne`

`$ne` selects the events where the value of the field is not equal to the specified value.

Query:
```json
{
  "events": ["cache.miss"],
  "select": ["$count"],
  "where": {
    "file_type": {
      "$ne": "html"
    }
  }
}
```

Result:
```json
109
```

### `$gt`

`$gt` selects the events where the value of the field is greater than the specified value. **Can only be used with numeric fields.**

Query:
```json
{
  "events": ["cache.miss"],
  "select": ["$count"],
  "where": {
    "$id": {
      "$gt": 100
    }
  }
}
```

Result:
```json
1323
```

### `$gte`

`$gte` selects the events where the value of the field is greater than or equal to the specified value. **Can only be used with numeric fields.**

Query:
```json
{
  "events": ["cache.miss"],
  "select": ["$count"],
  "where": {
    "$id": {
      "$gte": 100
    }
  }
}
```

Result:
```json
1322
```

### `$lt`

`$lt` selects the events where the value of the field is lower than the specified value. **Can only be used with numeric fields.**

Query:
```json
{
  "events": ["cache.miss"],
  "select": ["$count"],
  "where": {
    "$id": {
      "$lt": 100
    }
  }
}
```

Result:
```json
99
```

### `$lte`

`$lte` selects the events where the value of the field is lower than or equal to the specified value. **Can only be used with numeric fields.**

Query:
```json
{
  "events": ["cache.miss"],
  "select": ["$count"],
  "where": {
    "$id": {
      "$lte": 100
    }
  }
}
```

Result:
```json
100
```

### `$in`

`$in` selects the events where the value of the field is in the specified array. **Can only be used with numeric fields.**

Query:
```json
{
  "events": ["cache.miss"],
  "select": ["$count"],
  "where": {
    "file_type": {
      "$in": ["html", "png"]
    }
  }
}
```

Result:
```json
178
```

### `$nin`

`$nin` selects the events where the value of the field is not in the specified array. **Can only be used with numeric fields.**

Query:
```json
{
  "events": ["cache.miss"],
  "select": ["$count"],
  "where": {
    "file_type": {
      "$nin": ["html", "png"]
    }
  }
}
```

Result:
```json
34
```
