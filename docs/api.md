# API documentation

## logfire.json

### Category

| Key | Value type | Available values | Default |
| --- | --- | --- | --- |
| `events` | Object | See `Event`. Key is the event name. | `{}` |

### Event

| Key | Value type | Available values | Default |
| --- | --- | --- | --- |
| `fields` | Object | See `Event fields` | `{}` |
| `ttl` | Number | Any number (seconds) | `0` (infinite) |

### Event fields

Events have a couple of default fields: `$id`, `$date` and `$event`

| Key | Value type | Available values | Default |
| --- | --- | --- | --- |
| `type` | String | string, number, timestamp | `string` |
| `required` | Boolean | true, false | `false` |


## HTTP API

### Events

#### POST /events

Creates an event.

| Variable | Type | Description |
| --- | --- | --- | --- |
| `event` | String | The event name (Format: `{category}.{event}`) |
| `data` | Object | Additional data |

### Queryies

#### POST /query

Runs a query on the data.

| Variable | Type | Description |
| --- | --- | --- | --- |
| `events` | Array | **Required** The events (Format: `{category}.{event}`) that should be taken into account. |
| `select` | Array | The event fields that should be returned. `$count` returns the amount of events and can not be used together with another field. Returns all fields per default, including `$id` and `$date`. |
| `group` | String | The field that logfire should group results by. |
| `start` | UNIX Timestamp (seconds) | Minimum value for `$date` |
| `end` | UNIX Timestamp (seconds) | Maximum value for `$date` |
| `where` | Mixed / Object | See [Querying and Query Operators](querying.md) |
