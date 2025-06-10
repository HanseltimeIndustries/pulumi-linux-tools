[**@hanseltime/traefik**](../README.md)

***

[@hanseltime/traefik](../README.md) / LogFileOptions

# Interface: LogFileOptions

Options that apply if a logfile is set

## Properties

### compress?

> `optional` **compress**: `boolean`

compress determines if the rotated log files should be compressed using gzip. The default is not to perform compression.

***

### maxAge?

> `optional` **maxAge**: `number`

maxAge is the maximum number of days to retain old log files based on the timestamp encoded in their filename. Note that a day is defined as 24 hours and may not exactly correspond to calendar days due to daylight savings, leap seconds, etc. The default is not to remove old log files based on age.

***

### maxBackups?

> `optional` **maxBackups**: `number`

maxBackups is the maximum number of old log files to retain. The default is to retain all old log files (though maxAge may still cause them to get deleted).

***

### maxSize?

> `optional` **maxSize**: `number`

maxSize is the maximum size in megabytes of the log file before it gets rotated. It defaults to 100 megabytes.
