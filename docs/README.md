This page will guide you through the basic setup of logfire. If you would like to know more about logfire's API, see the [API documentation](api.md).

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

### Redis

Per default, logfire will try to connect to localhost:6379 without authentication and it will use db index 0. You can change that by defining the information in your logfire.json:

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

To be able to create new events, you will have to define your event structure in the logfire.json first. There are event categories and events. Let's define a `cache` category with two events: `hit` and `miss`.

```json
{
  "categories": {
    "cache": {
      "events": {
        "hit": {},
        "miss": {}
      }
    }
  }
}
```

Events can also hold additional fields. Let's add some:

```json
{
  "categories": {
    "cache": {
      "events": {
        "hit": {
          "fields": {
            "file_name": {
              "type": "string"
            },
            "file_type": {
              "type": "string"
            }
          }
        },
        "miss": {
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
  }
}
```

## Creating events

logfire provides an HTTP API for creating events. You don't need to do raw HTTP requests, there are [clients](clients.md) for several programming languages and frameworks. I'm just using curl here to demonstrate how the API works:

```bash
$ curl -d '{"category": "cache", "event": "hit", "data": { "file_type": "html", "file_name": "foobar.html" }}' -H "Content-Type: application/json" http://localhost:8085/events
# Result: {"success":true}
$ curl -d '{"category": "cache", "event": "miss", "data": { "file_type": "html", "file_name": "foobar.html" }}' -H "Content-Type: application/json" http://localhost:8085/events
# Result: {"success":true}
```

## Querying events

logfire also provides an HTTP API for querying events:

```bash
$ curl -d '{"events": ["cache.hit", "cache.miss"]}' -H "Content-Type: application/json" http://localhost:8085/query
# Result: [{"$date":1401998427,"file_name":"foobar.html","$id":1,"file_type":"html"},{"$date":1401998444,"file_name":"foobar.html","$id":2,"file_type":"html"}]
```

The querying API provides much more options. To learn more about the available options, see the [API documentation](api.md).
