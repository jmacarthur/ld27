#!/usr/bin/perl -w

use DBI;

`echo | sqlite3 condition.sqlite`;

my $dbh = DBI->connect("dbi:SQLite:condition.sqlite","","");

my $sth = $dbh->prepare("CREATE TABLE userids (userid integer primary key autoincrement, shard integer);");
my $rv = $sth->execute() or die $sth->errstr;

print "Return value of create statement: $rv\n";

