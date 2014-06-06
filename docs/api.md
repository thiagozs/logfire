# API documentation

## logfire.json

### Configuration

| Key | Value type | Available values | Default |
| --- | --- | --- | --- |
| `redis` | Object | Redis configuration (`host`, `port`, `db`, `auth`) | Redis stock configuration. (`localhost:6379`, database index `0`, no auth) |
| `auth` | String | The Logfire server password. | `null` |
| `disable_flush` | Boolean | Specifies whether Logfire should flush old events. | `true` |
| `flush_interval` | Number | Specifies the interval in which Logfire should flush old events (in seconds). | `60` |
| `events` | Object | A hash containing the event structure. (`"event name": {Event object}`) | `{}` |

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

> :exclamation: If you set the `auth` configuration in logfire.json, you'll have to pass the `auth` query variable containing the server password. Otherwise the server responds with a `403` error.

### Events

#### POST /events

Creates an event.

| Variable | Type | Description |
| --- | --- | --- | --- |
| `event` | String | The event name |
| `data` | Object | Additional data |

#### GET /events/:id

Returns the event with the given id.

### Queryies

#### POST /query

Runs a query on the data.

| Variable | Type | Description |
| --- | --- | --- | --- |
| `auth` | String | The server password (if `auth` configuration is set) |
| `events` | Array | **Required** The events that should be taken into account. |
| `select` | Array | The event fields that should be returned. `$count` returns the amount of events and can not be used together with another field. Returns all fields per default, including `$id` and `$date`. |
| `group` | String | The field that logfire should group results by. |
| `start` | UNIX Timestamp (seconds) | Minimum value for `$date` |
| `end` | UNIX Timestamp (seconds) | Maximum value for `$date` |
| `where` | Mixed / Object | See [Querying and Query Operators](querying.md) |
