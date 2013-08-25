#!/usr/bin/perl
use CGI;
use Data::Dumper;
use DBI;

use utils;

open STDERR, ">>errors" if $ENV{SERVER_SOFTWARE} =~ m/^mini_httpd/;

my $dbh = DBI->connect("dbi:SQLite:../condition.sqlite","","");

my $sth = $dbh->prepare("INSERT INTO userids (shard) VALUES (0);");
my $rh = $sth->execute();
my $userID = $dbh->func('last_insert_rowid');
my $q = CGI->new;
print $q->header('text/plain');
print "USERID: $userID\n";
touchTimeStamp($dbh,$userID);
