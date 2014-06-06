This page will guide you through the basic setup of Logfire. If you would like to know more about logfire's API, see the [API documentation](api.md).

## Installation

```bash
$ npm install -g logfire
```

## Usage

To run the server, simply run `logfire` on your terminal:

```
Usage: logfire [/path/to/logfire.json] [options]

Options:
  --port  [default: 8085]
```

## Configuration

The configuration file (logfire.json) contains information on how to connect to your redis store and on the structure of the events that you would like to store.

### Logfire port

Per default, Logfire will run on port `8085`. You can override the port in your logfire.json:

```json
{
  "port": 8088
}
```

### Redis

Per default, Logfire will try to connect to localhost:6379 without authentication and it will use db index 0. You can change that by defining the information in your logfire.json:

```json
{
  "redis": {
    "host": "localhost",
    "port": 6379,
    "db": 3,
    "auth": ""
  }
}
```

### Event structure

To be able to create new events, you will have to define your event structure in the logfire.json first. Let's define two events: `cache.hit` and `cache.miss`:

```json
{
  "events": {
    "cache.hit": {},
    "cache.miss": {}
  }
}
```

Events can also hold additional fields. Let's add some:

```json
{
  "events": {
    "cache.hit": {
      "fields": {
        "file_name": {
          "type": "string"
        },
        "file_type": {
          "type": "string"
        }
      }
    },
    "cache.miss": {
      "fields": {
        "file_name": {
          "type": "string"
        },
        "file_type": {
          "type": "string"
        }
      }
    }
  }
}
```

> :exclamation: There are more options for events and event fields. To learn more about the available options, see the [API documentation](api.md).

## Creating events

Logfire provides an HTTP API for creating events. You don't need to do raw HTTP requests, there are [clients](clients.md) for several programming languages and frameworks. I'm just using curl here to demonstrate how the API works:

```bash
$ curl -d '{"event": "cache.hit", "data": { "file_type": "html", "file_name": "foobar.html" }}' -H "Content-Type: application/json" http://localhost:8085/events
# Result: {"success":true, "$id": 1}
$ curl -d '{"event": "cache.miss", "data": { "file_type": "html", "file_name": "foobar.html" }}' -H "Content-Type: application/json" http://localhost:8085/events
# Result: {"success":true, "$id": 2}
```

## Querying events

Logfire also provides an HTTP API for querying events:

```bash
$ curl -d '{"events": ["cache.hit", "cache.miss"]}' -H "Content-Type: application/json" http://localhost:8085/query
# Result: [{"$date":1401998427,"file_name":"foobar.html","$id":1,"file_type":"html"},{"$date":1401998444,"file_name":"foobar.html","$id":2,"file_type":"html"}]
```

> :exclamation: The querying API provides much more options. To learn more about the available options, see the [API documentation](api.md). To see some examples, see the [Querying and Query Operators Page](querying.md).
