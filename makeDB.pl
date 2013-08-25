#!/usr/bin/perl -w

use DBI;

`echo | sqlite3 condition.sqlite`;

my $dbh = DBI->connect("dbi:SQLite:condition.sqlite","","");

my $sth = $dbh->prepare("CREATE TABLE userids (userid integer primary key autoincrement, shard integer, lastseen datetime);");
my $rv = $sth->execute() or die $sth->errstr;

$sth = $dbh->prepare("CREATE TABLE shard (shardid integer primary key autoincrement, status integer, playerx integer, playery integer, time integer, nextuser integer, inuse integer, flags integer, mapUpdates varchar(256), inventory varchar(256));");
$rv = $sth->execute() or die $sth->errstr;


