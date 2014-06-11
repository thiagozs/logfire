## 0.0.4 (Jun 11 2014)

* Fix flushing (date calculation was inversed)

## 0.0.3 (Jun 6 2014)

* Add authentication
* `port` is now configurable via `logfire.json`
* Minor fix in `LogfireStore#_runLuaScript`
* Removed categories

## 0.0.2 (Jun 6 2014)

* Added GET /events/:id
* POST /events takes `event` (Format: `{category}.{event}`) instead of `category` and `event`
* POST /events returns `$id`

## 0.0.1 (Jun 5 2014)

* Initial commit
