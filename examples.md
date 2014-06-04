* video.success, video.error: count per hour / day in timespan (today until today-24h)
* /query?events=video.success,video.error&group_by=created_at[hour]&start={timestamp}&end={timestamp}

* group by value in timespan (portal_identifier in past 24h)
* /query?events=video.success&group_by=portal_identifier&start={timestamp}&end={timestamp}
