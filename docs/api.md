## API documentation

### logfire.json

#### Category

| Key          | Value type | Available values          | Default        |
| ------------ | ---------- | ------------------------- | -------------- |
| `events`     | Object     | See `Event`               | `{}`           |

#### Event

| Key          | Value type | Available values          | Default        |
| ------------ | ---------- | ------------------------- | -------------- |
| `fields`     | Object     | See `Event fields`        | `{}`           |
| `ttl`        | Number     | Any number (seconds)      | `0` (infinite) |

#### Event fields

| Key          | Value type | Available values          | Default        |
| ------------ | ---------- | ------------------------- | -------------- |
| `type`       | String     | string, number, timestamp | `string`       |
| `required`   | Boolean    | true, false               | `false`        |
| `ttl`        | Number     | Any number (seconds)      | `0` (infinite) |

