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

The configuration file (logfire.json) contains information on how to connect to your redis store and on the events that you would like to store.

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

To create new events, you have to define your event structure in the logfire.json. There are event categories and events, which have fields of specific types. Let's define `cache` category with two events: `hit` and `miss`.

```json
{
  "redis": { /* your redis configuration goes here */ }
}
```
